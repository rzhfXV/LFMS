# LFMS Backend - API Documentation & Security Guide

Backend REST API untuk **Lost and Found Management System (LFMS)** dibangun menggunakan **Spring Boot 3.3.5 / Java 21**, **Spring Security + JWT**, **Spring Data JPA**, **PostgreSQL (Supabase)**, dan **Bucket4j Rate Limiter**.

---

## 1. Konfigurasi & Menjalankan Aplikasi

### 1.1 Persyaratan Sistem
- Java 21+
- Database PostgreSQL (Supabase)
- Maven 3.9+ (atau gunakan `./mvnw.cmd` / `./mvnw`)

### 1.2 Konfigurasi Database Supabase & Secrets
Buka dashboard **Supabase** Anda:
1. Masuk ke **Project Settings** -> **Database**.
2. Cari bagian **Connection string** -> pilih tab **JDBC** atau **URI**.
3. Atur di file `.env` atau `src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://db.<YOUR-PROJECT-REF>.supabase.co:5432/postgres?sslmode=require
spring.datasource.username=postgres
spring.datasource.password=<YOUR-SUPABASE-DB-PASSWORD>
spring.datasource.driver-class-name=org.postgresql.Driver
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
```

> **Tips Supabase**: Anda juga dapat mengeksekusi skrip DDL [[schema.sql](file:///c:/Main%20Folder/Raihan%20Folder/Homework/S5/Kemanan%20Cyber/LFMS/BackendLFMS/src/main/resources/schema.sql)] langsung melalui fitur **SQL Editor** di Supabase Dashboard jika tidak ingin bergantung pada `hibernate.ddl-auto=update`.

Default Akun Administrator (otomatis dibuat via `DataSeeder` saat pertama kali dijalankan):
- **Email**: `admin@lfms.id`
- **Password**: `Admin@12345`

### 1.3 Menjalankan Aplikasi
```bash
cd BackendLFMS
./mvnw clean spring-boot:run
```
Aplikasi berjalan pada: `http://localhost:8080`

---

## 2. Aspek Keamanan yang Diimplementasikan (Cyber Security)

| Fitur Keamanan | Implementasi |
|----------------|--------------|
| **Password Hashing** | BCrypt dengan salt strength 12 (`BCryptPasswordEncoder(12)`) |
| **Autentikasi** | JSON Web Token (JWT) stateless (HS256/HS512) dengan masa berlaku 24 jam |
| **Otorisasi (RBAC)** | Role-Based Access Control (`ROLE_USER`, `ROLE_ADMIN`) dengan Spring Security |
| **IDOR Protection** | Validasi kepemilikan resource di Service layer (laporan, klaim, notifikasi, profil) |
| **SQL Injection** | Prepared Statements via Spring Data JPA dan parameterized `@Query` |
| **Cross-Site Scripting (XSS)** | Jakarta Validation `@NotBlank`, `@Size`, sanitasi data input, strict DTOs |
| **Rate Limiting** | Bucket4j Token Bucket: maks 5 percobaan login per 15 menit per IP (mencegah brute force) |
| **File Upload Security** | Whitelist ekstensi (`jpg`, `jpeg`, `png`, `webp`), MIME type check, limit ukuran 5MB, random UUID filenames, proteksi directory traversal |
| **Private Data Isolation** | Tabel `report_private_details` terpisah. Detail rahasia barang temuan (BR-07) hanya dapat diakses oleh pembuat dan Admin |
| **Audit Logging** | Pencatatan otomatis ke tabel `audit_logs` untuk seluruh aktivitas krusial (login, register, manipulasi status, verifikasi, dll) lengkap dengan IP address |

---

## 3. Format Respons & Error

### Format Sukses Standar
```json
{
  "content": [...],
  "page": 0,
  "size": 10,
  "totalElements": 25,
  "totalPages": 3,
  "last": false
}
```

### Format Error Standar
```json
{
  "status": 400,
  "message": "Validation failed",
  "timestamp": "2026-11-02T13:30:00",
  "fieldErrors": {
    "title": "Title is required",
    "eventDate": "Event date cannot be in the future"
  }
}
```

---

## 4. Daftar API Endpoints

### 4.1 Autentikasi (`/api/auth`)

#### 1. Registrasi Akun Pengguna
- **Method & URL**: `POST /api/auth/register`
- **Akses**: Publik / Guest
- **Request Body**:
```json
{
  "name": "Budi Santoso",
  "email": "budi@student.ac.id",
  "password": "Password123!"
}
```
- **Response**: `201 Created`

#### 2. Login
- **Method & URL**: `POST /api/auth/login`
- **Akses**: Publik (Diproteksi Rate Limiter 5 req/15 min)
- **Request Body**:
```json
{
  "email": "budi@student.ac.id",
  "password": "Password123!"
}
```
- **Response**: `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "user": {
    "id": 2,
    "name": "Budi Santoso",
    "email": "budi@student.ac.id",
    "role": "USER",
    "status": "ACTIVE",
    "createdAt": "2026-11-02T10:00:00"
  }
}
```

#### 3. Logout
- **Method & URL**: `POST /api/auth/logout`
- **Akses**: Authenticated (`Bearer <token>`)
- **Response**: `204 No Content`

---

### 4.2 Laporan Publik & Kategori

#### 1. Daftar Kategori
- **Method & URL**: `GET /api/categories`
- **Akses**: Publik

#### 2. Cari & Filter Laporan Publik
- **Method & URL**: `GET /api/reports`
- **Akses**: Publik
- **Query Params**:
  - `type`: `LOST` atau `FOUND` (opsional)
  - `categoryId`: ID kategori (opsional)
  - `location`: nama lokasi (opsional)
  - `eventDate`: `YYYY-MM-DD` (opsional)
  - `q`: kata kunci pencarian judul/deskripsi (opsional)
  - `page`: nomor halaman (default `0`)
  - `size`: jumlah per halaman (default `10`)
- **Catatan**: Hanya laporan berstatus `PUBLISHED` yang ditampilkan. Informasi `verificationDetails` disembunyikan.

#### 3. Detail Laporan Publik
- **Method & URL**: `GET /api/reports/{id}`
- **Akses**: Publik

---

### 4.3 Fitur Pengguna Terdaftar (`/api/user` & `/api/reports`, `/api/claims`)
*Header wajib*: `Authorization: Bearer <token>`

#### 1. Buat Laporan Barang Hilang / Temuan
- **Method & URL**: `POST /api/reports`
- **Content-Type**: `multipart/form-data`
- **Form Data Fields**:
  - `categoryId`: Long
  - `type`: `LOST` atau `FOUND`
  - `title`: String (maks 150)
  - `description`: String (maks 5000)
  - `location`: String (maks 255)
  - `eventDate`: `YYYY-MM-DD`
  - `verificationDetails`: String (Khusus `FOUND`: detail tersembunyi untuk verifikasi klaim)
  - `image`: File (opsional, maks 5MB, format: jpg, jpeg, png, webp)

#### 2. Daftar Laporan Saya
- **Method & URL**: `GET /api/user/reports?page=0&size=10`

#### 3. Detail Laporan Saya (Termasuk Detail Rahasia & Alasan Penolakan)
- **Method & URL**: `GET /api/user/reports/{id}`

#### 4. Edit Laporan Saya
- **Method & URL**: `PUT /api/user/reports/{id}`
- **Content-Type**: `multipart/form-data`
- **Aturan**: Hanya bisa diedit jika status laporan `PENDING_REVIEW` atau `REJECTED`.

#### 5. Hapus Laporan Saya
- **Method & URL**: `DELETE /api/user/reports/{id}`
- **Aturan**: Laporan yang sudah `PUBLISHED` tidak dapat dihapus sembarangan oleh user.

#### 6. Ajukan Klaim Kepemilikan Barang Temuan
- **Method & URL**: `POST /api/claims`
- **Request Body**:
```json
{
  "foundReportId": 5,
  "evidence": "Dompet tersebut bermerk Fossil warna cokelat tua, di dalamnya terdapat kartu perpus bernomor 12345 dan stiker kucing."
}
```
- **Aturan Bisnis (BR-05 & BR-06)**:
  - Hanya untuk laporan temuan yang berstatus `PUBLISHED`.
  - User tidak boleh mengklaim barang temuannya sendiri.
  - User tidak boleh mengajukan klaim ganda yang masih aktif pada barang yang sama.

#### 7. Daftar Klaim Saya
- **Method & URL**: `GET /api/user/claims?page=0&size=10`

#### 8. Detail Klaim Saya
- **Method & URL**: `GET /api/user/claims/{id}`

#### 9. Batalkan Klaim Saya
- **Method & URL**: `DELETE /api/user/claims/{id}`
- **Aturan**: Hanya klaim dengan status `PENDING` yang bisa dibatalkan.

#### 10. Dashboard User
- **Method & URL**: `GET /api/user/dashboard`

#### 11. Profil User
- **Method & URL**: `GET /api/user/profile`
- **Ubah Profil / Password**: `PUT /api/user/profile`

#### 12. Notifikasi
- `GET /api/user/notifications?page=0&size=20`
- `GET /api/user/notifications/unread-count`
- `PATCH /api/user/notifications/{id}/read`
- `PATCH /api/user/notifications/read-all`

---

### 4.4 Fitur Administrator (`/api/admin`)
*Header wajib*: `Authorization: Bearer <token>` (User dengan role `ADMIN`)

#### 1. Admin Dashboard
- **Method & URL**: `GET /api/admin/dashboard`
- Mengembalikan statistik total laporan barang hilang/temuan, antrian verifikasi, klaim pending, barang selesai, serta statistik per kategori.

#### 2. Verifikasi & Kelola Laporan
- `GET /api/admin/reports?status=PENDING_REVIEW&page=0&size=10`
- `GET /api/admin/reports/{id}` (Menampilkan seluruh detail termasuk `verificationDetails`)
- `PATCH /api/admin/reports/{id}/review`
```json
{
  "status": "PUBLISHED",
  "rejectionReason": null
}
```
*(Status yang didukung: `PUBLISHED`, `REJECTED`, `RESOLVED`, `CLOSED`)*

#### 3. Ekspor Data Laporan ke CSV
- **Method & URL**: `GET /api/admin/reports/export?status=PUBLISHED`
- Mengunduh file `.csv` yang berisi rekapitulasi data laporan untuk dokumentasi dan pelaporan kampus.

#### 4. Verifikasi & Proses Klaim
- `GET /api/admin/claims?status=PENDING&page=0&size=10`
- `GET /api/admin/claims/{id}` (Menyertakan `evidence` dari pengklaim sekaligus `foundReportVerificationDetails` dari pelapor barang temuan untuk verifikasi silang)
- `PATCH /api/admin/claims/{id}/review`
```json
{
  "status": "APPROVED",
  "adminNote": "Bukti cocok dengan detail verifikasi. Silakan ambil barang di Ruang Sekretariat Lt. 2."
}
```
- `PATCH /api/admin/claims/{id}/complete`
*(Digunakan ketika barang sudah diserahkan kepada pemilik yang sah. Otomatis mengubah status klaim menjadi `COMPLETED` dan status laporan menjadi `RESOLVED`)*

#### 5. Pengelolaan Pengguna
- `GET /api/admin/users?page=0&size=10`
- `PATCH /api/admin/users/{id}/status?status=SUSPENDED`

#### 6. Pengelolaan Kategori
- `GET /api/admin/categories`
- `POST /api/admin/categories`
- `PUT /api/admin/categories/{id}`
- `DELETE /api/admin/categories/{id}`

#### 7. Audit Logging (Riwayat Aktivitas Sistem)
- **Method & URL**: `GET /api/admin/audit-logs?page=0&size=20`
- Menampilkan jejak audit keamanan seluruh aksi penting: aktor, jenis aksi, entitas, ID data, deskripsi, timestamp, dan IP address.
