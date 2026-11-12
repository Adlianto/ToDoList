<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Enums\WorkspaceRole;
use App\Http\Requests\Invitation\AcceptInvitationCodeRequest;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InvitationController extends Controller
{
    /**
     * Display the authenticated user's incoming pending invitations.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $invitations = $user->receivedInvitations()
            ->with([
                'workspace:id,name,type',
                'inviter:id,account_id,name',
            ])
            ->where('status', InvitationStatus::Pending)
            ->where('expires_at', '>', now())
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Invitation $invitation): array {
                /** @var Carbon $expiresAt */
                $expiresAt = $invitation->expires_at;

                return [
                    'id' => $invitation->id,
                    'workspace' => [
                        'id' => $invitation->workspace->id,
                        'name' => $invitation->workspace->name,
                        'type' => $invitation->workspace->type->value,
                    ],
                    'inviter' => [
                        'id' => $invitation->inviter->id,
                        'account_id' => $invitation->inviter->account_id,
                        'name' => $invitation->inviter->name,
                    ],
                    'expires_at' => $expiresAt->toISOString(),
                ];
            });

        return Inertia::render('invitations/index', [
            'invitations' => $invitations,
        ]);
    }

    /**
     * Accept a direct incoming invitation atomically.
     */
    public function accept(Request $request, Invitation $invitation): RedirectResponse
    {
        Gate::authorize('respond', $invitation);

        /** @var User $user */
        $user = $request->user();

        $acceptedWorkspace = DB::transaction(function () use ($invitation, $user): ?Workspace {
            $locked = Invitation::query()
                ->with('workspace')
                ->whereKey($invitation->id)
                ->lockForUpdate()
                ->first();

            if (! $locked instanceof Invitation || ! $locked->isUsable() || $locked->workspace->isPersonal()) {
                return null;
            }

            WorkspaceMember::query()->firstOrCreate(
                [
                    'workspace_id' => $locked->workspace_id,
                    'user_id' => $user->id,
                ],
                [
                    'role' => WorkspaceRole::Member,
                    'joined_at' => now(),
                ],
            );

            $locked->update([
                'status' => InvitationStatus::Accepted,
                'accepted_at' => now(),
            ]);

            return $locked->workspace;
        });

        if (! $acceptedWorkspace instanceof Workspace) {
            return redirect()
                ->route('invitations.index')
                ->with('error', 'This invitation is no longer valid or has expired.');
        }

        return redirect()
            ->route('workspaces.show', $acceptedWorkspace)
            ->with('success', sprintf('You have joined %s.', $acceptedWorkspace->name));
    }

    /**
     * Decline a direct incoming invitation.
     */
    public function decline(Request $request, Invitation $invitation): RedirectResponse
    {
        Gate::authorize('respond', $invitation);

        $declined = DB::transaction(function () use ($invitation): bool {
            $locked = Invitation::query()
                ->whereKey($invitation->id)
                ->lockForUpdate()
                ->first();

            if (! $locked instanceof Invitation || ! $locked->isUsable()) {
                return false;
            }

            $locked->update([
                'status' => InvitationStatus::Declined,
            ]);

            return true;
        });

        if (! $declined) {
            return redirect()
                ->route('invitations.index')
                ->with('error', 'This invitation is no longer valid or has expired.');
        }

        return redirect()
            ->route('invitations.index')
            ->with('success', 'Invitation declined.');
    }

    /**
     * Accept a one-time invitation code to join a group workspace atomically.
     *
     * @throws ValidationException
     */
    public function acceptByCode(AcceptInvitationCodeRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var array{code: string} $validated */
        $validated = $request->validated();

        $tokenHash = Invitation::hashToken(strtoupper($validated['code']));

        $result = DB::transaction(function () use ($tokenHash, $user): array {
            $locked = Invitation::query()
                ->with('workspace')
                ->where('token_hash', $tokenHash)
                ->whereNull('invitee_id')
                ->lockForUpdate()
                ->first();

            if (! $locked instanceof Invitation || ! $locked->isUsable() || $locked->workspace->isPersonal()) {
                return ['status' => 'invalid', 'workspace' => null];
            }

            if ($locked->workspace->hasMember($user)) {
                return ['status' => 'already_member', 'workspace' => $locked->workspace];
            }

            WorkspaceMember::query()->firstOrCreate(
                [
                    'workspace_id' => $locked->workspace_id,
                    'user_id' => $user->id,
                ],
                [
                    'role' => WorkspaceRole::Member,
                    'joined_at' => now(),
                ],
            );

            $locked->update([
                'status' => InvitationStatus::Accepted,
                'accepted_at' => now(),
            ]);

            return ['status' => 'joined', 'workspace' => $locked->workspace];
        });

        if ($result['status'] === 'invalid') {
            throw ValidationException::withMessages([
                'code' => 'The invitation code is invalid, expired, or has already been used.',
            ]);
        }

        if ($result['status'] === 'already_member') {
            throw ValidationException::withMessages([
                'code' => 'You are already a member of this workspace.',
            ]);
        }

        /** @var Workspace $joinedWorkspace */
        $joinedWorkspace = $result['workspace'];

        return redirect()
            ->route('workspaces.show', $joinedWorkspace)
            ->with('success', sprintf('You have joined %s.', $joinedWorkspace->name));
    }
}
