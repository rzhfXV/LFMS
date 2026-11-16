# Lost and Found Management System (LFMS)

Aplikasi web terintegrasi untuk pelaporan barang hilang, publikasi barang temuan, dan verifikasi klaim kepemilikan di lingkungan kampus dengan standar keamanan Cyber Security.

---

## 🛠️ Tech Stack & Hosting

| Komponen | Teknologi | Hosting / Platform |
|----------|-----------|-------------------|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | **Cloudflare Pages** |
| **Backend** | Spring Boot 3.3.5 (Java 21), Spring Security, JWT, Bucket4j | **Light Cloud** |
| **ORM** | Spring Data JPA + Hibernate (PostgreSQL Dialect) | - |
| **Database** | PostgreSQL 15+ | **Supabase** |
| **Object Storage** | Cloud Storage Bucket | **Supabase Storage** |
| **Repository** | Git | **GitHub** |

---

## 📁 Struktur Direktori

```
LFMS/
├── .github/workflows/ci.yml       # CI Pipeline GitHub Actions
├── .gitignore                     # Git ignore root
├── SRS.md                         # Dokumen Analisis Kebutuhan Sistem
│
├── BackendLFMS/                   # Backend (Spring Boot 3 / Java 21)
│   ├── Dockerfile                 # Multi-stage Dockerfile (Light Cloud)
│   ├── pom.xml                    # Maven configuration (PostgreSQL, Spring Boot)
│   ├── API_DOCUMENTATION.md       # Dokumentasi endpoint & keamanan API
│   ├── .env.example               # Contoh environment variable backend
│   └── src/
│       ├── main/java/id/rzhf/projecti/
│       │   ├── config/            # Security, Rate Limiter, CORS, Seeder
│       │   ├── controller/        # Auth, Report, Claim, User, Admin
│       │   ├── entity/            # 7 entitas JPA relasional
│       │   ├── repository/        # Spring Data JPA repositories (@EntityGraph)
│       │   ├── security/          # JWT filter & UserDetailsService
│       │   └── service/           # Business logic, Supabase Storage & Audit logging
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

### Langkah 2: Setup Database & Storage di Supabase
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan buat project baru.
2. **Database**:
   - Masuk ke **Project Settings** -> **Database**.
   - Di bagian **Connection parameters / Connection string**, catat Host, User (`postgres`), dan Password.
   - (Opsional): Salin isi `BackendLFMS/src/main/resources/schema.sql` dan jalankan di **SQL Editor** Supabase.
3. **Storage (Foto Barang)**:
   - Masuk ke menu **Storage** -> Buat bucket baru bernama `reports`.
   - Pastikan opsi **Public bucket** diaktifkan.
   - Masuk ke **Project Settings** -> **API**, salin **Project URL** dan **Secret key** (`sb_secret_...` / `service_role`).

---

### Langkah 3: Hosting Backend di Light Cloud
1. Hubungkan repository GitHub Anda ke workspace / project di **Light Cloud**.
2. Pastikan build menggunakan Dockerfile pada path `BackendLFMS/Dockerfile`.
3. Tambahkan **Environment Variables** di dashboard Light Cloud:
   - `DB_URL`: `jdbc:postgresql://db.<PROJECT-REF>.supabase.co:5432/postgres?sslmode=require`
   - `DB_USERNAME`: `postgres`
   - `DB_PASSWORD`: `<PASSWORD_SUPABASE_ANDA>`
   - `JWT_SECRET`: `9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b`
   - `CORS_ORIGINS`: URL domain Frontend Anda (misal: `https://lfms.atasraihan.my.id`)
   - `SUPABASE_URL`: `https://<PROJECT-REF>.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `sb_secret_...`
   - `SUPABASE_STORAGE_BUCKET`: `reports`
   - `ADMIN_EMAIL`: `admin@lfms.id`
   - `ADMIN_PASSWORD`: `Admin@12345`

---

### Langkah 4: Hosting Frontend di Cloudflare Pages
1. Masuk ke [Cloudflare Dashboard](https://dash.cloudflare.com/) -> **Workers & Pages** -> **Pages**.
2. Hubungkan repository GitHub Anda.
3. Konfigurasi Build Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `FrontendLFMS`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Tambahkan **Environment Variable**:
   - `VITE_API_BASE_URL`: URL Backend Light Cloud Anda ditambah `/api` (misal: `https://main-lfms-rzhfxvs-workspace.light-cloud.io/api`)
5. Klik **Save and Deploy**.

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
Frontend berjalan pada `http://localhost:5173`. Request `/api/*` otomatis di-proxy ke backend port 8080.

---

## 🔒 Fitur Keamanan (Cyber Security)
- **Rate Limiting**: Maksimal 5 percobaan login per 15 menit per IP (mencegah brute-force).
- **IDOR Protection**: Validasi ketat kepemilikan resource (laporan, klaim, notifikasi).
- **Private Data Protection (BR-07)**: Detail verifikasi barang temuan disimpan di tabel terpisah dan hanya dapat diakses oleh Admin & pelapor.
- **Audit Logging**: Setiap aksi krusial dicatat ke tabel `audit_logs` lengkap dengan IP address.
- **File Upload Security**: Pembatasan MIME type, ekstensi, batas ukuran 5MB, penyimpanan aman di Supabase Storage CDN.
