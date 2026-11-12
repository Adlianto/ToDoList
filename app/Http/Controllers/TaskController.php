<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Http\Requests\Task\BulkUpdateTasksRequest;
use App\Http\Requests\Task\StoreTaskRequest;
use App\Http\Requests\Task\UpdateTaskRequest;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class TaskController extends Controller
{
    /**
     * Store a newly created task in the specified workspace.
     */
    public function store(StoreTaskRequest $request, Workspace $workspace): RedirectResponse
    {
        Gate::authorize('create', [Task::class, $workspace]);

        /** @var User $user */
        $user = $request->user();

        /** @var array{title: string, description?: string|null, status: string, due_at?: string|null} $validated */
        $validated = $request->validated();

        $task = new Task([
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => TaskStatus::from($validated['status']),
            'due_at' => $validated['due_at'] ?? null,
            'lock_version' => 1,
        ]);
        $task->workspace_id = $workspace->id;
        $task->created_by = $user->id;
        $task->save();

        return redirect()
            ->route('workspaces.show', $workspace)
            ->with('success', 'Task created successfully.');
    }

    /**
     * Update the specified task in the workspace.
     */
    public function update(UpdateTaskRequest $request, Workspace $workspace, Task $task): RedirectResponse|Response|JsonResponse
    {
        Gate::authorize('update', $task);

        /** @var array{title?: string, description?: string|null, status?: string, due_at?: string|null, lock_version?: int} $validated */
        $validated = $request->validated();

        $conflict = DB::transaction(function () use ($task, $validated): bool {
            $locked = Task::query()
                ->whereKey($task->id)
                ->lockForUpdate()
                ->first();

            if (! $locked instanceof Task) {
                return true;
            }

            if (isset($validated['lock_version']) && $locked->lock_version !== $validated['lock_version']) {
                return true;
            }

            $attributes = [];

            if (array_key_exists('title', $validated)) {
                $attributes['title'] = $validated['title'];
            }

            if (array_key_exists('description', $validated)) {
                $attributes['description'] = $validated['description'];
            }

            if (array_key_exists('status', $validated)) {
                $attributes['status'] = TaskStatus::from($validated['status']);
            }

            if (array_key_exists('due_at', $validated)) {
                $attributes['due_at'] = $validated['due_at'];
            }

            if (! empty($attributes)) {
                $attributes['lock_version'] = $locked->lock_version + 1;
                $locked->update($attributes);
            }

            return false;
        });

        if ($conflict) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Task was modified by another user. Please refresh and try again.',
                ], 409);
            }

            return redirect()
                ->route('workspaces.show', $workspace)
                ->with('error', 'Task was modified by another user. Please review the latest version.');
        }

        if ($request->expectsJson()) {
            return response()->noContent();
        }

        return redirect()
            ->route('workspaces.show', $workspace)
            ->with('success', 'Task updated successfully.');
    }

    /**
     * Batch update multiple tasks status in the workspace atomically.
     */
    public function bulkUpdate(BulkUpdateTasksRequest $request, Workspace $workspace): JsonResponse
    {
        Gate::authorize('viewAny', [Task::class, $workspace]);

        /** @var array{updates: array<int, array{task_id: int, status: string, lock_version?: int}>} $validated */
        $validated = $request->validated();
        $updates = $validated['updates'];

        $taskIds = array_column($updates, 'task_id');

        // Fetch all matching tasks strictly constrained to this workspace
        $tasks = Task::query()
            ->where('workspace_id', $workspace->id)
            ->whereIn('id', $taskIds)
            ->get()
            ->keyBy('id');

        // Verify every task belongs to the workspace and exists
        $missingTaskIds = array_values(array_diff($taskIds, $tasks->keys()->all()));
        if (! empty($missingTaskIds)) {
            throw ValidationException::withMessages([
                'updates' => ['One or more tasks do not exist or do not belong to this workspace.'],
            ]);
        }

        // Authorize user against each task
        foreach ($tasks as $task) {
            Gate::authorize('update', $task);
        }

        /** @var array<int, int> $taskVersions */
        $taskVersions = [];
        /** @var array<int, array{task_id: int, status: string, lock_version: int}> $conflicts */
        $conflicts = [];

        // Atomically perform updates in transaction with row-level lock and optimistic version check
        DB::transaction(function () use ($workspace, $updates, $taskIds, &$taskVersions, &$conflicts): void {
            $lockedTasks = Task::query()
                ->where('workspace_id', $workspace->id)
                ->whereIn('id', $taskIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($lockedTasks->count() !== count(array_unique($taskIds))) {
                throw ValidationException::withMessages([
                    'updates' => ['One or more tasks were deleted before the update completed.'],
                ]);
            }

            foreach ($updates as $update) {
                /** @var Task $lockedTask */
                $lockedTask = $lockedTasks->get($update['task_id']);

                if (isset($update['lock_version']) && $lockedTask->lock_version !== $update['lock_version']) {
                    $conflicts[] = [
                        'task_id' => $lockedTask->id,
                        'status' => $lockedTask->status->value,
                        'lock_version' => $lockedTask->lock_version,
                    ];
                }
            }

            if (! empty($conflicts)) {
                return;
            }

            foreach ($updates as $update) {
                /** @var Task $lockedTask */
                $lockedTask = $lockedTasks->get($update['task_id']);
                $nextStatus = TaskStatus::from($update['status']);

                if ($lockedTask->status !== $nextStatus) {
                    $lockedTask->update([
                        'status' => $nextStatus,
                        'lock_version' => $lockedTask->lock_version + 1,
                    ]);
                }

                $taskVersions[$lockedTask->id] = $lockedTask->lock_version;
            }
        });

        if (! empty($conflicts)) {
            return response()->json([
                'message' => 'One or more tasks were modified by another user. Changes were synchronized with the latest server state.',
                'conflicts' => $conflicts,
            ], 409);
        }

        return response()->json([
            'message' => 'Tasks updated successfully.',
            'updated_count' => count($updates),
            'updated_task_ids' => $taskIds,
            'task_versions' => $taskVersions,
        ]);
    }

    /**
     * Remove the specified task from the workspace.
     */
    public function destroy(Workspace $workspace, Task $task): RedirectResponse
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return redirect()
            ->route('workspaces.show', $workspace)
            ->with('success', 'Task deleted successfully.');
    }
}
