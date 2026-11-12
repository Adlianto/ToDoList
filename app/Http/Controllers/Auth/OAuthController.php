<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Throwable;

class OAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        /** @var GoogleProvider $driver */
        $driver = Socialite::driver('google');

        return $driver->redirect();
    }

    /**
     * Handle callback from Google OAuth.
     */
    public function handleGoogleCallback(Request $request): RedirectResponse
    {
        try {
            /** @var SocialiteUser $googleUser */
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            Log::warning('Google OAuth callback failed', [
                'error' => $e->getMessage(),
            ]);

            return redirect()->route('login')->withErrors([
                'email' => 'Unable to authenticate with Google. Please try again.',
            ]);
        }

        $googleId = (string) $googleUser->getId();
        $email = Str::lower(trim((string) $googleUser->getEmail()));

        if ($googleId === '' || $email === '') {
            return redirect()->route('login')->withErrors([
                'email' => 'Unable to retrieve your email address from Google.',
            ]);
        }

        /** @var User $user */
        $user = DB::transaction(function () use ($googleUser, $googleId, $email): User {
            /** @var User|null $existingUser */
            $existingUser = User::query()
                ->where('google_id', $googleId)
                ->orWhere('email', $email)
                ->first();

            if ($existingUser) {
                if ($existingUser->google_id !== $googleId) {
                    $existingUser->google_id = $googleId;
                }

                if ($existingUser->email_verified_at === null) {
                    $existingUser->email_verified_at = now();
                }

                $existingUser->save();
                $existingUser->ensurePersonalWorkspace();

                return $existingUser;
            }

            $name = trim((string) ($googleUser->getName() ?: $googleUser->getNickname() ?: Str::before($email, '@')));
            if ($name === '') {
                $name = 'User';
            }

            $newUser = User::createWithUniqueAccountId([
                'name' => Str::substr($name, 0, 100),
                'email' => $email,
                'google_id' => $googleId,
                'password' => null,
            ]);

            $newUser->email_verified_at = now();
            $newUser->save();

            $newUser->ensurePersonalWorkspace();

            event(new Registered($newUser));

            return $newUser;
        });

        Auth::login($user, remember: true);

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }
}
