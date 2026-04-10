# Dokumentasi API — Royal Canin Event

Base URL: `https://api.royalcaninvetsymposium.id/api/v1`

## Daftar Isi

1. [Alur Penggunaan](#alur-penggunaan)
2. [Format Response](#format-response)
3. [Autentikasi](#autentikasi)
4. [Endpoint Publik](#1-endpoint-publik-tanpa-login)
5. [Endpoint Participant](#2-endpoint-participant-perlu-login)
6. [Endpoint Admin — Kelola Participant](#3-endpoint-admin--kelola-participant)
7. [Endpoint Admin — Check-In Hari H](#4-endpoint-admin--check-in-hari-h)
8. [Kode Status HTTP](#kode-status-http)

---

## Alur Penggunaan

### Alur Admin

```
Login → Tambah Participant (satuan/bulk) → Hari H: Scan QR Code → Selesai
```

### Alur Participant

```
Terima link → Buka link, input nomor HP → Buat password → Login → Lihat Profil & QR Code
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

Participant yang sudah didaftarkan admin membuka link, memasukkan nomor HP, lalu membuat password.

```
POST /api/v1/setup-password
```

**Body:**

| Field                 | Tipe   | Wajib | Keterangan                 |
| --------------------- | ------ | ----- | -------------------------- |
| phone                 | string | Ya    | Nomor HP terdaftar         |
| password              | string | Ya    | Minimal 8 karakter         |
| password_confirmation | string | Ya    | Harus sama dengan password |

**Contoh Request:**

```json
{
  "phone": "081234567890",
  "password": "password",
  "password_confirmation": "password"
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
      "name": "John Doe",
      "email": "john@example.com",
      "role": "participant",
      "detail": { "phone": "081234567890", "clinic_name": "Happy Pets Clinic" },
      "qr_code": {
        "code": "RC-2026-A3F8XKWM",
        "image_path": "qrcodes/2_RC-2026-A3F8XKWM.svg"
      }
    },
    "token": "2|abc123..."
  }
}
```

**Kemungkinan Error:**

| Kode | Pesan                            |
| ---- | -------------------------------- |
| 404  | Nomor telepon tidak ditemukan.   |
| 409  | Akun sudah aktif. Silakan login. |

---

### Login

Login untuk participant maupun admin menggunakan endpoint yang sama.

```
POST /api/v1/login
```

**Rate Limit:** 10 request per menit per kombinasi IP + email.

**Body:**

| Field    | Tipe   | Wajib | Keterangan |
| -------- | ------ | ----- | ---------- |
| email    | string | Ya    | Email      |
| password | string | Ya    | Password   |

**Contoh Request:**

```json
{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response Berhasil (200):**

```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "admin@example.com",
      "role": "admin"
    },
    "token": "1|abc123..."
  }
}
```

**Kemungkinan Error:**

| Kode | Pesan                                                          |
| ---- | -------------------------------------------------------------- |
| 403  | Akun belum diaktifkan. Silakan setup password terlebih dahulu. |
| 422  | Email tidak ditemukan.                                         |
| 422  | Email atau password salah.                                     |

---

## 2. Endpoint Participant (Perlu Login)

Semua endpoint di bagian ini memerlukan header `Authorization: Bearer {token}`.

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
| -------------------- | ------- | ---------------------- |
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

## 3. Endpoint Admin — Kelola Participant

Semua endpoint di bagian ini memerlukan login sebagai **admin**. Jika bukan admin, akan dikembalikan `403 Akses ditolak.`

### Tambah Participant (Satuan)

```
POST /api/v1/participants
```

Mendukung 2 mode pengiriman:

- **JSON** — QR code dan gambar otomatis di-generate sistem
- **Form-data** — bisa upload gambar QR sendiri

**Body:**

| Field                | Tipe    | Wajib | Keterangan                             |
| -------------------- | ------- | ----- | -------------------------------------- |
| name                 | string  | Ya    | Nama lengkap                           |
| email                | string  | Ya    | Email (harus unik)                     |
| phone                | string  | Ya    | Nomor HP (harus unik)                  |
| clinic_name          | string  | Tidak | Nama klinik                            |
| outlet_number        | integer | Tidak | Nomor outlet                           |
| social_media_account | string  | Tidak | Akun media sosial                      |
| rc_club              | boolean | Tidak | Anggota RC Club (default: false)       |
| pet                  | string  | Tidak | Jenis hewan peliharaan                 |
| scrub_size           | string  | Tidak | Ukuran scrub                           |
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

| Field                         | Tipe    | Wajib | Keterangan                             |
| ----------------------------- | ------- | ----- | -------------------------------------- |
| participants                  | array   | Ya    | Array berisi data participant          |
| participants.\*.name          | string  | Ya    | Nama lengkap                           |
| participants.\*.email         | string  | Ya    | Email (harus unik)                     |
| participants.\*.phone         | string  | Ya    | Nomor HP (harus unik)                  |
| participants.\*.clinic_name   | string  | Tidak | Nama klinik                            |
| participants.\*.outlet_number | integer | Tidak | Nomor outlet                           |
| participants.\*.rc_club       | boolean | Tidak | Anggota RC Club                        |
| participants.\*.pet           | string  | Tidak | Jenis hewan peliharaan                 |
| participants.\*.scrub_size    | string  | Tidak | Ukuran scrub                           |
| participants.\*.qr_code       | string  | Tidak | Kode QR custom (jika kosong, otomatis) |

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

Menampilkan 20 participant per halaman.

**Response (200):**

```json
{
    "success": true,
    "message": "Success",
    "data": {
        "current_page": 1,
        "data": [ ... ],
        "last_page": 3,
        "per_page": 20,
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

---

## 4. Endpoint Admin — Check-In Hari H

Digunakan saat event berlangsung. Admin scan QR code participant untuk check-in.

### Scan QR Code

```
POST /api/v1/check-in/scan
```

**Body:**

| Field   | Tipe   | Wajib | Keterangan           |
| ------- | ------ | ----- | -------------------- |
| qr_code | string | Ya    | Kode QR yang di-scan |

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
  "message": "Check-in berhasil.",
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
| ---- | --------------------------- |
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

| Kode | Pesan           |
| ---- | --------------- |
| 404  | Belum check-in. |

---

## Kode Status HTTP

| Kode | Arti                                             |
| ---- | ------------------------------------------------ |
| 200  | Berhasil                                         |
| 201  | Berhasil dibuat (create/check-in)                |
| 401  | Token tidak valid atau belum login               |
| 403  | Tidak punya akses (bukan admin / belum aktivasi) |
| 404  | Data tidak ditemukan                             |
| 409  | Konflik (sudah check-in / akun sudah aktif)      |
| 422  | Validasi gagal                                   |
| 429  | Terlalu banyak request (rate limit)              |

---

## Ringkasan Endpoint

| Method | Endpoint                     | Akses  | Fungsi                       |
| ------ | ---------------------------- | ------ | ---------------------------- |
| POST   | `/api/v1/setup-password`     | Publik | Buat password (via nomor HP) |
| POST   | `/api/v1/login`              | Publik | Login                        |
| POST   | `/api/v1/logout`             | Login  | Logout                       |
| GET    | `/api/v1/me`                 | Login  | Lihat profil                 |
| PUT    | `/api/v1/me`                 | Login  | Update profil                |
| GET    | `/api/v1/participants`       | Admin  | Daftar participant           |
| GET    | `/api/v1/participants/{id}`  | Admin  | Detail participant           |
| POST   | `/api/v1/participants`       | Admin  | Tambah participant           |
| POST   | `/api/v1/participants/bulk`  | Admin  | Tambah participant massal    |
| POST   | `/api/v1/check-in/scan`      | Admin  | Scan QR → check-in           |
| GET    | `/api/v1/check-ins`          | Admin  | Daftar check-in              |
| GET    | `/api/v1/check-ins/{userId}` | Admin  | Status check-in per user     |
