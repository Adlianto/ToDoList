import {
    DragDropContext,
    Draggable,
    Droppable,
    type DropResult,
} from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TaskCard } from '@/components/workspaces/task-card';
import { KANBAN_COLUMNS } from '@/lib/formatters';
import {
    type TaskStatus,
    type WorkspacePermissions,
    type WorkspaceTaskItem,
} from '@/types';

type KanbanBoardProps = {
    tasks: WorkspaceTaskItem[];
    workspaceId: number;
    permissions: WorkspacePermissions;
    onAddTask: (status: TaskStatus) => void;
    onEditTask: (task: WorkspaceTaskItem) => void;
    onStatusChange?: (taskId: number, status: TaskStatus) => void;
    onDragEnd: (result: DropResult) => void;
};

export function KanbanBoard({
    tasks,
    workspaceId,
    permissions,
    onAddTask,
    onEditTask,
    onStatusChange,
    onDragEnd,
}: KanbanBoardProps) {
    const [dndReady, setDndReady] = useState(false);

    useEffect(() => {
        setDndReady(true);
    }, []);

    if (!dndReady) {
        return (
            <div className="p-8 text-center text-sm text-zinc-500">
                Loading board...
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 gap-5 overflow-x-auto pb-6 md:grid-cols-3">
                {KANBAN_COLUMNS.map((column) => {
                    const columnTasks = tasks.filter(
                        (t) => t.status === column.id,
                    );

                    return (
                        <div
                            key={column.id}
                            className="flex flex-col rounded-2xl border border-zinc-200/80 bg-zinc-100/60 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-950/50"
                        >
                            {/* Column Header */}
                            <div className="mb-3.5 flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                        {column.title}
                                    </h3>
                                    <Badge
                                        variant={column.badgeVariant}
                                        className="rounded-full px-2 py-0 text-xs font-bold"
                                    >
                                        {columnTasks.length}
                                    </Badge>
                                </div>

                                {permissions.can_create_task !== false && (
                                    <button
                                        type="button"
                                        onClick={() => onAddTask(column.id)}
                                        title={`Add task to ${column.title}`}
                                        className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Droppable Task Cards Container */}
                            <Droppable droppableId={column.id}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex min-h-[300px] flex-1 flex-col gap-3 rounded-xl transition-colors ${
                                            snapshot.isDraggingOver
                                                ? 'bg-zinc-200/40 ring-1 ring-zinc-300 dark:bg-zinc-900/50 dark:ring-zinc-700'
                                                : ''
                                        }`}
                                    >
                                        {columnTasks.map((task, index) => (
                                            <Draggable
                                                key={task.id}
                                                draggableId={String(task.id)}
                                                index={index}
                                            >
                                                {(
                                                    dragProvided,
                                                    dragSnapshot,
                                                ) => (
                                                    <div
                                                        ref={
                                                            dragProvided.innerRef
                                                        }
                                                        {...dragProvided.draggableProps}
                                                        {...dragProvided.dragHandleProps}
                                                    >
                                                        <TaskCard
                                                            task={task}
                                                            workspaceId={
                                                                workspaceId
                                                            }
                                                            onEdit={onEditTask}
                                                            onStatusChange={
                                                                onStatusChange
                                                            }
                                                            isDragging={
                                                                dragSnapshot.isDragging
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}

                                        {columnTasks.length === 0 && (
                                            <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-300/80 p-6 text-center dark:border-zinc-800">
                                                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                                    Drop tasks here or click +
                                                    to add
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
