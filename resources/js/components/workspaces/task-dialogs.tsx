import { Form } from '@inertiajs/react';
import {
    store as storeTask,
    update as updateTask,
} from '@/actions/App/Http/Controllers/TaskController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { formatDateTimeForInput } from '@/lib/formatters';
import { type TaskStatus, type WorkspaceTaskItem } from '@/types';

type TaskCreateDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: number;
    workspaceName: string;
    defaultStatus?: TaskStatus;
};

export function TaskCreateDialog({
    open,
    onOpenChange,
    workspaceId,
    workspaceName,
    defaultStatus = 'todo',
}: TaskCreateDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent onClose={() => onOpenChange(false)}>
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>
                        Create a task in {workspaceName}. Assign status and due
                        date.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...storeTask.form(workspaceId)}
                    resetOnSuccess
                    onSuccess={() => onOpenChange(false)}
                    className="mt-4 space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <div>
                                <label
                                    htmlFor="modal-task-title"
                                    className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                >
                                    Task Title *
                                </label>
                                <input
                                    id="modal-task-title"
                                    name="title"
                                    type="text"
                                    required
                                    maxLength={255}
                                    placeholder="e.g. Design System & Style Guide"
                                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="modal-task-status"
                                        className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                    >
                                        Status
                                    </label>
                                    <select
                                        id="modal-task-status"
                                        name="status"
                                        defaultValue={defaultStatus}
                                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                    >
                                        <option value="todo">To-do</option>
                                        <option value="in_progress">
                                            On Progress
                                        </option>
                                        <option value="done">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="modal-task-due"
                                        className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                    >
                                        Due Date (Optional)
                                    </label>
                                    <input
                                        id="modal-task-due"
                                        name="due_at"
                                        type="datetime-local"
                                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="modal-task-desc"
                                    className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                >
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="modal-task-desc"
                                    name="description"
                                    rows={3}
                                    maxLength={2000}
                                    placeholder="Add notes, checklists, or relevant information..."
                                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => onOpenChange(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Adding...' : 'Create Task'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

type TaskEditDialogProps = {
    task: WorkspaceTaskItem | null;
    onClose: () => void;
    workspaceId: number;
};

export function TaskEditDialog({
    task,
    onClose,
    workspaceId,
}: TaskEditDialogProps) {
    if (!task) {
        return null;
    }

    return (
        <Dialog
            open={Boolean(task)}
            onOpenChange={(open) => !open && onClose()}
        >
            <DialogContent onClose={onClose}>
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                    <DialogDescription>
                        Update title, status, description, or due date.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...updateTask.form({
                        workspace: workspaceId,
                        task: task.id,
                    })}
                    onSuccess={onClose}
                    className="mt-4 space-y-4"
                >
                    {({ errors, processing }) => (
                        <>
                            {task.lock_version !== undefined && (
                                <input
                                    type="hidden"
                                    name="lock_version"
                                    value={task.lock_version}
                                />
                            )}
                            <div>
                                <label
                                    htmlFor="edit-modal-title"
                                    className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                >
                                    Title *
                                </label>
                                <input
                                    id="edit-modal-title"
                                    name="title"
                                    type="text"
                                    required
                                    defaultValue={task.title}
                                    maxLength={255}
                                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                        {errors.title}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="edit-modal-status"
                                        className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                    >
                                        Status
                                    </label>
                                    <select
                                        id="edit-modal-status"
                                        name="status"
                                        defaultValue={task.status}
                                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                    >
                                        <option value="todo">To-do</option>
                                        <option value="in_progress">
                                            On Progress
                                        </option>
                                        <option value="done">Completed</option>
                                    </select>
                                </div>

                                <div>
                                    <label
                                        htmlFor="edit-modal-due"
                                        className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                    >
                                        Due Date
                                    </label>
                                    <input
                                        id="edit-modal-due"
                                        name="due_at"
                                        type="datetime-local"
                                        defaultValue={formatDateTimeForInput(
                                            task.due_at,
                                        )}
                                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="edit-modal-desc"
                                    className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="edit-modal-desc"
                                    name="description"
                                    rows={3}
                                    defaultValue={task.description ?? ''}
                                    maxLength={2000}
                                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                />
                            </div>

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
