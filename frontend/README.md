# Frontend

React dan Vite untuk menu pelanggan, dashboard staf, katalog admin, laporan, serta invoice. Referensi fungsi dan alur data ada di [dokumentasi utama](../DOKUMENTASI.md).

Jalankan `npm install` sekali, lalu `npm run dev`. Konfigurasi lokal di `.env.local` memilih backend melalui `VITE_DATA_SOURCE=api` dan `VITE_API_URL=http://localhost:8000/api`.

Untuk mode tanpa API, atur `VITE_DATA_SOURCE=local`. Mode tersebut memakai katalog contoh dan menyimpan pesanan di localStorage browser.
