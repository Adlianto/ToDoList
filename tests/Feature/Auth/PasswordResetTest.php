<?php

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;

describe('Password Reset and Update Flow', function () {
    test('forgot password page can be rendered', function () {
        $this->get(route('password.request'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('auth/forgot-password'));
    });

    test('reset password link can be requested', function () {
        $user = User::factory()->create([
            'email' => 'resetme@example.com',
        ]);

        $response = $this->post(route('password.email'), [
            'email' => 'resetme@example.com',
        ]);

        $response->assertSessionHas('status');
    });

    test('reset password screen can be rendered with token', function () {
        $this->get(route('password.reset', ['token' => 'test-token', 'email' => 'user@example.com']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('auth/reset-password')
                ->where('token', 'test-token')
                ->where('email', 'user@example.com')
            );
    });

    test('password can be reset with valid token', function () {
        Event::fake([PasswordReset::class]);

        $user = User::factory()->create([
            'email' => 'user@example.com',
            'password' => 'old-password123',
        ]);

        $token = Password::createToken($user);

        $response = $this->post(route('password.update'), [
            'token' => $token,
            'email' => 'user@example.com',
            'password' => 'new-secret-password123',
            'password_confirmation' => 'new-secret-password123',
        ]);

        $response->assertRedirect(route('login'));
        $response->assertSessionHas('status');

        $user->refresh();
        expect(Hash::check('new-secret-password123', (string) $user->password))->toBeTrue();

        Event::assertDispatched(PasswordReset::class);
    });

    test('authenticated user can view password settings and update password', function () {
        $user = User::factory()->withPersonalWorkspace()->create([
            'password' => 'current-secret123',
        ]);

        $this->actingAs($user)
            ->get(route('password.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/password')
                ->where('hasPassword', true)
            );

        $response = $this->actingAs($user)
            ->put(route('password.change'), [
                'current_password' => 'current-secret123',
                'password' => 'brand-new-secret-pass123',
                'password_confirmation' => 'brand-new-secret-pass123',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('status', 'password-updated');

        $user->refresh();
        expect(Hash::check('brand-new-secret-pass123', (string) $user->password))->toBeTrue();
    });

    test('google user without password can set password without current_password', function () {
        $user = User::factory()->withPersonalWorkspace()->create([
            'google_id' => 'google-user-id',
            'password' => null,
        ]);

        $this->actingAs($user)
            ->get(route('password.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/password')
                ->where('hasPassword', false)
            );

        $response = $this->actingAs($user)
            ->put(route('password.change'), [
                'current_password' => null,
                'password' => 'newly-created-pass123',
                'password_confirmation' => 'newly-created-pass123',
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('status', 'password-updated');

        $user->refresh();
        expect(Hash::check('newly-created-pass123', (string) $user->password))->toBeTrue();
    });
});
