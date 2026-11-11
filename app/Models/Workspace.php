<?php

namespace App\Models;

use App\Enums\WorkspaceRole;
use App\Enums\WorkspaceType;
use Database\Factories\WorkspaceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property WorkspaceType $type
 * @property int $owner_id
 * @property int|null $personal_owner_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read int|null $members_count
 * @property-read int|null $tasks_count
 * @property-read Pivot|null $pivot
 * @property-read User $owner
 * @property-read Collection<int, User> $members
 * @property-read Collection<int, WorkspaceMember> $memberships
 * @property-read Collection<int, Invitation> $invitations
 * @property-read Collection<int, Task> $tasks
 */
#[Fillable(['name', 'type'])]
class Workspace extends Model
{
    /** @use HasFactory<WorkspaceFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => WorkspaceType::class,
        ];
    }

    /**
     * Get the owner of the workspace.
     *
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the membership records for the workspace.
     *
     * @return HasMany<WorkspaceMember, $this>
     */
    public function memberships(): HasMany
    {
        return $this->hasMany(WorkspaceMember::class, 'workspace_id');
    }

    /**
     * Get the users that belong to the workspace.
     *
     * @return BelongsToMany<User, $this>
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'workspace_members')
            ->withPivot(['role', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * Get the invitations for the workspace.
     *
     * @return HasMany<Invitation, $this>
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(Invitation::class, 'workspace_id');
    }

    /**
     * Get the tasks belonging to the workspace.
     *
     * @return HasMany<Task, $this>
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'workspace_id');
    }

    /**
     * Determine if the workspace is a personal workspace.
     */
    public function isPersonal(): bool
    {
        return $this->type === WorkspaceType::Personal;
    }

    /**
     * Determine if the workspace is a group workspace.
     */
    public function isGroup(): bool
    {
        return $this->type === WorkspaceType::Group;
    }

    /**
     * Get the role of a specific user in this workspace.
     */
    public function getMemberRole(User $user): ?WorkspaceRole
    {
        $membership = $this->memberships()
            ->where('user_id', $user->id)
            ->first();

        return $membership?->role;
    }

    /**
     * Check if the given user is a member of this workspace.
     */
    public function hasMember(User $user): bool
    {
        return $this->memberships()
            ->where('user_id', $user->id)
            ->exists();
    }

    /**
     * Resolve a child route binding for scoped bindings.
     *
     * @param  string  $childType
     * @param  mixed  $value
     * @param  string|null  $field
     * @return Model|null
     */
    public function resolveChildRouteBinding($childType, $value, $field)
    {
        if ($childType === 'member') {
            return $this->memberships()->where($field ?? 'id', $value)->first();
        }

        return parent::resolveChildRouteBinding($childType, $value, $field);
    }
}
