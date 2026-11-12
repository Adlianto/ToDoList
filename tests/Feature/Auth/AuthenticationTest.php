<?php

use App\Enums\WorkspaceRole;
use App\Enums\WorkspaceType;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Database\QueryException;
use Inertia\Testing\AssertableInertia as Assert;

describe('Authentication and Personal Workspace Provisioning', function () {
    test('guests are redirected to login when accessing dashboard', function () {
        $this->get(route('dashboard'))
            ->assertRedirect(route('login'));
    });

    test('login and register pages can be rendered for guests', function () {
        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('auth/login'));

        $this->get(route('register'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('auth/register'));
    });

    test('new users can register and receive exactly one personal workspace atomically', function () {
        $response = $this->post(route('register.store'), [
            'name' => 'Budi Santoso',
            'email' => 'Budi@Example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();

        $user = User::query()->where('email', 'budi@example.com')->firstOrFail();

        expect($user->name)->toBe('Budi Santoso')
            ->and($user->account_id)->toMatch('/^[1-9][0-9]{8}$/')
            ->and(strlen($user->account_id))->toBe(9);

        $personalWorkspaces = Workspace::query()
            ->where('owner_id', $user->id)
            ->where('type', WorkspaceType::Personal)
            ->get();

        expect($personalWorkspaces)->toHaveCount(1);

        $personalWorkspace = $personalWorkspaces->firstOrFail();
        expect($personalWorkspace->personal_owner_id)->toBe($user->id)
            ->and($personalWorkspace->name)->toBe('Personal Workspace');

        $membership = WorkspaceMember::query()
            ->where('workspace_id', $personalWorkspace->id)
            ->where('user_id', $user->id)
            ->first();

        expect($membership)->not->toBeNull()
            ->and($membership?->role)->toBe(WorkspaceRole::Owner);
    });

    test('registration validates unique email and required fields without username', function () {
        User::factory()->create([
            'email' => 'taken@example.com',
        ]);

        $this->post(route('register.store'), [
            'name' => 'Another User',
            'email' => 'taken@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertSessionHasErrors(['email']);

        $this->post(route('register.store'), [
            'name' => '',
            'email' => 'valid@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertSessionHasErrors(['name']);
    });

    test('ensurePersonalWorkspace is idempotent and database prevents duplicate personal workspaces', function () {
        $user = User::factory()->withPersonalWorkspace()->create();

        $first = $user->ensurePersonalWorkspace();
        $second = $user->ensurePersonalWorkspace();

        expect($first->id)->toBe($second->id)
            ->and(Workspace::query()->where('personal_owner_id', $user->id)->count())->toBe(1);

        expect(function () use ($user): void {
            $duplicate = new Workspace([
                'name' => 'Duplicate Personal',
                'type' => WorkspaceType::Personal,
            ]);
            $duplicate->owner_id = $user->id;
            $duplicate->personal_owner_id = $user->id;
            $duplicate->save();
        })->toThrow(QueryException::class);
    });

    test('users can authenticate and logout', function () {
        $user = User::factory()->withPersonalWorkspace()->create([
            'email' => 'member@example.com',
            'password' => 'secret-password',
        ]);

        $this->post(route('login.store'), [
            'email' => 'member@example.com',
            'password' => 'secret-password',
        ])->assertRedirect(route('dashboard'));

        $this->assertAuthenticatedAs($user);

        $this->post(route('logout'))
            ->assertRedirect(route('login'));

        $this->assertGuest();
    });

    test('users cannot authenticate with invalid password and login is rate limited', function () {
        $user = User::factory()->create([
            'email' => 'rate@example.com',
            'password' => 'correct-password',
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->post(route('login.store'), [
                'email' => $user->email,
                'password' => 'wrong-password',
            ])->assertSessionHasErrors('email');
        }

        $this->post(route('login.store'), [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(429);
    });

    test('dashboard only displays workspaces belonging to the authenticated user', function () {
        $userA = User::factory()->withPersonalWorkspace()->create(['name' => 'User A']);
        $userB = User::factory()->withPersonalWorkspace()->create(['name' => 'User B']);

        $this->actingAs($userA)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('personalWorkspace.id', $userA->personalWorkspace->id)
                ->has('workspaces', 1)
                ->where('workspaces.0.id', $userA->personalWorkspace->id)
            );

        expect($userA->personalWorkspace->id)->not->toBe($userB->personalWorkspace->id);
    });

    test('authenticated user inertia shared auth data provides account_id and omits email and username', function () {
        $user = User::factory()->withPersonalWorkspace()->create();

        expect($user->account_id)->toMatch('/^[1-9][0-9]{8}$/');

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.user.id', $user->id)
                ->where('auth.user.account_id', $user->account_id)
                ->where('auth.user.name', $user->name)
                ->missing('auth.user.username')
                ->missing('auth.user.email')
            );
    });

    test('createWithUniqueAccountId safely retries when an account_id unique constraint collision occurs', function () {
        $existingUser = User::factory()->create([
            'account_id' => '123456789',
        ]);

        $attemptCount = 0;
        User::creating(function (User $user) use (&$attemptCount, $existingUser): void {
            $attemptCount++;
            if ($attemptCount === 1) {
                // Force a collision with existingUser on the first insert attempt
                $user->account_id = $existingUser->account_id;
            }
        });

        $newUser = User::createWithUniqueAccountId([
            'name' => 'Collision Retry User',
            'email' => 'collision@example.com',
            'password' => 'password123',
        ]);

        expect($attemptCount)->toBe(2)
            ->and($newUser->exists)->toBeTrue()
            ->and($newUser->account_id)->not->toBe($existingUser->account_id)
            ->and($newUser->account_id)->toMatch('/^[1-9][0-9]{8}$/');
    });
});
