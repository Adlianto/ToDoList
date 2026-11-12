import { useEffect, useRef, useState } from 'react';
import {
    ApiError,
    patchTaskBulkUpdate,
    type TaskBulkUpdateItem,
} from '@/lib/api';
import { CARD_MOVE_DEBOUNCE_MS } from '@/lib/constants';
import {
    type TaskStatus,
    type TaskSyncStatus,
    type WorkspaceTaskItem,
} from '@/types';

interface TaskSyncState {
    persistedStatus: TaskStatus;
    lockVersion: number;
}

interface UseWorkspaceTaskSyncOptions {
    workspaceId: number;
    initialTasks: WorkspaceTaskItem[];
    debounceMs?: number;
    onError?: (error: Error) => void;
}

function getStorageKey(workspaceId: number): string {
    return `workspace_pending_task_sync_${workspaceId}`;
}

function saveQueueToStorage(
    workspaceId: number,
    pending: Map<number, TaskStatus>,
    inFlight: Map<number, TaskStatus> | null,
    states: Map<number, TaskSyncState>,
): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const merged = new Map<number, TaskStatus>();
        if (inFlight) {
            inFlight.forEach((status, id) => merged.set(id, status));
        }
        pending.forEach((status, id) => merged.set(id, status));

        if (merged.size === 0) {
            window.sessionStorage.removeItem(getStorageKey(workspaceId));
            return;
        }

        const items: TaskBulkUpdateItem[] = Array.from(merged.entries()).map(
            ([taskId, status]) => ({
                task_id: taskId,
                status,
                lock_version: states.get(taskId)?.lockVersion ?? 1,
            }),
        );

        window.sessionStorage.setItem(
            getStorageKey(workspaceId),
            JSON.stringify(items),
        );
    } catch {
        // Ignore storage quota or privacy mode errors
    }
}

function loadQueueFromStorage(workspaceId: number): TaskBulkUpdateItem[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.sessionStorage.getItem(getStorageKey(workspaceId));
        if (!raw) {
            return [];
        }
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
            return [];
        }
        return parsed.filter(
            (item): item is TaskBulkUpdateItem =>
                typeof item === 'object' &&
                item !== null &&
                typeof (item as TaskBulkUpdateItem).task_id === 'number' &&
                typeof (item as TaskBulkUpdateItem).status === 'string',
        );
    } catch {
        return [];
    }
}

export function useWorkspaceTaskSync({
    workspaceId,
    initialTasks,
    debounceMs = CARD_MOVE_DEBOUNCE_MS,
    onError,
}: UseWorkspaceTaskSyncOptions) {
    const [tasks, setTasks] = useState<WorkspaceTaskItem[]>(initialTasks);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<TaskSyncStatus>('idle');

    // Single global debounce timer for the entire workspace
    const globalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track the latest persisted status and lock_version for each task
    const taskPersistedStateRef = useRef<Map<number, TaskSyncState>>(new Map());

    // 1. Pending changes queued by the user, waiting for idle debounce
    const pendingUpdatesRef = useRef<Map<number, TaskStatus>>(new Map());

    // 2. In-flight changes currently being sent to the server
    const inFlightUpdatesRef = useRef<Map<number, TaskStatus> | null>(null);

    // Keep tasks in sync if initialTasks prop updates externally (e.g. filter change or create modal),
    // while preserving any unsynced optimistic changes in the local queue.
    useEffect(() => {
        initialTasks.forEach((t) => {
            const existing = taskPersistedStateRef.current.get(t.id);
            const incomingVersion = t.lock_version ?? 1;

            if (
                !existing ||
                incomingVersion >= existing.lockVersion ||
                (!pendingUpdatesRef.current.has(t.id) &&
                    !inFlightUpdatesRef.current?.has(t.id))
            ) {
                taskPersistedStateRef.current.set(t.id, {
                    persistedStatus: t.status,
                    lockVersion: incomingVersion,
                });
            }
        });

        // Recover any unsent mutations persisted before an unexpected reload
        const recovered = loadQueueFromStorage(workspaceId);
        if (recovered.length > 0) {
            const validIds = new Set(initialTasks.map((t) => t.id));
            recovered.forEach((item) => {
                if (!validIds.has(item.task_id)) {
                    return;
                }
                const serverState = taskPersistedStateRef.current.get(
                    item.task_id,
                );
                if (
                    serverState &&
                    serverState.persistedStatus !== item.status &&
                    (item.lock_version === undefined ||
                        item.lock_version === serverState.lockVersion)
                ) {
                    pendingUpdatesRef.current.set(item.task_id, item.status);
                }
            });
        }

        setTasks(
            initialTasks.map((t) => {
                const pendingStatus =
                    pendingUpdatesRef.current.get(t.id) ??
                    inFlightUpdatesRef.current?.get(t.id);
                return pendingStatus ? { ...t, status: pendingStatus } : t;
            }),
        );

        if (pendingUpdatesRef.current.size > 0 && !inFlightUpdatesRef.current) {
            setSyncStatus('pending');
            if (globalTimerRef.current === null) {
                globalTimerRef.current = setTimeout(() => {
                    globalTimerRef.current = null;
                    void processBatchQueue();
                }, debounceMs);
            }
        } else {
            saveQueueToStorage(
                workspaceId,
                pendingUpdatesRef.current,
                inFlightUpdatesRef.current,
                taskPersistedStateRef.current,
            );
        }
    }, [initialTasks, workspaceId]);

    /**
     * Flush all pending updates immediately to the server (e.g. on unmount, pagehide, or before unload).
     */
    const flushQueue = () => {
        if (globalTimerRef.current !== null) {
            clearTimeout(globalTimerRef.current);
            globalTimerRef.current = null;
        }
        void processBatchQueue();
    };

    /**
     * Process batch updates from pending queue to in-flight request.
     */
    const processBatchQueue = async () => {
        if (inFlightUpdatesRef.current !== null) {
            return;
        }

        if (pendingUpdatesRef.current.size === 0) {
            return;
        }

        const currentBatch = new Map(pendingUpdatesRef.current);
        pendingUpdatesRef.current.clear();
        inFlightUpdatesRef.current = currentBatch;
        setSyncStatus('syncing');

        saveQueueToStorage(
            workspaceId,
            pendingUpdatesRef.current,
            inFlightUpdatesRef.current,
            taskPersistedStateRef.current,
        );

        const payload: TaskBulkUpdateItem[] = Array.from(
            currentBatch.entries(),
        ).map(([taskId, status]) => ({
            task_id: taskId,
            status,
            lock_version:
                taskPersistedStateRef.current.get(taskId)?.lockVersion ?? 1,
        }));

        try {
            const response = await patchTaskBulkUpdate(workspaceId, payload);

            // Successfully persisted this batch: update known persisted status and lock_version
            currentBatch.forEach((status, taskId) => {
                const currentVersion =
                    taskPersistedStateRef.current.get(taskId)?.lockVersion ?? 1;
                const nextVersion =
                    response.task_versions?.[taskId] ?? currentVersion + 1;

                taskPersistedStateRef.current.set(taskId, {
                    persistedStatus: status,
                    lockVersion: nextVersion,
                });
            });

            setTasks((prev) =>
                prev.map((t) => {
                    const updatedState = taskPersistedStateRef.current.get(
                        t.id,
                    );
                    if (currentBatch.has(t.id) && updatedState) {
                        return {
                            ...t,
                            lock_version: updatedState.lockVersion,
                        };
                    }
                    return t;
                }),
            );

            inFlightUpdatesRef.current = null;
            saveQueueToStorage(
                workspaceId,
                pendingUpdatesRef.current,
                inFlightUpdatesRef.current,
                taskPersistedStateRef.current,
            );

            if (pendingUpdatesRef.current.size > 0) {
                setSyncStatus('pending');
                if (globalTimerRef.current === null) {
                    void processBatchQueue();
                }
            } else {
                setSyncStatus('saved');
            }
        } catch (error) {
            // If server detected an optimistic concurrency conflict (HTTP 409), adopt authoritative server versions
            if (
                error instanceof ApiError &&
                error.status === 409 &&
                error.conflicts
            ) {
                error.conflicts.forEach((conflict) => {
                    taskPersistedStateRef.current.set(conflict.task_id, {
                        persistedStatus: conflict.status,
                        lockVersion: conflict.lock_version,
                    });
                });
            }

            // Rollback tasks in this batch ONLY if no newer pending update was queued for that task
            setTasks((prev) =>
                prev.map((t) => {
                    if (
                        currentBatch.has(t.id) &&
                        !pendingUpdatesRef.current.has(t.id)
                    ) {
                        const state = taskPersistedStateRef.current.get(t.id);
                        return state
                            ? {
                                  ...t,
                                  status: state.persistedStatus,
                                  lock_version: state.lockVersion,
                              }
                            : t;
                    }
                    return t;
                }),
            );

            inFlightUpdatesRef.current = null;
            saveQueueToStorage(
                workspaceId,
                pendingUpdatesRef.current,
                inFlightUpdatesRef.current,
                taskPersistedStateRef.current,
            );

            const err =
                error instanceof Error
                    ? error
                    : new Error('Failed to synchronize workspace tasks');
            setErrorMessage(err.message);
            setSyncStatus('error');
            onError?.(err);

            if (
                pendingUpdatesRef.current.size > 0 &&
                globalTimerRef.current === null
            ) {
                void processBatchQueue();
            }
        }
    };

    /**
     * Move task status with instant optimistic UI and centralized workspace debounce queue.
     */
    const moveTaskStatus = (taskId: number, destinationStatus: TaskStatus) => {
        const currentTask = tasks.find((t) => t.id === taskId);
        if (!currentTask || currentTask.status === destinationStatus) {
            return;
        }

        // 1. Instant Optimistic UI Update
        setTasks((prev) =>
            prev.map((t) =>
                t.id === taskId ? { ...t, status: destinationStatus } : t,
            ),
        );
        setErrorMessage(null);

        // 2. Add / deduplicate into centralized workspace pending queue
        const persisted =
            taskPersistedStateRef.current.get(taskId)?.persistedStatus ??
            currentTask.status;

        if (
            destinationStatus === persisted &&
            (!inFlightUpdatesRef.current ||
                !inFlightUpdatesRef.current.has(taskId))
        ) {
            pendingUpdatesRef.current.delete(taskId);
        } else {
            pendingUpdatesRef.current.set(taskId, destinationStatus);
        }

        saveQueueToStorage(
            workspaceId,
            pendingUpdatesRef.current,
            inFlightUpdatesRef.current,
            taskPersistedStateRef.current,
        );

        // 3. Reset Global Workspace Debounce Timer
        if (globalTimerRef.current !== null) {
            clearTimeout(globalTimerRef.current);
            globalTimerRef.current = null;
        }

        if (pendingUpdatesRef.current.size > 0) {
            setSyncStatus(
                inFlightUpdatesRef.current !== null ? 'syncing' : 'pending',
            );
            globalTimerRef.current = setTimeout(() => {
                globalTimerRef.current = null;
                void processBatchQueue();
            }, debounceMs);
        } else if (inFlightUpdatesRef.current === null) {
            setSyncStatus('idle');
        }
    };

    // Component lifecycle cleanup: flush pending updates on pagehide / visibilitychange / beforeunload
    useEffect(() => {
        const handleFlush = () => {
            flushQueue();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                flushQueue();
            }
        };

        window.addEventListener('beforeunload', handleFlush);
        window.addEventListener('pagehide', handleFlush);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleFlush);
            window.removeEventListener('pagehide', handleFlush);
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange,
            );
            if (globalTimerRef.current !== null) {
                clearTimeout(globalTimerRef.current);
                globalTimerRef.current = null;
            }
            if (pendingUpdatesRef.current.size > 0) {
                void processBatchQueue();
            }
        };
    }, [workspaceId]);

    return {
        tasks,
        setTasks,
        syncStatus,
        errorMessage,
        setErrorMessage,
        moveTaskStatus,
        flushQueue,
    };
}
