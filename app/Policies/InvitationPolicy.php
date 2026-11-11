<?php

namespace App\Policies;

use App\Enums\WorkspaceRole;
use App\Models\Invitation;
use App\Models\User;

class InvitationPolicy
{
    /**
     * Determine whether the user can revoke a pending invitation in the workspace.
     * Only the group workspace owner and admins can revoke invitations.
     */
    public function revoke(User $user, Invitation $invitation): bool
    {
        $workspace = $invitation->workspace;

        if ($workspace->isPersonal()) {
            return false;
        }

        $role = $workspace->getMemberRole($user);

        return in_array($role, [WorkspaceRole::Owner, WorkspaceRole::Admin], true);
    }

    /**
     * Determine whether the user can respond (accept or decline) to a direct invitation.
     */
    public function respond(User $user, Invitation $invitation): bool
    {
        return $invitation->invitee_id !== null
            && $invitation->invitee_id === $user->id;
    }
}
