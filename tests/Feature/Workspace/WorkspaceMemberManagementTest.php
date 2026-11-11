<?php

use App\Enums\TaskStatus;
use App\Enums\WorkspaceRole;
use App\Enums\WorkspaceType;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

describe('Workspace Member Management & Advanced Scheduling', function () {
    test('owner can promote a member to admin', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $memberUser = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->create([
            'type' => WorkspaceType::Group,
            'owner_id' => $owner->id,
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $owner->id,
            'role' => WorkspaceRole::Owner,
            'joined_at' => now(),
        ]);

        $membership = WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $memberUser->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        $response = $this->actingAs($owner)->patch(
            route('workspaces.members.update', ['workspace' => $group, 'member' => $membership]),
            ['role' => 'admin']
        );

        $response->assertRedirect(route('workspaces.show', $group));

        expect($membership->fresh()->role)->toBe(WorkspaceRole::Admin);
    });

    test('owner can demote an admin to member', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $adminUser = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->create([
            'type' => WorkspaceType::Group,
            'owner_id' => $owner->id,
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $owner->id,
            'role' => WorkspaceRole::Owner,
            'joined_at' => now(),
        ]);

        $membership = WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $adminUser->id,
            'role' => WorkspaceRole::Admin,
            'joined_at' => now(),
        ]);

        $response = $this->actingAs($owner)->patch(
            route('workspaces.members.update', ['workspace' => $group, 'member' => $membership]),
            ['role' => 'member']
        );

        $response->assertRedirect(route('workspaces.show', $group));

        expect($membership->fresh()->role)->toBe(WorkspaceRole::Member);
    });

    test('owner cannot change their own role or assign owner role', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->create([
            'type' => WorkspaceType::Group,
            'owner_id' => $owner->id,
        ]);

        $ownerMembership = WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $owner->id,
            'role' => WorkspaceRole::Owner,
            'joined_at' => now(),
        ]);

        $this->actingAs($owner)->patch(
            route('workspaces.members.update', ['workspace' => $group, 'member' => $ownerMembership]),
            ['role' => 'admin']
        )->assertForbidden();

        $memberUser = User::factory()->withPersonalWorkspace()->create();
        $memberMembership = WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $memberUser->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        $this->actingAs($owner)->patch(
            route('workspaces.members.update', ['workspace' => $group, 'member' => $memberMembership]),
            ['role' => 'owner']
        )->assertSessionHasErrors('role');
    });

    test('admin or regular member cannot change roles', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $adminUser = User::factory()->withPersonalWorkspace()->create();
        $memberUser = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->create([
            'type' => WorkspaceType::Group,
            'owner_id' => $owner->id,
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $owner->id,
            'role' => WorkspaceRole::Owner,
            'joined_at' => now(),
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $adminUser->id,
            'role' => WorkspaceRole::Admin,
            'joined_at' => now(),
        ]);

        $targetMembership = WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $memberUser->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        $this->actingAs($adminUser)->patch(
            route('workspaces.members.update', ['workspace' => $group, 'member' => $targetMembership]),
            ['role' => 'admin']
        )->assertForbidden();

        $this->actingAs($memberUser)->patch(
            route('workspaces.members.update', ['workspace' => $group, 'member' => $targetMembership]),
            ['role' => 'admin']
        )->assertForbidden();
    });

    test('owner can remove any non-owner member', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $memberUser = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->create([
            'type' => WorkspaceType::Group,
            'owner_id' => $owner->id,
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $owner->id,
            'role' => WorkspaceRole::Owner,
            'joined_at' => now(),
        ]);

        $membership = WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $memberUser->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        $response = $this->actingAs($owner)->delete(
            route('workspaces.members.destroy', ['workspace' => $group, 'member' => $membership])
        );

        $response->assertRedirect(route('workspaces.show', $group));

        $this->assertDatabaseMissing('workspace_members', [
            'id' => $membership->id,
        ]);
    });

    test('admin can remove regular members but cannot remove owner or another admin', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $adminA = User::factory()->withPersonalWorkspace()->create();
        $adminB = User::factory()->withPersonalWorkspace()->create();
        $memberUser = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->create([
            'type' => WorkspaceType::Group,
            'owner_id' => $owner->id,
        ]);

        $ownerMembership = WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $owner->id,
            'role' => WorkspaceRole::Owner,
            'joined_at' => now(),
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $adminA->id,
            'role' => WorkspaceRole::Admin,
            'joined_at' => now(),
        ]);

        $adminBMembership = WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $adminB->id,
            'role' => WorkspaceRole::Admin,
            'joined_at' => now(),
        ]);

        $memberMembership = WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $memberUser->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        // Admin cannot remove owner
        $this->actingAs($adminA)->delete(
            route('workspaces.members.destroy', ['workspace' => $group, 'member' => $ownerMembership])
        )->assertForbidden();

        // Admin cannot remove fellow admin
        $this->actingAs($adminA)->delete(
            route('workspaces.members.destroy', ['workspace' => $group, 'member' => $adminBMembership])
        )->assertForbidden();

        // Admin can remove member
        $this->actingAs($adminA)->delete(
            route('workspaces.members.destroy', ['workspace' => $group, 'member' => $memberMembership])
        )->assertRedirect(route('workspaces.show', $group));

        $this->assertDatabaseMissing('workspace_members', [
            'id' => $memberMembership->id,
        ]);
    });

    test('regular member cannot remove anyone', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $memberA = User::factory()->withPersonalWorkspace()->create();
        $memberB = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->create([
            'type' => WorkspaceType::Group,
            'owner_id' => $owner->id,
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $owner->id,
            'role' => WorkspaceRole::Owner,
            'joined_at' => now(),
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $memberA->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        $membershipB = WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $memberB->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        $this->actingAs($memberA)->delete(
            route('workspaces.members.destroy', ['workspace' => $group, 'member' => $membershipB])
        )->assertForbidden();
    });

    test('member or admin can leave a group workspace', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $memberUser = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->create([
            'type' => WorkspaceType::Group,
            'owner_id' => $owner->id,
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $owner->id,
            'role' => WorkspaceRole::Owner,
            'joined_at' => now(),
        ]);

        $membership = WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $memberUser->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        $response = $this->actingAs($memberUser)->post(
            route('workspaces.leave', $group)
        );

        $response->assertRedirect(route('workspaces.index'));

        $this->assertDatabaseMissing('workspace_members', [
            'id' => $membership->id,
        ]);
    });

    test('owner cannot leave a group workspace', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->create([
            'type' => WorkspaceType::Group,
            'owner_id' => $owner->id,
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $owner->id,
            'role' => WorkspaceRole::Owner,
            'joined_at' => now(),
        ]);

        $this->actingAs($owner)->post(
            route('workspaces.leave', $group)
        )->assertForbidden();
    });

    test('user cannot leave a personal workspace', function () {
        $user = User::factory()->withPersonalWorkspace()->create();

        $personal = $user->personalWorkspace()->firstOrFail();

        $this->actingAs($user)->post(
            route('workspaces.leave', $personal)
        )->assertForbidden();
    });

    test('workspace show filters tasks by status and date range', function () {
        $user = User::factory()->withPersonalWorkspace()->create();
        $workspace = $user->personalWorkspace()->firstOrFail();

        // 1. Task due today
        Task::factory()->create([
            'workspace_id' => $workspace->id,
            'created_by' => $user->id,
            'title' => 'Task Due Today',
            'status' => TaskStatus::Todo,
            'due_at' => Carbon::today()->addHours(14),
        ]);

        // 2. Task due next month
        Task::factory()->create([
            'workspace_id' => $workspace->id,
            'created_by' => $user->id,
            'title' => 'Task Due Far Away',
            'status' => TaskStatus::Todo,
            'due_at' => Carbon::now()->addDays(40),
        ]);

        // 3. Overdue task
        Task::factory()->create([
            'workspace_id' => $workspace->id,
            'created_by' => $user->id,
            'title' => 'Task Overdue',
            'status' => TaskStatus::InProgress,
            'due_at' => Carbon::now()->subDays(2),
        ]);

        // 4. No due date task
        Task::factory()->create([
            'workspace_id' => $workspace->id,
            'created_by' => $user->id,
            'title' => 'Task Backlog',
            'status' => TaskStatus::Done,
            'due_at' => null,
        ]);

        // Filter: due=today
        $this->actingAs($user)
            ->get(route('workspaces.show', ['workspace' => $workspace, 'due' => 'today']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('workspaces/show')
                ->has('tasks', 1)
                ->where('tasks.0.title', 'Task Due Today')
                ->where('filters.due', 'today')
            );

        // Filter: due=overdue
        $this->actingAs($user)
            ->get(route('workspaces.show', ['workspace' => $workspace, 'due' => 'overdue']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('workspaces/show')
                ->has('tasks', 1)
                ->where('tasks.0.title', 'Task Overdue')
                ->where('filters.due', 'overdue')
            );

        // Filter: due=no_due_date
        $this->actingAs($user)
            ->get(route('workspaces.show', ['workspace' => $workspace, 'due' => 'no_due_date']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('workspaces/show')
                ->has('tasks', 1)
                ->where('tasks.0.title', 'Task Backlog')
                ->where('filters.due', 'no_due_date')
            );

        // Filter: status=done
        $this->actingAs($user)
            ->get(route('workspaces.show', ['workspace' => $workspace, 'status' => 'done']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('workspaces/show')
                ->has('tasks', 1)
                ->where('tasks.0.title', 'Task Backlog')
                ->where('filters.status', 'done')
            );
    });

    test('workspace show supports agenda view mode and sorting', function () {
        $user = User::factory()->withPersonalWorkspace()->create();
        $workspace = $user->personalWorkspace()->firstOrFail();

        Task::factory()->create([
            'workspace_id' => $workspace->id,
            'created_by' => $user->id,
            'title' => 'Alpha Task',
            'status' => TaskStatus::Todo,
            'due_at' => Carbon::now()->addDays(5),
        ]);

        Task::factory()->create([
            'workspace_id' => $workspace->id,
            'created_by' => $user->id,
            'title' => 'Beta Task',
            'status' => TaskStatus::Todo,
            'due_at' => Carbon::now()->addDays(1),
        ]);

        $this->actingAs($user)
            ->get(route('workspaces.show', [
                'workspace' => $workspace,
                'view' => 'agenda',
                'sort' => 'title_asc',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('workspaces/show')
                ->has('tasks', 2)
                ->where('tasks.0.title', 'Alpha Task')
                ->where('tasks.1.title', 'Beta Task')
                ->where('filters.view', 'agenda')
                ->where('filters.sort', 'title_asc')
            );
    });
});
