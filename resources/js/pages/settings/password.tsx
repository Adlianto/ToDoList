import { Form, Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { update as updatePasswordAction } from '@/actions/App/Http/Controllers/Auth/PasswordController';

type PasswordSettingsProps = {
    hasPassword: boolean;
    status?: string;
};

export default function PasswordSettings({
    hasPassword,
    status,
}: PasswordSettingsProps) {
    return (
        <AppLayout title="Password & Security">
            <Head title="Password & Security" />

            <div className="mx-auto max-w-2xl">
                <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-6">
                        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                            {hasPassword ? 'Update password' : 'Set a password'}
                        </h1>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            {hasPassword
                                ? 'Ensure your account uses a long, random password to stay secure.'
                                : 'You signed in with Google. You can set a password to also log in with email and password.'}
                        </p>
                    </div>

                    {status === 'password-updated' && (
                        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Password updated successfully.
                        </div>
                    )}

                    <Form
                        {...updatePasswordAction.form()}
                        className="flex flex-col gap-4"
                    >
                        {({ errors, processing }) => (
                            <>
                                {hasPassword && (
                                    <div>
                                        <label
                                            htmlFor="current_password"
                                            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                        >
                                            Current password
                                        </label>
                                        <input
                                            id="current_password"
                                            name="current_password"
                                            type="password"
                                            required
                                            autoComplete="current-password"
                                            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                                        />
                                        {errors.current_password && (
                                            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                                {errors.current_password}
                                            </p>
                                        )}
                                    </div>
                                )}

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
                                        Confirm new password
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

                                <div className="mt-2 flex items-center justify-end">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                    >
                                        {processing
                                            ? 'Saving...'
                                            : 'Save password'}
                                    </button>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </div>
        </AppLayout>
    );
}
