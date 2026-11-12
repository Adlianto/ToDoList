<?php

use App\Enums\WorkspaceRole;
use App\Enums\WorkspaceType;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;

describe('Google OAuth Flow', function () {
    test('guest can redirect to Google OAuth', function () {
        $response = $this->get(route('auth.google.redirect'));

        $response->assertRedirect();
        expect($response->headers->get('Location'))->toContain('accounts.google.com');
    });

    test('new user is atomically registered with personal workspace on google callback', function () {
        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-unique-id-12345');
        $googleUser->shouldReceive('getEmail')->andReturn('googleuser@example.com');
        $googleUser->shouldReceive('getName')->andReturn('Google User');
        $googleUser->shouldReceive('getNickname')->andReturn('guser');

        $provider = Mockery::mock(GoogleProvider::class);
        $provider->shouldReceive('user')->andReturn($googleUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticated();

        $user = User::query()->where('email', 'googleuser@example.com')->firstOrFail();
        expect($user->google_id)->toBe('google-unique-id-12345')
            ->and($user->email_verified_at)->not->toBeNull()
            ->and($user->name)->toBe('Google User')
            ->and($user->account_id)->toMatch('/^[1-9][0-9]{8}$/');

        $personalWorkspace = Workspace::query()
            ->where('owner_id', $user->id)
            ->where('type', WorkspaceType::Personal)
            ->first();

        expect($personalWorkspace)->not->toBeNull()
            ->and($personalWorkspace?->personal_owner_id)->toBe($user->id);

        $membership = WorkspaceMember::query()
            ->where('workspace_id', $personalWorkspace?->id)
            ->where('user_id', $user->id)
            ->first();

        expect($membership?->role)->toBe(WorkspaceRole::Owner);
    });

    test('existing user by email links google_id and signs in', function () {
        $existing = User::factory()->withPersonalWorkspace()->create([
            'email' => 'existing@example.com',
            'google_id' => null,
        ]);

        $googleUser = Mockery::mock(SocialiteUser::class);
        $googleUser->shouldReceive('getId')->andReturn('google-id-linked-999');
        $googleUser->shouldReceive('getEmail')->andReturn('existing@example.com');
        $googleUser->shouldReceive('getName')->andReturn('Existing User');
        $googleUser->shouldReceive('getNickname')->andReturn(null);

        $provider = Mockery::mock(GoogleProvider::class);
        $provider->shouldReceive('user')->andReturn($googleUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($existing);

        $existing->refresh();
        expect($existing->google_id)->toBe('google-id-linked-999')
            ->and($existing->email_verified_at)->not->toBeNull();
    });

    test('oauth callback gracefully redirects with error when google fails', function () {
        $provider = Mockery::mock(GoogleProvider::class);
        $provider->shouldReceive('user')->andThrow(new Exception('OAuth provider failure'));

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get(route('auth.google.callback'));

        $response->assertRedirect(route('login'));
        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    });
});
