<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateStaffUser extends Command
{
    protected $signature = 'staff:create';

    protected $description = 'Buat akun admin atau kasir';

    public function handle(): int
    {
        $name = trim((string) $this->ask('Nama staf'));
        $username = strtolower(trim((string) $this->ask('Username')));

        if ($name === '' || ! preg_match('/^[a-z0-9_-]{3,80}$/', $username)) {
            $this->error('Nama dan username (3-80 karakter: huruf, angka, _ atau -) wajib diisi.');

            return self::FAILURE;
        }

        if (User::query()->where('username', $username)->exists()) {
            $this->error('Username tersebut sudah dipakai.');

            return self::FAILURE;
        }

        $role = $this->choice('Role akun', ['kasir', 'admin'], 'kasir');
        $password = (string) $this->secret('Password');

        if ($password === '') {
            $this->error('Password wajib diisi.');

            return self::FAILURE;
        }

        User::query()->create([
            'name' => $name,
            'username' => $username,
            'email' => $username.'@dapur-aina.local',
            'password' => Hash::make($password),
            'role' => $role,
        ]);

        $this->info("Akun {$role} ({$username}) berhasil dibuat.");

        return self::SUCCESS;
    }
}
