<?php

namespace Database\Factories;

use App\Enums\WorkspaceRole;
use App\Enums\WorkspaceType;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Workspace>
 */
class WorkspaceFactory extends Factory
{
    protected $model = Workspace::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'type' => WorkspaceType::Group,
            'owner_id' => User::factory(),
            'personal_owner_id' => null,
        ];
    }

    /**
     * Indicate that the workspace is a personal workspace.
     */
    public function personal(?User $owner = null): static
    {
        return $this->state(function (array $attributes) use ($owner): array {
            $ownerId = $owner !== null ? $owner->id : $attributes['owner_id'];

            return [
                'name' => 'Personal Workspace',
                'type' => WorkspaceType::Personal,
                'owner_id' => $ownerId,
                'personal_owner_id' => $ownerId,
            ];
        })->afterCreating(function (Workspace $workspace): void {
            WorkspaceMember::query()->firstOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'user_id' => $workspace->owner_id,
                ],
                [
                    'role' => WorkspaceRole::Owner,
                    'joined_at' => now(),
                ],
            );
        });
    }

    /**
     * Configure the group workspace to automatically register its owner as a member.
     */
    public function withOwnerMembership(): static
    {
        return $this->afterCreating(function (Workspace $workspace): void {
            WorkspaceMember::query()->firstOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'user_id' => $workspace->owner_id,
                ],
                [
                    'role' => WorkspaceRole::Owner,
                    'joined_at' => now(),
                ],
            );
        });
    }
}
