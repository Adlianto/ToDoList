<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Enums\TaskStatus;
use App\Models\Invitation;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the user's dashboard with personal, group workspaces, pending invitations, and task summaries.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $personalWorkspace = $user->ensurePersonalWorkspace();

        $workspaceModels = $user->workspaces()
            ->withCount(['members', 'tasks'])
            ->orderByRaw("CASE WHEN workspaces.type = 'personal' THEN 0 ELSE 1 END")
            ->orderBy('workspaces.name')
            ->get();

        $workspaceIds = $workspaceModels->pluck('id')->all();

        $workspaces = $workspaceModels->map(fn (Workspace $workspace): array => [
            'id' => $workspace->id,
            'name' => $workspace->name,
            'type' => $workspace->type->value,
            'owner_id' => $workspace->owner_id,
            'role' => $workspace->pivot?->getAttribute('role'),
            'members_count' => $workspace->members_count,
            'tasks_count' => $workspace->tasks_count,
        ]);

        $pendingInvitations = $user->receivedInvitations()
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

        $activeTasks = Task::query()
            ->with(['workspace:id,name,type', 'creator:id,account_id,name'])
            ->whereIn('workspace_id', $workspaceIds)
            ->whereIn('status', [TaskStatus::Todo->value, TaskStatus::InProgress->value])
            ->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_at')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $mapTask = function (Task $task): array {
            /** @var Carbon|null $dueAt */
            $dueAt = $task->due_at;

            return [
                'id' => $task->id,
                'title' => $task->title,
                'status' => $task->status->value,
                'due_at' => $dueAt?->toISOString(),
                'is_overdue' => $dueAt !== null && $dueAt->isPast(),
                'workspace' => [
                    'id' => $task->workspace->id,
                    'name' => $task->workspace->name,
                    'type' => $task->workspace->type->value,
                ],
            ];
        };

        $overdueTasks = $activeTasks
            ->filter(fn (Task $task): bool => $task->due_at !== null && $task->due_at->isPast())
            ->values()
            ->map($mapTask);

        $upcomingTasks = $activeTasks
            ->reject(fn (Task $task): bool => $task->due_at !== null && $task->due_at->isPast())
            ->values()
            ->map($mapTask);

        return Inertia::render('dashboard', [
            'personalWorkspace' => [
                'id' => $personalWorkspace->id,
                'name' => $personalWorkspace->name,
                'type' => $personalWorkspace->type->value,
            ],
            'workspaces' => $workspaces,
            'pendingInvitations' => $pendingInvitations,
            'overdueTasks' => $overdueTasks,
            'upcomingTasks' => $upcomingTasks,
        ]);
    }
}
