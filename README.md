# Lost and Found Management System (LFMS)

Aplikasi web terintegrasi untuk pelaporan barang hilang, publikasi barang temuan, dan verifikasi klaim kepemilikan di lingkungan kampus dengan standar keamanan Cyber Security.

---

## 🛠️ Tech Stack & Hosting

| Komponen | Teknologi | Hosting / Platform |
|----------|-----------|-------------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | **Cloudflare Pages** |
| **Backend** | Spring Boot 3.3.5 (Java 21), Spring Security, JWT, Bucket4j | **Render** atau **Railway** |
| **ORM** | Spring Data JPA + Hibernate (PostgreSQL Dialect) | - |
| **Database** | PostgreSQL 15+ | **Supabase** |
| **Repository** | Git | **GitHub** |

---

## 📁 Struktur Direktori

```
LFMS/
├── .github/workflows/ci.yml       # CI Pipeline GitHub Actions
├── .gitignore                     # Git ignore root
├── render.yaml                    # Blueprint Render (Hosting Backend)
├── railway.toml                   # Konfigurasi Railway (Hosting Backend)
├── SRS.md                         # Dokumen Analisis Kebutuhan Sistem
│
├── BackendLFMS/                   # Backend (Spring Boot 3 / Java 21)
│   ├── Dockerfile                 # Multi-stage Dockerfile (Render / Railway)
│   ├── pom.xml                    # Maven configuration (PostgreSQL, Spring Boot)
│   ├── API_DOCUMENTATION.md       # Dokumentasi endpoint & keamanan API
│   ├── .env.example               # Contoh environment variable backend
│   └── src/
│       ├── main/java/id/rzhf/projecti/
│       │   ├── config/            # Security, Rate Limiter, CORS, Seeder
│       │   ├── controller/        # Auth, Report, Claim, User, Admin
│       │   ├── entity/            # 7 entitas JPA relasional
│       │   ├── repository/        # Spring Data JPA repositories
│       │   ├── security/          # JWT filter & UserDetailsService
│       │   └── service/           # Business logic & Audit logging
│       └── main/resources/
│           ├── application.properties
│           └── schema.sql         # Skrip DDL Supabase PostgreSQL
│
└── FrontendLFMS/                  # Frontend (React / Vite)
    ├── package.json               # Dependensi React & Tailwind
    ├── vite.config.js             # Vite config & development proxy
    ├── tailwind.config.js
    ├── .env.example               # Contoh environment variable frontend
    ├── public/
    │   └── _redirects             # Rule routing SPA untuk Cloudflare Pages
    └── src/
        ├── api/client.js          # Axios interceptor JWT
        ├── context/AuthContext.jsx
        ├── components/            # Navbar, Footer, ProtectedRoute
        └── pages/                 # Home, Reports, Detail, Login, Dashboard, Admin
```

---

## 🚀 Panduan Setup & Deployment

### Langkah 1: Hubungkan ke GitHub
1. Buat repository baru di [GitHub](https://github.com/new) (misal: `LFMS` atau `lost-and-found-system`).
2. Jalankan perintah berikut di terminal:
```bash
git add .
git commit -m "feat: initial commit fullstack LFMS (React + Spring Boot + Supabase)"
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/NAMA_REPO_ANDA.git
git push -u origin main
```

---

### Langkah 2: Setup Database di Supabase
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
2. Masuk ke **Project Settings** -> **Database**.
3. Di bagian **Connection parameters / Connection string**, catat:
   - **Host**: `db.<PROJECT-REF>.supabase.co`
   - **User**: `postgres`
   - **Password**: Password database Anda.
4. (Opsional): Salin isi `BackendLFMS/src/main/resources/schema.sql` dan jalankan di **SQL Editor** Supabase.

---

### Langkah 3: Hosting Backend di Render atau Railway

#### Pilihan A: Menggunakan Render
1. Masuk ke [dashboard.render.com](https://dashboard.render.com).
2. Klik **New +** -> **Web Service** -> Hubungkan dengan repository GitHub Anda.
3. Konfigurasi:
   - **Root Directory**: `BackendLFMS`
   - **Runtime**: `Docker` (akan otomatis membaca `BackendLFMS/Dockerfile`)
   - **Region**: Singapore
   - **Instance Type**: Free
4. Tambahkan **Environment Variables** di dashboard Render:
   - `DB_URL`: `jdbc:postgresql://db.<PROJECT-REF>.supabase.co:5432/postgres?sslmode=require`
   - `DB_USERNAME`: `postgres`
   - `DB_PASSWORD`: `<PASSWORD_SUPABASE_ANDA>`
   - `JWT_SECRET`: `9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b`
   - `CORS_ORIGINS`: URL frontend Anda (misal: `https://lfms.pages.dev`)
   - `ADMIN_EMAIL`: `admin@lfms.id`
   - `ADMIN_PASSWORD`: `Admin@12345`
5. Klik **Create Web Service**. Catat URL backend Anda (misal: `https://lfms-backend.onrender.com`).

#### Pilihan B: Menggunakan Railway
1. Masuk ke [railway.app](https://railway.app).
2. Klik **New Project** -> **Deploy from GitHub repo**.
3. Masuk ke **Settings** service:
   - **Root Directory**: `BackendLFMS`
   - Railway otomatis mendeteksi `Dockerfile` dan `railway.toml`.
4. Masuk ke tab **Variables** dan isi environment variables yang sama seperti di atas.
5. Generate domain publik di tab **Settings** -> **Networking** -> **Generate Domain**.

---

### Langkah 4: Hosting Frontend di Cloudflare Pages
1. Masuk ke [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Compute (Workers & Pages)** -> **Pages**.
2. Klik **Connect to Git** dan pilih repository GitHub Anda.
3. Konfigurasi Build Settings:
   - **Project Name**: `lfms` (atau nama pilihan Anda)
   - **Production Branch**: `main`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `FrontendLFMS`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Tambahkan **Environment Variable**:
   - `VITE_API_BASE_URL`: URL Backend Anda ditambah `/api` (misal: `https://lfms-backend.onrender.com/api`)
5. Klik **Save and Deploy**. Cloudflare Pages otomatis men-deploy dan memberikan URL seperti `https://lfms.pages.dev`.

> **Catatan Routing SPA**: Berkas `FrontendLFMS/public/_redirects` telah disiapkan agar reload pada rute client-side (seperti `/reports/1` atau `/dashboard`) tidak menghasilkan 404 pada Cloudflare Pages.

---

## 💻 Menjalankan Secara Lokal (Development)

### 1. Backend (Terminal 1)
```bash
cd BackendLFMS
./mvnw clean spring-boot:run
```
Backend berjalan pada `http://localhost:8080`.

### 2. Frontend (Terminal 2)
```bash
cd FrontendLFMS
npm install
npm run dev
```
Frontend berjalan pada `http://localhost:5173`. Request `/api/*` otomatis di-proxy ke port 8080.

---

## 🔒 Fitur Keamanan (Cyber Security)
- **Rate Limiting**: Maksimal 5 percobaan login per 15 menit per IP (mencegah brute-force).
- **IDOR Protection**: Validasi ketat kepemilikan resource (laporan, klaim, notifikasi).
- **Private Data Protection (BR-07)**: Detail verifikasi barang temuan disimpan di tabel terpisah dan hanya dapat diakses oleh Admin & pelapor.
- **Audit Logging**: Setiap aksi krusial dicatat ke tabel `audit_logs` lengkap dengan IP address.
- **File Upload Security**: Pembatasan MIME type, ekstensi, batas ukuran 5MB, dan nama file acak UUID.
