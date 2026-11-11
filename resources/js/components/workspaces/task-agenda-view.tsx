import { TaskCard } from '@/components/workspaces/task-card';
import { AGENDA_BUCKETS, getAgendaBucket } from '@/lib/formatters';
import { type WorkspaceTaskItem } from '@/types';

type TaskAgendaViewProps = {
    tasks: WorkspaceTaskItem[];
    workspaceId: number;
    onEditTask: (task: WorkspaceTaskItem) => void;
    onStatusChange?: (
        taskId: number,
        status: 'todo' | 'in_progress' | 'done',
    ) => void;
};

export function TaskAgendaView({
    tasks,
    workspaceId,
    onEditTask,
    onStatusChange,
}: TaskAgendaViewProps) {
    return (
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Timeline & Agenda Schedule
                </h2>
            </div>

            <div className="space-y-6">
                {AGENDA_BUCKETS.map((bucket) => {
                    const bucketTasks = tasks.filter(
                        (t) => getAgendaBucket(t) === bucket.key,
                    );

                    if (bucketTasks.length === 0) {
                        return null;
                    }

                    return (
                        <div key={bucket.key} className="space-y-3">
                            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                        {bucket.label}
                                    </h3>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${bucket.badgeClass}`}
                                    >
                                        {bucketTasks.length}
                                    </span>
                                </div>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {bucket.description}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {bucketTasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        workspaceId={workspaceId}
                                        onEdit={onEditTask}
                                        onStatusChange={onStatusChange}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
