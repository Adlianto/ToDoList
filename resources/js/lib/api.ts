import {
    bulkUpdate as bulkUpdateTasks,
    update as updateTask,
} from '@/actions/App/Http/Controllers/TaskController';
import { type TaskStatus } from '@/types';

/**
 * Retrieve CSRF token from document meta tag or XSRF-TOKEN cookie.
 */
export function getCsrfToken(): string {
    if (typeof document === 'undefined') {
        return '';
    }

    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
        const token = metaTag.getAttribute('content');
        if (token) {
            return token;
        }
    }

    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
        public conflicts?: TaskConflictItem[],
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export interface TaskConflictItem {
    task_id: number;
    status: TaskStatus;
    lock_version: number;
}

/**
 * Perform a background PATCH request to update task status without triggering Inertia page reload.
 */
export async function patchTaskStatus(
    workspaceId: number,
    taskId: number,
    status: TaskStatus,
    lockVersion?: number,
): Promise<void> {
    const url = updateTask.url({ workspace: workspaceId, task: taskId });
    const csrfToken = getCsrfToken();

    const response = await fetch(url, {
        method: 'PATCH',
        keepalive: true,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            status,
            ...(lockVersion !== undefined ? { lock_version: lockVersion } : {}),
        }),
    });

    if (!response.ok) {
        let errorMessage = `Failed to update task status (HTTP ${response.status})`;
        try {
            const data = (await response.json()) as { message?: string };
            if (data?.message) {
                errorMessage = data.message;
            }
        } catch {
            // response was not JSON or empty
        }
        throw new ApiError(response.status, errorMessage);
    }
}

export interface TaskBulkUpdateItem {
    task_id: number;
    status: TaskStatus;
    lock_version?: number;
}

export interface TaskBulkUpdateResponse {
    message: string;
    updated_count: number;
    updated_task_ids: number[];
    task_versions?: Record<number, number>;
}

/**
 * Perform a background PATCH request to atomically update multiple tasks in a workspace.
 */
export async function patchTaskBulkUpdate(
    workspaceId: number,
    updates: TaskBulkUpdateItem[],
): Promise<TaskBulkUpdateResponse> {
    const url = bulkUpdateTasks.url({ workspace: workspaceId });
    const csrfToken = getCsrfToken();

    const response = await fetch(url, {
        method: 'PATCH',
        keepalive: true,
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
        let errorMessage = `Failed to bulk update tasks (HTTP ${response.status})`;
        let conflicts: TaskConflictItem[] | undefined;
        try {
            const data = (await response.json()) as {
                message?: string;
                conflicts?: TaskConflictItem[];
            };
            if (data?.message) {
                errorMessage = data.message;
            }
            if (Array.isArray(data?.conflicts)) {
                conflicts = data.conflicts;
            }
        } catch {
            // response was not JSON or empty
        }
        throw new ApiError(response.status, errorMessage, conflicts);
    }

    return (await response.json()) as TaskBulkUpdateResponse;
}
