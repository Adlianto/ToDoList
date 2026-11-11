<?php

namespace App\Http\Controllers;

use App\Enums\InvitationStatus;
use App\Enums\TaskStatus;
use App\Enums\WorkspaceRole;
use App\Enums\WorkspaceType;
use App\Http\Requests\Workspace\StoreWorkspaceRequest;
use App\Http\Requests\Workspace\UpdateWorkspaceRequest;
use App\Models\Invitation;
use App\Models\Task;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class WorkspaceController extends Controller
{
    /**
     * Display a listing of the workspaces the user belongs to.
     */
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Workspace::class);

        /** @var User $user */
        $user = $request->user();

        $user->ensurePersonalWorkspace();

        $workspaces = $user->workspaces()
            ->withCount(['members', 'tasks'])
            ->orderByRaw("CASE WHEN workspaces.type = 'personal' THEN 0 ELSE 1 END")
            ->orderBy('workspaces.name')
            ->get()
            ->map(fn (Workspace $workspace): array => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'type' => $workspace->type->value,
                'owner_id' => $workspace->owner_id,
                'role' => $workspace->pivot?->getAttribute('role'),
                'members_count' => $workspace->members_count,
                'tasks_count' => $workspace->tasks_count,
            ]);

        return Inertia::render('workspaces/index', [
            'workspaces' => $workspaces,
        ]);
    }

    /**
     * Show the form for creating a new group workspace.
     */
    public function create(): Response
    {
        Gate::authorize('create', Workspace::class);

        return Inertia::render('workspaces/create');
    }

    /**
     * Store a newly created group workspace in storage.
     */
    public function store(StoreWorkspaceRequest $request): RedirectResponse
    {
        Gate::authorize('create', Workspace::class);

        /** @var User $user */
        $user = $request->user();

        /** @var array{name: string} $validated */
        $validated = $request->validated();

        $workspace = DB::transaction(function () use ($user, $validated): Workspace {
            $workspace = new Workspace([
                'name' => $validated['name'],
                'type' => WorkspaceType::Group,
            ]);
            $workspace->owner_id = $user->id;
            $workspace->personal_owner_id = null;
            $workspace->save();

            WorkspaceMember::query()->create([
                'workspace_id' => $workspace->id,
                'user_id' => $user->id,
                'role' => WorkspaceRole::Owner,
                'joined_at' => now(),
            ]);

            return $workspace;
        });

        return redirect()
            ->route('workspaces.show', $workspace)
            ->with('success', 'Group workspace created successfully.');
    }

    /**
     * Display the specified workspace, its tasks, and its members.
     */
    public function show(Request $request, Workspace $workspace): Response
    {
        Gate::authorize('view', $workspace);

        /** @var User $user */
        $user = $request->user();

        $currentUserRole = $workspace->getMemberRole($user);
        $canInvite = Gate::forUser($user)->allows('invite', $workspace);
        $canDeleteAnyTask = in_array($currentUserRole, [WorkspaceRole::Owner, WorkspaceRole::Admin], true);

        $statusFilter = $request->query('status');
        $activeStatus = is_string($statusFilter) && TaskStatus::tryFrom($statusFilter) !== null
            ? $statusFilter
            : 'all';

        $dueFilter = $request->query('due');
        $activeDue = is_string($dueFilter) && in_array($dueFilter, ['all', 'today', 'this_week', 'overdue', 'no_due_date'], true)
            ? $dueFilter
            : 'all';

        $sortFilter = $request->query('sort');
        $activeSort = is_string($sortFilter) && in_array($sortFilter, ['due_at_asc', 'due_at_desc', 'created_at_desc', 'created_at_asc', 'title_asc'], true)
            ? $sortFilter
            : 'default';

        $rawView = $request->query('view');
        $viewMode = is_string($rawView) && in_array($rawView, ['kanban', 'list', 'agenda', 'members'], true)
            ? $rawView
            : 'kanban';

        $tasksQuery = $workspace->tasks()
            ->with('creator:id,username,name');

        if ($activeStatus !== 'all') {
            $tasksQuery->where('status', $activeStatus);
        }

        if ($activeDue === 'today') {
            $tasksQuery->whereNotNull('due_at')
                ->whereBetween('due_at', [now()->startOfDay(), now()->endOfDay()]);
        } elseif ($activeDue === 'this_week') {
            $tasksQuery->whereNotNull('due_at')
                ->whereBetween('due_at', [now()->startOfDay(), now()->endOfWeek()]);
        } elseif ($activeDue === 'overdue') {
            $tasksQuery->whereNotNull('due_at')
                ->where('due_at', '<', now())
                ->where('status', '!=', TaskStatus::Done->value);
        } elseif ($activeDue === 'no_due_date') {
            $tasksQuery->whereNull('due_at');
        }

        if ($activeSort === 'due_at_asc') {
            $tasksQuery->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
                ->orderBy('due_at', 'asc')
                ->orderByDesc('created_at');
        } elseif ($activeSort === 'due_at_desc') {
            $tasksQuery->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
                ->orderBy('due_at', 'desc')
                ->orderByDesc('created_at');
        } elseif ($activeSort === 'created_at_asc') {
            $tasksQuery->orderBy('created_at', 'asc');
        } elseif ($activeSort === 'title_asc') {
            $tasksQuery->orderBy('title', 'asc');
        } else {
            $tasksQuery->orderByRaw("CASE WHEN status = 'done' THEN 1 ELSE 0 END")
                ->orderByRaw('CASE WHEN due_at IS NULL THEN 1 ELSE 0 END')
                ->orderBy('due_at')
                ->orderByDesc('created_at');
        }

        $tasks = $tasksQuery
            ->get()
            ->map(function (Task $task) use ($user, $canDeleteAnyTask): array {
                /** @var Carbon|null $dueAt */
                $dueAt = $task->due_at;
                /** @var Carbon|null $createdAt */
                $createdAt = $task->created_at;

                return [
                    'id' => $task->id,
                    'workspace_id' => $task->workspace_id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status->value,
                    'due_at' => $dueAt?->toISOString(),
                    'is_overdue' => $dueAt !== null
                        && $task->status !== TaskStatus::Done
                        && $dueAt->isPast(),
                    'creator' => [
                        'id' => $task->creator->id,
                        'username' => $task->creator->username,
                        'name' => $task->creator->name,
                    ],
                    'can_delete' => $canDeleteAnyTask || $task->created_by === $user->id,
                    'created_at' => $createdAt?->toISOString(),
                ];
            });

        $members = $workspace->memberships()
            ->with('user:id,username,name')
            ->orderByRaw("CASE WHEN role = 'owner' THEN 0 WHEN role = 'admin' THEN 1 ELSE 2 END")
            ->orderBy('joined_at')
            ->get()
            ->map(function (WorkspaceMember $membership) use ($user, $workspace): array {
                /** @var Carbon $joinedAt */
                $joinedAt = $membership->joined_at;

                return [
                    'id' => $membership->id,
                    'user_id' => $membership->user->id,
                    'username' => $membership->user->username,
                    'name' => $membership->user->name,
                    'role' => $membership->role->value,
                    'joined_at' => $joinedAt->toISOString(),
                    'can_change_role' => Gate::forUser($user)->allows('manageMemberRole', [$workspace, $membership]),
                    'can_remove' => Gate::forUser($user)->allows('removeMember', [$workspace, $membership]),
                ];
            });

        $pendingInvitations = $canInvite
            ? $workspace->invitations()
                ->with(['invitee:id,username,name', 'inviter:id,username,name'])
                ->where('status', InvitationStatus::Pending)
                ->where('expires_at', '>', now())
                ->orderByDesc('created_at')
                ->get()
                ->map(function (Invitation $invitation): array {
                    /** @var Carbon $expiresAt */
                    $expiresAt = $invitation->expires_at;

                    return [
                        'id' => $invitation->id,
                        'mode' => $invitation->invitee_id !== null ? 'username' : 'code',
                        'invitee' => $invitation->invitee ? [
                            'id' => $invitation->invitee->id,
                            'username' => $invitation->invitee->username,
                            'name' => $invitation->invitee->name,
                        ] : null,
                        'inviter' => [
                            'id' => $invitation->inviter->id,
                            'username' => $invitation->inviter->username,
                            'name' => $invitation->inviter->name,
                        ],
                        'expires_at' => $expiresAt->toISOString(),
                    ];
                })
                ->all()
            : [];

        return Inertia::render('workspaces/show', [
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
                'type' => $workspace->type->value,
                'owner_id' => $workspace->owner_id,
                'current_user_role' => $currentUserRole?->value,
            ],
            'tasks' => $tasks,
            'filters' => [
                'status' => $activeStatus,
                'due' => $activeDue,
                'sort' => $activeSort,
                'view' => $viewMode,
            ],
            'members' => $members,
            'pendingInvitations' => $pendingInvitations,
            'permissions' => [
                'can_update' => Gate::forUser($user)->allows('update', $workspace),
                'can_delete' => Gate::forUser($user)->allows('delete', $workspace),
                'can_invite' => $canInvite,
                'can_create_task' => Gate::forUser($user)->allows('create', [Task::class, $workspace]),
                'can_leave' => Gate::forUser($user)->allows('leave', $workspace),
            ],
        ]);
    }

    /**
     * Update the specified workspace in storage.
     */
    public function update(UpdateWorkspaceRequest $request, Workspace $workspace): RedirectResponse
    {
        Gate::authorize('update', $workspace);

        /** @var array{name: string} $validated */
        $validated = $request->validated();

        $workspace->update([
            'name' => $validated['name'],
        ]);

        return redirect()
            ->route('workspaces.show', $workspace)
            ->with('success', 'Workspace updated successfully.');
    }

    /**
     * Remove the specified group workspace from storage.
     */
    public function destroy(Workspace $workspace): RedirectResponse
    {
        Gate::authorize('delete', $workspace);

        $workspace->delete();

        return redirect()
            ->route('workspaces.index')
            ->with('success', 'Group workspace deleted successfully.');
    }
}
