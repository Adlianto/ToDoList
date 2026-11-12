<?php

namespace App\Http\Middleware;

use App\Enums\InvitationStatus;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'account_id' => $user->account_id,
                    'name' => $user->name,
                ] : null,
                'workspaces' => $user
                    ? fn () => $user->workspaces()
                        ->orderByRaw("CASE WHEN workspaces.type = 'personal' THEN 0 ELSE 1 END")
                        ->orderBy('workspaces.name')
                        ->get()
                        ->map(fn (Workspace $workspace): array => [
                            'id' => $workspace->id,
                            'name' => $workspace->name,
                            'type' => $workspace->type->value,
                            'role' => $workspace->pivot?->getAttribute('role'),
                        ])
                    : [],
                'pending_invitations_count' => $user
                    ? fn (): int => $user->receivedInvitations()
                        ->where('status', InvitationStatus::Pending)
                        ->where('expires_at', '>', now())
                        ->count()
                    : 0,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'invitation_code' => fn () => $request->session()->get('invitation_code'),
            ],
        ];
    }
}
