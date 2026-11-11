import { TaskCard } from '@/components/workspaces/task-card';
import { type WorkspaceTaskItem } from '@/types';

type TaskListViewProps = {
    tasks: WorkspaceTaskItem[];
    workspaceId: number;
    onEditTask: (task: WorkspaceTaskItem) => void;
    onStatusChange?: (
        taskId: number,
        status: 'todo' | 'in_progress' | 'done',
    ) => void;
};

export function TaskListView({
    tasks,
    workspaceId,
    onEditTask,
    onStatusChange,
}: TaskListViewProps) {
    return (
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Task List ({tasks.length})
                </h2>
            </div>

            {tasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    No tasks matching the selected filters.
                </div>
            ) : (
                <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="py-3.5 first:pt-0 last:pb-0"
                        >
                            <TaskCard
                                task={task}
                                workspaceId={workspaceId}
                                onEdit={onEditTask}
                                onStatusChange={onStatusChange}
                            />
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
