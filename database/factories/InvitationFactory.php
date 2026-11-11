<?php

namespace Database\Factories;

use App\Enums\InvitationStatus;
use App\Models\Invitation;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Invitation>
 */
class InvitationFactory extends Factory
{
    protected $model = Invitation::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'invited_by' => User::factory(),
            'invitee_id' => User::factory(),
            'token_hash' => Invitation::hashToken(Str::random(32)),
            'status' => InvitationStatus::Pending,
            'expires_at' => now()->addDays(7),
            'accepted_at' => null,
        ];
    }

    /**
     * Indicate that the invitation is a claimable code invitation (no specific invitee).
     */
    public function code(string $plainCode): static
    {
        return $this->state(fn (): array => [
            'invitee_id' => null,
            'token_hash' => Invitation::hashToken($plainCode),
        ]);
    }

    /**
     * Indicate that the invitation has expired.
     */
    public function expired(): static
    {
        return $this->state(fn (): array => [
            'expires_at' => now()->subHour(),
        ]);
    }

    /**
     * Indicate that the invitation has been revoked.
     */
    public function revoked(): static
    {
        return $this->state(fn (): array => [
            'status' => InvitationStatus::Revoked,
        ]);
    }
}
