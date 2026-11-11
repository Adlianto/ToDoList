<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate all existing user account_ids to 9-digit numeric format
        $users = User::query()->orderBy('id')->get();
        $assignedIds = [];

        foreach ($users as $user) {
            do {
                $newId = (string) random_int(100000000, 999999999);
            } while (
                in_array($newId, $assignedIds, true) ||
                DB::table('users')->where('account_id', $newId)->exists()
            );

            $assignedIds[] = $newId;

            DB::table('users')
                ->where('id', $user->id)
                ->update(['account_id' => $newId]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to prefix format if rolled back
        $users = User::query()->orderBy('id')->get();
        $assignedIds = [];

        foreach ($users as $user) {
            do {
                $oldFormatId = 'usr_'.bin2hex(random_bytes(6));
            } while (
                in_array($oldFormatId, $assignedIds, true) ||
                DB::table('users')->where('account_id', $oldFormatId)->exists()
            );

            $assignedIds[] = $oldFormatId;

            DB::table('users')
                ->where('id', $user->id)
                ->update(['account_id' => $oldFormatId]);
        }
    }
};
