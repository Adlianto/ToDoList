<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Http\Requests\Invitation\StoreInvitationRequest;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class WorkspaceInvitationController extends Controller
{
    /**
     * Create a new invitation in the specified group workspace (by username or claimable code).
     *
     * @throws ValidationException
     */
    public function store(StoreInvitationRequest $request, Workspace $workspace): RedirectResponse
    {
        Gate::authorize('invite', $workspace);

        /** @var User $inviter */
        $inviter = $request->user();

        /** @var array{mode: string, username?: string|null} $validated */
        $validated = $request->validated();

        if ($validated['mode'] === 'code') {
            $plainCode = Str::upper(Str::random(12));

            $invitation = new Invitation([
                'status' => InvitationStatus::Pending,
                'expires_at' => now()->addDays(7),
                'accepted_at' => null,
            ]);
            $invitation->workspace_id = $workspace->id;
            $invitation->invited_by = $inviter->id;
            $invitation->invitee_id = null;
            $invitation->token_hash = Invitation::hashToken($plainCode);
            $invitation->save();

            return redirect()
                ->route('workspaces.show', $workspace)
                ->with('success', 'One-time invitation code generated.')
                ->with('invitation_code', $plainCode);
        }

        $targetUsername = (string) ($validated['username'] ?? '');
        $invitee = User::query()->where('username', $targetUsername)->first();

        if (! $invitee instanceof User) {
            throw ValidationException::withMessages([
                'username' => 'No account was found with that username.',
            ]);
        }

        if ($workspace->hasMember($invitee)) {
            throw ValidationException::withMessages([
                'username' => 'This user is already a member of the workspace.',
            ]);
        }

        $hasActivePending = $workspace->invitations()
            ->where('invitee_id', $invitee->id)
            ->where('status', InvitationStatus::Pending)
            ->where('expires_at', '>', now())
            ->exists();

        if ($hasActivePending) {
            throw ValidationException::withMessages([
                'username' => 'This user already has an active pending invitation for this workspace.',
            ]);
        }

        $invitation = new Invitation([
            'status' => InvitationStatus::Pending,
            'expires_at' => now()->addDays(7),
            'accepted_at' => null,
        ]);
        $invitation->workspace_id = $workspace->id;
        $invitation->invited_by = $inviter->id;
        $invitation->invitee_id = $invitee->id;
        $invitation->token_hash = Invitation::hashToken(Str::random(40));
        $invitation->save();

        return redirect()
            ->route('workspaces.show', $workspace)
            ->with('success', sprintf('Invitation sent to @%s.', $invitee->username));
    }

    /**
     * Revoke a pending invitation belonging to the specified workspace.
     */
    public function destroy(Workspace $workspace, Invitation $invitation): RedirectResponse
    {
        Gate::authorize('revoke', $invitation);

        if ($invitation->status !== InvitationStatus::Pending) {
            return redirect()
                ->route('workspaces.show', $workspace)
                ->with('error', 'Only pending invitations can be revoked.');
        }

        $invitation->update([
            'status' => InvitationStatus::Revoked,
        ]);

        return redirect()
            ->route('workspaces.show', $workspace)
            ->with('success', 'Invitation revoked.');
    }
}
