<?php

use App\Enums\TaskStatus;
use App\Enums\WorkspaceRole;
use App\Enums\WorkspaceType;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use Inertia\Testing\AssertableInertia as Assert;

describe('End-to-End MVP User Journey', function () {
    test('complete MVP flow: register, personal workspace, group workspace, invitation, task collaboration', function () {
        // 1. User A (Owner) registers
        $responseA = $this->post(route('register.store'), [
            'name' => 'Alice Admin',
            'username' => 'alice_lead',
            'email' => 'alice@example.com',
            'password' => 'secret123456',
            'password_confirmation' => 'secret123456',
        ]);

        $responseA->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();

        $alice = User::query()->where('email', 'alice@example.com')->firstOrFail();

        // Verify Alice has 1 personal workspace
        expect($alice->personalWorkspace)->not->toBeNull()
            ->and($alice->personalWorkspace?->type)->toBe(WorkspaceType::Personal);

        // 2. Alice creates a Group Workspace
        $createGroupResponse = $this->actingAs($alice)->post(route('workspaces.store'), [
            'name' => 'Engineering Squad',
        ]);

        $groupWorkspace = Workspace::query()->where('name', 'Engineering Squad')->firstOrFail();
        $createGroupResponse->assertRedirect(route('workspaces.show', $groupWorkspace));
        expect($groupWorkspace->type)->toBe(WorkspaceType::Group)
            ->and($groupWorkspace->getMemberRole($alice))->toBe(WorkspaceRole::Owner);

        // 3. User B (Bob) registers in a separate session
        $this->post(route('logout'));
        $this->assertGuest();

        $this->post(route('register.store'), [
            'name' => 'Bob Builder',
            'username' => 'bob_dev',
            'email' => 'bob@example.com',
            'password' => 'secret123456',
            'password_confirmation' => 'secret123456',
        ]);
        $bob = User::query()->where('email', 'bob@example.com')->firstOrFail();
        $this->post(route('logout'));

        // 4. Alice invites Bob via username
        $this->actingAs($alice)->post(route('workspaces.invitations.store', $groupWorkspace), [
            'type' => 'username',
            'username' => 'bob_dev',
        ])->assertRedirect(route('workspaces.show', $groupWorkspace));

        // 5. Bob logs in, checks invitations, and accepts
        $this->actingAs($bob);
        $this->get(route('invitations.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('invitations/index')
                ->has('invitations', 1)
                ->where('invitations.0.workspace.name', 'Engineering Squad')
            );

        $invitation = $bob->receivedInvitations()->firstOrFail();
        $this->post(route('invitations.accept', $invitation))
            ->assertRedirect(route('workspaces.show', $groupWorkspace));

        // Verify Bob is now a member of the group
        expect($groupWorkspace->hasMember($bob))->toBeTrue()
            ->and($groupWorkspace->getMemberRole($bob))->toBe(WorkspaceRole::Member);

        // 6. Bob creates a shared task in the Engineering Squad workspace
        $this->post(route('workspaces.tasks.store', $groupWorkspace), [
            'title' => 'Implement CI/CD pipeline',
            'description' => 'Automate testing and deployment scripts',
            'status' => 'todo',
            'due_at' => now()->addDays(3)->toDateTimeString(),
        ])->assertRedirect(route('workspaces.show', $groupWorkspace));

        $task = Task::query()->where('title', 'Implement CI/CD pipeline')->firstOrFail();
        expect($task->workspace_id)->toBe($groupWorkspace->id)
            ->and($task->created_by)->toBe($bob->id);

        // 7. Alice updates task status to 'in_progress' and then 'done'
        $this->actingAs($alice)->patch(route('workspaces.tasks.update', [
            'workspace' => $groupWorkspace,
            'task' => $task,
        ]), [
            'status' => 'in_progress',
        ])->assertRedirect(route('workspaces.show', $groupWorkspace));

        $task->refresh();
        expect($task->status)->toBe(TaskStatus::InProgress);

        $this->actingAs($bob)->patch(route('workspaces.tasks.update', [
            'workspace' => $groupWorkspace,
            'task' => $task,
        ]), [
            'status' => 'done',
        ])->assertRedirect(route('workspaces.show', $groupWorkspace));

        $task->refresh();
        expect($task->status)->toBe(TaskStatus::Done);

        // 8. Bob (creator) deletes his own task
        $this->actingAs($bob)->delete(route('workspaces.tasks.destroy', [
            'workspace' => $groupWorkspace,
            'task' => $task,
        ]))->assertRedirect(route('workspaces.show', $groupWorkspace));

        expect(Task::query()->whereKey($task->id)->exists())->toBeFalse();
    });
});
