# 🚀 CYBERSEARCH - Sistem Menu Digital

Sistem menu digital dengan pencarian fuzzy cerdas, didukung oleh **Neon.tech** (Serverless PostgreSQL).

## ✨ Fitur Utama

- 🔍 **Pencarian Fuzzy** - Toleransi kesalahan ketik dengan algoritma Levenshtein
- 💾 **Neon Database** - PostgreSQL serverless yang cepat dan scalable
- 🎨 **UI Cyberpunk** - Desain futuristik dengan animasi neon
- 🧮 **Calculator Built-in** - Kalkulator untuk hitung harga
- 📱 **Responsive** - Tampil sempurna di semua device
- ⚡ **Vercel Serverless** - Deploy cepat dengan Vercel
- 🔄 **CRUD Lengkap** - Tambah, Edit, Hapus menu
- 💿 **Cache Offline** - Data tetap tersedia saat offline

## 📁 Struktur Project

```
project/
├── index.html          # Halaman utama
├── style.css           # Styling
├── script.js           # Logic frontend
├── package.json        # Dependencies
├── database.sql        # Skema database
├── .env.example        # Template environment
├── README.md           # Dokumentasi
└── api/
    └── menu.js         # Vercel Serverless Function
```

## 🚀 Setup & Instalasi

### 1. Buat Database di Neon.tech

1. Daftar di [https://neon.tech](https://neon.tech) (gratis!)
2. Buat project baru
3. Buka **SQL Editor** di Neon Console
4. Copy-paste isi `database.sql` dan jalankan

### 2. Dapatkan Connection String

1. Di Neon Console, klik project Anda
2. Klik **"Connection Details"**
3. Copy **Connection string** (format: `postgresql://user:pass@host/db`)

### 3. Setup Environment Variable

Buat file `.env` di root project:

```bash
cp .env.example .env
```

Edit `.env` dan isi dengan connection string Neon:

```bash
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Jalankan Lokal

```bash
npm run dev
```

Buka `http://localhost:3000`

### 6. Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Tambahkan environment variable di Vercel Dashboard
# atau via CLI:
vercel env add DATABASE_URL
```

## 🔧 Konfigurasi Vercel

Pastikan di **Vercel Dashboard → Settings → Environment Variables** sudah ada:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Connection string dari Neon |

## 📡 API Endpoints

Serverless function menyediakan REST API:

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/menu` | Ambil semua menu |
| `POST` | `/api/menu` | Tambah menu baru |
| `PUT` | `/api/menu?id=X` | Update menu |
| `DELETE` | `/api/menu?id=X` | Hapus menu |

### Contoh Request

**Tambah Menu:**
```bash
curl -X POST https://your-app.vercel.app/api/menu \
  -H "Content-Type: application/json" \
  -d '{"title":"NASI GORENG","info":"Nasi goreng spesial"}'
```

**Update Menu:**
```bash
curl -X PUT "https://your-app.vercel.app/api/menu?id=1" \
  -H "Content-Type: application/json" \
  -d '{"title":"NASI GORENG BARU","info":"Deskripsi baru"}'
```

**Hapus Menu:**
```bash
curl -X DELETE "https://your-app.vercel.app/api/menu?id=1"
```

## 🔒 Keamanan

⚠️ **PENTING**: Jangan pernah commit `.env` ke Git!

Tambahkan ke `.gitignore`:
```
.env
node_modules/
.vercel/
```

## 🛠️ Troubleshooting

### Error: "DATABASE_URL is not defined"
- Pastikan file `.env` ada di root project
- Restart server setelah edit `.env`
- Di Vercel, tambahkan env var di Dashboard

### Error: "relation menu does not exist"
- Jalankan `database.sql` di Neon SQL Editor
- Pastikan connection string benar

### Data tidak muncul
- Cek browser console untuk error
- Pastikan API endpoint `/api/menu` bisa diakses
- Cek logs di Vercel Dashboard

## 📝 Lisensi

MIT License - Bebas digunakan dan dimodifikasi.

## 👨‍💻 Author

**Daniel** - CYBERSEARCH Engine v3.0.0

---

**Powered by** ⚡ Neon.tech + 🚀 Vercel
