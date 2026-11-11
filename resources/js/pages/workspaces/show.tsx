import { type DropResult } from '@hello-pangea/dnd';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, X } from 'lucide-react';
import { useState } from 'react';
import { KanbanBoard } from '@/components/workspaces/kanban-board';
import { TaskAgendaView } from '@/components/workspaces/task-agenda-view';
import {
    TaskCreateDialog,
    TaskEditDialog,
} from '@/components/workspaces/task-dialogs';
import { TaskListView } from '@/components/workspaces/task-list-view';
import { WorkspaceHeader } from '@/components/workspaces/workspace-header';
import { WorkspaceMembersSettings } from '@/components/workspaces/workspace-members-settings';
import { useWorkspaceTaskSync } from '@/hooks/use-workspace-task-sync';
import AppLayout from '@/layouts/app-layout';
import { buildFilterUrl } from '@/lib/formatters';
import {
    type TaskStatus,
    type WorkspaceDetail,
    type WorkspaceFilters,
    type WorkspaceMemberItem,
    type WorkspacePendingInvitation,
    type WorkspacePermissions,
    type WorkspaceTaskItem,
} from '@/types';

type WorkspaceShowProps = {
    workspace: WorkspaceDetail;
    tasks?: WorkspaceTaskItem[];
    filters?: WorkspaceFilters;
    members: WorkspaceMemberItem[];
    pendingInvitations?: WorkspacePendingInvitation[];
    permissions: WorkspacePermissions;
};

export default function WorkspaceShow({
    workspace,
    tasks = [],
    filters = {
        status: 'all',
        due: 'all',
        sort: 'default',
        view: 'kanban',
    },
    members,
    pendingInvitations = [],
    permissions,
}: WorkspaceShowProps) {
    const activeFilters: WorkspaceFilters = {
        status: filters.status || 'all',
        due: filters.due || 'all',
        sort: filters.sort || 'default',
        view: filters.view || 'kanban',
    };

    // Centralized workspace sync queue with instant optimistic UI
    const {
        tasks: localTasks,
        errorMessage,
        setErrorMessage,
        moveTaskStatus,
    } = useWorkspaceTaskSync({
        workspaceId: workspace.id,
        initialTasks: tasks,
    });

    // Dialog state for Task Create & Edit modals
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [createDefaultStatus, setCreateDefaultStatus] =
        useState<TaskStatus>('todo');
    const [editingTask, setEditingTask] = useState<WorkspaceTaskItem | null>(
        null,
    );

    const openCreateDialog = (status: TaskStatus = 'todo') => {
        setCreateDefaultStatus(status);
        setCreateDialogOpen(true);
    };

    // Filter Navigation Handler with SPA transitions
    const applyFilterUpdate = (updates: Partial<WorkspaceFilters>) => {
        const nextUrl = buildFilterUrl(workspace.id, activeFilters, updates);
        router.get(
            nextUrl,
            {},
            {
                preserveScroll: true,
                preserveState: true,
            },
        );
    };

    // Drag and Drop Handler with Optimistic Updates and Debounced Sync
    const handleDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;
        if (!destination) {
            return;
        }

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const taskId = Number(draggableId);
        const destinationStatus = destination.droppableId as TaskStatus;

        moveTaskStatus(taskId, destinationStatus);
    };

    return (
        <AppLayout workspace={workspace}>
            <Head title={workspace.name} />

            <div className="flex flex-col gap-6">
                {/* Error Banner for Optimistic Move Failure */}
                {errorMessage && (
                    <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                            <span>{errorMessage}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setErrorMessage(null)}
                            className="rounded-lg p-1 text-rose-600 hover:bg-rose-100 dark:text-rose-400 dark:hover:bg-rose-900/50"
                            aria-label="Dismiss error"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* 1. Header Toolbar */}
                <WorkspaceHeader
                    workspace={workspace}
                    membersCount={members.length}
                    activeFilters={activeFilters}
                    permissions={permissions}
                    onFilterChange={applyFilterUpdate}
                    onOpenCreateDialog={openCreateDialog}
                />

                {/* 2. Main View Presentation */}
                {activeFilters.view === 'kanban' && (
                    <KanbanBoard
                        tasks={localTasks}
                        workspaceId={workspace.id}
                        permissions={permissions}
                        onAddTask={openCreateDialog}
                        onEditTask={setEditingTask}
                        onStatusChange={moveTaskStatus}
                        onDragEnd={handleDragEnd}
                    />
                )}

                {activeFilters.view === 'list' && (
                    <TaskListView
                        tasks={localTasks}
                        workspaceId={workspace.id}
                        onEditTask={setEditingTask}
                        onStatusChange={moveTaskStatus}
                    />
                )}

                {activeFilters.view === 'agenda' && (
                    <TaskAgendaView
                        tasks={localTasks}
                        workspaceId={workspace.id}
                        onEditTask={setEditingTask}
                        onStatusChange={moveTaskStatus}
                    />
                )}

                {activeFilters.view === 'members' && (
                    <WorkspaceMembersSettings
                        workspace={workspace}
                        members={members}
                        pendingInvitations={pendingInvitations}
                        permissions={permissions}
                    />
                )}
            </div>

            {/* 3. Task Dialogs */}
            <TaskCreateDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                workspaceId={workspace.id}
                workspaceName={workspace.name}
                defaultStatus={createDefaultStatus}
            />

            <TaskEditDialog
                task={editingTask}
                workspaceId={workspace.id}
                onClose={() => setEditingTask(null)}
            />
        </AppLayout>
    );
}
