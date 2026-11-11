<?php

namespace App\Policies;

use App\Enums\WorkspaceRole;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;

class TaskPolicy
{
    /**
     * Determine whether the user can view tasks in the given workspace.
     */
    public function viewAny(User $user, Workspace $workspace): bool
    {
        return $workspace->hasMember($user);
    }

    /**
     * Determine whether the user can view a specific task.
     */
    public function view(User $user, Task $task): bool
    {
        return $task->workspace->hasMember($user);
    }

    /**
     * Determine whether the user can create tasks in the given workspace.
     * All workspace members (owner, admin, member) can create tasks.
     */
    public function create(User $user, Workspace $workspace): bool
    {
        return $workspace->hasMember($user);
    }

    /**
     * Determine whether the user can update the task.
     * All workspace members (owner, admin, member) can update tasks in the workspace.
     */
    public function update(User $user, Task $task): bool
    {
        return $task->workspace->hasMember($user);
    }

    /**
     * Determine whether the user can delete the task.
     * Owners and admins can delete any task in the workspace.
     * Regular members can only delete tasks they created themselves.
     */
    public function delete(User $user, Task $task): bool
    {
        $role = $task->workspace->getMemberRole($user);

        if ($role === null) {
            return false;
        }

        if (in_array($role, [WorkspaceRole::Owner, WorkspaceRole::Admin], true)) {
            return true;
        }

        return $task->created_by === $user->id;
    }
}
