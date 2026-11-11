<?php

use App\Enums\TaskStatus;
use App\Enums\WorkspaceRole;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Inertia\Testing\AssertableInertia as Assert;

describe('Task Management and Workspace Isolation', function () {
    test('workspace members can create tasks with title, description, status, and due_at while ignoring mass-assignment tampering', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $member = User::factory()->withPersonalWorkspace()->create();
        $otherUser = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $owner->id,
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $member->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        $dueAt = now()->addDays(3)->startOfMinute()->toISOString();

        $this->actingAs($member)
            ->post(route('workspaces.tasks.store', $group), [
                'title' => 'Susun Bab 1 Laporan',
                'description' => 'Bagian pendahuluan dan rumusan masalah',
                'status' => TaskStatus::InProgress->value,
                'due_at' => $dueAt,
                'workspace_id' => $otherUser->personalWorkspace->id, // Tampering attempt
                'created_by' => $otherUser->id, // Tampering attempt
            ])
            ->assertRedirect(route('workspaces.show', $group));

        $task = Task::query()->where('title', 'Susun Bab 1 Laporan')->firstOrFail();

        expect($task->workspace_id)->toBe($group->id)
            ->and($task->created_by)->toBe($member->id)
            ->and($task->description)->toBe('Bagian pendahuluan dan rumusan masalah')
            ->and($task->status)->toBe(TaskStatus::InProgress)
            ->and($task->due_at)->not->toBeNull();
    });

    test('non-members cannot create, update, or delete tasks in a workspace', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $stranger = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $owner->id,
        ]);

        $task = Task::factory()->create([
            'workspace_id' => $group->id,
            'created_by' => $owner->id,
            'title' => 'Protected Task',
        ]);

        $this->actingAs($stranger)
            ->post(route('workspaces.tasks.store', $group), [
                'title' => 'Unauthorized Task',
            ])
            ->assertForbidden();

        $this->actingAs($stranger)
            ->patch(route('workspaces.tasks.update', ['workspace' => $group->id, 'task' => $task->id]), [
                'title' => 'Hacked Title',
            ])
            ->assertForbidden();

        $this->actingAs($stranger)
            ->delete(route('workspaces.tasks.destroy', ['workspace' => $group->id, 'task' => $task->id]))
            ->assertForbidden();

        expect($task->fresh()?->title)->toBe('Protected Task');
    });

    test('tasks are strictly isolated per workspace and status filter works properly', function () {
        $user = User::factory()->withPersonalWorkspace()->create();
        $otherUser = User::factory()->withPersonalWorkspace()->create();

        $personal = $user->personalWorkspace;
        $groupA = Workspace::factory()->withOwnerMembership()->create([
            'name' => 'Group A',
            'owner_id' => $user->id,
        ]);
        $groupB = Workspace::factory()->withOwnerMembership()->create([
            'name' => 'Group B',
            'owner_id' => $otherUser->id,
        ]);

        $personalTask = Task::factory()->create([
            'workspace_id' => $personal->id,
            'created_by' => $user->id,
            'title' => 'Jadwal Potong Rambut',
            'status' => TaskStatus::Todo,
        ]);

        $groupTodoTask = Task::factory()->create([
            'workspace_id' => $groupA->id,
            'created_by' => $user->id,
            'title' => 'Meeting Grup A',
            'status' => TaskStatus::Todo,
        ]);

        $groupDoneTask = Task::factory()->create([
            'workspace_id' => $groupA->id,
            'created_by' => $user->id,
            'title' => 'Beli Konsumsi Grup A',
            'status' => TaskStatus::Done,
        ]);

        Task::factory()->create([
            'workspace_id' => $groupB->id,
            'created_by' => $otherUser->id,
            'title' => 'Rahasia Grup B',
            'status' => TaskStatus::Todo,
        ]);

        // Personal workspace only shows personal task
        $this->actingAs($user)
            ->get(route('workspaces.show', $personal))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('workspaces/show')
                ->has('tasks', 1)
                ->where('tasks.0.id', $personalTask->id)
            );

        // Group A shows only Group A tasks (both todo and done when status=all)
        $this->actingAs($user)
            ->get(route('workspaces.show', $groupA))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('workspaces/show')
                ->has('tasks', 2)
            );

        // Filtering Group A by status=done only returns the done task
        $this->actingAs($user)
            ->get(route('workspaces.show', ['workspace' => $groupA->id, 'status' => 'done']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('workspaces/show')
                ->where('filters.status', 'done')
                ->has('tasks', 1)
                ->where('tasks.0.id', $groupDoneTask->id)
            );

        expect($groupTodoTask->workspace_id)->toBe($groupA->id);
    });

    test('scoped route bindings prevent cross-workspace task modification or deletion (IDOR protection)', function () {
        $user = User::factory()->withPersonalWorkspace()->create();
        $otherOwner = User::factory()->withPersonalWorkspace()->create();

        $userGroup = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $user->id,
        ]);
        $otherGroup = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $otherOwner->id,
        ]);

        $otherTask = Task::factory()->create([
            'workspace_id' => $otherGroup->id,
            'created_by' => $otherOwner->id,
            'title' => 'Other Workspace Task',
        ]);

        // Attempting to update or delete otherTask through userGroup's route returns 404
        $this->actingAs($user)
            ->patch(route('workspaces.tasks.update', [
                'workspace' => $userGroup->id,
                'task' => $otherTask->id,
            ]), [
                'title' => 'Cross-Workspace Attack',
            ])
            ->assertNotFound();

        $this->actingAs($user)
            ->delete(route('workspaces.tasks.destroy', [
                'workspace' => $userGroup->id,
                'task' => $otherTask->id,
            ]))
            ->assertNotFound();

        expect($otherTask->fresh()?->title)->toBe('Other Workspace Task');
    });

    test('members can update any task in their group, but can only delete tasks they created themselves while owner and admin can delete any task', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $admin = User::factory()->withPersonalWorkspace()->create();
        $memberA = User::factory()->withPersonalWorkspace()->create();
        $memberB = User::factory()->withPersonalWorkspace()->create();

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
            'user_id' => $memberA->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        WorkspaceMember::query()->create([
            'workspace_id' => $group->id,
            'user_id' => $memberB->id,
            'role' => WorkspaceRole::Member,
            'joined_at' => now(),
        ]);

        $taskByMemberA = Task::factory()->create([
            'workspace_id' => $group->id,
            'created_by' => $memberA->id,
            'title' => 'Task by Member A',
            'status' => TaskStatus::Todo,
        ]);

        $taskByMemberB = Task::factory()->create([
            'workspace_id' => $group->id,
            'created_by' => $memberB->id,
            'title' => 'Task by Member B',
            'status' => TaskStatus::Todo,
        ]);

        // Member B can update status/title of Member A's task
        $this->actingAs($memberB)
            ->patch(route('workspaces.tasks.update', ['workspace' => $group->id, 'task' => $taskByMemberA->id]), [
                'status' => TaskStatus::Done->value,
                'workspace_id' => $memberB->personalWorkspace->id, // Ignored
                'created_by' => $memberB->id, // Ignored
            ])
            ->assertRedirect(route('workspaces.show', $group));

        $taskByMemberA->refresh();
        expect($taskByMemberA->status)->toBe(TaskStatus::Done)
            ->and($taskByMemberA->workspace_id)->toBe($group->id)
            ->and($taskByMemberA->created_by)->toBe($memberA->id);

        // Member B CANNOT delete Member A's task
        $this->actingAs($memberB)
            ->delete(route('workspaces.tasks.destroy', ['workspace' => $group->id, 'task' => $taskByMemberA->id]))
            ->assertForbidden();

        // Member A CAN delete their own task
        $this->actingAs($memberA)
            ->delete(route('workspaces.tasks.destroy', ['workspace' => $group->id, 'task' => $taskByMemberA->id]))
            ->assertRedirect(route('workspaces.show', $group));

        expect(Task::query()->find($taskByMemberA->id))->toBeNull();

        // Admin CAN delete Member B's task
        $this->actingAs($admin)
            ->delete(route('workspaces.tasks.destroy', ['workspace' => $group->id, 'task' => $taskByMemberB->id]))
            ->assertRedirect(route('workspaces.show', $group));

        expect(Task::query()->find($taskByMemberB->id))->toBeNull();
    });

    test('updating task status via JSON returns 204 No Content without redirect and persists to database', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $group = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $owner->id,
        ]);

        $task = Task::factory()->create([
            'workspace_id' => $group->id,
            'created_by' => $owner->id,
            'status' => TaskStatus::Todo,
        ]);

        $response = $this->actingAs($owner)
            ->patchJson(route('workspaces.tasks.update', ['workspace' => $group->id, 'task' => $task->id]), [
                'status' => TaskStatus::InProgress->value,
            ]);

        $response->assertNoContent();

        $task->refresh();
        expect($task->status)->toBe(TaskStatus::InProgress);
    });

    test('updating task status with invalid status via JSON returns 422 Unprocessable Entity', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $group = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $owner->id,
        ]);

        $task = Task::factory()->create([
            'workspace_id' => $group->id,
            'created_by' => $owner->id,
            'status' => TaskStatus::Todo,
        ]);

        $response = $this->actingAs($owner)
            ->patchJson(route('workspaces.tasks.update', ['workspace' => $group->id, 'task' => $task->id]), [
                'status' => 'invalid_status_value',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['status']);

        $task->refresh();
        expect($task->status)->toBe(TaskStatus::Todo);
    });

    test('unauthorized user attempting task update via JSON returns 403 Forbidden', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $stranger = User::factory()->withPersonalWorkspace()->create();
        $group = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $owner->id,
        ]);

        $task = Task::factory()->create([
            'workspace_id' => $group->id,
            'created_by' => $owner->id,
            'status' => TaskStatus::Todo,
        ]);

        $response = $this->actingAs($stranger)
            ->patchJson(route('workspaces.tasks.update', ['workspace' => $group->id, 'task' => $task->id]), [
                'status' => TaskStatus::Done->value,
            ]);

        $response->assertForbidden();

        $task->refresh();
        expect($task->status)->toBe(TaskStatus::Todo);
    });

    test('bulk update tasks endpoint atomically updates multiple tasks in workspace and returns JSON 200', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $group = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $owner->id,
        ]);

        $task1 = Task::factory()->create([
            'workspace_id' => $group->id,
            'created_by' => $owner->id,
            'status' => TaskStatus::Todo,
        ]);

        $task2 = Task::factory()->create([
            'workspace_id' => $group->id,
            'created_by' => $owner->id,
            'status' => TaskStatus::Todo,
        ]);

        $response = $this->actingAs($owner)
            ->patchJson(route('workspaces.tasks.bulk-update', ['workspace' => $group->id]), [
                'updates' => [
                    ['task_id' => $task1->id, 'status' => TaskStatus::InProgress->value],
                    ['task_id' => $task2->id, 'status' => TaskStatus::Done->value],
                ],
            ]);

        $response->assertOk()
            ->assertJson([
                'message' => 'Tasks updated successfully.',
                'updated_count' => 2,
                'updated_task_ids' => [$task1->id, $task2->id],
            ]);

        $task1->refresh();
        $task2->refresh();

        expect($task1->status)->toBe(TaskStatus::InProgress)
            ->and($task2->status)->toBe(TaskStatus::Done);
    });

    test('bulk update rolls back all updates if any task belongs to another workspace or is invalid', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $otherUser = User::factory()->withPersonalWorkspace()->create();

        $groupA = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $owner->id,
        ]);
        $groupB = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $otherUser->id,
        ]);

        $taskValid = Task::factory()->create([
            'workspace_id' => $groupA->id,
            'created_by' => $owner->id,
            'status' => TaskStatus::Todo,
        ]);

        $taskForeign = Task::factory()->create([
            'workspace_id' => $groupB->id,
            'created_by' => $otherUser->id,
            'status' => TaskStatus::Todo,
        ]);

        $response = $this->actingAs($owner)
            ->patchJson(route('workspaces.tasks.bulk-update', ['workspace' => $groupA->id]), [
                'updates' => [
                    ['task_id' => $taskValid->id, 'status' => TaskStatus::Done->value],
                    ['task_id' => $taskForeign->id, 'status' => TaskStatus::Done->value],
                ],
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['updates']);

        $taskValid->refresh();
        $taskForeign->refresh();

        // Transaction rollback guarantee
        expect($taskValid->status)->toBe(TaskStatus::Todo)
            ->and($taskForeign->status)->toBe(TaskStatus::Todo);
    });

    test('unauthorized user cannot bulk update tasks in a workspace', function () {
        $owner = User::factory()->withPersonalWorkspace()->create();
        $stranger = User::factory()->withPersonalWorkspace()->create();

        $group = Workspace::factory()->withOwnerMembership()->create([
            'owner_id' => $owner->id,
        ]);

        $task = Task::factory()->create([
            'workspace_id' => $group->id,
            'created_by' => $owner->id,
            'status' => TaskStatus::Todo,
        ]);

        $response = $this->actingAs($stranger)
            ->patchJson(route('workspaces.tasks.bulk-update', ['workspace' => $group->id]), [
                'updates' => [
                    ['task_id' => $task->id, 'status' => TaskStatus::Done->value],
                ],
            ]);

        $response->assertForbidden();

        $task->refresh();
        expect($task->status)->toBe(TaskStatus::Todo);
    });

    test('task input validation rejects invalid status and empty title', function () {
        $user = User::factory()->withPersonalWorkspace()->create();
        $personal = $user->personalWorkspace;

        $this->actingAs($user)
            ->post(route('workspaces.tasks.store', $personal), [
                'title' => '   ',
                'status' => 'invalid_status',
                'due_at' => 'not-a-date',
            ])
            ->assertSessionHasErrors(['title', 'status', 'due_at']);
    });
});
