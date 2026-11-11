import { Head, Link, usePage } from '@inertiajs/react';
import { dashboard, login, register } from '@/routes';
import { redirect as googleRedirect } from '@/routes/auth/google';
import { type Auth } from '@/types';

export default function Welcome() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isAuthenticated = Boolean(auth?.user);

    return (
        <>
            <Head title="Shared To-Do & Schedule Workspace" />

            <div className="min-h-screen bg-zinc-50 text-zinc-900 selection:bg-zinc-900 selection:text-white dark:bg-zinc-950 dark:text-zinc-100 dark:selection:bg-zinc-100 dark:selection:text-zinc-900">
                {/* Navigation Header */}
                <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-900/80">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
                        <Link
                            href={isAuthenticated ? dashboard.url() : '/'}
                            className="flex items-center gap-2.5 text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
                        >
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-bold text-white shadow-xs dark:bg-zinc-100 dark:text-zinc-900">
                                TD
                            </span>
                            <span>Shared To-Do</span>
                        </Link>

                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <Link
                                    href={dashboard.url()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    <span>Go to Dashboard</span>
                                    <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                        />
                                    </svg>
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login.url()}
                                        className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 sm:inline-block dark:text-zinc-300 dark:hover:text-zinc-100"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        href={register.url()}
                                        className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-xs hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative overflow-hidden px-4 pt-16 pb-20 sm:px-6 lg:pt-24 lg:pb-28">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1 text-xs font-medium text-zinc-700 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                            <span>
                                Production Ready &bull; Personal & Group
                                Workspaces
                            </span>
                        </div>

                        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
                            Organize Personal Tasks &amp;
                            <span className="block text-zinc-600 dark:text-zinc-400">
                                Collaborate in Shared Workspaces
                            </span>
                        </h1>

                        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
                            A focused, distraction-free workspace for your
                            personal to-dos and group projects. Invite team
                            members securely via username or single-use
                            invitation codes, track deadlines, and manage
                            workloads with granular role-based permissions.
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
                            {isAuthenticated ? (
                                <Link
                                    href={dashboard.url()}
                                    className="w-full rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    Open Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={register.url()}
                                        className="w-full rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-xs hover:bg-zinc-800 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                    >
                                        Create Free Account
                                    </Link>

                                    <a
                                        href={googleRedirect.url()}
                                        className="inline-flex w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
                                        <span>Sign in with Google</span>
                                    </a>
                                </>
                            )}
                        </div>

                        {/* Interactive UI Mockup Card */}
                        <div className="mt-14 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-xl sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
                            <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="h-3 w-3 rounded-full bg-red-400/80" />
                                        <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                                        <div className="h-3 w-3 rounded-full bg-emerald-400/80" />
                                    </div>
                                    <span className="ml-2 font-mono text-xs font-semibold text-zinc-500">
                                        Sprint Planning 2026 &bull; Group
                                        Workspace
                                    </span>
                                </div>
                                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                    3 Members
                                </span>
                            </div>

                            <div className="mt-5 space-y-3">
                                <div className="flex items-center justify-between rounded-lg border border-zinc-200/80 bg-zinc-50/50 p-3 sm:p-4 dark:border-zinc-800/80 dark:bg-zinc-950/40">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                            ✓
                                        </span>
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900 line-through opacity-70 dark:text-zinc-100">
                                                Finalize MVP schema &amp;
                                                database design
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                Created by @alex
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                        Done
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="flex items-center gap-3">
                                        <div className="h-4 w-4 rounded-full border-2 border-amber-500" />
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                Review OAuth flow &amp;
                                                invitation permissions
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                Created by @sarah &bull; Due
                                                Tomorrow
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                                        In Progress
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 sm:p-4 dark:border-zinc-800 dark:bg-zinc-900">
                                    <div className="flex items-center gap-3">
                                        <div className="h-4 w-4 rounded-full border-2 border-zinc-400" />
                                        <div>
                                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                Deploy MVP release to cloud
                                                production
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                Created by @budi &bull; Due Nov
                                                15
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                        To Do
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="border-t border-zinc-200 bg-white px-4 py-20 sm:px-6 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mx-auto max-w-6xl">
                        <div className="mb-14 text-center">
                            <h2 className="text-xs font-bold tracking-widest text-zinc-500 uppercase dark:text-zinc-400">
                                Core Capabilities
                            </h2>
                            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-100">
                                Everything you need to get work done together
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-xl border border-zinc-200 p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                    Personal Workspace
                                </h3>
                                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    Automatically provisioned upon registration.
                                    Guaranteed private at the database level and
                                    never deletable.
                                </p>
                            </div>

                            <div className="rounded-xl border border-zinc-200 p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                    Group Collaboration
                                </h3>
                                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    Create group workspaces for projects and
                                    teams. Granular Owner, Admin, and Member
                                    permissions keep control clear.
                                </p>
                            </div>

                            <div className="rounded-xl border border-zinc-200 p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                    Two-Way Invitations
                                </h3>
                                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    Invite members directly via their @username
                                    or issue high-entropy 12-character one-time
                                    codes that expire safely.
                                </p>
                            </div>

                            <div className="rounded-xl border border-zinc-200 p-6 shadow-2xs dark:border-zinc-800 dark:bg-zinc-950">
                                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                                    <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                    Task &amp; Due Date Tracking
                                </h3>
                                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                                    Manage task statuses, quick inline edits,
                                    and automatic overdue indicators across
                                    personal and shared workspaces.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="border-t border-zinc-200 bg-zinc-50 py-10 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                            <p>
                                &copy; {new Date().getFullYear()} Shared To-Do
                                &amp; Schedule Workspace. All rights reserved.
                            </p>
                            <div className="flex items-center gap-6">
                                <Link
                                    href={login.url()}
                                    className="hover:text-zinc-900 dark:hover:text-zinc-100"
                                >
                                    Sign in
                                </Link>
                                <Link
                                    href={register.url()}
                                    className="hover:text-zinc-900 dark:hover:text-zinc-100"
                                >
                                    Register
                                </Link>
                                <a
                                    href="https://github.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-zinc-900 dark:hover:text-zinc-100"
                                >
                                    Source Code
                                </a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
