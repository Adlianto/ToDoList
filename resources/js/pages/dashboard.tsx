import { Form, Head, Link } from '@inertiajs/react';
import {
    accept as acceptInvitation,
    decline as declineInvitation,
    index as invitationsIndex,
} from '@/actions/App/Http/Controllers/InvitationController';
import {
    create as createWorkspace,
    show as showWorkspace,
} from '@/actions/App/Http/Controllers/WorkspaceController';
import AppLayout from '@/layouts/app-layout';
import {
    type DashboardTaskItem,
    type IncomingInvitationItem,
    type WorkspaceSummary,
} from '@/types';

type DashboardProps = {
    personalWorkspace: WorkspaceSummary;
    workspaces: WorkspaceSummary[];
    pendingInvitations?: IncomingInvitationItem[];
    overdueTasks?: DashboardTaskItem[];
    upcomingTasks?: DashboardTaskItem[];
};

export default function Dashboard({
    personalWorkspace,
    workspaces,
    pendingInvitations = [],
    overdueTasks = [],
    upcomingTasks = [],
}: DashboardProps) {
    return (
        <AppLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="flex flex-col gap-6">
                {pendingInvitations.length > 0 && (
                    <section className="rounded-lg border border-amber-200 bg-amber-50/60 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                Pending Group Invitations (
                                {pendingInvitations.length})
                            </h2>
                            <Link
                                href={invitationsIndex.url()}
                                className="text-xs font-medium text-zinc-700 underline underline-offset-4 dark:text-zinc-300"
                            >
                                View all
                            </Link>
                        </div>

                        <div className="divide-y divide-amber-200/70 dark:divide-amber-900/40">
                            {pendingInvitations.map((invitation) => (
                                <div
                                    key={invitation.id}
                                    className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {invitation.workspace.name}
                                        </p>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                            Invited by {invitation.inviter.name}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Form
                                            {...acceptInvitation.form(
                                                invitation.id,
                                            )}
                                        >
                                            {({ processing }) => (
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                                >
                                                    Accept
                                                </button>
                                            )}
                                        </Form>
                                        <Form
                                            {...declineInvitation.form(
                                                invitation.id,
                                            )}
                                        >
                                            {({ processing }) => (
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                                >
                                                    Decline
                                                </button>
                                            )}
                                        </Form>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                    {personalWorkspace.name}
                                </h2>
                                <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 uppercase dark:bg-zinc-800 dark:text-zinc-300">
                                    {personalWorkspace.type}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                                Your private workspace for personal tasks and
                                schedules.
                            </p>
                        </div>

                        <Link
                            href={showWorkspace.url(personalWorkspace.id)}
                            className="rounded-md bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            Open Personal Workspace
                        </Link>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            Upcoming & Active Tasks ({upcomingTasks.length})
                        </h2>

                        {upcomingTasks.length === 0 ? (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                No active upcoming tasks across your workspaces.
                            </p>
                        ) : (
                            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {upcomingTasks.map((task) => (
                                    <Link
                                        key={task.id}
                                        href={showWorkspace.url(
                                            task.workspace.id,
                                        )}
                                        className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:opacity-80"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {task.workspace.name} (
                                                {task.workspace.type})
                                            </p>
                                        </div>
                                        <span className="shrink-0 rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 uppercase dark:bg-zinc-800 dark:text-zinc-300">
                                            {task.status}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                        <h2 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            Overdue Tasks ({overdueTasks.length})
                        </h2>

                        {overdueTasks.length === 0 ? (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                You have no overdue tasks. Great job!
                            </p>
                        ) : (
                            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {overdueTasks.map((task) => (
                                    <Link
                                        key={task.id}
                                        href={showWorkspace.url(
                                            task.workspace.id,
                                        )}
                                        className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:opacity-80"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-red-600 dark:text-red-400">
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {task.workspace.name}
                                            </p>
                                        </div>
                                        <span className="shrink-0 rounded bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 uppercase dark:bg-red-950/70 dark:text-red-300">
                                            Overdue
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            Your Workspaces ({workspaces.length})
                        </h2>
                        <Link
                            href={createWorkspace.url()}
                            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                        >
                            + Create Group Workspace
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {workspaces.map((workspace) => (
                            <Link
                                key={workspace.id}
                                href={showWorkspace.url(workspace.id)}
                                className="flex flex-col justify-between rounded-md border border-zinc-200 p-4 transition hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                                        {workspace.name}
                                    </h3>
                                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 uppercase dark:bg-zinc-800 dark:text-zinc-400">
                                        {workspace.type}
                                    </span>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                    <span>
                                        Role: {workspace.role ?? 'owner'}
                                    </span>
                                    <div className="flex items-center gap-3">
                                        {typeof workspace.tasks_count ===
                                            'number' && (
                                            <span>
                                                {workspace.tasks_count}{' '}
                                                {workspace.tasks_count === 1
                                                    ? 'task'
                                                    : 'tasks'}
                                            </span>
                                        )}
                                        {typeof workspace.members_count ===
                                            'number' && (
                                            <span>
                                                {workspace.members_count}{' '}
                                                {workspace.members_count === 1
                                                    ? 'member'
                                                    : 'members'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
