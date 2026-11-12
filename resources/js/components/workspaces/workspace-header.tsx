import { Form } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    Clock,
    Filter,
    FolderKanban,
    ListTodo,
    Loader2,
    Plus,
    Users,
} from 'lucide-react';
import { leave as leaveWorkspace } from '@/actions/App/Http/Controllers/WorkspaceMemberController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    type TaskStatus,
    type TaskSyncStatus,
    type WorkspaceDetail,
    type WorkspaceFilters,
    type WorkspacePermissions,
} from '@/types';

type WorkspaceHeaderProps = {
    workspace: WorkspaceDetail;
    membersCount: number;
    activeFilters: WorkspaceFilters;
    permissions: WorkspacePermissions;
    syncStatus?: TaskSyncStatus;
    onFilterChange: (updates: Partial<WorkspaceFilters>) => void;
    onOpenCreateDialog: (status?: TaskStatus) => void;
};

const DUE_FILTER_OPTIONS: Array<{ key: string; label: string }> = [
    { key: 'all', label: 'All Dates' },
    { key: 'today', label: 'Due Today' },
    { key: 'this_week', label: 'Due This Week' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'no_due_date', label: 'No Due Date' },
];

const SORT_OPTIONS: Array<{ key: string; label: string }> = [
    { key: 'default', label: 'Default Order' },
    { key: 'due_at_asc', label: 'Due: Earliest' },
    { key: 'due_at_desc', label: 'Due: Latest' },
    { key: 'created_at_desc', label: 'Newest First' },
    { key: 'created_at_asc', label: 'Oldest First' },
    { key: 'title_asc', label: 'Title: A-Z' },
];

export function WorkspaceHeader({
    workspace,
    membersCount,
    activeFilters,
    permissions,
    syncStatus = 'idle',
    onFilterChange,
    onOpenCreateDialog,
}: WorkspaceHeaderProps) {
    return (
        <header className="flex flex-col gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            {workspace.name}
                        </h1>
                        <Badge
                            variant="secondary"
                            className="font-bold tracking-wide uppercase"
                        >
                            {workspace.type}
                        </Badge>
                        {workspace.current_user_role && (
                            <Badge
                                variant="outline"
                                className="font-semibold uppercase"
                            >
                                Role: {workspace.current_user_role}
                            </Badge>
                        )}
                        {syncStatus === 'pending' && (
                            <span
                                data-testid="sync-status-pending"
                                className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                            >
                                <Clock className="h-3 w-3" />
                                <span>Unsaved changes...</span>
                            </span>
                        )}
                        {syncStatus === 'syncing' && (
                            <span
                                data-testid="sync-status-syncing"
                                className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                            >
                                <Loader2 className="h-3 w-3 animate-spin" />
                                <span>Saving...</span>
                            </span>
                        )}
                        {syncStatus === 'saved' && (
                            <span
                                data-testid="sync-status-saved"
                                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                            >
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Saved</span>
                            </span>
                        )}
                        {syncStatus === 'error' && (
                            <span
                                data-testid="sync-status-error"
                                className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                            >
                                <AlertCircle className="h-3 w-3" />
                                <span>Sync failed</span>
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {workspace.type === 'personal'
                            ? 'A private board to keep track of your personal tasks and schedule.'
                            : `Shared team board with ${membersCount} members.`}
                    </p>
                </div>

                {/* Top Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Switcher View Tabs */}
                    <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
                        <button
                            type="button"
                            onClick={() => onFilterChange({ view: 'kanban' })}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeFilters.view === 'kanban'
                                    ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                            }`}
                        >
                            <FolderKanban className="h-3.5 w-3.5" />
                            <span>Kanban</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onFilterChange({ view: 'list' })}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeFilters.view === 'list'
                                    ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                            }`}
                        >
                            <ListTodo className="h-3.5 w-3.5" />
                            <span>List</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => onFilterChange({ view: 'agenda' })}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                activeFilters.view === 'agenda'
                                    ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                            }`}
                        >
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>Agenda</span>
                        </button>
                        {workspace.type === 'group' && (
                            <button
                                type="button"
                                onClick={() =>
                                    onFilterChange({
                                        view: 'members',
                                    })
                                }
                                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                    activeFilters.view === 'members'
                                        ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                                }`}
                            >
                                <Users className="h-3.5 w-3.5" />
                                <span>Members</span>
                            </button>
                        )}
                    </div>

                    {/* + New Task Button */}
                    {permissions.can_create_task !== false && (
                        <Button
                            onClick={() => onOpenCreateDialog('todo')}
                            className="bg-zinc-900 text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            <Plus className="h-4 w-4" />
                            <span>+ New Task</span>
                        </Button>
                    )}
                </div>
            </div>

            {/* Filter controls row */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <Filter className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="font-medium">Date:</span>
                        <select
                            value={activeFilters.due}
                            onChange={(e) =>
                                onFilterChange({ due: e.target.value })
                            }
                            className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200"
                        >
                            {DUE_FILTER_OPTIONS.map((opt) => (
                                <option key={opt.key} value={opt.key}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <span className="font-medium">Sort:</span>
                        <select
                            value={activeFilters.sort}
                            onChange={(e) =>
                                onFilterChange({ sort: e.target.value })
                            }
                            className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-2.5 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-200"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.key} value={opt.key}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Leave workspace button for non-owner members */}
                {permissions.can_leave && (
                    <Form
                        {...leaveWorkspace.form(workspace.id)}
                        onSubmit={(e) => {
                            if (
                                !confirm(
                                    'Are you sure you want to leave this workspace? You will lose access to its tasks.',
                                )
                            ) {
                                e.preventDefault();
                            }
                        }}
                    >
                        {({ processing }) => (
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300"
                            >
                                {processing ? 'Leaving...' : 'Leave Workspace'}
                            </button>
                        )}
                    </Form>
                )}
            </div>
        </header>
    );
}
