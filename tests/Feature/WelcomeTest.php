<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

describe('Welcome Landing Page', function () {
    test('guest can render the landing page', function () {
        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('auth.user', null)
            );
    });

    test('authenticated user can view landing page with auth state', function () {
        $user = User::factory()->withPersonalWorkspace()->create([
            'name' => 'Budi Pratama',
        ]);

        $this->actingAs($user)
            ->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('welcome')
                ->where('auth.user.id', $user->id)
                ->where('auth.user.account_id', $user->account_id)
                ->where('auth.user.name', 'Budi Pratama')
                ->missing('auth.user.username')
            );
    });
});
