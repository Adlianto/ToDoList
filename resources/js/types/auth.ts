export type WorkspaceType = 'personal' | 'group';

export type WorkspaceRole = 'owner' | 'admin' | 'member';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type WorkspaceSummary = {
    id: number;
    name: string;
    type: WorkspaceType;
    owner_id?: number;
    role?: WorkspaceRole | null;
    members_count?: number;
    tasks_count?: number;
};

export type WorkspaceDetail = {
    id: number;
    name: string;
    type: WorkspaceType;
    owner_id: number;
    current_user_role: WorkspaceRole | null;
};

export type WorkspaceMemberItem = {
    id: number;
    user_id?: number;
    username: string;
    name: string;
    role: WorkspaceRole;
    joined_at: string;
    can_change_role?: boolean;
    can_remove?: boolean;
};

export type WorkspaceTaskItem = {
    id: number;
    workspace_id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
    due_at: string | null;
    is_overdue: boolean;
    creator: {
        id: number;
        username: string;
        name: string;
    };
    can_delete: boolean;
    created_at: string | null;
};

export type DashboardTaskItem = {
    id: number;
    title: string;
    status: TaskStatus;
    due_at: string | null;
    is_overdue: boolean;
    workspace: {
        id: number;
        name: string;
        type: WorkspaceType;
    };
};

export type WorkspacePermissions = {
    can_update: boolean;
    can_delete: boolean;
    can_invite: boolean;
    can_create_task?: boolean;
    can_leave?: boolean;
};

export type WorkspaceFilters = {
    status: string;
    due?: string;
    sort?: string;
    view?: 'kanban' | 'list' | 'agenda' | 'members';
};

export type WorkspacePendingInvitation = {
    id: number;
    mode: 'username' | 'code';
    invitee: {
        id: number;
        username: string;
        name: string;
    } | null;
    inviter: {
        id: number;
        username: string;
        name: string;
    };
    expires_at: string;
};

export type IncomingInvitationItem = {
    id: number;
    workspace: {
        id: number;
        name: string;
        type: WorkspaceType;
    };
    inviter: {
        id: number;
        username: string;
        name: string;
    };
    expires_at: string;
};

export type User = {
    id: number;
    account_id?: string;
    username: string;
    name: string;
    email?: string;
    avatar?: string;
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User | null;
    workspaces: WorkspaceSummary[];
    pending_invitations_count: number;
};
