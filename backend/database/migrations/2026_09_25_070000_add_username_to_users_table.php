<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('username', 80)->nullable()->after('name');
            });
        }

        DB::table('users')->whereNull('username')->orderBy('id')->each(function ($user) {
            $base = strtolower((string) str($user->email)->before('@')->replaceMatches('/[^a-z0-9_-]/', ''));
            $base = $base !== '' ? $base : 'user'.$user->id;
            $username = $base;
            $suffix = 1;

            while (DB::table('users')->where('username', $username)->exists()) {
                $username = $base.'_'.$suffix++;
            }

            DB::table('users')->where('id', $user->id)->update(['username' => $username]);
        });

        $indexes = collect(Schema::getIndexes('users'))->pluck('name');
        if (! $indexes->contains('users_username_unique')) {
            Schema::table('users', fn (Blueprint $table) => $table->unique('username'));
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_username_unique');
                $table->dropColumn('username');
            });
        }
    }
};
