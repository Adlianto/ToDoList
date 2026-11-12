<?php

namespace App\Models;

use App\Enums\WorkspaceRole;
use App\Enums\WorkspaceType;
use Carbon\CarbonImmutable;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $account_id
 * @property string $name
 * @property string $email
 * @property string|null $google_id
 * @property CarbonImmutable|Carbon|null $email_verified_at
 * @property string|null $password
 * @property string|null $remember_token
 * @property CarbonImmutable|Carbon|null $created_at
 * @property CarbonImmutable|Carbon|null $updated_at
 * @property-read Workspace|null $personalWorkspace
 * @property-read Collection<int, Workspace> $ownedWorkspaces
 * @property-read Collection<int, Workspace> $workspaces
 * @property-read Collection<int, WorkspaceMember> $workspaceMemberships
 * @property-read Collection<int, Invitation> $receivedInvitations
 * @property-read Collection<int, Task> $createdTasks
 */
#[Fillable(['account_id', 'name', 'email', 'google_id', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function (User $user): void {
            if (empty($user->account_id)) {
                $user->account_id = static::generateUniqueAccountId();
            }
        });
    }

    /**
     * Generate a unique, public-safe 9-digit numeric Account ID (100000000 to 999999999).
     */
    public static function generateUniqueAccountId(): string
    {
        do {
            $candidate = (string) random_int(100000000, 999999999);
        } while (static::query()->where('account_id', $candidate)->exists());

        return $candidate;
    }

    /**
     * Create a new user while safely retrying if a concurrent Account ID collision occurs.
     *
     * @param  array<string, mixed>  $attributes
     */
    public static function createWithUniqueAccountId(array $attributes, int $maxAttempts = 5): static
    {
        $attempt = 0;

        while (true) {
            $attempt++;

            try {
                unset($attributes['account_id']);

                /** @var static $user */
                $user = static::query()->create($attributes);

                return $user;
            } catch (UniqueConstraintViolationException $e) {
                if ($attempt >= $maxAttempts || ! str_contains(strtolower($e->getMessage()), 'account_id')) {
                    throw $e;
                }
            }
        }
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the user's single personal workspace.
     *
     * @return HasOne<Workspace, $this>
     */
    public function personalWorkspace(): HasOne
    {
        return $this->hasOne(Workspace::class, 'personal_owner_id');
    }

    /**
     * Get all workspaces owned by the user.
     *
     * @return HasMany<Workspace, $this>
     */
    public function ownedWorkspaces(): HasMany
    {
        return $this->hasMany(Workspace::class, 'owner_id');
    }

    /**
     * Get all workspace memberships for the user.
     *
     * @return HasMany<WorkspaceMember, $this>
     */
    public function workspaceMemberships(): HasMany
    {
        return $this->hasMany(WorkspaceMember::class, 'user_id');
    }

    /**
     * Get all workspaces the user belongs to.
     *
     * @return BelongsToMany<Workspace, $this>
     */
    public function workspaces(): BelongsToMany
    {
        return $this->belongsToMany(Workspace::class, 'workspace_members')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * Get invitations sent directly to this user.
     *
     * @return HasMany<Invitation, $this>
     */
    public function receivedInvitations(): HasMany
    {
        return $this->hasMany(Invitation::class, 'invitee_id');
    }

    /**
     * Get tasks created by this user.
     *
     * @return HasMany<Task, $this>
     */
    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'created_by');
    }

    /**
     * Provision the default personal workspace for the user if not already present.
     */
    public function ensurePersonalWorkspace(): Workspace
    {
        $existing = $this->personalWorkspace()->first();

        if ($existing instanceof Workspace) {
            return $existing;
        }

        $workspace = new Workspace([
            'name' => 'Personal Workspace',
            'type' => WorkspaceType::Personal,
        ]);
        $workspace->owner_id = $this->id;
        $workspace->personal_owner_id = $this->id;
        $workspace->save();

        WorkspaceMember::query()->firstOrCreate(
            [
                'workspace_id' => $workspace->id,
                'user_id' => $this->id,
            ],
            [
                'role' => WorkspaceRole::Owner,
                'joined_at' => now(),
            ],
        );

        return $workspace;
    }
}
