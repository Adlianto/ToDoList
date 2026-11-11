import { Form, Head, Link } from '@inertiajs/react';
import {
    index as workspacesIndex,
    store as storeWorkspace,
} from '@/actions/App/Http/Controllers/WorkspaceController';
import AppLayout from '@/layouts/app-layout';

export default function CreateWorkspace() {
    return (
        <AppLayout title="Create Group Workspace">
            <Head title="Create Group Workspace" />

            <div className="max-w-xl rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="mb-5 text-sm text-zinc-600 dark:text-zinc-400">
                    Create a shared workspace for your team, organization, or
                    study group. You will automatically become the owner of this
                    group.
                </p>

                <Form
                    {...storeWorkspace.form()}
                    className="flex flex-col gap-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Group Workspace Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    autoFocus
                                    maxLength={100}
                                    placeholder="e.g. Kuliah Kerja Kelompok C"
                                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div className="mt-2 flex items-center justify-end gap-3">
                                <Link
                                    href={workspacesIndex.url()}
                                    className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    {processing
                                        ? 'Creating...'
                                        : 'Create Group Workspace'}
                                </button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </AppLayout>
    );
}
