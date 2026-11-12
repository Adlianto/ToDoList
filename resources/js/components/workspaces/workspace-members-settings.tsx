import { Form } from '@inertiajs/react';
import {
    destroy as destroyWorkspace,
    update as updateWorkspace,
} from '@/actions/App/Http/Controllers/WorkspaceController';
import {
    destroy as revokeInvitation,
    store as storeInvitation,
} from '@/actions/App/Http/Controllers/WorkspaceInvitationController';
import {
    destroy as removeMember,
    update as updateMemberRole,
} from '@/actions/App/Http/Controllers/WorkspaceMemberController';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/formatters';
import {
    type WorkspaceDetail,
    type WorkspaceMemberItem,
    type WorkspacePendingInvitation,
    type WorkspacePermissions,
} from '@/types';

type WorkspaceMembersSettingsProps = {
    workspace: WorkspaceDetail;
    members: WorkspaceMemberItem[];
    pendingInvitations: WorkspacePendingInvitation[];
    permissions: WorkspacePermissions;
};

export function WorkspaceMembersSettings({
    workspace,
    members,
    pendingInvitations,
    permissions,
}: WorkspaceMembersSettingsProps) {
    return (
        <div className="space-y-6">
            {/* Members section */}
            <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="mb-4 text-base font-bold text-zinc-900 dark:text-zinc-100">
                    Team Members ({members.length})
                </h2>

                <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarFallback className="text-xs font-bold">
                                        {getInitials(member.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        {member.name}
                                    </p>
                                    <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                                        ID: {member.account_id ?? 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {member.can_change_role ? (
                                    <Form
                                        {...updateMemberRole.form({
                                            workspace: workspace.id,
                                            member: member.id,
                                        })}
                                        className="inline-flex items-center gap-1.5"
                                    >
                                        {({ processing }) => (
                                            <select
                                                name="role"
                                                defaultValue={member.role}
                                                disabled={processing}
                                                onChange={(e) =>
                                                    e.currentTarget.form?.requestSubmit()
                                                }
                                                className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                                            >
                                                <option value="admin">
                                                    Admin
                                                </option>
                                                <option value="member">
                                                    Member
                                                </option>
                                            </select>
                                        )}
                                    </Form>
                                ) : (
                                    <Badge
                                        variant="secondary"
                                        className="font-bold uppercase"
                                    >
                                        {member.role}
                                    </Badge>
                                )}

                                {member.can_remove && (
                                    <Form
                                        {...removeMember.form({
                                            workspace: workspace.id,
                                            member: member.id,
                                        })}
                                        onSubmit={(e) => {
                                            if (
                                                !confirm(
                                                    `Are you sure you want to remove ${member.name} from this workspace?`,
                                                )
                                            ) {
                                                e.preventDefault();
                                            }
                                        }}
                                    >
                                        {({ processing }) => (
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-400"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </Form>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Invitations section */}
            {permissions.can_invite && workspace.type === 'group' && (
                <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                Invite Members
                            </h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Invite team members via their 9-digit Account ID
                                or generate a one-time invitation code.
                            </p>
                        </div>

                        <Form {...storeInvitation.form(workspace.id)}>
                            {({ processing }) => (
                                <>
                                    <input
                                        type="hidden"
                                        name="mode"
                                        value="code"
                                    />
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        {processing
                                            ? 'Generating...'
                                            : 'Generate Invite Code'}
                                    </Button>
                                </>
                            )}
                        </Form>
                    </div>

                    <Form
                        {...storeInvitation.form(workspace.id)}
                        resetOnSuccess
                        className="mt-4 flex flex-col gap-3 sm:flex-row"
                    >
                        {({ errors, processing }) => (
                            <>
                                <input
                                    type="hidden"
                                    name="mode"
                                    value="account_id"
                                />
                                <div className="grow">
                                    <input
                                        name="account_id"
                                        type="text"
                                        required
                                        pattern="[1-9][0-9]{8}"
                                        maxLength={9}
                                        placeholder="Enter 9-digit Account ID (e.g. 100000001)"
                                        className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                    />
                                    {errors.account_id && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                            {errors.account_id}
                                        </p>
                                    )}
                                </div>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Sending...'
                                        : 'Send Invitation'}
                                </Button>
                            </>
                        )}
                    </Form>

                    {pendingInvitations.length > 0 && (
                        <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                            <h4 className="mb-3 text-xs font-bold tracking-wider text-zinc-400 uppercase dark:text-zinc-500">
                                Pending Invitations ({pendingInvitations.length}
                                )
                            </h4>
                            <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                                {pendingInvitations.map((inv) => (
                                    <div
                                        key={inv.id}
                                        className="flex items-center justify-between py-2.5"
                                    >
                                        <div>
                                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                {inv.invitee
                                                    ? `${inv.invitee.name} (ID: ${inv.invitee.account_id})`
                                                    : 'One-Time Invitation Code'}
                                            </p>
                                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                                Created by {inv.inviter.name}
                                            </p>
                                        </div>

                                        <Form
                                            {...revokeInvitation.form({
                                                workspace: workspace.id,
                                                invitation: inv.id,
                                            })}
                                        >
                                            {({ processing }) => (
                                                <button
                                                    type="submit"
                                                    disabled={processing}
                                                    className="rounded-lg border border-red-300 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900/60 dark:text-red-400"
                                                >
                                                    Revoke
                                                </button>
                                            )}
                                        </Form>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Workspace Settings / Rename & Delete */}
            {permissions.can_update && (
                <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-900">
                    <h3 className="mb-3 text-base font-bold text-zinc-900 dark:text-zinc-100">
                        Workspace Settings
                    </h3>

                    <Form
                        {...updateWorkspace.form(workspace.id)}
                        className="flex flex-col gap-3 sm:flex-row sm:items-end"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grow">
                                    <label
                                        htmlFor="workspace-rename"
                                        className="mb-1 block text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                                    >
                                        Workspace Name
                                    </label>
                                    <input
                                        id="workspace-rename"
                                        name="name"
                                        type="text"
                                        required
                                        defaultValue={workspace.name}
                                        maxLength={100}
                                        className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Name'}
                                </Button>
                            </>
                        )}
                    </Form>

                    {permissions.can_delete && (
                        <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <h4 className="text-sm font-bold text-red-600 dark:text-red-400">
                                        Delete Group Workspace
                                    </h4>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        Permanently delete this workspace, all
                                        tasks, and memberships.
                                    </p>
                                </div>

                                <Form {...destroyWorkspace.form(workspace.id)}>
                                    {({ processing }) => (
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Deleting...'
                                                : 'Delete Group'}
                                        </Button>
                                    )}
                                </Form>
                            </div>
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}
