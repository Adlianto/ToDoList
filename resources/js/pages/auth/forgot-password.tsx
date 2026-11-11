import { Form, Head, Link } from '@inertiajs/react';
import { store as sendResetLinkAction } from '@/actions/App/Http/Controllers/Auth/PasswordResetLinkController';
import { login } from '@/routes';

type ForgotPasswordProps = {
    status?: string;
};

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    return (
        <>
            <Head title="Forgot Password" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
                <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-6">
                        <h1 className="text-xl font-semibold tracking-tight">
                            Reset your password
                        </h1>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Enter your email address and we will send you a
                            password reset link.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {status}
                        </div>
                    )}

                    <Form
                        {...sendResetLinkAction.form()}
                        className="flex flex-col gap-4"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                    >
                                        Email address
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="mt-2 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    {processing
                                        ? 'Sending link...'
                                        : 'Send password reset link'}
                                </button>
                            </>
                        )}
                    </Form>

                    <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                        Remember your password?{' '}
                        <Link
                            href={login.url()}
                            className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                        >
                            Back to sign in
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
