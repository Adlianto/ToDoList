import { Form, Head } from '@inertiajs/react';
import {
    accept as acceptInvitation,
    acceptByCode,
    decline as declineInvitation,
} from '@/actions/App/Http/Controllers/InvitationController';
import AppLayout from '@/layouts/app-layout';
import { type IncomingInvitationItem } from '@/types';

type InvitationsIndexProps = {
    invitations: IncomingInvitationItem[];
};

export default function InvitationsIndex({
    invitations,
}: InvitationsIndexProps) {
    return (
        <AppLayout title="Invitations">
            <Head title="Invitations" />

            <div className="flex flex-col gap-6">
                <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Join with Invitation Code
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Have a one-time invitation code from a group owner or
                        admin? Enter it below to join.
                    </p>

                    <Form
                        {...acceptByCode.form()}
                        resetOnSuccess
                        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grow">
                                    <label
                                        htmlFor="invitation-code"
                                        className="sr-only"
                                    >
                                        Invitation Code
                                    </label>
                                    <input
                                        id="invitation-code"
                                        name="code"
                                        type="text"
                                        required
                                        placeholder="Enter 12-character code (e.g. A1B2C3D4E5F6)"
                                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 uppercase focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                                    />
                                    {errors.code && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                            {errors.code}
                                        </p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-md bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    {processing ? 'Joining...' : 'Join Group'}
                                </button>
                            </>
                        )}
                    </Form>
                </section>

                <section className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                    <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        Pending Invitations ({invitations.length})
                    </h2>

                    {invitations.length === 0 ? (
                        <div className="rounded-md border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-800">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                You have no pending group invitations right now.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {invitations.map((invitation) => (
                                <div
                                    key={invitation.id}
                                    className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                                >
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {invitation.workspace.name}
                                        </p>
                                        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
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
                                                    className="rounded-md bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                                >
                                                    {processing
                                                        ? 'Accepting...'
                                                        : 'Accept'}
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
                                                    className="rounded-md border border-zinc-300 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                                                >
                                                    {processing
                                                        ? 'Declining...'
                                                        : 'Decline'}
                                                </button>
                                            )}
                                        </Form>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
