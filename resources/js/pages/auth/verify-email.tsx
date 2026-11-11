import { Form, Head } from '@inertiajs/react';
import { store as sendVerificationNotification } from '@/actions/App/Http/Controllers/Auth/EmailVerificationNotificationController';
import { destroy as logoutAction } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';

type VerifyEmailProps = {
    status?: string;
};

export default function VerifyEmail({ status }: VerifyEmailProps) {
    return (
        <>
            <Head title="Verify Email" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
                <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-6">
                        <h1 className="text-xl font-semibold tracking-tight">
                            Verify your email address
                        </h1>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Thanks for signing up! Before getting started, could
                            you verify your email address by clicking on the
                            link we just emailed to you?
                        </p>
                    </div>

                    {status === 'verification-link-sent' && (
                        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            A new verification link has been sent to the email
                            address you provided during registration.
                        </div>
                    )}

                    <div className="flex flex-col gap-4">
                        <Form {...sendVerificationNotification.form()}>
                            {({ processing }) => (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    {processing
                                        ? 'Resending email...'
                                        : 'Resend verification email'}
                                </button>
                            )}
                        </Form>

                        <Form {...logoutAction.form()}>
                            {({ processing }) => (
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                >
                                    Log out
                                </button>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </>
    );
}
