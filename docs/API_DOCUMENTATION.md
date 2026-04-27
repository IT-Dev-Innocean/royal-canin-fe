# Dokumentasi API — Royal Canin Event

Base URL: `https://api.royalcaninvetsymposium.id/api/v1`

Akun Super admin:

"email": "superadmin@innocean.co.id",
"password": "innocean2026!"

---

## Daftar Isi

1. [Alur Penggunaan](#alur-penggunaan)
2. [Format Response](#format-response)
3. [Autentikasi](#autentikasi)
4. [Endpoint Publik](#1-endpoint-publik-tanpa-login)
5. [Endpoint Participant](#2-endpoint-participant-perlu-login)
6. [Endpoint Participant — Seminar](#3-endpoint-participant--seminar)
7. [Endpoint Admin — Kelola Participant](#4-endpoint-admin--kelola-participant)
8. [Endpoint Admin — Check-In Hari H](#5-endpoint-admin--check-in-hari-h)
9. [Endpoint Admin — Kelola Seminar](#6-endpoint-admin--kelola-seminar)
10. [Endpoint Participant — Aktivitas Event](#7-endpoint-participant--aktivitas-event)
11. [Endpoint Admin — Kelola Aktivitas Event](#8-endpoint-admin--kelola-aktivitas-event)
12. [Form tanggapan seminar — Admin & Participant](#9-form-tanggapan-seminar--admin--participant)
13. [Hadiah booth & pencatatan penukaran](#10-hadiah-booth--pencatatan-penukaran--admin--participant)
14. [Doorprize (undian)](#11-doorprize-undian--admin)
15. [Kode Status HTTP](#kode-status-http)
16. [Sistem Poin](#sistem-poin)
17. [Data Dummy Aktivitas (Seeder)](#data-dummy-aktivitas-seeder)
18. [Konfigurasi environment](#konfigurasi-environment)

- [Panduan integrasi — Frontend](#panduan-integrasi--frontend)

---

## Panduan integrasi — Frontend

Bagian ini merangkum kontrak API untuk mempercepat kerja **web / mobile** tanpa membaca seluruh dokumen.

| Topik | Ringkasan |
|-------|-----------|
| **Base URL** | Semua path di dokumen ini relatif terhadap `{BASE}/api/v1` (contoh lokal: `http://localhost/api/v1`). |
| **Auth** | Setelah login: header **`Authorization: Bearer {token}`** dan **`Accept: application/json`**. |
| **Body** | Default **JSON** (`Content-Type: application/json`). Upload file (thumbnail, foto pembicara, QR participant) pakai **`multipart/form-data`**. |
| **Response sukses** | `{ "success": true, "message": "...", "data": ... }` |
| **Response gagal** | `{ "success": false, "message": "...", "errors": ... }` — validasi umumnya **422**. |
| **403** | Peserta: belum check-in / belum join seminar (tergantung endpoint). |
| **Pagination** | `?page=1` — `per_page` di response: daftar participant **admin** = **10**; banyak resource lain = **20**. |

**Feedback seminar (`GET/POST /seminars/{id}/feedback`):**

- `GET` mengembalikan `points_for_complete_set` (= `feedback_completion_points` di data seminar, diset admin).
- Tiap elemen `questions[]` punya **`question_type`**: `choice` → tampilkan opsi, submit dengan `{ "question_id", "option_id" }` | `text` → textarea, submit dengan `{ "question_id", "answer" }` (1–5000 karakter).
- **Satu** `POST` wajib berisi **semua** soal aktif (satu objek per `question_id`). Poin hadiah = **satu transaksi** (`total_points_earned`), bukan per soal.

**Admin — update & hapus (CRUD lengkap):**

| Sumber | Method | Path |
|--------|--------|------|
| Participant | `PUT` / `PATCH`, `DELETE` | `/participants/{userId}` — update sama seperti tambah (opsional field); hapus mengikuti cascade DB |
| Token QR aktivitas | `PUT` / `PATCH`, `DELETE` | `/admin/activities/{activityId}/scannable-codes/{id}` |
| Pertanyaan ke pembicara | `DELETE` | `/admin/seminars/{seminarId}/questions/{seminarQuestionId}` (moderasi; saldo poin tidak di-adjust otomatis) |
| Review seminar | `DELETE` | `/admin/seminars/{seminarId}/reviews/{seminarReviewId}` |
| Pencatatan penukaran hadiah | `DELETE` | `/admin/prize-redemptions/{prizeRedemptionId}` |
| Pemenang doorprize | `DELETE` | `/admin/door-prize/winners/{doorPrizeWinnerId}` — partisipan bisa masuk pool eligibel lagi |

**Koleksi Postman** (`Royal_Canin_Admin`, `Royal_Canin_Participant`, `Royal_Canin_BE`) memakai variabel `{{base_url}}`, `{{token}}`, dan ID terkait — isi dari response `GET` sebelum memanggil `PUT`/`DELETE`.

---

## Alur Penggunaan

### Alur Admin
```
Login → Tambah Participant (satuan/bulk) → Buat Seminar & Pembicara → (opsional) atur soal/opsi feedback per seminar, katalog hadiah, doorprize
→ Hari H: Scan QR → Check-in → (opsional) feedback seminar, booth hadiah (scan), undian doorprize
→ Lihat Pertanyaan & Review
```

### Alur Participant
```
Input nomor HP → Buat password → Login (HP/Email + password) → Lihat Profil & QR Code
→ Bisa **lihat daftar** seminar & aktivitas (`GET /seminars`, `GET /activities`) kapan saja setelah login
→ **Check-in Admin** (+100 poin) — diperlukan untuk **join seminar**, detail, tanya, review, alur aktivitas, **katalog hadiah**, dsb.
→ **Join seminar** (tombol, `POST /seminars/{id}/join`) → +poin join sesuai `join_points` (1× join per peserta per seminar)
→ Pilih Pembicara & Tanya (+100 poin × 4)
→ Submit Review & Feedback (+100 poin)
→ **Form tanggapan seminar** (soal pilihan + isian): satu kali submit per seminar; poin satu transaksi = **`feedback_completion_points`** pada seminar (adjustable admin; saldo tidak dipotong untuk booth hadiah)
→ **Aktivitas event** (Gastro / Study Case / Usher, dll.): scan QR aktivitas → dapat poin sesuai konfigurasi di database
→ **Hadiah booth**: lihat katalog; penukaran dicatat oleh usher (scan QR) — saldo poin **tidak** dipotong
```

---

## Format Response

Semua response menggunakan format JSON yang konsisten.

### Berhasil
```json
{
    "success": true,
    "message": "Pesan sukses.",
    "data": { ... }
}
```

### Gagal
```json
{
    "success": false,
    "message": "Pesan error.",
    "errors": null
}
```

### Validasi Gagal (422)
```json
{
    "message": "Pesan validasi.",
    "errors": {
        "nama_field": ["Pesan error untuk field ini."]
    }
}
```

---

## Autentikasi

API menggunakan **Bearer Token** (Laravel Sanctum). Token didapat setelah login atau setup password.

Kirim token di setiap request yang memerlukan autentikasi:

```
Header: Authorization: Bearer {token}
```

Token tidak memiliki masa kadaluarsa — berlaku sampai logout.

---

## 1. Endpoint Publik (Tanpa Login)

### Setup Password

Participant memasukkan nomor HP yang terdaftar dan membuat password. Auto-login setelah berhasil.

```
POST /api/v1/setup-password
```

**Body:**

| Field                   | Tipe   | Wajib | Keterangan                                |
|-------------------------|--------|-------|--------------------------------------------|
| phone                   | string | Ya    | Nomor HP yang terdaftar                   |
| password                | string | Ya    | Minimal 8 karakter                        |
| password_confirmation   | string | Ya    | Harus sama dengan password                |

**Contoh Request:**
```json
{
    "phone": "081281117540",
    "password": "password123",
    "password_confirmation": "password123"
}
```

**Response Berhasil (200):**
```json
{
    "success": true,
    "message": "Password berhasil dibuat.",
    "data": {
        "user": {
            "id": 2,
            "name": "drh. Angga Wirantoko Hadi Saputro",
            "email": "angga@1stline-jago.com",
            "role": "participant",
            "detail": { "phone": "081281117540", "clinic_name": "Pawstone" },
            "qr_code": { "code": "RC-2026-A3F8XKWM", "image_path": "qrcodes/2_RC-2026-A3F8XKWM.svg" }
        },
        "token": "2|abc123..."
    }
}
```

**Kemungkinan Error:**

| Kode | Pesan                                |
|------|--------------------------------------|
| 404  | Nomor HP tidak terdaftar.            |
| 409  | Akun sudah aktif. Silakan login.     |

---

### Login

Login untuk participant maupun admin menggunakan email dan password.

```
POST /api/v1/login
```

**Rate Limit:** 10 request per menit per kombinasi IP + email.

**Body:**

| Field    | Tipe   | Wajib | Keterangan |
|----------|--------|-------|------------|
| email    | string | Ya    | Email      |
| password | string | Ya    | Password   |

**Contoh Request:**
```json
{
    "email": "superadmin@innocean.co.id",
    "password": "innocean2026!"
}
```

**Response Berhasil (200):**
```json
{
    "success": true,
    "message": "Login berhasil.",
    "data": {
        "user": {
            "id": 2,
            "name": "John Doe",
            "email": "john@example.com",
            "role": "participant"
        },
        "token": "1|abc123..."
    }
}
```

**Kemungkinan Error:**

| Kode | Pesan                                                          |
|------|----------------------------------------------------------------|
| 403  | Akun belum diaktifkan. Silakan setup password terlebih dahulu. |
| 422  | Email tidak ditemukan.                                         |
| 422  | Email atau password salah.                                     |

---

## 2. Endpoint Participant (Perlu Login)

Semua endpoint di bagian ini memerlukan header `Authorization: Bearer {token}`.

**Check-in acara (hari H):** Untuk **melihat daftar** saja, cukup login: **`GET /seminars`** dan **`GET /activities`**.  
Untuk **ikut berpartisipasi** (join seminar, scan aktivitas, detail seminar, sesi aktivitas, dll.) peserta harus sudah check-in (admin memindai QR peserta). Tanpa check-in pada endpoint tersebut → **403**.  
Profil (`GET/PUT /me`), riwayat poin, dan logout **tidak** membutuhkan check-in.

### Lihat Profil

```
GET /api/v1/me
```

**Response (200):**
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "id": 2,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "participant",
        "detail": {
            "phone": "081234567890",
            "clinic_name": "Happy Pets Clinic",
            "outlet_number": 12,
            "social_media_account": "@johndoe",
            "rc_club": true,
            "pet": "cat",
            "scrub_size": "L",
            "points": 0
        },
        "qr_code": {
            "code": "RC-2026-A3F8XKWM",
            "image_path": "qrcodes/2_RC-2026-A3F8XKWM.svg",
            "is_active": true
        },
        "check_in": null
    }
}
```

> Gambar QR code bisa diakses di: `http://localhost/storage/{image_path}`

---

### Update Profil

Kirim hanya field yang ingin diubah.

```
PUT /api/v1/me
```

**Body (semua opsional):**

| Field                | Tipe    | Keterangan             |
|----------------------|---------|------------------------|
| name                 | string  | Nama lengkap           |
| phone                | string  | Nomor HP (harus unik)  |
| clinic_name          | string  | Nama klinik            |
| outlet_number        | integer | Nomor outlet           |
| social_media_account | string  | Akun media sosial      |
| rc_club              | boolean | Anggota RC Club        |
| pet                  | string  | Jenis hewan peliharaan |
| scrub_size           | string  | Ukuran scrub           |

**Contoh Request:**
```json
{
    "name": "John Doe Updated",
    "pet": "dog",
    "scrub_size": "XL"
}
```

**Response Berhasil (200):**
```json
{
    "success": true,
    "message": "Profil berhasil diperbarui.",
    "data": { ... }
}
```

---

### Riwayat transaksi poin

Menampilkan semua pencairan poin peserta yang tersimpan di `point_transactions` (check-in, seminar, aktivitas event), terurut dari yang terbaru. Total saldo tetap di `GET /api/v1/me` → `detail.points`.

```
GET /api/v1/me/point-transactions?page=1&per_page=20
```

| Query        | Tipe    | Keterangan                          |
|--------------|---------|-------------------------------------|
| page         | integer | Halaman (default 1)                 |
| per_page     | integer | 1–50, default 20                    |

**Response (200):** objek paginasi Laravel; tiap elemen `data` berisi:

| Field           | Keterangan |
|-----------------|------------|
| id              | ID transaksi |
| points_earned   | Poin yang ditambahkan pada transaksi ini (positif) |
| reason_code     | `check_in`, `seminar_join`, `seminar_question`, `seminar_review`, `seminar_feedback`, `activity_correct_answer`, `activity_usher_reward` (data historis bisa memuat kode lama seperti `seminar_first_join` atau `event_feedback`) |
| reason_label    | Teks singkat untuk UI (Bahasa Indonesia) |
| meta            | JSON kontekstual, mis. `seminar_id`, `points_for_complete_set`, `activity_id`, `check_in_id`, `session_id`, `activity_question_id` |
| created_at      | Waktu transaksi (ISO 8601) |

---

### Logout

```
POST /api/v1/logout
```

**Response (200):**
```json
{
    "success": true,
    "message": "Berhasil logout.",
    "data": null
}
```

---

## 3. Endpoint Participant — Seminar

Semua endpoint di bagian ini memerlukan header `Authorization: Bearer {token}`.

> **`GET /seminars`:** cukup **login** (tanpa syarat check-in).  
> **Endpoint lain di bagian ini** (`POST /seminars/{id}/join`, `GET /seminars/{id}`, pertanyaan, review): peserta harus sudah **check-in**; lalu untuk detail/tanya/review harus **join** (tombol / join seminar). Tanpa check-in → `403` (belum check-in). Sudah check-in tapi belum join → `403` (belum join seminar…).

### Daftar Seminar

Menampilkan seminar aktif beserta daftar pembicaranya. Field `is_joined` menunjukkan apakah participant sudah **join** seminar tersebut.

**Akses:** hanya perlu **Bearer token** (login). Tidak memerlukan check-in acara.

```
GET /api/v1/seminars?page=1
```

**Response (200):**
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "title": "Nutrisi Kucing Indoor",
                "description": "Pembahasan mengenai nutrisi optimal...",
                "thumbnail": "seminars/abc123.jpg",
                "starts_at": "2026-04-10T09:00:00.000000Z",
                "ends_at": "2026-04-10T12:00:00.000000Z",
                "is_active": true,
                "is_joined": true,
                "speakers": [
                    {
                        "id": 1,
                        "name": "drh. Budi Santoso",
                        "title": "Spesialis Nutrisi Hewan",
                        "photo": "speakers/budi.jpg",
                        "bio": "10 tahun pengalaman..."
                    },
                    {
                        "id": 2,
                        "name": "drh. Sari Dewi",
                        "title": "Dokter Hewan Klinik ABC",
                        "photo": "speakers/sari.jpg",
                        "bio": null
                    }
                ]
            }
        ],
        "last_page": 1,
        "per_page": 20,
        "total": 1
    }
}
```

> Gambar thumbnail & foto speaker: `http://localhost/storage/{path}`

---

### Join Seminar (tombol / tanpa scan QR)

Participant memilih seminar dari daftar lalu memanggil endpoint ini (mis. dari tombol **Join**). Setelah join, barulah bisa akses detail, kirim pertanyaan, dan submit review.

Jumlah poin saat join mengikuti field **`join_points`** pada seminar (diatur admin; default **100**). Setiap seminar: **poin join maksimal sekali** per peserta (idempoten). Jika `join_points` = **0**, join tetap berhasil tanpa penambahan poin.

Response data seminar menyertakan **`points_earned`** (integer): poin yang baru diberikan pada request ini (0 jika tidak ada poin atau sudah pernah tercatat).

```
POST /api/v1/seminars/{seminarId}/join
```

**Path / body:** cukup **ID seminar** di URL (sama dengan `id` di `GET /seminars`). **Tanpa body** wajib.

**Response Berhasil — dengan poin (201):**
```json
{
    "success": true,
    "message": "Berhasil join seminar. +100 poin.",
    "data": {
        "id": 1,
        "title": "Nutrisi Kucing Indoor",
        "description": "Pembahasan mengenai nutrisi optimal...",
        "thumbnail": "seminars/abc123.jpg",
        "starts_at": "2026-04-10T09:00:00.000000Z",
        "ends_at": "2026-04-10T12:00:00.000000Z",
        "is_active": true,
        "join_points": 100,
        "qr_code": "SEM-2026-A3F8XKWM",
        "points_earned": 100,
        "speakers": [
            { "id": 1, "name": "drh. Budi Santoso" },
            { "id": 2, "name": "drh. Sari Dewi" }
        ]
    }
}
```

**Response Berhasil — tanpa poin baru (201)** (mis. `join_points` = 0, atau kasus edge idempotensi):
```json
{
    "success": true,
    "message": "Berhasil join seminar.",
    "data": {
        "id": 2,
        "title": "Manajemen Obesitas pada Kucing",
        "description": "Strategi manajemen obesitas...",
        "thumbnail": "seminars/def456.jpg",
        "starts_at": "2026-04-11T09:00:00.000000Z",
        "ends_at": "2026-04-11T12:00:00.000000Z",
        "is_active": true,
        "join_points": 0,
        "qr_code": "SEM-2026-Z9Y8X7WV",
        "points_earned": 0,
        "speakers": [
            { "id": 3, "name": "drh. Rina Putri" }
        ]
    }
}
```

**Kemungkinan Error:**

| Kode | Pesan                           |
|------|---------------------------------|
| 404  | Seminar tidak tersedia (tidak ada atau nonaktif). |
| 409  | Anda sudah join seminar ini. (field `errors` berisi ringkasan `seminar` dan `joined_at`) |

---

### Detail Seminar

Menampilkan detail seminar beserta statistik partisipan (jumlah pertanyaan, sisa kuota poin, status review).

> **Wajib join dulu** (`POST /seminars/{id}/join`). Jika belum → `403 Anda belum join seminar ini.`

```
GET /api/v1/seminars/{seminarId}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "seminar": {
            "id": 1,
            "title": "Nutrisi Kucing Indoor",
            "description": "Pembahasan mengenai nutrisi optimal...",
            "thumbnail": "seminars/abc123.jpg",
            "starts_at": "2026-04-10T09:00:00.000000Z",
            "ends_at": "2026-04-10T12:00:00.000000Z",
            "is_active": true,
            "speakers": [ ... ]
        },
        "my_stats": {
            "questions_asked": 2,
            "rewarded_remaining": 2,
            "has_reviewed": false
        }
    }
}
```

> **`rewarded_remaining`**: sisa pertanyaan yang masih mendapat poin (maks 4). Setelah habis, tetap bisa bertanya tapi tanpa poin.

---

### Kirim Pertanyaan ke Pembicara

Partisipan memilih pembicara dan mengirim pertanyaan. 4 pertanyaan pertama per seminar mendapat +100 poin, selanjutnya tanpa poin.

> **Wajib join dulu** (sudah join via `POST .../join`). Jika belum → `403`

```
POST /api/v1/seminars/{seminarId}/questions
```

**Body:**

| Field      | Tipe    | Wajib | Keterangan                          |
|------------|---------|-------|-------------------------------------|
| speaker_id | integer | Ya    | ID pembicara dari daftar speakers   |
| question   | string  | Ya    | Pertanyaan (maks 1000 karakter)     |

**Contoh Request:**
```json
{
    "speaker_id": 1,
    "question": "Bagaimana cara menentukan porsi makan yang tepat untuk kucing indoor?"
}
```

**Response Berhasil — dengan poin (201):**
```json
{
    "success": true,
    "message": "Pertanyaan berhasil dikirim. +100 poin.",
    "data": {
        "id": 1,
        "seminar_id": 1,
        "speaker_id": 1,
        "user_id": 2,
        "question": "Bagaimana cara menentukan porsi makan yang tepat untuk kucing indoor?",
        "points_earned": 100,
        "speaker": {
            "id": 1,
            "name": "drh. Budi Santoso",
            "title": "Spesialis Nutrisi Hewan"
        }
    }
}
```

**Response Berhasil — tanpa poin / pertanyaan ke-5+ (201):**
```json
{
    "success": true,
    "message": "Pertanyaan berhasil dikirim.",
    "data": {
        "id": 5,
        "seminar_id": 1,
        "speaker_id": 2,
        "user_id": 2,
        "question": "Apakah makanan basah lebih baik?",
        "points_earned": 0,
        "speaker": { ... }
    }
}
```

**Kemungkinan Error:**

| Kode | Pesan                                        |
|------|----------------------------------------------|
| 404  | Pembicara tidak ditemukan di seminar ini.    |

---

### Lihat Pertanyaan Saya (per Seminar)

> **Wajib join dulu** (sudah join via `POST .../join`). Jika belum → `403`

```
GET /api/v1/seminars/{seminarId}/my-questions
```

**Response (200):**
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "questions": [
            {
                "id": 1,
                "question": "Bagaimana cara menentukan porsi makan?",
                "points_earned": 100,
                "speaker": { "id": 1, "name": "drh. Budi Santoso" },
                "created_at": "2026-04-10T09:15:00.000000Z"
            },
            {
                "id": 2,
                "question": "Apakah vitamin tambahan diperlukan?",
                "points_earned": 100,
                "speaker": { "id": 2, "name": "drh. Sari Dewi" },
                "created_at": "2026-04-10T09:20:00.000000Z"
            }
        ],
        "total_questions": 2,
        "total_points_earned": 200,
        "rewarded_remaining": 2
    }
}
```

---

### Submit Review & Feedback (Akhiri Sesi Seminar)

Partisipan mengakhiri sesi seminar dengan mengisi review. Hanya bisa dilakukan 1 kali per seminar. Mendapat +100 poin.

> **Wajib join dulu** (sudah join via `POST .../join`). Jika belum → `403`

```
POST /api/v1/seminars/{seminarId}/review
```

**Body:**

| Field    | Tipe    | Wajib | Keterangan                     |
|----------|---------|-------|--------------------------------|
| rating   | integer | Ya    | Rating 1-5                     |
| feedback | string  | Tidak | Feedback/ulasan (maks 2000 karakter) |

**Contoh Request:**
```json
{
    "rating": 5,
    "feedback": "Seminar sangat informatif dan pembicaranya sangat kompeten. Terima kasih!"
}
```

**Response Berhasil (201):**
```json
{
    "success": true,
    "message": "Review berhasil dikirim. +100 poin.",
    "data": {
        "id": 1,
        "seminar_id": 1,
        "user_id": 2,
        "rating": 5,
        "feedback": "Seminar sangat informatif dan pembicaranya sangat kompeten. Terima kasih!",
        "points_earned": 100
    }
}
```

**Kemungkinan Error:**

| Kode | Pesan                                              |
|------|----------------------------------------------------|
| 409  | Anda sudah memberikan review untuk seminar ini.   |

---

### Lihat Review Saya (per Seminar)

> **Wajib join dulu** (sudah join via `POST .../join`). Jika belum → `403`

```
GET /api/v1/seminars/{seminarId}/my-review
```

**Response (200):**
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "id": 1,
        "seminar_id": 1,
        "rating": 5,
        "feedback": "Seminar sangat informatif...",
        "points_earned": 100
    }
}
```

**Kemungkinan Error:**

| Kode | Pesan                    |
|------|--------------------------|
| 404  | Belum memberikan review. |

---

### Feedback Seminar (form tanggapan per seminar)

Form **per seminar** (bukan per acara global). Setiap soal punya **`question_type`**: `choice` (pilihan skala / pilihan ganda) atau `text` (isian bebas). **Poin** untuk satu kali menyelesaikan **seluruh** soal aktif hanya lewat field seminar **`feedback_completion_points`** (dapat disetel admin, adjustable). Satu transaksi `seminar_feedback` per peserta per seminar = nilai itu (bukan poin per baris jawaban).

**Wajib:** check-in + **sudah join** seminar. Tanpa check-in / belum join → `403` (sama gate seperti tanya & review).

**Dapat poin maksimal sekali** jika isi **semua** soal aktif dalam **satu** `POST` (tidak parsial). Submit ulang (setelah tercatat) → `409`.

| Method | Path | Fungsi |
|--------|------|--------|
| GET    | `/api/v1/seminars/{seminarId}/feedback` | `has_submitted`, `points_for_complete_set` (= `feedback_completion_points` seminar), per soal: `body`, `question_type`, soal `choice` → `options[]` (`id`, `label`); soal `text` → `options` kosong. `my_response` per soal bila sudah: choice → `feedback_option_id` + `label`; text → `answer` |
| POST   | `/api/v1/seminars/{seminarId}/feedback` | `responses` harus memuat **tepat satu** entri per `question_id` aktif. Soal `choice`: `{ "question_id", "option_id" }`. Soal `text`: `{ "question_id", "answer" }` (1–5000 karakter) |

Response sukses menyertakan `total_points_earned`: sama dengan nilai **`feedback_completion_points`** pada seminar jika > 0 (satu transaksi `seminar_feedback`). Jika **0**, naikkan dulu lewat **`PUT /api/v1/admin/seminars/{id}`**.

**Contoh `POST` (gabungan pilihan + isian):**
```json
{
  "responses": [
    { "question_id": 1, "option_id": 12 },
    { "question_id": 2, "option_id": 16 },
    { "question_id": 5, "answer": "Aktivitas booth Gastro paling menarik." }
  ]
}
```

**Admin** mengelola soal: **poin** satu set hanya lewat `feedback_completion_points` (POST/PUT seminar).

- `GET /api/v1/admin/seminars/{seminarId}/feedback` — daftar soal; field `question_type` (`choice` \| `text`)
- `POST /api/v1/admin/seminars/{seminarId}/feedback/questions` — body: `body` (wajib), `question_type` (`choice` \| `text`, default `choice`) — alias: `type`
- `PUT/DELETE .../feedback/questions/{feedbackQuestionId}` — ubah tipe; bila jadi `text`, opsi lama dihapus otomatis
- `POST .../feedback/questions/{feedbackQuestionId}/options` — hanya untuk soal `choice` — body: `label` (wajib), `sort_order?`, `is_active?`
- `PUT/DELETE /api/v1/admin/seminars/{seminarId}/feedback/options/{feedbackOptionId}` — body: `label?`, `sort_order?`, `is_active?`

---

## 4. Endpoint Admin — Kelola Participant

Semua endpoint di bagian ini memerlukan login sebagai **admin**. Jika bukan admin, akan dikembalikan `403 Akses ditolak.`

### Tambah Participant (Satuan)

```
POST /api/v1/participants
```

Mendukung 2 mode pengiriman:
- **JSON** — QR code dan gambar otomatis di-generate sistem
- **Form-data** — bisa upload gambar QR sendiri

**Body:**

| Field                | Tipe    | Wajib | Keterangan                     |
|----------------------|---------|-------|--------------------------------|
| name                 | string  | Ya    | Nama lengkap                   |
| email                | string  | Ya    | Email (harus unik)             |
| phone                | string  | Ya    | Nomor HP (harus unik)          |
| clinic_name          | string  | Tidak | Nama klinik                    |
| outlet_number        | integer | Tidak | Nomor outlet                   |
| social_media_account | string  | Tidak | Akun media sosial              |
| rc_club              | boolean | Tidak | Anggota RC Club (default: false) |
| pet                  | string  | Tidak | Jenis hewan peliharaan         |
| scrub_size           | string  | Tidak | Ukuran scrub                   |
| qr_code              | string  | Tidak | Kode QR custom (jika kosong, otomatis) |
| qr_image             | file    | Tidak | File gambar QR (jika kosong, otomatis) |

**Contoh Request (JSON, QR otomatis):**
```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "081234567890",
    "clinic_name": "Happy Pets Clinic",
    "outlet_number": 12,
    "rc_club": true,
    "pet": "cat",
    "scrub_size": "L"
}
```

**Response Berhasil (201):**
```json
{
    "success": true,
    "message": "Participant berhasil ditambahkan.",
    "data": {
        "id": 2,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "participant",
        "detail": {
            "phone": "081234567890",
            "clinic_name": "Happy Pets Clinic"
        },
        "qr_code": {
            "code": "RC-2026-A3F8XKWM",
            "image_path": "qrcodes/2_RC-2026-A3F8XKWM.svg",
            "is_active": true
        }
    }
}
```

---

### Tambah Participant (Bulk / Massal)

Tambah banyak participant sekaligus dalam satu request. Semua data diproses dalam satu transaksi — jika satu gagal, semua dibatalkan.

```
POST /api/v1/participants/bulk
```

**Body:**

| Field                       | Tipe    | Wajib | Keterangan                     |
|-----------------------------|---------|-------|--------------------------------|
| participants                | array   | Ya    | Array berisi data participant  |
| participants.*.name         | string  | Ya    | Nama lengkap                   |
| participants.*.email        | string  | Ya    | Email (harus unik)             |
| participants.*.phone        | string  | Ya    | Nomor HP (harus unik)          |
| participants.*.clinic_name  | string  | Tidak | Nama klinik                    |
| participants.*.outlet_number| integer | Tidak | Nomor outlet                   |
| participants.*.rc_club      | boolean | Tidak | Anggota RC Club                |
| participants.*.pet          | string  | Tidak | Jenis hewan peliharaan         |
| participants.*.scrub_size   | string  | Tidak | Ukuran scrub                   |
| participants.*.qr_code      | string  | Tidak | Kode QR custom (jika kosong, otomatis) |

**Contoh Request:**
```json
{
    "participants": [
        {
            "name": "John Doe",
            "email": "john@example.com",
            "phone": "081234567890",
            "clinic_name": "Happy Pets Clinic",
            "rc_club": true,
            "pet": "cat",
            "scrub_size": "L"
        },
        {
            "name": "Jane Smith",
            "email": "jane@example.com",
            "phone": "081298765432",
            "clinic_name": "Pet Care Center",
            "pet": "dog",
            "scrub_size": "M",
            "qr_code": "CUSTOM-QR-001"
        }
    ]
}
```

**Response Berhasil (201):**
```json
{
    "success": true,
    "message": "2 participant berhasil ditambahkan.",
    "data": {
        "count": 2,
        "participants": [ ... ]
    }
}
```

---

### Daftar Semua Participant

```
GET /api/v1/participants?page=1
```

Menampilkan **10** participant per halaman (urutan `id` terbesar dulu).

**Response (200):**
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "current_page": 1,
        "data": [ ... ],
        "last_page": 3,
        "per_page": 10,
        "total": 50
    }
}
```

---

### Detail Participant

```
GET /api/v1/participants/{id}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "id": 2,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "participant",
        "detail": { ... },
        "qr_code": { ... },
        "check_in": { ... }
    }
}
```

### Update Participant

```
PUT  /api/v1/participants/{id}
PATCH /api/v1/participants/{id}
```

- **Akses:** admin.
- **Isi body:** sama seperti [Tambah Participant (Satuan)](#tambah-participant-satuan) — **kirim hanya field yang diubah** (partial). Mendukung **JSON** atau **form-data** (termasuk ganti `qr_code` / upload `qr_image`).
- Email & nomor HP tetap mematuhi aturan **unik** (kecuali milik partisipan yang sedang diedit).
- **Response 200** — data partisipan terbaru (termasuk `detail`, `qr_code`, `check_in`).

### Hapus Participant

```
DELETE /api/v1/participants/{id}
```

- **Akses:** admin; hanya jika `role` = `participant`.
- Menghapus token Sanctum user, data terkait mengikuti **foreign key** di database.
- **Response 200** — `message` sukses.

---

## 5. Endpoint Admin — Check-In Hari H

Digunakan saat event berlangsung. Admin scan QR code participant untuk check-in. **+100 poin** peserta tercatat di `point_transactions` (`reason_code`: `check_in`).

### Scan QR Code

```
POST /api/v1/check-in/scan
```

**Body:**

| Field   | Tipe   | Wajib | Keterangan              |
|---------|--------|-------|-------------------------|
| qr_code | string | Ya    | Kode QR yang di-scan    |

**Contoh Request:**
```json
{
    "qr_code": "RC-2026-A3F8XKWM"
}
```

**Response Berhasil (201):**
```json
{
    "success": true,
    "message": "Check-in berhasil. +100 poin.",
    "data": {
        "id": 1,
        "user_id": 2,
        "verified_by": 1,
        "checked_in_at": "2026-04-06T08:01:00.000000Z",
        "user": {
            "id": 2,
            "name": "John Doe",
            "detail": { "phone": "081234567890", "clinic_name": "Happy Pets Clinic" }
        },
        "verifier": {
            "id": 1,
            "name": "Admin"
        }
    }
}
```

**Kemungkinan Error:**

| Kode | Pesan                       |
|------|-----------------------------|
| 404  | QR code tidak valid.        |
| 409  | Participant sudah check-in. |

---

### Daftar Semua Check-In

```
GET /api/v1/check-ins?page=1
```

Menampilkan 20 data per halaman, diurutkan dari yang terbaru.

---

### Cek Status Check-In per User

```
GET /api/v1/check-ins/{userId}
```

**Response Berhasil (200):**
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "id": 1,
        "user_id": 2,
        "checked_in_at": "2026-04-06T08:01:00.000000Z",
        "user": { "id": 2, "name": "John Doe" },
        "verifier": { "id": 1, "name": "Admin" }
    }
}
```

**Kemungkinan Error:**

| Kode | Pesan          |
|------|----------------|
| 404  | Belum check-in.|

---

## 6. Endpoint Admin — Kelola Seminar

### Tambah Seminar (dengan Pembicara)

Buat seminar baru beserta daftar pembicaranya sekaligus. Gunakan `form-data` untuk upload thumbnail dan foto pembicara.

```
POST /api/v1/admin/seminars
```

**Body (form-data):**

| Field                 | Tipe    | Wajib | Keterangan                     |
|-----------------------|---------|-------|--------------------------------|
| title                 | string  | Ya    | Judul seminar                  |
| description           | string  | Tidak | Deskripsi seminar              |
| thumbnail             | file    | Tidak | Gambar thumbnail (maks 2MB)    |
| starts_at             | date    | Tidak | Waktu mulai                    |
| ends_at               | date    | Tidak | Waktu selesai (≥ starts_at)    |
| is_active             | boolean | Tidak | Status aktif (default: true)   |
| join_points           | integer | Tidak | Poin saat peserta join (0–1000000; default **100** jika tidak dikirim) |
| feedback_completion_points | integer | Tidak | Poin **satu kali** jika feedback kuesioner **lengkap** tersubmit (0–1000000; default **100** jika tidak dikirim, selaras `join_points`). Bukan jumlah per opsi. **Seminar lama** yang masih 0: naikkan lewat `PUT` admin jika ingin poin saat submit. |
| speakers[0][name]     | string  | Ya    | Nama pembicara ke-1            |
| speakers[0][title]    | string  | Tidak | Jabatan/gelar pembicara ke-1   |
| speakers[0][photo]    | file    | Tidak | Foto pembicara ke-1            |
| speakers[0][bio]      | string  | Tidak | Bio pembicara ke-1             |
| speakers[1][name]     | string  | Ya    | Nama pembicara ke-2            |
| ...                   |         |       | dst.                           |

**Response Berhasil (201):**
```json
{
    "success": true,
    "message": "Seminar berhasil ditambahkan.",
    "data": {
        "id": 1,
        "title": "Nutrisi Kucing Indoor",
        "description": "Pembahasan mengenai nutrisi optimal...",
        "thumbnail": "seminars/abc123.jpg",
        "starts_at": "2026-04-10T09:00:00.000000Z",
        "ends_at": "2026-04-10T12:00:00.000000Z",
        "is_active": true,
        "join_points": 100,
        "feedback_completion_points": 100,
        "speakers": [
            {
                "id": 1,
                "name": "drh. Budi Santoso",
                "title": "Spesialis Nutrisi Hewan",
                "photo": "speakers/budi.jpg",
                "bio": "10 tahun pengalaman..."
            }
        ]
    }
}
```

---

### Update Seminar

```
PUT /api/v1/admin/seminars/{seminarId}
```

Kirim hanya field yang ingin diubah (tidak termasuk speakers — kelola terpisah).

**Body (form-data):**

| Field       | Tipe    | Wajib | Keterangan                   |
|-------------|---------|-------|------------------------------|
| title       | string  | Tidak | Judul seminar                |
| description | string  | Tidak | Deskripsi                    |
| thumbnail   | file    | Tidak | Gambar baru (replace lama)   |
| starts_at   | date    | Tidak | Waktu mulai                  |
| ends_at     | date    | Tidak | Waktu selesai                |
| is_active   | boolean | Tidak | Status aktif                 |
| join_points | integer | Tidak | Poin join (0–1000000); ubah hanya jika perlu |
| feedback_completion_points | integer | Tidak | Poin satu set feedback lengkap (0–1000000) |

**Response Berhasil (200):**
```json
{
    "success": true,
    "message": "Seminar berhasil diperbarui.",
    "data": { ... }
}
```

---

### Hapus Seminar

```
DELETE /api/v1/admin/seminars/{seminarId}
```

**Response (200):**
```json
{
    "success": true,
    "message": "Seminar berhasil dihapus.",
    "data": null
}
```

---

### Daftar Seminar (Admin)

```
GET /api/v1/admin/seminars?page=1
```

Menampilkan semua seminar (aktif & nonaktif) beserta jumlah pertanyaan dan review.

---

### Detail Seminar (Admin)

```
GET /api/v1/admin/seminars/{seminarId}
```

---

### Tambah Pembicara ke Seminar

```
POST /api/v1/admin/seminars/{seminarId}/speakers
```

**Body (form-data):**

| Field | Tipe   | Wajib | Keterangan         |
|-------|--------|-------|--------------------|
| name  | string | Ya    | Nama pembicara     |
| title | string | Tidak | Jabatan/gelar      |
| photo | file   | Tidak | Foto (maks 2MB)    |
| bio   | string | Tidak | Bio/deskripsi      |

**Response Berhasil (201):**
```json
{
    "success": true,
    "message": "Pembicara berhasil ditambahkan.",
    "data": {
        "id": 3,
        "seminar_id": 1,
        "name": "drh. Ahmad",
        "title": "Dokter Hewan Klinik XYZ",
        "photo": "speakers/ahmad.jpg",
        "bio": null
    }
}
```

---

### Update Pembicara

```
PUT /api/v1/admin/seminars/{seminarId}/speakers/{speakerId}
```

**Body (form-data):** sama seperti tambah pembicara (semua opsional).

---

### Hapus Pembicara

```
DELETE /api/v1/admin/seminars/{seminarId}/speakers/{speakerId}
```

**Kemungkinan Error:**

| Kode | Pesan                                        |
|------|----------------------------------------------|
| 404  | Pembicara tidak ditemukan di seminar ini.    |

---

### Lihat Pertanyaan per Seminar

Admin dapat melihat semua pertanyaan yang disubmit partisipan. Bisa difilter berdasarkan pembicara.

```
GET /api/v1/admin/seminars/{seminarId}/questions?speaker_id=1&page=1
```

**Query Parameter:**

| Parameter  | Tipe    | Wajib | Keterangan                          |
|------------|---------|-------|-------------------------------------|
| speaker_id | integer | Tidak | Filter pertanyaan untuk pembicara tertentu |
| page       | integer | Tidak | Halaman (20 per halaman)            |

**Response (200):**
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "question": "Bagaimana cara menentukan porsi makan?",
                "points_earned": 100,
                "created_at": "2026-04-10T09:15:00.000000Z",
                "user": {
                    "id": 2,
                    "name": "John Doe",
                    "detail": { "phone": "081234567890", "clinic_name": "Happy Pets" }
                },
                "speaker": {
                    "id": 1,
                    "name": "drh. Budi Santoso"
                }
            }
        ],
        "last_page": 1,
        "per_page": 20,
        "total": 5
    }
}
```

### Hapus pertanyaan (moderasi)

```
DELETE /api/v1/admin/seminars/{seminarId}/questions/{seminarQuestionId}
```

- **Akses:** admin; `seminarQuestionId` harus milik `seminarId` yang sama.
- Menghapus baris pertanyaan dari peserta. **Tidak** menyesuaikan saldo poin partisipan secara otomatis.

---

### Lihat Review per Seminar

```
GET /api/v1/admin/seminars/{seminarId}/reviews?page=1
```

**Response (200):**
```json
{
    "success": true,
    "message": "Success",
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "rating": 5,
                "feedback": "Seminar sangat informatif...",
                "points_earned": 100,
                "created_at": "2026-04-10T12:05:00.000000Z",
                "user": {
                    "id": 2,
                    "name": "John Doe",
                    "detail": { "phone": "081234567890" }
                }
            }
        ],
        "last_page": 1,
        "per_page": 20,
        "total": 10
    }
}
```

### Hapus review (moderasi)

```
DELETE /api/v1/admin/seminars/{seminarId}/reviews/{seminarReviewId}
```

- **Akses:** admin; review harus untuk seminar tersebut.
- **Tidak** menyesuaikan saldo poin partisipan secara otomatis.

---

## 7. Endpoint Participant — Aktivitas Event

Semua endpoint memerlukan `Authorization: Bearer {token}` (participant).

**`GET /activities` (daftar aktivitas aktif):** cukup login — **tidak** memerlukan check-in.

**Endpoint lain** di bagian ini (`POST /activities/scan`, sesi, abandon, dll.): peserta harus sudah **check-in acara**; jika belum → **403**.

Poin per aktivitas **bukan nilai tetap** — diatur di database (`activities.default_reward_points`, `activity_questions.reward_points`, atau `reward_points_override` pada QR usher). Pencairan dari aktivitas ini ikut tercatat di `point_transactions` (sama seperti check-in & seminar); peserta melihat gabungannya di **`GET /api/v1/me/point-transactions`**. Idempotensi per aksi.

**Satu kali per aktivitas per peserta:** untuk satu `activity_id`, peserta hanya boleh satu “permainan” seumur hidup di sistem. Jika sesi **system_qa** sudah pernah ada (selesai, menyerah, atau masih aktif lalu dilanjutkan), scan QR **mulai** lagi → **409** `Aktivitas ini hanya bisa dimainkan sekali.` Untuk alur **usher_reward**, setelah poin usher pernah berhasil dicatat untuk aktivitas itu, scan QR usher manapun untuk aktivitas yang sama → **409** dengan pesan yang sama.

### Daftar Aktivitas Aktif

```
GET /api/v1/activities
```

**Akses:** hanya perlu login (tanpa syarat check-in).

**Response (200):** array aktivitas: `id`, `code`, `name`, `description`, `flow_type` (`system_qa` \| `usher_reward`), `questions_per_session`, `default_reward_points`, **`play_status`**, plus **`scannable_codes`**.

**`play_status`:** hanya dua nilai — **`completed`** atau **`uncompleted`** (per user login).
- **`uncompleted`:** belum selesai — belum ada sesi / belum dapat poin usher; atau sesi `system_qa` masih **active** (sedang berjalan).
- **`completed`:** sudah selesai — `usher_reward` dengan poin usher tercatat; atau `system_qa` dengan sesi **completed** atau **abandoned** (keduanya dianggap selesai).

**`scannable_codes`:** kode yang masih berlaku (`is_active` dan belum lewat `expires_at`); masing-masing `id`, `public_token` (untuk `POST /activities/scan`), `code_kind` (`start_session` \| `answer_for_question` \| `usher_reward`), `activity_question_id` (jika soal), `reward_points` (hanya `usher_reward`), `expires_at`, `qr_image_path` (jika ada). `is_correct_answer` tidak disertakan.

---

### Scan QR Aktivitas (satu endpoint untuk semua jenis QR)

Mengirim **token** yang sama dengan string yang di-encode di QR (bukan gambar).

```
POST /api/v1/activities/scan
```

**Body:**

| Field                   | Tipe    | Wajib | Keterangan |
|-------------------------|---------|-------|------------|
| token                   | string  | Ya    | `public_token` dari tabel `activity_scannable_codes` |
| activity_question_id    | integer | Tidak | **Hanya untuk aktivitas `STUDY_CASE`:** id soal yang dipilih user di UI. Harus sama dengan soal di QR. Aktivitas lain (mis. Gastro) mengabaikan field ini dan menjawab **berurutan** (`position`). |

**Perilaku ringkas:**

| Jenis QR (`code_kind`)   | Kapan dipakai |
|--------------------------|----------------|
| `start_session`        | Mulai sesi (Gastro Fact/Product, Study Case). `flow_type` aktivitas harus `system_qa`. |
| `answer_for_question`  | **Study Case (`STUDY_CASE`):** urutan bebas; pilih soal lalu scan (disarankan kirim `activity_question_id`). **Aktivitas `system_qa` lain:** satu soal per sesi atau **berurutan** menurut `position`. |
| `usher_reward`         | RC Club / Nutrition / Social: klaim poin setelah validasi usher. |

**Response:** bergantung alur (mulai sesi, jawaban benar/salah, usher sukses, atau error 4xx).

---

### Sesi Aktif Saya

```
GET /api/v1/activities/sessions/active
GET /api/v1/activities/sessions/active?activity_id=1
```

**Response (200):** array objek sesi (format sama seperti field `session` pada response scan).

---

### Detail Satu Sesi

```
GET /api/v1/activities/sessions/{user_activity_session}
```

Hanya pemilik sesi (`user_id` = user login).

---

### Akhiri Sesi Lebih Awal (semua benar sudah otomatis selesai)

Peserta bisa mengakhiri sesi kapan saja jika masih ada soal belum dijawab atau tidak ingin melanjutkan. Soal yang sudah dijawab benar tetap mendapat poin; yang masih `pending` ditandai tidak selesai tanpa poin.

```
POST /api/v1/activities/sessions/{user_activity_session}/abandon
```

Menandai sesi `abandoned` dan tantangan yang masih `pending` menjadi `skipped_abandoned`. Jika sebelumnya semua soal sudah terjawab benar, sesi sudah `completed` (endpoint ini mengembalikan 409).

---

## 8. Endpoint Admin — Kelola Aktivitas Event

Semua endpoint memerlukan user **admin**.

### Daftar Aktivitas

```
GET /api/v1/admin/activities
```

---

### Buat Aktivitas

```
POST /api/v1/admin/activities
```

**Body (JSON):**

| Field                  | Tipe    | Wajib | Keterangan |
|------------------------|---------|-------|------------|
| code                   | string  | Ya    | Unik, mis. `GASTRO_FACT` |
| name                   | string  | Ya    | Nama tampilan |
| description            | string  | Tidak | |
| flow_type              | string  | Ya    | `system_qa` atau `usher_reward` |
| questions_per_session  | integer | Ya    | Jumlah soal diundi per sesi (1 untuk Gastro; 4 untuk Study Case) |
| default_reward_points  | integer | Ya    | Fallback poin jika soal tidak override |
| is_active              | boolean | Tidak | Default true |
| sort_order             | integer | Tidak | Urutan tampilan |

---

### Detail / Update / Hapus Aktivitas

```
GET    /api/v1/admin/activities/{activityId}
PUT    /api/v1/admin/activities/{activityId}
DELETE /api/v1/admin/activities/{activityId}
```

**GET detail:** pada setiap elemen `scannable_codes`, jika `activity_question_id` terisi, field **`question_text`** berisi teks soal (`activity_questions.body`) agar mudah dibaca di admin; untuk kode tanpa soal (mis. `start_session`, `usher_reward`) berisi `null`.

---

### Kelola Soal (bank soal untuk `system_qa`)

```
POST   /api/v1/admin/activities/{activityId}/questions
PUT    /api/v1/admin/activities/{activityId}/questions/{questionId}
DELETE /api/v1/admin/activities/{activityId}/questions/{questionId}
```

**Body (contoh create):** `body` (teks soal), `reward_points` (nullable, integer ≥ 0), `sort_order`, `is_active`.

---

### Buat Token QR (`activity_scannable_codes`)

```
POST /api/v1/admin/activities/{activityId}/scannable-codes
```

**Body (JSON):**

| Field                   | Tipe    | Wajib | Keterangan |
|-------------------------|---------|-------|------------|
| code_kind               | string  | Ya    | `start_session`, `answer_for_question`, `usher_reward` |
| public_token            | string  | Tidak | Jika kosong, di-generate otomatis |
| activity_question_id    | integer | Kondisional | Wajib untuk `answer_for_question` |
| is_correct_answer       | boolean | Kondisional | Wajib untuk `answer_for_question` |
| reward_points_override  | integer | Tidak | Untuk `usher_reward`: override `default_reward_points` |
| max_redemptions_per_user| integer | Tidak | Default 1 |
| expires_at              | datetime| Tidak | |

Aturan: QR `start_session` hanya untuk aktivitas `system_qa`; QR `usher_reward` hanya untuk `usher_reward`.

### Update / Hapus Token QR

```
PUT    /api/v1/admin/activities/{activityId}/scannable-codes/{scannableCodeId}
PATCH  /api/v1/admin/activities/{activityId}/scannable-codes/{scannableCodeId}
DELETE /api/v1/admin/activities/{activityId}/scannable-codes/{scannableCodeId}
```

- **Update:** field opsional (sama makna dengan [Buat Token QR](#buat-token-qr-activity_scannable_codes)): `code_kind`, `public_token`, `activity_question_id`, `is_correct_answer`, `reward_points_override`, `max_redemptions_per_user`, `expires_at`, `is_active`. Aturan tipe aktivitas (system_qa / usher) tetap berlaku. Gambar QR disinkronkan ulang setelah simpan.
- **Hapus:** menghapus token dan file gambar terkait (jika ada).

---

## 9. Form tanggapan seminar — Admin & Participant

**Soal `choice`:** API mengembalikan `options` (tanpa poin). **Soal `text`:** tanpa `option_id` — jawaban tersimpan di `answer_text` (response peserta: field `answer`). **Poin** sekali selesai set: **`feedback_completion_points`** di seminar saja (adjustable admin).

Ringkasan: lihat tabel [Feedback Seminar (form tanggapan per seminar)](#feedback-seminar-form-tanggapan-per-seminar) di bagian participant — seminar. **Pencairan** = nilai `feedback_completion_points` (bukan per soal/opsi). `GET/POST` peserta: `/seminars/{id}/feedback`. Admin kelola: `/api/v1/admin/seminars/{seminarId}/feedback/...` + set poin lewat **POST/PUT** `/api/v1/admin/seminars/{id}`.

---

## 10. Hadiah booth & pencatatan penukaran — Admin & Participant

Peserta memilih hadiah di UI; di booth, **usher (admin)** memindai **QR peserta** dan mengirim `prize_id`. Sistem **mencatat** `points_recorded` (nilai katalog) dan **tidak** mengurangi `user_details.points` — tidak membuat `point_transactions` debit.

**Kelayakan:** poin partisipan saat pencatatan harus `>=` `prizes.points_value` (kecuali nilai 0). **Sekali per hadiah** per peserta: unik `user_id` + `prize_id` (hindari tukar berulang jenis hadiah yang sama). Peserta harus **sudah check-in**.

| Method | Path | Akses | Fungsi |
|--------|------|--------|--------|
| GET    | `/api/v1/prizes` | participant, setelah check-in | Katalog hadiah aktif; tiap item `already_redeemed` |
| GET    | `/api/v1/me/prize-redemptions` | participant | Riwayat penukaran + `prize` |
| GET    | `/api/v1/admin/prizes` | admin | Katalog penuh (CRUD) |
| POST   | `/api/v1/admin/prizes` | admin | `name`, `description?`, `points_value`, `sort_order?`, `is_active?` |
| GET/PUT/DELETE | `/api/v1/admin/prizes/{id}` | admin | |
| POST   | `/api/v1/admin/prize-redemptions/scan` | admin | Body: `qr_code`, `prize_id` — catat penukaran; response `points_balance_unchanged: true` |
| GET    | `/api/v1/admin/prize-redemptions` | admin | Daftar pencatatan; query `?prize_id=`, `?per_page=` |
| DELETE | `/api/v1/admin/prize-redemptions/{id}` | admin | Hapus satu baris pencatatan (koreksi/input salah) |

**Scan (contoh body):**
```json
{
  "qr_code": "RC-2026-A3F8XKWM",
  "prize_id": 1
}
```

---

## 11. Doorprize (undian) — Admin

Pool undian: partisipan **check-in**, poin `>=` batas minimum, **belum** pernah menang (tabel `door_prize_winners`, satu baris per user). Pemenang di-flag admin; poin **tidak** diubah.

**Poin minimum** default dari `.env` / `config` (`DOOR_PRIZE_MIN_POINTS`, default **100**). Query `?min_points=` di GET pool meng-override sementara per request.

| Method | Path | Fungsi |
|--------|------|--------|
| GET    | `/api/v1/admin/door-prize/eligible-participants` | Pool; query `min_points?`, `page`, `per_page` — data pagination + `min_points` + `min_points_config_default` |
| POST   | `/api/v1/admin/door-prize/winners` | Body: `user_id`, `min_points?` — tandai pemenang; `409` jika sudah menang |
| GET    | `/api/v1/admin/door-prize/winners` | Daftar pemenang tercatat (pagination) |
| DELETE | `/api/v1/admin/door-prize/winners/{id}` | Hapus pencatatan pemenang; partisipan dapat masuk pool eligibel lagi |

---

## Sistem Poin

Partisipan mendapatkan poin secara otomatis dari aktivitas berikut. **Setiap penambahan poin** mencatat satu baris di `point_transactions` (saldo `user_details.points` di-update lewat layanan yang sama), sehingga audit trail lengkap.

| Aktivitas                          | Poin   | Keterangan                                 |
|------------------------------------|--------|---------------------------------------------|
| Check-in Admin                     | +100   | 1× per event (nilai saat ini; bisa diubah di kode terkait check-in) |
| Join seminar (tombol)              | **`join_points`** pada seminar (default 100; **0** = tanpa poin) | 1× join per peserta per seminar; `reason_code`: `seminar_join` |
| Kirim pertanyaan (per seminar)     | +100   | Maks 4 pertanyaan pertama mendapat poin     |
| Submit review & feedback           | +100   | 1× per seminar                             |
| **Feedback seminar (kuesioner)**  | **`feedback_completion_points`** pada seminar (1 transaksi) | 1× submit lengkap per seminar; `reason_code`: `seminar_feedback` |
| **Aktivitas event (baru)**         | **Konfigurasi DB** | Gastro / Study Case / Usher: lihat `activities`; riwayat di `point_transactions` |
| Penukaran hadiah booth            | 0     | Pencatatan saja; **bukan** baris `point_transactions` (saldo tidak berkurang) |
| Doorprize                         | 0     | Pencatatan pemenang; **bukan** kredit poin     |

**Maksimal poin dari alur seminar (per seminar, contoh default):** `join_points` (mis. 100) + 400 (4 pertanyaan) + 100 (review) + (opsional) **`feedback_completion_points`** (satu transaksi jika kuesioner diselesaikan) — bukan penjumlahan poin per baris opsi feedback.

Poin terakumulasi di `user_details.points` — ringkasan saldo di `GET /api/v1/me`, **rincian per sumber** di `GET /api/v1/me/point-transactions`.

---

## Data Dummy Aktivitas (Seeder)

Setelah migrasi, jalankan:

```bash
php artisan db:seed --class="Database\Seeders\ActivityEventDummySeeder"
```

Token contoh untuk uji `POST /activities/scan` (lihat juga seeder): `DMY-GF-START`, `DMY-GP-START`, `DMY-SC-START`, `DMY-RC-USHER`, `DMY-NUT-USHER`, `DMY-SOC-USHER`, serta token jawaban `DMY-GF-Q1-OK` / `DMY-GF-Q1-BAD`, dll.

**Dummy feedback seminar + hadiah booth** (idempotent, ikut jalan bila `php artisan db:seed` tanpa class):

```bash
php artisan db:seed --class="Database\Seeders\FeedbackAndPrizeDummySeeder"
```

- Seminar judul `[DUMMY] Seminar — Uji Feedback` dengan **`feedback_completion_points` = 200`, **4** soal `choice` (skala 4 opsi) + **2** soal `text` (isian); poin 1x submit mengikuti `feedback_completion_points`.
- Hadiah `[DUMMY] Tote bag Royal Canin`, `[DUMMY] Notebook + pen`, `[DUMMY] Voucher undian spesial` (satu hadiah `points_value` 0 agar katalog bisa diuji tanpa syarat poin).

---

## Konfigurasi environment

| Key | Fungsi | Default (contoh) |
|-----|--------|------------------|
| `DOOR_PRIZE_MIN_POINTS` | Poin minimum pool undian doorprize | `100` |

Dikonfigurasi lewat `config/door_prize.php` (membaca `env`).

---

## Kode Status HTTP

| Kode | Arti                                              |
|------|---------------------------------------------------|
| 200  | Berhasil                                          |
| 201  | Berhasil dibuat (create/check-in)                 |
| 401  | Token tidak valid atau belum login                |
| 403  | Tidak punya akses (bukan admin / belum aktivasi / **participant belum check-in** pada endpoint yang memerlukannya — bukan untuk `GET /seminars` atau `GET /activities`)  |
| 404  | Data tidak ditemukan                              |
| 409  | Konflik (sudah check-in / akun sudah aktif)       |
| 422  | Validasi gagal                                    |
| 429  | Terlalu banyak request (rate limit)               |

---

## Ringkasan Endpoint

### Publik
| Method | Endpoint                    | Fungsi                              |
|--------|-----------------------------|--------------------------------------|
| POST   | `/api/v1/setup-password`    | Buat password (via nomor HP)        |
| POST   | `/api/v1/login`             | Login (email + password)            |

### Participant (Login)
| Method | Endpoint                                    | Fungsi                                    |
|--------|---------------------------------------------|-------------------------------------------|
| POST   | `/api/v1/logout`                            | Logout                                    |
| GET    | `/api/v1/me`                                | Lihat profil + poin                       |
| PUT    | `/api/v1/me`                                | Update profil                             |
| GET    | `/api/v1/me/point-transactions`             | Riwayat transaksi poin (paginasi)         |
| GET    | `/api/v1/seminars`                          | Daftar seminar aktif (+ status join)      |
| POST   | `/api/v1/seminars/{id}/join`                | Join seminar (tombol)                  |
| GET    | `/api/v1/seminars/{id}`                     | Detail seminar + stats saya (wajib join)  |
| POST   | `/api/v1/seminars/{id}/questions`           | Kirim pertanyaan ke pembicara (wajib join)|
| GET    | `/api/v1/seminars/{id}/my-questions`        | Lihat pertanyaan saya (wajib join)        |
| POST   | `/api/v1/seminars/{id}/review`              | Submit review & feedback (wajib join)     |
| GET    | `/api/v1/seminars/{id}/my-review`           | Lihat review saya (wajib join)            |
| GET    | `/api/v1/seminars/{id}/feedback`            | Feedback kuesioner seminar (wajib check-in + join) |
| POST   | `/api/v1/seminars/{id}/feedback`            | Submit feedback (semua soal aktif sekaligus) |
| GET    | `/api/v1/prizes`                            | Katalog hadiah booth (wajib check-in)     |
| GET    | `/api/v1/me/prize-redemptions`              | Riwayat penukaran hadiah (wajib check-in) |
| GET    | `/api/v1/activities`                        | Daftar aktivitas + `play_status` + `scannable_codes` |
| POST   | `/api/v1/activities/scan`                   | Scan QR aktivitas (token)                 |
| GET    | `/api/v1/activities/sessions/active`        | Sesi aktivitas aktif saya                 |
| GET    | `/api/v1/activities/sessions/{id}`          | Detail sesi aktivitas                     |
| POST   | `/api/v1/activities/sessions/{id}/abandon`  | Menyerah / hentikan sesi                  |

### Admin
| Method | Endpoint                                              | Fungsi                          |
|--------|-------------------------------------------------------|---------------------------------|
| GET    | `/api/v1/participants`                                | Daftar participant              |
| GET    | `/api/v1/participants/{id}`                           | Detail participant              |
| PUT/PATCH | `/api/v1/participants/{id}`                        | Update participant              |
| DELETE | `/api/v1/participants/{id}`                           | Hapus participant               |
| POST   | `/api/v1/participants`                                | Tambah participant              |
| POST   | `/api/v1/participants/bulk`                           | Tambah participant massal       |
| PATCH  | `/api/v1/participants/sales-responsible`              | Bulk update sales (by email)    |
| POST   | `/api/v1/check-in/scan`                               | Scan QR → check-in (+100 poin) |
| GET    | `/api/v1/check-ins`                                   | Daftar check-in                 |
| GET    | `/api/v1/check-ins/{userId}`                          | Status check-in per user        |
| POST   | `/api/v1/admin/seminars`                              | Buat seminar + pembicara        |
| GET    | `/api/v1/admin/seminars`                              | Daftar semua seminar            |
| GET    | `/api/v1/admin/seminars/{id}`                         | Detail seminar                  |
| PUT    | `/api/v1/admin/seminars/{id}`                         | Update seminar                  |
| DELETE | `/api/v1/admin/seminars/{id}`                         | Hapus seminar                   |
| POST   | `/api/v1/admin/seminars/{id}/speakers`                | Tambah pembicara                |
| PUT    | `/api/v1/admin/seminars/{id}/speakers/{speakerId}`    | Update pembicara                |
| DELETE | `/api/v1/admin/seminars/{id}/speakers/{speakerId}`    | Hapus pembicara                 |
| GET    | `/api/v1/admin/seminars/{id}/questions`               | Lihat pertanyaan (filter speaker)|
| DELETE | `/api/v1/admin/seminars/{id}/questions/{qid}`         | Hapus pertanyaan (moderasi)     |
| GET    | `/api/v1/admin/seminars/{id}/reviews`                 | Lihat review partisipan         |
| DELETE | `/api/v1/admin/seminars/{id}/reviews/{rid}`           | Hapus review (moderasi)         |
| GET/POST/PUT/DELETE | `/api/v1/admin/seminars/{id}/feedback/...`   | Soal/opsi feedback per seminar  |
| GET/POST/PUT/DELETE | `/api/v1/admin/prizes` & `/api/v1/admin/prizes/{id}` | Katalog hadiah        |
| GET    | `/api/v1/admin/prize-redemptions`                     | Daftar pencatatan penukaran     |
| DELETE | `/api/v1/admin/prize-redemptions/{id}`                 | Hapus pencatatan penukaran      |
| POST   | `/api/v1/admin/prize-redemptions/scan`                 | Usher: scan QR + `prize_id`  |
| GET    | `/api/v1/admin/door-prize/eligible-participants`      | Pool undian doorprize            |
| POST   | `/api/v1/admin/door-prize/winners`                    | Tandai pemenang doorprize        |
| GET    | `/api/v1/admin/door-prize/winners`                    | Daftar pemenang                  |
| DELETE | `/api/v1/admin/door-prize/winners/{id}`               | Hapus pencatatan pemenang       |
| GET    | `/api/v1/admin/activities`                            | Daftar aktivitas event          |
| POST   | `/api/v1/admin/activities`                            | Buat aktivitas                  |
| GET    | `/api/v1/admin/activities/{id}`                       | Detail aktivitas                |
| PUT    | `/api/v1/admin/activities/{id}`                       | Update aktivitas                |
| DELETE | `/api/v1/admin/activities/{id}`                       | Hapus aktivitas                 |
| POST   | `/api/v1/admin/activities/{id}/questions`           | Tambah soal                     |
| PUT    | `/api/v1/admin/activities/{id}/questions/{qid}`     | Update soal                     |
| DELETE | `/api/v1/admin/activities/{id}/questions/{qid}`      | Hapus soal                      |
| POST   | `/api/v1/admin/activities/{id}/scannable-codes`     | Buat token QR                   |
| PUT/PATCH | `/api/v1/admin/activities/{id}/scannable-codes/{cid}` | Update token QR              |
| DELETE | `/api/v1/admin/activities/{id}/scannable-codes/{cid}` | Hapus token QR                |
