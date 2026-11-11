import { show as showWorkspace } from '@/actions/App/Http/Controllers/WorkspaceController';
import {
    type TaskStatus,
    type WorkspaceFilters,
    type WorkspaceTaskItem,
} from '@/types';

export type AgendaBucketKey =
    | 'overdue'
    | 'today'
    | 'this_week'
    | 'later'
    | 'no_date';

export function getInitials(name?: string): string {
    if (!name) {
        return 'U';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

export function formatDateTimeForInput(isoString: string | null): string {
    if (!isoString) {
        return '';
    }

    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatDueDateDisplay(isoString: string | null): string | null {
    if (!isoString) {
        return null;
    }

    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export function getAgendaBucket(task: WorkspaceTaskItem): AgendaBucketKey {
    if (!task.due_at) {
        return 'no_date';
    }

    const dueDate = new Date(task.due_at);
    if (Number.isNaN(dueDate.getTime())) {
        return 'no_date';
    }

    const now = new Date();

    if (task.is_overdue && task.status !== 'done') {
        return 'overdue';
    }

    const isToday =
        dueDate.getFullYear() === now.getFullYear() &&
        dueDate.getMonth() === now.getMonth() &&
        dueDate.getDate() === now.getDate();

    if (isToday) {
        return 'today';
    }

    const diffDays =
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > 0 && diffDays <= 7) {
        return 'this_week';
    }

    if (diffDays > 7) {
        return 'later';
    }

    return 'overdue';
}

export function buildFilterUrl(
    workspaceId: number,
    currentFilters: WorkspaceFilters,
    updates: Partial<WorkspaceFilters>,
): string {
    const next = {
        status:
            updates.status !== undefined
                ? updates.status
                : currentFilters.status,
        due: updates.due !== undefined ? updates.due : currentFilters.due,
        sort: updates.sort !== undefined ? updates.sort : currentFilters.sort,
        view: updates.view !== undefined ? updates.view : currentFilters.view,
    };

    const query: Record<string, string> = {};
    if (next.status && next.status !== 'all') {
        query.status = next.status;
    }
    if (next.due && next.due !== 'all') {
        query.due = next.due;
    }
    if (next.sort && next.sort !== 'default') {
        query.sort = next.sort;
    }
    if (next.view && next.view !== 'kanban') {
        query.view = next.view;
    }

    return showWorkspace.url(
        workspaceId,
        Object.keys(query).length > 0 ? { query } : undefined,
    );
}

export const KANBAN_COLUMNS: Array<{
    id: TaskStatus;
    title: string;
    badgeVariant: 'secondary' | 'info' | 'success';
    headerBorder: string;
}> = [
    {
        id: 'todo',
        title: 'To-do',
        badgeVariant: 'secondary',
        headerBorder: 'border-zinc-300 dark:border-zinc-700',
    },
    {
        id: 'in_progress',
        title: 'On Progress',
        badgeVariant: 'info',
        headerBorder: 'border-blue-400 dark:border-blue-600',
    },
    {
        id: 'done',
        title: 'Completed',
        badgeVariant: 'success',
        headerBorder: 'border-emerald-400 dark:border-emerald-600',
    },
];

export const AGENDA_BUCKETS: Array<{
    key: AgendaBucketKey;
    label: string;
    description: string;
    badgeClass: string;
}> = [
    {
        key: 'overdue',
        label: 'Overdue',
        description: 'Tasks past their due date that still need attention',
        badgeClass:
            'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-300',
    },
    {
        key: 'today',
        label: 'Today',
        description: 'Tasks scheduled for today',
        badgeClass:
            'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300',
    },
    {
        key: 'this_week',
        label: 'Upcoming This Week',
        description: 'Tasks due within the next 7 days',
        badgeClass:
            'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300',
    },
    {
        key: 'later',
        label: 'Later',
        description: 'Tasks due beyond this week',
        badgeClass:
            'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300',
    },
    {
        key: 'no_date',
        label: 'No Due Date',
        description: 'Backlog tasks without a deadline',
        badgeClass:
            'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
    },
];
