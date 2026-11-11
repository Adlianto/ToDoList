import { Form, Head } from '@inertiajs/react';
import { store as resetPasswordAction } from '@/actions/App/Http/Controllers/Auth/NewPasswordController';

type ResetPasswordProps = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    return (
        <>
            <Head title="Reset Password" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
                <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-6">
                        <h1 className="text-xl font-semibold tracking-tight">
                            Set a new password
                        </h1>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Please choose a strong password to protect your
                            account.
                        </p>
                    </div>

                    <Form
                        {...resetPasswordAction.form()}
                        className="flex flex-col gap-4"
                    >
                        {({ errors, processing }) => (
                            <>
                                <input
                                    type="hidden"
                                    name="token"
                                    value={token}
                                />

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
                                        defaultValue={email}
                                        required
                                        autoComplete="email"
                                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="password"
                                        className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                    >
                                        New password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        autoFocus
                                        autoComplete="new-password"
                                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="password_confirmation"
                                        className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                    >
                                        Confirm password
                                    </label>
                                    <input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type="password"
                                        required
                                        autoComplete="new-password"
                                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="mt-2 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    {processing
                                        ? 'Resetting password...'
                                        : 'Reset password'}
                                </button>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </>
    );
}
