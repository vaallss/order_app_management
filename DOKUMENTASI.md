# Dokumentasi Dapur Ina Aina

> Catatan ini menjelaskan fungsi kode aplikasi dan bisa dipakai sebagai bahan presentasi atau tanya jawab.

## Gambaran sederhana

```text
React (halaman dan interaksi)
        ↓ request JSON dengan Axios
Laravel API (login, validasi, aturan bisnis)
        ↓ Eloquent ORM
MySQL: dapur_aina
```

Frontend dan backend dijalankan terpisah. React menampilkan aplikasi di port 5173, Laravel menyediakan API di port 8000, dan Laravel membaca konfigurasi MySQL dari `backend/.env`.

## Role dan izin

| Pengguna | Yang bisa dilakukan |
| --- | --- |
| Pelanggan | Melihat menu, membuat pesanan sebagai tamu, melihat invoice dan progres pesanan. Tidak perlu akun. |
| Kasir | Login dengan akun sendiri, melihat dashboard pesanan masuk, mengonfirmasi pembayaran, dan memajukan status pesanan. Katalog dan keranjang disembunyikan. |
| Admin | Login dengan akun sendiri, mengelola produk dan melihat laporan. Dashboard operasional kasir tidak ditampilkan. |

Username menentukan role dari data `users`; pilihan role tidak dikirim dari form login. Laravel memeriksa role lagi di backend, jadi menyembunyikan tombol saja bukan pengamanan utamanya.

## Alur login staf

1. Form profil mengirim `username` dan `password` ke `POST /api/auth/login`.
2. `AuthController::login` mencari akun berdasarkan username dan memeriksa password yang tersimpan dalam bentuk hash.
3. Sanctum membuat token akses. Frontend menyimpan token di `sessionStorage` dan Axios mengirimkannya sebagai `Authorization: Bearer ...`.
4. Role dari API menentukan dashboard awal: `admin` ke panel admin, `kasir` ke dashboard pesanan.
5. `POST /api/auth/logout` menghapus token aktif. `GET /api/auth/me` memeriksa akun untuk sesi yang masih tersimpan.

Akun lokal saat ini: `admin` dan `kasir`, password `123`. Ini akun pengembangan dengan password sederhana; ganti password sebelum aplikasi dipakai sungguhan.

## Alur pesanan

1. Frontend mengambil menu melalui `GET /api/products`.
2. Pelanggan memilih produk. Keranjang hanya disimpan di browser sebelum checkout.
3. Saat checkout, frontend mengirim nama, telepon, cara penyajian, metode pembayaran, ID produk, jumlah, dan catatan ke `POST /api/orders`.
4. `OrderController::store` memvalidasi data, mengambil harga dan stok dari database (bukan mempercayai total dari browser), menghitung PB1 10%, membuat transaksi, menyimpan rincian dan pembayaran, lalu mengurangi stok dalam satu transaksi database.
5. Invoice menggunakan kode transaksi acak. Pelanggan dapat melihatnya lewat kode dan nomor telepon pada `GET /api/orders/{kode}?phone=...`.
6. Kasir/admin mengambil daftar operasional dari `GET /api/orders`. Status hanya bisa maju satu tahap, dan pembayaran harus lunas lebih dulu.

Status pesanan: `Pending Confirmation` → `Diproses` → `Siap Disajikan` → `Selesai`.

Tombol hapus pada **Pesanan saya** hanya membuang invoice dari riwayat browser/perangkat tersebut. Baris transaksi di database tidak dihapus, sehingga riwayat penjualan tetap utuh.

## Tabel database

| Tabel | Fungsi |
| --- | --- |
| `users` | Akun staf, username, hash password, dan role. |
| `pelanggan` | Nama dan nomor telepon pemesan. Pelanggan saat ini checkout sebagai tamu, bukan membuat akun. |
| `produk` | Katalog, harga, stok, kategori, dan status aktif produk. |
| `transaksi` | Header pesanan: pelanggan, kode invoice, waktu, pajak, total, status, dan kasir. |
| `detail_transaksi` | Produk, jumlah, harga saat dipesan, dan catatan per item. Nama serta harga disalin agar invoice lama tetap benar saat katalog berubah. |
| `pembayaran` | Metode, status pembayaran, jumlah dibayar, uang diterima, dan kembalian. |
| `personal_access_tokens` | Token login Sanctum untuk staf. |

Tabel `cache`, `jobs`, dan `sessions` adalah infrastruktur Laravel; tabel tersebut bukan data menu atau transaksi restoran.

Relasi utama: satu pelanggan dapat punya banyak transaksi; satu transaksi punya banyak rincian dan satu pembayaran; setiap rincian mengacu ke satu produk. `RestaurantOrder`, `OrderItem`, `Payment`, `Customer`, dan `Product` mendefinisikan relasi ini untuk Eloquent.

## Endpoint penting

| Method dan URL | Kegunaan | Akses |
| --- | --- | --- |
| `POST /api/auth/login` | Login username/password | Publik, dibatasi percobaan |
| `GET /api/auth/me` | Membaca identitas sesi | Staf login |
| `POST /api/auth/logout` | Logout dan hapus token aktif | Staf login |
| `GET /api/products` | Melihat menu aktif | Publik |
| `POST /api/products` | Membuat produk | Admin |
| `PUT /api/products/{id}` | Mengubah produk | Admin |
| `DELETE /api/products/{id}` | Menonaktifkan produk dari katalog | Admin |
| `POST /api/orders` | Checkout pelanggan | Publik |
| `GET /api/orders/{kode}?phone=...` | Melihat invoice dan progres | Kode + nomor telepon |
| `GET /api/orders` | Melihat daftar pesanan | Kasir/admin |
| `PATCH /api/orders/{kode}` | Memajukan status pesanan | Kasir/admin |
| `POST /api/orders/{kode}/payment` | Mencatat/verifikasi pembayaran | Kasir/admin |

`RequireRole` adalah middleware yang menolak request jika pengguna tidak login atau role-nya tidak sesuai. Token tanpa izin akan mendapat HTTP 403.

## File yang perlu dikenal

### Frontend

- `frontend/src/App.jsx`: halaman utama dan alur UI. `login` mengirim kredensial; `submitOrder` checkout; `advanceOrder` memperbarui progres; `recordPayment` mengonfirmasi pembayaran; `saveProduct`/`deleteProduct` mengelola katalog; `deleteOrderFromHistory` membuang invoice dari daftar lokal perangkat.
- `frontend/src/services/api.js`: konfigurasi Axios, alamat dasar API, dan penambahan bearer token otomatis.
- `frontend/src/main.jsx`: memasang React ke halaman HTML dan mendaftarkan service worker ketika production.
- `frontend/src/App.css`, `customer.css`, `auth.css`, `print.css`: tampilan umum, pelanggan, login, dan cetak invoice.
- `frontend/src/App.jsx`: menyimpan katalog contoh `seedProducts` untuk mode lokal dan mengatur seluruh alur tampilan.
- `frontend/.env.local`: memilih mode API dan URL backend. File ini dibuat dari `frontend/.env.example` dan tidak perlu disimpan ke Git.

### Backend

- `backend/routes/api.php`: daftar URL API dan middleware yang mengunci tiap role.
- `backend/app/Http/Controllers/Api/AuthController.php`: login, profil sesi, logout, dan bentuk data pengguna yang dikirim ke frontend.
- `backend/app/Http/Controllers/Api/ProductController.php`: baca, buat, ubah, nonaktifkan, serta pemetaan nama field API ke kolom produk.
- `backend/app/Http/Controllers/Api/OrderController.php`: checkout, invoice, daftar pesanan, pembayaran, perubahan status, dan pemetaan data transaksi untuk frontend.
- `backend/app/Http/Middleware/RequireRole.php`: pemeriksaan izin berbasis role.
- `backend/app/Models`: hubungan Laravel ke tabel user, produk, pelanggan, transaksi, rincian, dan pembayaran.
- `backend/database/migrations`: definisi tabel. Migration dijalankan dengan `php artisan migrate` dan tidak mengganti data pesanan yang ada.
- `backend/app/Console/Commands/CreateStaffUser.php`: membuat akun staf baru melalui `php artisan staff:create`.
- `backend/config/cors.php`: mengizinkan frontend lokal mengakses API.

## Pertanyaan yang mungkin muncul

**Kenapa checkout memakai transaksi database?**
Supaya pembuatan transaksi, rincian, pembayaran, dan pengurangan stok berhasil bersama-sama atau dibatalkan bersama-sama jika ada kesalahan.

**Kenapa stok dikunci saat checkout?**
`lockForUpdate()` mencegah dua checkout bersamaan membaca stok yang sama lalu menjual stok melebihi jumlah tersedia.

**Kenapa harga dihitung lagi di backend?**
Browser bisa dimodifikasi. Backend memakai harga di tabel `produk`, jadi total invoice tidak bergantung pada angka kiriman frontend.

**Kenapa produk dihapus dengan cara dinonaktifkan?**
Detail transaksi lama masih merujuk ke produk. Menonaktifkan produk menyembunyikannya dari menu baru tetapi menjaga invoice lama.

**Apa beda autentikasi dan otorisasi?**
Autentikasi memastikan siapa yang login (token Sanctum). Otorisasi memastikan apa yang boleh dilakukan (role dan `RequireRole`).

**Apakah pelanggan punya akun?**
Belum. Pelanggan checkout sebagai tamu dan memakai kode invoice serta nomor telepon untuk melihat progres. Login akun terpisah saat ini untuk admin dan kasir.

## Menjalankan aplikasi

### Persiapan backend

Salin `backend/.env.example` menjadi `backend/.env`, lalu pastikan MySQL Laragon aktif dan database `dapur_aina` sudah dibuat. Jalankan perintah berikut dari folder `backend`:

```powershell
composer install
php artisan key:generate
php artisan migrate
php artisan staff:create
```

Perintah `staff:create` akan meminta nama, username, role, dan password untuk akun `admin` atau `kasir`. Akun staf tidak dibuat melalui halaman publik.

### Persiapan frontend

Salin `frontend/.env.example` menjadi `frontend/.env.local`. Untuk memakai Laravel API, isi nilainya seperti ini:

```dotenv
VITE_API_URL=http://localhost:8000/api
VITE_DATA_SOURCE=api
```

Untuk mode demo tanpa database, gunakan `VITE_DATA_SOURCE=local`. Mode ini memakai katalog contoh dan menyimpan pesanan di `localStorage` browser.

### Menjalankan server

Buka dua terminal dari folder proyek:

```powershell
cd backend
php artisan serve
```

```powershell
cd frontend
npm install
npm run dev
```

Pastikan MySQL Laragon aktif dan `.env` backend memakai database `dapur_aina`. Buka alamat yang ditampilkan Vite, biasanya `http://localhost:5173`.
