<?php

use App\Enums\InvitationStatus;
use App\Enums\WorkspaceRole;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Inertia\Testing\AssertableInertia as Assert;

describe('Invitation Flow and Atomic Acceptance', function () {
    test('only group owner and admin can send invitations, and personal workspaces cannot send invitations', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $admin = User::factory()->withPersonalWorkspace()->create();
        $member = User::factory()->withPersonalWorkspace()->create();
        $stranger = User::factory()->withPersonalWorkspace()->create();
        $invitee = User::factory()->withPersonalWorkspace()->create(['username' => 'target_user']);

        $group = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $owner->id,
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $admin->id,
            'role' => WorkspaceRole::Admin,
            'joined_at' => now(),
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $member->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        // Personal workspace cannot invite anyone
        $this->actingAs($owner)
            ->post(route('workspaces.invitations.store', $owner->personalWorkspace), [
                'mode' => 'username',
                'username' => 'target_user',
            ])
            ->assertForbidden();

        // Regular member cannot invite
        $this->actingAs($member)
            ->post(route('workspaces.invitations.store', $group), [
                'mode' => 'username',
                'username' => 'target_user',
            ])
            ->assertForbidden();

        // Non-member cannot invite
        $this->actingAs($stranger)
            ->post(route('workspaces.invitations.store', $group), [
                'mode' => 'username',
                'username' => 'target_user',
            ])
            ->assertForbidden();

        // Admin can invite by username
        $this->actingAs($admin)
            ->post(route('workspaces.invitations.store', $group), [
                'mode' => 'username',
                'username' => '@TARGET_USER',
            ])
            ->assertRedirect(route('workspaces.show', $group));

        $invitation = Invitation::query()
            ->where('workspace_id', $group->id)
            ->where('invitee_id', $invitee->id)
            ->first();

        expect($invitation)->not->toBeNull()
            ->and($invitation?->invited_by)->toBe($admin->id)
            ->and($invitation?->status)->toBe(InvitationStatus::Pending);
    });

    test('cannot invite an existing member or create duplicate active pending invitations', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $existingMember = User::factory()->withPersonalWorkspace()->create(['username' => 'existing_member']);
        $invitee = User::factory()->withPersonalWorkspace()->create(['username' => 'pending_user']);

        $group = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $owner->id,
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $existingMember->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        // Cannot invite existing member
        $this->actingAs($owner)
            ->post(route('workspaces.invitations.store', $group), [
                'mode' => 'username',
                'username' => 'existing_member',
            ])
            ->assertSessionHasErrors('username');

        // First invitation succeeds
        $this->actingAs($owner)
            ->post(route('workspaces.invitations.store', $group), [
                'mode' => 'username',
                'username' => 'pending_user',
            ])
            ->assertSessionHasNoErrors();

        // Duplicate active pending invitation is rejected
        $this->actingAs($owner)
            ->post(route('workspaces.invitations.store', $group), [
                'mode' => 'username',
                'username' => 'pending_user',
            ])
            ->assertSessionHasErrors('username');

        expect(Invitation::query()->where('workspace_id', $group->id)->where('invitee_id', $invitee->id)->count())
            ->toBe(1);
    });

    test('invitee can view pending invitations and accept or decline them atomically', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $invitee = User::factory()->withPersonalWorkspace()->create();
        $otherUser = User::factory()->withPersonalWorkspace()->create();

        $groupA = Workspace::factory()->withOwnerMembership()->create([
            'name' => 'Group A',
            'owner_id' => $owner->id,
        ]);
        $groupB = Workspace::factory()->withOwnerMembership()->create([
            'name' => 'Group B',
            'owner_id' => $owner->id,
        ]);

        $inviteToA = Invitation::factory()->create([
            'workspace_id' => $groupA->id,
            'invited_by' => $owner->id,
            'invitee_id' => $invitee->id,
        ]);

        $inviteToB = Invitation::factory()->create([
            'workspace_id' => $groupB->id,
            'invited_by' => $owner->id,
            'invitee_id' => $invitee->id,
        ]);

        // Invitee sees both invitations
        $this->actingAs($invitee)
            ->get(route('invitations.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('invitations/index')
                ->has('invitations', 2)
            );

        // Other user cannot accept or decline invitee's invitation
        $this->actingAs($otherUser)
            ->post(route('invitations.accept', $inviteToA))
            ->assertForbidden();

        $this->actingAs($otherUser)
            ->post(route('invitations.decline', $inviteToB))
            ->assertForbidden();

        // Invitee accepts inviteToA
        $this->actingAs($invitee)
            ->post(route('invitations.accept', $inviteToA))
            ->assertRedirect(route('workspaces.show', $groupA));

        $inviteToA->refresh();
        expect($inviteToA->status)->toBe(InvitationStatus::Accepted)
            ->and($inviteToA->accepted_at)->not->toBeNull();

        $membership = WorkspaceMember::query()
            ->where('workspace_id', $groupA->id)
            ->where('user_id', $invitee->id)
            ->first();

        expect($membership)->not->toBeNull()
            ->and($membership?->role)->toBe(WorkspaceRole::Member);

        // Accepting the same invitation a second time is rejected and does not duplicate membership
        $this->actingAs($invitee)
            ->post(route('invitations.accept', $inviteToA))
            ->assertRedirect(route('invitations.index'))
            ->assertSessionHas('error');

        expect(WorkspaceMember::query()->where('workspace_id', $groupA->id)->where('user_id', $invitee->id)->count())
            ->toBe(1);

        // Invitee declines inviteToB
        $this->actingAs($invitee)
            ->post(route('invitations.decline', $inviteToB))
            ->assertRedirect(route('invitations.index'));

        $inviteToB->refresh();
        expect($inviteToB->status)->toBe(InvitationStatus::Declined)
            ->and($groupB->hasMember($invitee))->toBeFalse();
    });

    test('expired or revoked invitations cannot be accepted and cross-workspace revocation is blocked', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $invitee = User::factory()->withPersonalWorkspace()->create();

        $groupA = Workspace::factory()->withOwnerMembership()->create(['owner_id' => $owner->id]);
        $groupB = Workspace::factory()->withOwnerMembership()->create(['owner_id' => $owner->id]);

        $expiredInvitation = Invitation::factory()->expired()->create([
            'workspace_id' => $groupA->id,
            'invited_by' => $owner->id,
            'invitee_id' => $invitee->id,
        ]);

        $pendingInvitation = Invitation::factory()->create([
            'workspace_id' => $groupA->id,
            'invited_by' => $owner->id,
            'invitee_id' => $invitee->id,
        ]);

        // Expired invitation is rejected
        $this->actingAs($invitee)
            ->post(route('invitations.accept', $expiredInvitation))
            ->assertRedirect(route('invitations.index'))
            ->assertSessionHas('error');

        expect($groupA->hasMember($invitee))->toBeFalse();

        // Cross-workspace revocation attempt returns 404 due to scoped route bindings
        $this->actingAs($owner)
            ->delete(route('workspaces.invitations.destroy', [
                'workspace' => $groupB->id,
                'invitation' => $pendingInvitation->id,
            ]))
            ->assertNotFound();

        // Owner revokes pendingInvitation in the correct workspace
        $this->actingAs($owner)
            ->delete(route('workspaces.invitations.destroy', [
                'workspace' => $groupA->id,
                'invitation' => $pendingInvitation->id,
            ]))
            ->assertRedirect(route('workspaces.show', $groupA));

        $pendingInvitation->refresh();
        expect($pendingInvitation->status)->toBe(InvitationStatus::Revoked);

        // Invitee cannot accept revoked invitation
        $this->actingAs($invitee)
            ->post(route('invitations.accept', $pendingInvitation))
            ->assertRedirect(route('invitations.index'))
            ->assertSessionHas('error');

        expect($groupA->hasMember($invitee))->toBeFalse();
    });

    test('one-time invitation code can be generated, claimed once, and rejected on reuse or invalid code', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $joinerOne = User::factory()->withPersonalWorkspace()->create();
        $joinerTwo = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->withOwnerMembership()->create([
            'name' => 'Study Group Code Test',
            'owner_id' => $owner->id,
        ]);

        $response = $this->actingAs($owner)
            ->post(route('workspaces.invitations.store', $group), [
                'mode' => 'code',
            ]);

        $response->assertRedirect(route('workspaces.show', $group))
            ->assertSessionHas('invitation_code');

        $plainCode = (string) session('invitation_code');
        expect(strlen($plainCode))->toBe(12);

        // Ensure plaintext code is never stored in DB
        $invitation = Invitation::query()->where('workspace_id', $group->id)->firstOrFail();
        expect($invitation->token_hash)->toBe(Invitation::hashToken($plainCode))
            ->and($invitation->token_hash)->not->toBe($plainCode);

        // Owner (already a member) cannot claim their own group code
        $this->actingAs($owner)
            ->post(route('invitations.join-code'), ['code' => $plainCode])
            ->assertSessionHasErrors('code');

        // JoinerOne claims the code successfully
        $this->actingAs($joinerOne)
            ->post(route('invitations.join-code'), ['code' => strtolower($plainCode)])
            ->assertRedirect(route('workspaces.show', $group));

        expect($group->hasMember($joinerOne))->toBeTrue();

        // JoinerTwo cannot reuse the already claimed one-time code
        $this->actingAs($joinerTwo)
            ->post(route('invitations.join-code'), ['code' => $plainCode])
            ->assertSessionHasErrors('code');

        expect($group->hasMember($joinerTwo))->toBeFalse();
    });
});
