# HR Portal — Frontend Next.js

Frontend untuk [HR API (NestJS)](https://github.com/syarnass/nestjs): data
karyawan, pengajuan cuti, dan persetujuan atasan.

## Tech Stack

- **Next.js 16** (App Router, TypeScript) + **React 19**
- **Tailwind CSS 4** (otomatis mode gelap mengikuti sistem)
- **SWR** untuk pengambilan data di sisi client

## Cara Menjalankan

Jalankan dulu backend NestJS (default `http://localhost:3000`), lalu:

```bash
npm install
cp .env.example .env.local    # sesuaikan HR_API_URL bila perlu
npm run dev                   # http://localhost:3001
```

Login dengan akun hasil seed backend:

| Role     | Email               | Password       |
|----------|---------------------|----------------|
| ADMIN    | `admin@hr.local`    | `Admin123!`    |
| MANAGER  | `manager@hr.local`  | `Password123!` |
| EMPLOYEE | `karyawan@hr.local` | `Password123!` |

| Variabel     | Default                     | Keterangan                                   |
|--------------|-----------------------------|----------------------------------------------|
| `HR_API_URL` | `http://localhost:3000/api` | URL API NestJS (termasuk prefix `/api`), hanya dibaca server |

## Halaman

| Path              | Akses          | Isi                                                        |
|-------------------|----------------|------------------------------------------------------------|
| `/login`          | Publik         | Masuk                                                      |
| `/`               | Login          | Dasbor: saldo cuti, pengajuan terakhir, antrean persetujuan |
| `/cuti`           | Karyawan       | Saldo & riwayat cuti, batalkan pengajuan PENDING           |
| `/cuti/ajukan`    | Karyawan       | Form pengajuan (hitung hari kerja & cek saldo)             |
| `/cuti/[id]`      | Pemilik/atasan | Detail pengajuan + aksi setujui/tolak/batalkan             |
| `/persetujuan`    | MANAGER, ADMIN | Daftar pengajuan untuk diproses                            |
| `/tim`            | MANAGER, ADMIN | Bawahan langsung                                           |
| `/karyawan`       | ADMIN          | Daftar karyawan (cari & filter departemen)                 |
| `/karyawan/baru`  | ADMIN          | Buat akun + data karyawan                                  |
| `/karyawan/[id]`  | ADMIN          | Ubah data, atasan, akun/role/status, dan jatah cuti        |
| `/pengguna`       | ADMIN          | Kelola akun: role, aktif/nonaktif, hapus                   |
| `/profil`         | Login          | Profil & ganti password                                    |

Menu "Cuti Saya" dan "Tim Saya" disembunyikan untuk akun yang belum punya data
kepegawaian (mis. admin hasil seed).

## Arsitektur Autentikasi

Browser tidak pernah memegang JWT. Next.js berperan sebagai
*backend-for-frontend*:

```
Browser ──► /api/auth/login    ──► NestJS /auth/login    → token disimpan di cookie httpOnly
Browser ──► /api/backend/*     ──► NestJS /*             + Authorization: Bearer <cookie>
Browser ──► /api/auth/refresh  ──► NestJS /auth/refresh  → cookie diperbarui (rotasi)
Browser ──► /api/auth/logout   ──► NestJS /auth/logout   → cookie dihapus
```

- `hr_at` (access token) dan `hr_rt` (refresh token) adalah cookie **httpOnly**,
  `SameSite=Lax`, dan `Secure` di production.
- Saat API membalas **401**, client memanggil `/api/auth/refresh` **sekali**
  lalu mengulang request. Karena backend merotasi refresh token, refresh
  digabung menjadi satu (antar-request dan antar-tab lewat Web Locks) supaya
  dua refresh paralel tidak saling membatalkan sesi.
- Request yang mengubah data wajib membawa header `x-hr-client: 1`
  (perlindungan CSRF tambahan).
- `src/proxy.ts` mengarahkan pengunjung tanpa sesi ke `/login`. Otorisasi
  sesungguhnya tetap di backend; pembatasan menu per role hanya untuk tampilan.

## Struktur Folder

```
src/
├── proxy.ts                    # redirect ke /login bila belum login
├── app/
│   ├── login/                  # halaman login
│   ├── (app)/                  # halaman yang butuh login (pakai AppShell)
│   └── api/
│       ├── auth/               # login, refresh, logout (set/hapus cookie)
│       └── backend/[...path]/  # proxy ke API NestJS
├── components/
│   ├── app-shell.tsx           # sidebar & navigasi per role
│   ├── auth-provider.tsx       # user & data karyawan yang sedang login
│   ├── leave.tsx               # komponen cuti (saldo, tabel, dialog)
│   └── ui.tsx                  # komponen UI dasar
└── lib/
    ├── api.ts                  # fetch ke backend + auto refresh token
    ├── session.ts              # cookie sesi (server only)
    ├── format.ts               # format tanggal, label, hitung hari kerja
    └── types.ts                # tipe response API
```

## Script

| Script              | Fungsi                        |
|---------------------|-------------------------------|
| `npm run dev`       | Development server (port 3001) |
| `npm run build`     | Build production              |
| `npm start`         | Menjalankan hasil build       |
| `npm run lint`      | ESLint                        |
| `npm run typecheck` | Cek tipe TypeScript           |

## Catatan untuk Backend

Semua request ke NestJS kini datang dari server Next.js, sehingga rate limit
login (5×/menit per IP) akan terhitung untuk **satu IP yang sama**. Frontend
sudah meneruskan header `X-Forwarded-For`; agar dipakai, backend perlu
mengaktifkan `trust proxy` di Express, misalnya di `main.ts`:

```ts
const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.set('trust proxy', 1);
```

Aktifkan ini hanya jika API NestJS tidak bisa diakses langsung dari internet
(hanya lewat server Next.js), karena header tersebut bisa dipalsukan klien.
