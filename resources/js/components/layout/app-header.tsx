import { Form, Link } from '@inertiajs/react';
import { LogOut, Mail, Menu, Search } from 'lucide-react';
import { destroy as logoutAction } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import { index as invitationsIndex } from '@/actions/App/Http/Controllers/InvitationController';

export type BreadcrumbItem = {
    label: string;
    href?: string;
};

type AppHeaderProps = {
    breadcrumbs: BreadcrumbItem[];
    pendingInvitationsCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onOpenMobileMenu: () => void;
};

export function AppHeader({
    breadcrumbs,
    pendingInvitationsCount,
    searchQuery,
    onSearchChange,
    onOpenMobileMenu,
}: AppHeaderProps) {
    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6 dark:border-zinc-800/80 dark:bg-zinc-900/80">
            <div className="flex items-center gap-3">
                {/* Mobile Menu Toggle Button */}
                <button
                    type="button"
                    onClick={onOpenMobileMenu}
                    className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-400 dark:hover:bg-zinc-800"
                    aria-label="Open navigation menu"
                >
                    <Menu className="h-5 w-5" />
                </button>

                {/* Breadcrumbs (e.g. [Workspace Name] / Kanban) */}
                <nav
                    aria-label="Breadcrumb"
                    className="flex items-center gap-1.5 text-sm"
                >
                    {breadcrumbs.map((crumb, idx) => {
                        const isLast = idx === breadcrumbs.length - 1;
                        return (
                            <div
                                key={idx}
                                className="flex items-center gap-1.5"
                            >
                                {idx > 0 && (
                                    <span className="text-zinc-400 select-none">
                                        /
                                    </span>
                                )}
                                {crumb.href && !isLast ? (
                                    <Link
                                        href={crumb.href}
                                        preserveScroll
                                        preserveState
                                        className="font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                    >
                                        {crumb.label}
                                    </Link>
                                ) : (
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {crumb.label}
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>

            {/* Right Header: Search Bar & Actions */}
            <div className="flex items-center gap-3">
                <div className="relative hidden w-48 md:block lg:w-64">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Search..."
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50/80 py-1.5 pr-3 pl-8 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:bg-zinc-900"
                    />
                </div>

                {/* Invitations Notification Quick Indicator */}
                <Link
                    href={invitationsIndex.url()}
                    preserveScroll
                    preserveState
                    className="relative rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                    title="Invitations"
                >
                    <Mail className="h-4 w-4" />
                    {pendingInvitationsCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                        </span>
                    )}
                </Link>

                {/* Logout Button */}
                <Form {...logoutAction.form()}>
                    {({ processing }) => (
                        <button
                            type="submit"
                            disabled={processing}
                            title="Log out"
                            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Log out</span>
                        </button>
                    )}
                </Form>
            </div>
        </header>
    );
}
