<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\OAuthController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InvitationController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\WorkspaceController;
use App\Http\Controllers\WorkspaceInvitationController;
use App\Http\Controllers\WorkspaceMemberController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware('guest')->group(function (): void {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])
        ->middleware('throttle:login')
        ->name('login.store');

    Route::get('/register', [RegisteredUserController::class, 'create'])->name('register');
    Route::post('/register', [RegisteredUserController::class, 'store'])
        ->middleware('throttle:register')
        ->name('register.store');

    Route::get('/auth/google', [OAuthController::class, 'redirectToGoogle'])
        ->middleware('throttle:oauth')
        ->name('auth.google.redirect');
    Route::get('/auth/google/callback', [OAuthController::class, 'handleGoogleCallback'])
        ->middleware('throttle:oauth')
        ->name('auth.google.callback');

    Route::get('/forgot-password', [PasswordResetLinkController::class, 'create'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:password-reset')
        ->name('password.email');

    Route::get('/reset-password/{token}', [NewPasswordController::class, 'create'])->name('password.reset');
    Route::post('/reset-password', [NewPasswordController::class, 'store'])
        ->middleware('throttle:password-reset')
        ->name('password.update');
});

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    Route::get('/settings/password', [PasswordController::class, 'edit'])
        ->name('password.edit');
    Route::put('/password', [PasswordController::class, 'update'])
        ->name('password.change');

    Route::get('/verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');
    Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/workspaces', [WorkspaceController::class, 'index'])->name('workspaces.index');
    Route::get('/workspaces/create', [WorkspaceController::class, 'create'])->name('workspaces.create');
    Route::post('/workspaces', [WorkspaceController::class, 'store'])->name('workspaces.store');
    Route::get('/workspaces/{workspace}', [WorkspaceController::class, 'show'])->name('workspaces.show');
    Route::patch('/workspaces/{workspace}', [WorkspaceController::class, 'update'])->name('workspaces.update');
    Route::delete('/workspaces/{workspace}', [WorkspaceController::class, 'destroy'])->name('workspaces.destroy');

    Route::scopeBindings()->group(function (): void {
        Route::post('/workspaces/{workspace}/invitations', [WorkspaceInvitationController::class, 'store'])
            ->middleware('throttle:invitations')
            ->name('workspaces.invitations.store');
        Route::delete('/workspaces/{workspace}/invitations/{invitation}', [WorkspaceInvitationController::class, 'destroy'])
            ->name('workspaces.invitations.destroy');

        Route::post('/workspaces/{workspace}/tasks', [TaskController::class, 'store'])
            ->name('workspaces.tasks.store');
        Route::patch('/workspaces/{workspace}/tasks/bulk-update', [TaskController::class, 'bulkUpdate'])
            ->name('workspaces.tasks.bulk-update');
        Route::patch('/workspaces/{workspace}/tasks/{task}', [TaskController::class, 'update'])
            ->name('workspaces.tasks.update');
        Route::delete('/workspaces/{workspace}/tasks/{task}', [TaskController::class, 'destroy'])
            ->name('workspaces.tasks.destroy');

        Route::patch('/workspaces/{workspace}/members/{member}', [WorkspaceMemberController::class, 'update'])
            ->name('workspaces.members.update');
        Route::delete('/workspaces/{workspace}/members/{member}', [WorkspaceMemberController::class, 'destroy'])
            ->name('workspaces.members.destroy');
        Route::post('/workspaces/{workspace}/leave', [WorkspaceMemberController::class, 'leave'])
            ->name('workspaces.leave');
    });

    Route::get('/invitations', [InvitationController::class, 'index'])->name('invitations.index');
    Route::post('/invitations/join-code', [InvitationController::class, 'acceptByCode'])
        ->middleware('throttle:invitations')
        ->name('invitations.join-code');
    Route::post('/invitations/{invitation}/accept', [InvitationController::class, 'accept'])
        ->middleware('throttle:invitations')
        ->name('invitations.accept');
    Route::post('/invitations/{invitation}/decline', [InvitationController::class, 'decline'])
        ->name('invitations.decline');
});
