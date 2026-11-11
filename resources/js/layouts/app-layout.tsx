import { usePage } from '@inertiajs/react';
import { type ReactNode, useEffect, useState } from 'react';
import { show as showWorkspace } from '@/actions/App/Http/Controllers/WorkspaceController';
import { AppHeader, type BreadcrumbItem } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { FlashAlerts } from '@/components/layout/flash-messages';
import { dashboard } from '@/routes';
import {
    type Auth,
    type FlashMessages,
    type WorkspaceDetail,
    type WorkspaceFilters,
} from '@/types';

type AppLayoutProps = {
    title?: string;
    breadcrumbs?: BreadcrumbItem[];
    workspace?: WorkspaceDetail;
    children: ReactNode;
};

export default function AppLayout({
    title,
    breadcrumbs,
    workspace,
    children,
}: AppLayoutProps) {
    const page = usePage<{
        auth: Auth;
        flash?: FlashMessages;
        workspace?: WorkspaceDetail;
        filters?: WorkspaceFilters;
    }>();

    const { auth, flash } = page.props;
    const currentWorkspace = workspace ?? page.props.workspace;

    // Pure SPA URL parsing
    const currentUrl = page.url || '';
    const [currentPath, queryString] = currentUrl.split('?');
    const searchParams = new URLSearchParams(queryString || '');
    const currentView = searchParams.get('view') || 'kanban';

    // Collapsible workspace tree state
    const [expandedWorkspaces, setExpandedWorkspaces] = useState<
        Record<number, boolean>
    >({});
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Automatically expand the current workspace when visiting
    useEffect(() => {
        if (currentWorkspace?.id) {
            setExpandedWorkspaces((prev) => ({
                ...prev,
                [currentWorkspace.id]: true,
            }));
        }
    }, [currentWorkspace?.id]);

    const toggleWorkspace = (wsId: number) => {
        setExpandedWorkspaces((prev) => ({
            ...prev,
            [wsId]: !prev[wsId],
        }));
    };

    // Generate dynamic breadcrumb hierarchy
    const computedBreadcrumbs: BreadcrumbItem[] =
        breadcrumbs && breadcrumbs.length > 0
            ? breadcrumbs
            : currentWorkspace
              ? [
                    {
                        label: currentWorkspace.name,
                        href: showWorkspace.url(currentWorkspace.id),
                    },
                    {
                        label:
                            currentView === 'agenda'
                                ? 'Agenda / Schedule'
                                : currentView === 'list'
                                  ? 'List View'
                                  : currentView === 'members'
                                    ? 'Members & Settings'
                                    : 'Kanban',
                    },
                ]
              : currentPath === '/dashboard'
                ? [{ label: 'Dashboard' }]
                : currentPath === '/workspaces'
                  ? [{ label: 'Workspaces' }]
                  : currentPath === '/workspaces/create'
                    ? [
                          {
                              label: 'Workspaces',
                              href: dashboard.url(),
                          },
                          { label: 'New Group' },
                      ]
                    : currentPath === '/invitations'
                      ? [{ label: 'Invitations & Join Codes' }]
                      : currentPath === '/settings/password'
                        ? [
                              { label: 'Settings' },
                              { label: 'Password & Security' },
                          ]
                        : [{ label: title || 'Shared To-Do' }];

    return (
        <div className="flex min-h-screen bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
            {/* Sidebar (Desktop + Mobile Drawer) */}
            <AppSidebar
                auth={auth}
                currentPath={currentPath}
                currentView={currentView}
                expandedWorkspaces={expandedWorkspaces}
                onToggleWorkspace={toggleWorkspace}
                mobileOpen={mobileMenuOpen}
                onCloseMobileMenu={() => setMobileMenuOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Header Bar */}
                <AppHeader
                    breadcrumbs={computedBreadcrumbs}
                    pendingInvitationsCount={auth.pending_invitations_count}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onOpenMobileMenu={() => setMobileMenuOpen(true)}
                />

                {/* Main Body */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8">
                    {/* Flash Notifications */}
                    <FlashAlerts flash={flash} />

                    {title && (
                        <h1 className="mt-2 mb-6 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            {title}
                        </h1>
                    )}

                    {children}
                </main>
            </div>
        </div>
    );
}
