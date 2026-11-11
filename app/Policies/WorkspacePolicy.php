<?php

namespace App\Policies;

use App\Enums\WorkspaceRole;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;

class WorkspacePolicy
{
    /**
     * Determine whether the user can view any workspaces.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the workspace and its members.
     */
    public function view(User $user, Workspace $workspace): bool
    {
        return $workspace->hasMember($user);
    }

    /**
     * Determine whether the user can create a new group workspace.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the workspace name.
     */
    public function update(User $user, Workspace $workspace): bool
    {
        return $workspace->owner_id === $user->id
            && $workspace->getMemberRole($user) === WorkspaceRole::Owner;
    }

    /**
     * Determine whether the user can delete the workspace.
     * Personal workspaces can never be deleted.
     */
    public function delete(User $user, Workspace $workspace): bool
    {
        if ($workspace->isPersonal()) {
            return false;
        }

        return $workspace->owner_id === $user->id
            && $workspace->getMemberRole($user) === WorkspaceRole::Owner;
    }

    /**
     * Determine whether the user can invite members to the workspace.
     * Only group workspace owners and admins can invite members.
     */
    public function invite(User $user, Workspace $workspace): bool
    {
        if ($workspace->isPersonal()) {
            return false;
        }

        $role = $workspace->getMemberRole($user);

        return in_array($role, [WorkspaceRole::Owner, WorkspaceRole::Admin], true);
    }

    /**
     * Determine whether the user can change a member's role.
     * Only group workspace owners can change roles.
     */
    public function manageMemberRole(User $user, Workspace $workspace, WorkspaceMember $targetMember): bool
    {
        if ($workspace->isPersonal()) {
            return false;
        }

        if ($targetMember->workspace_id !== $workspace->id) {
            return false;
        }

        // Owner cannot change their own owner role via this action
        if ($targetMember->user_id === $workspace->owner_id) {
            return false;
        }

        return $workspace->owner_id === $user->id
            && $workspace->getMemberRole($user) === WorkspaceRole::Owner;
    }

    /**
     * Determine whether the user can remove a member from the workspace.
     */
    public function removeMember(User $user, Workspace $workspace, WorkspaceMember $targetMember): bool
    {
        if ($workspace->isPersonal()) {
            return false;
        }

        if ($targetMember->workspace_id !== $workspace->id) {
            return false;
        }

        // The owner cannot be removed from the workspace
        if ($targetMember->user_id === $workspace->owner_id) {
            return false;
        }

        $userRole = $workspace->getMemberRole($user);

        // Owner can remove any non-owner member
        if ($userRole === WorkspaceRole::Owner) {
            return true;
        }

        // Admin can only remove regular members (cannot remove other admins or owner)
        if ($userRole === WorkspaceRole::Admin) {
            return $targetMember->role === WorkspaceRole::Member;
        }

        return false;
    }

    /**
     * Determine whether the user can leave the workspace.
     * Users cannot leave their personal workspace or if they are the owner of the group.
     */
    public function leave(User $user, Workspace $workspace): bool
    {
        if ($workspace->isPersonal()) {
            return false;
        }

        if (! $workspace->hasMember($user)) {
            return false;
        }

        // Owner cannot leave without transferring ownership or deleting the group
        return $workspace->owner_id !== $user->id;
    }
}
