import { useEffect, useRef, useState } from 'react';
import { patchTaskBulkUpdate, type TaskBulkUpdateItem } from '@/lib/api';
import { CARD_MOVE_DEBOUNCE_MS } from '@/lib/constants';
import { type TaskStatus, type WorkspaceTaskItem } from '@/types';

interface TaskSyncState {
    persistedStatus: TaskStatus;
}

interface UseWorkspaceTaskSyncOptions {
    workspaceId: number;
    initialTasks: WorkspaceTaskItem[];
    debounceMs?: number;
    onError?: (error: Error) => void;
}

export function useWorkspaceTaskSync({
    workspaceId,
    initialTasks,
    debounceMs = CARD_MOVE_DEBOUNCE_MS,
    onError,
}: UseWorkspaceTaskSyncOptions) {
    const [tasks, setTasks] = useState<WorkspaceTaskItem[]>(initialTasks);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Keep tasks in sync if initialTasks prop updates externally (e.g. filter change or create modal)
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    // Single global debounce timer for the entire workspace
    const globalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Track the latest persisted status for each task (used for safe rollback)
    const taskPersistedStateRef = useRef<Map<number, TaskSyncState>>(new Map());

    // 1. Pending changes queued by the user, waiting for idle debounce
    const pendingUpdatesRef = useRef<Map<number, TaskStatus>>(new Map());

    // 2. In-flight changes currently being sent to the server
    const inFlightUpdatesRef = useRef<Map<number, TaskStatus> | null>(null);

    // Initialize/update known persisted status from tasks
    useEffect(() => {
        tasks.forEach((t) => {
            if (!taskPersistedStateRef.current.has(t.id)) {
                taskPersistedStateRef.current.set(t.id, {
                    persistedStatus: t.status,
                });
            }
        });
    }, [tasks]);

    /**
     * Flush all pending updates immediately to the server (e.g. on unmount or before unload).
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
        // If a batch request is already in progress, wait for it to complete.
        // When it completes, it will automatically trigger another cycle if pendingUpdates is non-empty.
        if (inFlightUpdatesRef.current !== null) {
            return;
        }

        // If no pending updates, nothing to do
        if (pendingUpdatesRef.current.size === 0) {
            return;
        }

        // Snapshot pending updates into in-flight collection and clear pending
        const currentBatch = new Map(pendingUpdatesRef.current);
        pendingUpdatesRef.current.clear();
        inFlightUpdatesRef.current = currentBatch;

        const payload: TaskBulkUpdateItem[] = Array.from(
            currentBatch.entries(),
        ).map(([taskId, status]) => ({
            task_id: taskId,
            status,
        }));

        try {
            await patchTaskBulkUpdate(workspaceId, payload);

            // Successfully persisted this batch
            currentBatch.forEach((status, taskId) => {
                const state = taskPersistedStateRef.current.get(taskId);
                if (state) {
                    state.persistedStatus = status;
                } else {
                    taskPersistedStateRef.current.set(taskId, {
                        persistedStatus: status,
                    });
                }
            });

            // Mark in-flight as done
            inFlightUpdatesRef.current = null;

            // If new pending changes arrived while this batch was in-flight,
            // process them immediately if no active debounce timer is running
            if (
                pendingUpdatesRef.current.size > 0 &&
                globalTimerRef.current === null
            ) {
                void processBatchQueue();
            }
        } catch (error) {
            // Batch failed: rollback tasks in this batch ONLY if no newer pending update was queued for that task
            setTasks((prev) =>
                prev.map((t) => {
                    if (
                        currentBatch.has(t.id) &&
                        !pendingUpdatesRef.current.has(t.id)
                    ) {
                        const state = taskPersistedStateRef.current.get(t.id);
                        return state
                            ? { ...t, status: state.persistedStatus }
                            : t;
                    }
                    return t;
                }),
            );

            // Re-queue any updates that user did NOT modify again, or discard if user modified
            currentBatch.forEach((status, taskId) => {
                if (!pendingUpdatesRef.current.has(taskId)) {
                    // Reverted locally, remove from queue
                }
            });

            inFlightUpdatesRef.current = null;

            const err =
                error instanceof Error
                    ? error
                    : new Error('Failed to synchronize workspace tasks');
            setErrorMessage(err.message);
            onError?.(err);

            // If new changes were queued during the failed request, attempt to sync them
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
            // Card was moved back to its persisted status before sending: remove from pending
            pendingUpdatesRef.current.delete(taskId);
        } else {
            pendingUpdatesRef.current.set(taskId, destinationStatus);
        }

        // 3. Reset Global Workspace Debounce Timer
        if (globalTimerRef.current !== null) {
            clearTimeout(globalTimerRef.current);
            globalTimerRef.current = null;
        }

        // Only start timer if there are pending updates to send
        if (pendingUpdatesRef.current.size > 0) {
            globalTimerRef.current = setTimeout(() => {
                globalTimerRef.current = null;
                void processBatchQueue();
            }, debounceMs);
        }
    };

    // Component lifecycle cleanup: flush or cancel pending timers
    useEffect(() => {
        const handleBeforeUnload = () => {
            flushQueue();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            if (globalTimerRef.current !== null) {
                clearTimeout(globalTimerRef.current);
                globalTimerRef.current = null;
            }
        };
    }, [workspaceId]);

    return {
        tasks,
        setTasks,
        errorMessage,
        setErrorMessage,
        moveTaskStatus,
        flushQueue,
    };
}
