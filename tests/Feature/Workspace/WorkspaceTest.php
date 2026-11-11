<?php

use App\Enums\WorkspaceRole;
use App\Enums\WorkspaceType;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Inertia\Testing\AssertableInertia as Assert;

describe('Workspace and Membership Management', function () {
    test('guests cannot access workspace routes', function () {
        $workspace = Workspace::factory()->withOwnerMembership()->create();

        $this->get(route('workspaces.index'))->assertRedirect(route('login'));
        $this->get(route('workspaces.create'))->assertRedirect(route('login'));
        $this->post(route('workspaces.store'), ['name' => 'Group A'])->assertRedirect(route('login'));
        $this->get(route('workspaces.show', $workspace))->assertRedirect(route('login'));
        $this->patch(route('workspaces.update', $workspace), ['name' => 'Renamed'])->assertRedirect(route('login'));
        $this->delete(route('workspaces.destroy', $workspace))->assertRedirect(route('login'));
    });

    test('authenticated user can create a group workspace and becomes its owner', function () {
        $user = User::factory()->withPersonalWorkspace()->create();

        $response = $this->actingAs($user)->post(route('workspaces.store'), [
            'name' => 'Kuliah Kerja Kelompok C',
            'type' => 'personal', // Attempted tampering should be ignored
            'owner_id' => 999999,
            'role' => 'admin',
        ]);

        $group = Workspace::query()
            ->where('owner_id', $user->id)
            ->where('type', WorkspaceType::Group)
            ->firstOrFail();

        $response->assertRedirect(route('workspaces.show', $group));

        expect($group->name)->toBe('Kuliah Kerja Kelompok C')
            ->and($group->type)->toBe(WorkspaceType::Group)
            ->and($group->personal_owner_id)->toBeNull();

        $membership = WorkspaceMember::query()
            ->where('workspace_id', $group->id)
            ->where('user_id', $user->id)
            ->first();

        expect($membership)->not->toBeNull()
            ->and($membership?->role)->toBe(WorkspaceRole::Owner);
    });

    test('workspaces index only lists workspaces where the user is a member', function () {
        $user = User::factory()->withPersonalWorkspace()->create();
        $otherUser = User::factory()->withPersonalWorkspace()->create();

        $ownedGroup = Workspace::factory()->withOwnerMembership()->create([
            'name' => 'Owned Group',
            'owner_id' => $user->id,
        ]);

        $joinedGroup = Workspace::factory()->withOwnerMembership()->create([
            'name' => 'Joined Group',
            'owner_id' => $otherUser->id,
        ]);
        WorkspaceMember::query()->create([
            'workspace_id' => $joinedGroup->id,
            'user_id' => $user->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        $unrelatedGroup = Workspace::factory()->withOwnerMembership()->create([
            'name' => 'Secret Unrelated Group',
            'owner_id' => $otherUser->id,
        ]);

        $this->actingAs($user)
            ->get(route('workspaces.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('workspaces/index')
                ->has('workspaces', 3)
                ->where('workspaces.0.id', $user->personalWorkspace->id)
            );

        $listedIds = $user->workspaces()->pluck('workspaces.id')->all();

        expect($listedIds)->toContain($user->personalWorkspace->id, $ownedGroup->id, $joinedGroup->id)
            ->and($listedIds)->not->toContain($otherUser->personalWorkspace->id, $unrelatedGroup->id);
    });

    test('workspace members (owner, admin, member) can view workspace details and member list', function () {
        $owner = User::factory()->withPersonalWorkspace()->create(['name' => 'Owner User']);
        $admin = User::factory()->withPersonalWorkspace()->create(['name' => 'Admin User']);
        $member = User::factory()->withPersonalWorkspace()->create(['name' => 'Regular Member']);

        $group = Workspace::factory()->withOwnerMembership()->create([
            'name' => 'Organisasi Kampus',
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

        $this->actingAs($owner)
            ->get(route('workspaces.show', $group))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('workspaces/show')
                ->where('workspace.id', $group->id)
                ->where('workspace.current_user_role', 'owner')
                ->has('members', 3)
                ->where('permissions.can_update', true)
                ->where('permissions.can_delete', true)
                ->where('permissions.can_invite', true)
            );

        $this->actingAs($admin)
            ->get(route('workspaces.show', $group))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('workspaces/show')
                ->where('workspace.current_user_role', 'admin')
                ->where('permissions.can_update', false)
                ->where('permissions.can_delete', false)
                ->where('permissions.can_invite', true)
            );

        $this->actingAs($member)
            ->get(route('workspaces.show', $group))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('workspaces/show')
                ->where('workspace.current_user_role', 'member')
                ->where('permissions.can_update', false)
                ->where('permissions.can_delete', false)
                ->where('permissions.can_invite', false)
            );
    });

    test('non-members cannot view another users personal or group workspace', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $stranger = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $owner->id,
        ]);

        $this->actingAs($stranger)
            ->get(route('workspaces.show', $owner->personalWorkspace))
            ->assertForbidden();

        $this->actingAs($stranger)
            ->get(route('workspaces.show', $group))
            ->assertForbidden();
    });

    test('only the workspace owner can update the workspace name and cannot tamper with workspace type or owner_id', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $admin = User::factory()->withPersonalWorkspace()->create();
        $member = User::factory()->withPersonalWorkspace()->create();
        $stranger = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->withOwnerMembership()->create([
            'name' => 'Initial Name',
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

        $this->actingAs($admin)
            ->patch(route('workspaces.update', $group), ['name' => 'Hacked by Admin'])
            ->assertForbidden();

        $this->actingAs($member)
            ->patch(route('workspaces.update', $group), ['name' => 'Hacked by Member'])
            ->assertForbidden();

        $this->actingAs($stranger)
            ->patch(route('workspaces.update', $group), ['name' => 'Hacked by Stranger'])
            ->assertForbidden();

        $this->actingAs($owner)
            ->patch(route('workspaces.update', $group), [
                'name' => 'Updated Group Name',
                'type' => 'personal',
                'owner_id' => $stranger->id,
            ])
            ->assertRedirect(route('workspaces.show', $group));

        $group->refresh();
        expect($group->name)->toBe('Updated Group Name')
            ->and($group->type)->toBe(WorkspaceType::Group)
            ->and($group->owner_id)->toBe($owner->id);
    });

    test('personal workspace can never be deleted even by its owner, while group workspace can only be deleted by its owner', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $admin = User::factory()->withPersonalWorkspace()->create();

        $personal = $owner->personalWorkspace;
        $group = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $owner->id,
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $admin->id,
            'role' => WorkspaceRole::Admin,
            'joined_at' => now(),
        ]);

        // Owner cannot delete personal workspace
        $this->actingAs($owner)
            ->delete(route('workspaces.destroy', $personal))
            ->assertForbidden();

        expect(Workspace::query()->find($personal->id))->not->toBeNull();

        // Admin cannot delete group workspace
        $this->actingAs($admin)
            ->delete(route('workspaces.destroy', $group))
            ->assertForbidden();

        expect(Workspace::query()->find($group->id))->not->toBeNull();

        // Owner can delete group workspace
        $this->actingAs($owner)
            ->delete(route('workspaces.destroy', $group))
            ->assertRedirect(route('workspaces.index'));

        expect(Workspace::query()->find($group->id))->toBeNull()
            ->and(WorkspaceMember::query()->where('workspace_id', $group->id)->count())->toBe(0);
    });
});
