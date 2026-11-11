import { Form, Head, Link } from '@inertiajs/react';
import { store as loginStore } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import { redirect as googleRedirect } from '@/routes/auth/google';
import { request as forgotPasswordRoute } from '@/routes/password';
import { register } from '@/routes';

type LoginProps = {
    status?: string;
};

export default function Login({ status }: LoginProps) {
    return (
        <>
            <Head title="Log in" />
            <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
                <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xs sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-6">
                        <h1 className="text-xl font-semibold tracking-tight">
                            Sign in to your account
                        </h1>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                            Access your personal and group workspaces.
                        </p>
                    </div>

                    {status && (
                        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            {status}
                        </div>
                    )}

                    <a
                        href={googleRedirect.url()}
                        className="inline-flex w-full items-center justify-center gap-3 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                        <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                fill="#4285F4"
                                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                            />
                        </svg>
                        <span>Continue with Google</span>
                    </a>

                    <div className="my-6 flex items-center gap-3">
                        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                        <span className="text-xs text-zinc-400 uppercase">
                            Or with email
                        </span>
                        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                    </div>

                    <Form
                        {...loginStore.form()}
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
                                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between">
                                        <label
                                            htmlFor="password"
                                            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                        >
                                            Password
                                        </label>
                                        <Link
                                            href={forgotPasswordRoute.url()}
                                            className="text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        autoComplete="current-password"
                                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-400"
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        id="remember"
                                        name="remember"
                                        type="checkbox"
                                        value="1"
                                        className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 dark:border-zinc-700 dark:bg-zinc-950"
                                    />
                                    <label
                                        htmlFor="remember"
                                        className="text-sm text-zinc-600 dark:text-zinc-400"
                                    >
                                        Remember me
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="mt-2 w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    {processing ? 'Signing in...' : 'Sign in'}
                                </button>
                            </>
                        )}
                    </Form>

                    <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
                        Don&apos;t have an account?{' '}
                        <Link
                            href={register.url()}
                            className="font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-100"
                        >
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </>
    );
}
