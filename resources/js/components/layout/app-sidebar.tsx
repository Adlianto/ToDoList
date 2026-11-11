import { Link } from '@inertiajs/react';
import {
    CalendarDays,
    Check,
    ChevronDown,
    ChevronRight,
    Copy,
    FolderKanban,
    KeyRound,
    LayoutDashboard,
    ListTodo,
    Mail,
    Plus,
    ShieldCheck,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { edit as passwordEditRoute } from '@/actions/App/Http/Controllers/Auth/PasswordController';
import { index as invitationsIndex } from '@/actions/App/Http/Controllers/InvitationController';
import {
    create as createWorkspace,
    show as showWorkspace,
} from '@/actions/App/Http/Controllers/WorkspaceController';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/formatters';
import { dashboard } from '@/routes';
import { type Auth } from '@/types';

type AppSidebarProps = {
    auth: Auth;
    currentPath: string;
    currentView: string;
    expandedWorkspaces: Record<number, boolean>;
    onToggleWorkspace: (wsId: number) => void;
    onCloseMobileMenu: () => void;
};

export function AppSidebarContent({
    auth,
    currentPath,
    currentView,
    expandedWorkspaces,
    onToggleWorkspace,
    onCloseMobileMenu,
}: AppSidebarProps) {
    const userInitials = getInitials(auth.user?.name);
    const [copiedId, setCopiedId] = useState(false);

    const handleCopyAccountId = async () => {
        if (!auth.user?.account_id) {
            return;
        }

        try {
            await navigator.clipboard.writeText(auth.user.account_id);
            setCopiedId(true);
            setTimeout(() => setCopiedId(false), 2000);
        } catch {
            // Clipboard API not permitted or available
        }
    };

    return (
        <div className="flex h-full flex-col justify-between p-4">
            <div className="space-y-6">
                {/* User Profile Header (Public Account ID displayed, NO EMAIL) */}
                {auth.user && (
                    <div className="flex items-center gap-3 rounded-xl border border-zinc-200/80 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-zinc-900 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {auth.user.name}
                            </p>
                            <p className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                @{auth.user.username}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className="inline-block max-w-[140px] truncate rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                    ID: {auth.user.account_id ?? 'N/A'}
                                </span>
                                {auth.user.account_id && (
                                    <button
                                        type="button"
                                        onClick={handleCopyAccountId}
                                        title={
                                            copiedId
                                                ? 'Copied!'
                                                : 'Copy Account ID'
                                        }
                                        aria-label="Copy Account ID"
                                        className="inline-flex h-5 w-5 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                                    >
                                        {copiedId ? (
                                            <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                                        ) : (
                                            <Copy className="h-3 w-3" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Navigation */}
                <nav className="space-y-1">
                    <Link
                        href={dashboard.url()}
                        preserveScroll
                        preserveState
                        onClick={onCloseMobileMenu}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                            currentPath === '/dashboard'
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                        }`}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        <span>Dashboard</span>
                    </Link>

                    <Link
                        href={invitationsIndex.url()}
                        preserveScroll
                        preserveState
                        onClick={onCloseMobileMenu}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                            currentPath === '/invitations'
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                        }`}
                    >
                        <div className="flex items-center gap-2.5">
                            <Mail className="h-4 w-4" />
                            <span>Invitations</span>
                        </div>
                        {auth.pending_invitations_count > 0 && (
                            <Badge
                                variant="destructive"
                                className="px-1.5 py-0 text-[10px]"
                            >
                                {auth.pending_invitations_count}
                            </Badge>
                        )}
                    </Link>
                </nav>

                {/* Dynamic Workspaces Tree */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-2">
                        <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                            Workspaces
                        </span>
                        <Link
                            href={createWorkspace.url()}
                            preserveScroll
                            preserveState
                            onClick={onCloseMobileMenu}
                            title="Create new group workspace"
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>New</span>
                        </Link>
                    </div>

                    <div className="space-y-1">
                        {auth.workspaces.map((ws) => {
                            const isWsActive =
                                currentPath === `/workspaces/${ws.id}`;
                            const isExpanded =
                                expandedWorkspaces[ws.id] ?? isWsActive;

                            return (
                                <div key={ws.id} className="space-y-0.5">
                                    {/* Collapsible Workspace Header */}
                                    <div
                                        className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition ${
                                            isWsActive &&
                                            currentView === 'kanban'
                                                ? 'bg-zinc-200/70 font-semibold text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-100'
                                                : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/50'
                                        }`}
                                    >
                                        <Link
                                            href={showWorkspace.url(ws.id, {
                                                query: { view: 'kanban' },
                                            })}
                                            preserveScroll
                                            preserveState
                                            onClick={onCloseMobileMenu}
                                            className="flex min-w-0 flex-1 items-center gap-2"
                                        >
                                            <FolderKanban className="h-4 w-4 shrink-0 text-zinc-500 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-100" />
                                            <span className="truncate">
                                                {ws.name}
                                            </span>
                                            <span className="py-0.2 rounded bg-zinc-200/60 px-1 text-[9px] font-bold text-zinc-600 uppercase dark:bg-zinc-800 dark:text-zinc-400">
                                                {ws.type === 'personal'
                                                    ? 'Personal'
                                                    : 'Group'}
                                            </span>
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onToggleWorkspace(ws.id);
                                            }}
                                            aria-label={`Toggle ${ws.name} views`}
                                            className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                                        >
                                            {isExpanded ? (
                                                <ChevronDown className="h-3.5 w-3.5" />
                                            ) : (
                                                <ChevronRight className="h-3.5 w-3.5" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Expanded Hierarchy Sub-items */}
                                    {isExpanded && (
                                        <div className="ml-4 space-y-0.5 border-l border-zinc-200 pl-3 dark:border-zinc-800">
                                            {/* Kanban View */}
                                            <Link
                                                href={showWorkspace.url(ws.id, {
                                                    query: { view: 'kanban' },
                                                })}
                                                preserveScroll
                                                preserveState
                                                onClick={onCloseMobileMenu}
                                                className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs transition ${
                                                    isWsActive &&
                                                    currentView === 'kanban'
                                                        ? 'bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                                                }`}
                                            >
                                                <FolderKanban className="h-3.5 w-3.5" />
                                                <span>Kanban</span>
                                            </Link>

                                            {/* List View */}
                                            <Link
                                                href={showWorkspace.url(ws.id, {
                                                    query: { view: 'list' },
                                                })}
                                                preserveScroll
                                                preserveState
                                                onClick={onCloseMobileMenu}
                                                className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs transition ${
                                                    isWsActive &&
                                                    currentView === 'list'
                                                        ? 'bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                                                }`}
                                            >
                                                <ListTodo className="h-3.5 w-3.5" />
                                                <span>List View</span>
                                            </Link>

                                            {/* Agenda / Schedule View */}
                                            <Link
                                                href={showWorkspace.url(ws.id, {
                                                    query: { view: 'agenda' },
                                                })}
                                                preserveScroll
                                                preserveState
                                                onClick={onCloseMobileMenu}
                                                className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs transition ${
                                                    isWsActive &&
                                                    currentView === 'agenda'
                                                        ? 'bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                                                }`}
                                            >
                                                <CalendarDays className="h-3.5 w-3.5" />
                                                <span>Agenda / Schedule</span>
                                            </Link>

                                            {/* Members & Settings (Group only) */}
                                            {ws.type === 'group' && (
                                                <Link
                                                    href={showWorkspace.url(
                                                        ws.id,
                                                        {
                                                            query: {
                                                                view: 'members',
                                                            },
                                                        },
                                                    )}
                                                    preserveScroll
                                                    preserveState
                                                    onClick={onCloseMobileMenu}
                                                    className={`flex items-center gap-2 rounded-md px-2 py-1 text-xs transition ${
                                                        isWsActive &&
                                                        currentView ===
                                                            'members'
                                                            ? 'bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                                                    }`}
                                                >
                                                    <Users className="h-3.5 w-3.5" />
                                                    <span>
                                                        Members & Settings
                                                    </span>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Sidebar Footer: Security & Settings */}
            <div className="space-y-3 pt-4">
                <Link
                    href={passwordEditRoute.url()}
                    preserveScroll
                    preserveState
                    onClick={onCloseMobileMenu}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                    <KeyRound className="h-4 w-4" />
                    <span>Password & Security</span>
                </Link>

                <div className="rounded-xl border border-zinc-200/80 bg-white p-3.5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-semibold">
                            Account Privacy
                        </span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Email address is private and never exposed to workspace
                        members.
                    </p>
                </div>
            </div>
        </div>
    );
}

export function AppSidebar(props: AppSidebarProps & { mobileOpen: boolean }) {
    const { mobileOpen, onCloseMobileMenu } = props;

    return (
        <>
            {/* Desktop Left Sidebar */}
            <aside className="hidden w-72 shrink-0 border-r border-zinc-200 bg-white/70 backdrop-blur-xs lg:block dark:border-zinc-800 dark:bg-zinc-950/70">
                <div className="sticky top-0 h-screen overflow-y-auto">
                    <AppSidebarContent {...props} />
                </div>
            </aside>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 flex lg:hidden">
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                        onClick={onCloseMobileMenu}
                    />
                    <aside className="relative z-50 flex w-72 flex-col bg-white shadow-xl dark:bg-zinc-900">
                        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
                            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                                Shared To-Do
                            </span>
                            <button
                                type="button"
                                onClick={onCloseMobileMenu}
                                className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="h-full overflow-y-auto">
                            <AppSidebarContent {...props} />
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}
