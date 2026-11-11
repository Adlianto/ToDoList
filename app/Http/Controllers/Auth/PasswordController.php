<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class PasswordController extends Controller
{
    /**
     * Display the password settings view.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/password', [
            'hasPassword' => $request->user()?->password !== null,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's password.
     */
    public function update(UpdatePasswordRequest $request): RedirectResponse
    {
        /** @var array{password: string} $validated */
        $validated = $request->validated();

        /** @var User $user */
        $user = $request->user();

        $user->forceFill([
            'password' => Hash::make($validated['password']),
        ])->save();

        return back()->with('status', 'password-updated');
    }
}
