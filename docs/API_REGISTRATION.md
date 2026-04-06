# API contract — registrasi Vet Symposium 2026

Dokumen ini menyelaraskan payload JSON antara frontend Next.js dan backend Laravel yang akan datang. Tipe TypeScript sumber kebenaran ada di `src/types/registration.ts`.

## Endpoint (FE mock saat ini)

| Lingkungan                   | Method | Path                                                       |
| ---------------------------- | ------ | ---------------------------------------------------------- |
| Next.js Route Handler (mock) | `POST` | `/api/register`                                            |
| Produksi (nanti)             | `POST` | `{BASE_URL_LARAVEL}/api/v1/register` (sesuaikan dengan BE) |

## Request headers

- `Content-Type: application/json`

## Request body (`RegistrationRequestBody`)

| Field               | Tipe                | Wajib | Keterangan                           |
| ------------------- | ------------------- | ----- | ------------------------------------ |
| `email`             | string              | Ya    | Email valid                          |
| `fullName`          | string              | Ya    | Nama lengkap dokter (gelar/titel)    |
| `phone`             | string              | Ya    | Nomor WhatsApp                       |
| `clinicName`        | string              | Ya    | Nama klinik                          |
| `nio`               | string              | Ya    | Number Identification Outlet         |
| `socialMedia`       | string              | Tidak | Handle atau URL; boleh string kosong |
| `royalCaninClub`    | `"ya"` \| `"tidak"` | Ya    | Keanggotaan Royal Canin Club         |
| `petTypes`          | lihat enum di TS    | Ya    | Hewan kesayangan                     |
| `scrubSize`         | `"S"` … `"4XL"`     | Ya    | Ukuran scrub                         |
| `agreedToPrivacy`   | boolean             | Ya    | Harus `true`                         |
| `agreedToAdminOnly` | boolean             | Ya    | Harus `true`                         |

## Response sukses (`201 Created`)

```json
{
  "success": true,
  "message": "string",
  "data": {
    "registrationId": "string",
    "submittedAt": "ISO-8601 datetime"
  }
}
```

## Response error (`400` / `422`)

```json
{
  "success": false,
  "message": "string",
  "errors": {
    "fieldKey": ["pesan validasi"]
  }
}
```

## Integrasi Laravel nanti

1. Set `NEXT_PUBLIC_REGISTRATION_API_URL` (atau variabel server-only) ke URL API Laravel.
2. Ganti isi `src/lib/register-client.ts` agar `fetch` mengarah ke URL tersebut (tetap kirim body yang sama).
3. Opsional: proxy lewat Route Handler Next jika perlu menyembunyikan secret atau menambah header auth.
