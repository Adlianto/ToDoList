<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('account_id', 32)->nullable()->unique()->after('id');
        });

        // Backfill existing users with unique account_ids
        $users = User::query()->whereNull('account_id')->get();
        foreach ($users as $user) {
            $user->account_id = User::generateUniqueAccountId();
            $user->saveQuietly();
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('account_id');
        });
    }
};
