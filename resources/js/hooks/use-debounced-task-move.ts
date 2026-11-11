import { useEffect, useRef, useState } from 'react';
import { patchTaskStatus } from '@/lib/api';
import { CARD_MOVE_DEBOUNCE_MS } from '@/lib/constants';
import { type TaskStatus, type WorkspaceTaskItem } from '@/types';

interface QueuedTaskMove {
    destinationStatus: TaskStatus;
    originalStatus: TaskStatus;
    timerId: ReturnType<typeof setTimeout> | null;
    isSyncing: boolean;
    persistedStatus: TaskStatus;
}

interface UseDebouncedTaskMoveOptions {
    workspaceId: number;
    initialTasks: WorkspaceTaskItem[];
    debounceMs?: number;
    onError?: (error: Error, taskId: number) => void;
}

export function useDebouncedTaskMove({
    workspaceId,
    initialTasks,
    debounceMs = CARD_MOVE_DEBOUNCE_MS,
    onError,
}: UseDebouncedTaskMoveOptions) {
    const [tasks, setTasks] = useState<WorkspaceTaskItem[]>(initialTasks);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Keep tasks in sync if initialTasks prop updates externally (e.g. filter change or create modal)
    useEffect(() => {
        setTasks(initialTasks);
    }, [initialTasks]);

    // Track per-task state: debounce timer, syncing status, persisted status, and latest intended status
    const taskQueuesRef = useRef<Map<number, QueuedTaskMove>>(new Map());

    // Flush all active debounce timers immediately (e.g., when unmounting or before window unload)
    const flushActiveTimers = () => {
        taskQueuesRef.current.forEach((queue, taskId) => {
            if (queue.timerId !== null) {
                clearTimeout(queue.timerId);
                queue.timerId = null;
                // Trigger immediate sync
                void processTaskQueue(taskId);
            }
        });
    };

    /**
     * Send the mutation to backend. If another status change came in while the request was in flight,
     * immediately process the new status.
     */
    const processTaskQueue = async (taskId: number) => {
        const queue = taskQueuesRef.current.get(taskId);
        if (!queue) {
            return;
        }

        // If a sync is already running, wait until it finishes
        if (queue.isSyncing) {
            return;
        }

        // If current intended status is already what is persisted, do nothing
        if (queue.destinationStatus === queue.persistedStatus) {
            return;
        }

        const targetStatus = queue.destinationStatus;
        queue.isSyncing = true;

        try {
            await patchTaskStatus(workspaceId, taskId, targetStatus);

            // Successfully persisted this target status
            queue.persistedStatus = targetStatus;
            queue.originalStatus = targetStatus;
            queue.isSyncing = false;

            // Check if user changed status again while request was in-flight
            if (queue.destinationStatus !== queue.persistedStatus) {
                // If there's no pending debounce timer, process right away
                if (queue.timerId === null) {
                    void processTaskQueue(taskId);
                }
            }
        } catch (error) {
            queue.isSyncing = false;

            // If user has not moved the card again since this failure
            if (queue.destinationStatus === targetStatus) {
                // Roll back local UI to last known persisted status
                setTasks((prev) =>
                    prev.map((t) =>
                        t.id === taskId
                            ? { ...t, status: queue.persistedStatus }
                            : t,
                    ),
                );
                queue.destinationStatus = queue.persistedStatus;

                const err =
                    error instanceof Error
                        ? error
                        : new Error('Failed to update task status');
                setErrorMessage(err.message);
                onError?.(err, taskId);
            } else {
                // User has chosen another status since, attempt to sync that instead
                if (queue.timerId === null) {
                    void processTaskQueue(taskId);
                }
            }
        }
    };

    /**
     * Move task status with instant optimistic UI update and debounced server sync.
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

        // 2. Manage Debounce Queue for this specific task
        let queue = taskQueuesRef.current.get(taskId);
        if (!queue) {
            queue = {
                destinationStatus,
                originalStatus: currentTask.status,
                persistedStatus: currentTask.status,
                timerId: null,
                isSyncing: false,
            };
            taskQueuesRef.current.set(taskId, queue);
        }

        // Clear existing debounce timer for this task if any
        if (queue.timerId !== null) {
            clearTimeout(queue.timerId);
            queue.timerId = null;
        }

        queue.destinationStatus = destinationStatus;

        // If destination is already the persisted status and not currently syncing, no need to schedule server request
        if (
            queue.destinationStatus === queue.persistedStatus &&
            !queue.isSyncing
        ) {
            return;
        }

        // Start new debounce timer
        queue.timerId = setTimeout(() => {
            if (queue) {
                queue.timerId = null;
            }
            void processTaskQueue(taskId);
        }, debounceMs);
    };

    // Component lifecycle cleanup: flush or cancel pending timers
    useEffect(() => {
        const handleBeforeUnload = () => {
            flushActiveTimers();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Flush any remaining pending moves on unmount
            taskQueuesRef.current.forEach((queue) => {
                if (queue.timerId !== null) {
                    clearTimeout(queue.timerId);
                    queue.timerId = null;
                }
            });
        };
    }, [workspaceId]);

    return {
        tasks,
        setTasks,
        errorMessage,
        setErrorMessage,
        moveTaskStatus,
        flushActiveTimers,
    };
}
