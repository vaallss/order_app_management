# Dapur Ina Aina

Aplikasi pemesanan restoran dengan React/Vite, Laravel API, dan MySQL.

Untuk memahami alur aplikasi, tabel, endpoint, dan fungsi file sebelum presentasi, baca [DOKUMENTASI.md](DOKUMENTASI.md).

## Menjalankan lokal

Pastikan PHP 8.3, Composer, Node.js, dan MySQL Laragon tersedia. `backend/.env` harus menunjuk ke database `dapur_aina`. Persiapan pertama kali:

```powershell
cd backend
composer install
php artisan migrate
cd ..\frontend
npm install
```

Setelah itu, buka dua terminal VS Code dari folder proyek:

```powershell
cd backend
php artisan serve
```

```powershell
cd frontend
npm run dev
```

Buka alamat Vite yang muncul di terminal, biasanya `http://localhost:5173`.

Login staf lokal: `admin` / `123` dan `kasir` / `123`. Ganti password sederhana ini sebelum aplikasi dipakai online.
