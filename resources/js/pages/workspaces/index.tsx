import { Head, Link } from '@inertiajs/react';
import {
    create as createWorkspace,
    show as showWorkspace,
} from '@/actions/App/Http/Controllers/WorkspaceController';
import AppLayout from '@/layouts/app-layout';
import { type WorkspaceSummary } from '@/types';

type WorkspacesIndexProps = {
    workspaces: WorkspaceSummary[];
};

export default function WorkspacesIndex({ workspaces }: WorkspacesIndexProps) {
    const personalWorkspaces = workspaces.filter((w) => w.type === 'personal');
    const groupWorkspaces = workspaces.filter((w) => w.type === 'group');

    return (
        <AppLayout title="Workspaces">
            <Head title="Workspaces" />

            <div className="flex flex-col gap-6">
                <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                Personal Workspace
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Strictly private to your account.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {personalWorkspaces.map((workspace) => (
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
                                    <span>Private</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                Group Workspaces ({groupWorkspaces.length})
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Shared workspaces for meetings, organizations,
                                and study groups.
                            </p>
                        </div>

                        <Link
                            href={createWorkspace.url()}
                            className="rounded-md bg-zinc-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            + Create Group Workspace
                        </Link>
                    </div>

                    {groupWorkspaces.length === 0 ? (
                        <div className="rounded-md border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                You haven&apos;t joined or created any group
                                workspaces yet.
                            </p>
                            <Link
                                href={createWorkspace.url()}
                                className="mt-3 inline-block text-xs font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                            >
                                Create your first group workspace
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {groupWorkspaces.map((workspace) => (
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
                                        <span>Role: {workspace.role}</span>
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
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
