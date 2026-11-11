import { Form, router } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Edit3,
    ListTodo,
    MoreHorizontal,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
    destroy as destroyTask,
    update as updateTask,
} from '@/actions/App/Http/Controllers/TaskController';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { formatDueDateDisplay, getInitials } from '@/lib/formatters';
import { type WorkspaceTaskItem } from '@/types';

type TaskCardProps = {
    task: WorkspaceTaskItem;
    workspaceId: number;
    onEdit: (task: WorkspaceTaskItem) => void;
    onStatusChange?: (
        taskId: number,
        status: 'todo' | 'in_progress' | 'done',
    ) => void;
    isDragging?: boolean;
};

export function TaskCard({
    task,
    workspaceId,
    onEdit,
    onStatusChange,
    isDragging = false,
}: TaskCardProps) {
    const [menuOpen, setMenuOpen] = useState(false);
    const formattedDue = formatDueDateDisplay(task.due_at);
    const creatorInitials = getInitials(task.creator.name);

    return (
        <Card
            className={`group relative flex flex-col justify-between rounded-xl border border-zinc-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800/90 dark:bg-zinc-900 dark:hover:border-zinc-700 ${
                isDragging
                    ? 'scale-102 rotate-1 shadow-xl ring-2 ring-zinc-900 dark:ring-zinc-100'
                    : ''
            }`}
        >
            <div>
                {/* Card Title & Options Menu */}
                <div className="flex items-start justify-between gap-2">
                    <h4
                        className={`text-sm leading-snug font-semibold tracking-tight ${
                            task.status === 'done'
                                ? 'text-zinc-400 line-through dark:text-zinc-500'
                                : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                    >
                        {task.title}
                    </h4>

                    <div className="relative shrink-0">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpen((prev) => !prev);
                            }}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            aria-label="Task options"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {menuOpen && (
                            <div
                                className="absolute top-6 right-0 z-20 w-44 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onEdit(task);
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    <span>Edit Task</span>
                                </button>

                                {task.status !== 'done' ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            if (onStatusChange) {
                                                onStatusChange(task.id, 'done');
                                            } else {
                                                router.patch(
                                                    updateTask.url({
                                                        workspace: workspaceId,
                                                        task: task.id,
                                                    }),
                                                    { status: 'done' },
                                                    {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    },
                                                );
                                            }
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/50"
                                    >
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        <span>Mark Done</span>
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            if (onStatusChange) {
                                                onStatusChange(task.id, 'todo');
                                            } else {
                                                router.patch(
                                                    updateTask.url({
                                                        workspace: workspaceId,
                                                        task: task.id,
                                                    }),
                                                    { status: 'todo' },
                                                    {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                    },
                                                );
                                            }
                                        }}
                                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                                    >
                                        <ListTodo className="h-3.5 w-3.5" />
                                        <span>Reopen Task</span>
                                    </button>
                                )}

                                {task.can_delete && (
                                    <div className="mt-1 border-t border-zinc-100 pt-1 dark:border-zinc-800">
                                        <Form
                                            {...destroyTask.form({
                                                workspace: workspaceId,
                                                task: task.id,
                                            })}
                                            onSubmit={() => setMenuOpen(false)}
                                        >
                                            {({ processing }) => (
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950/50"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    <span>Delete</span>
                                                </button>
                                            )}
                                        </Form>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Description preview */}
                {task.description && (
                    <p className="mt-1.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {task.description}
                    </p>
                )}

                {/* Due Date & Overdue Badges */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {formattedDue && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                            <Clock className="h-3 w-3" />
                            <span>{formattedDue}</span>
                        </span>
                    )}

                    {task.is_overdue && task.status !== 'done' && (
                        <Badge
                            variant="destructive"
                            className="inline-flex items-center gap-1 text-[10px]"
                        >
                            <AlertCircle className="h-2.5 w-2.5" />
                            <span>Overdue</span>
                        </Badge>
                    )}
                </div>
            </div>

            {/* Footer: Creator Avatar & Username (NO EMAIL) */}
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-2.5 dark:border-zinc-800/80">
                <div
                    className="flex items-center gap-1.5"
                    title={`Created by ${task.creator.name} (@${task.creator.username})`}
                >
                    <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[9px]">
                            {creatorInitials}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                        @{task.creator.username}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    {task.can_delete && (
                        <Form
                            {...destroyTask.form({
                                workspace: workspaceId,
                                task: task.id,
                            })}
                        >
                            {({ processing }) => (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    title="Delete task"
                                    className="rounded p-1 text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </Form>
                    )}
                </div>
            </div>
        </Card>
    );
}
