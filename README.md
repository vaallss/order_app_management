# ⚡ LSP Decoupled Starter Stack

Starter template bersih (kosongan) untuk proyek **LSP**:
- **Frontend**: React JS (Vite + Tailwind CSS v4 + Axios)
- **Backend**: Laravel 11 REST API (PHP)
- **Database**: MySQL

---

## 📁 Struktur Folder

```text
LSP/
├── frontend/             # React JS (Vite + Tailwind CSS v4)
│   ├── src/
│   │   ├── components/   # Simpan komponen UI kamu di sini
│   │   ├── pages/        # Simpan halaman web kamu di sini
│   │   ├── services/
│   │   │   └── api.js    # Client Axios terkonfigurasi ke http://localhost:8000/api
│   │   ├── App.jsx       # Canvas awal ngoding
│   │   ├── index.css     # Setup Tailwind CSS
│   │   └── main.jsx
│   └── package.json
│
├── backend/              # Laravel 11 REST API
│   ├── app/
│   │   ├── Http/Controllers/ # Taruh Controller API kamu di sini
│   │   └── Models/           # Taruh Eloquent Model di sini
│   ├── database/
│   │   ├── migrations/       # Taruh migration tabel DB di sini
│   │   └── seeders/          # Database seeder
│   ├── routes/
│   │   └── api.php           # Daftarkan endpoint REST API di sini
│   ├── config/cors.php       # CORS sudah diset allow origin dari React
│   ├── .env                  # Konfigurasi database MySQL
│   └── composer.json
│
└── README.md
```

---

## 🚀 Cara Menjalankan

### Frontend (React):
```bash
cd frontend
npm run dev
```
Akses di: `http://localhost:5173`

### Backend (Laravel):
```bash
cd backend
composer install
php artisan serve
```
API endpoint di: `http://localhost:8000/api`
