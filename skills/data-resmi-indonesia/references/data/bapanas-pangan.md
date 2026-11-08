# Bapanas — data pangan (WebAPI NFA, kunci pengguna)

## Sumber & portal resmi

- Portal Open Data: <https://data.badanpangan.go.id/>
- WebAPI NFA (dokumentasi): <https://webapi.badanpangan.go.id/>

## Kelas sumber: kunci milik pengguna

Layanan ini **membutuhkan kunci API pengguna** (dibagikan setelah pendaftaran &
verifikasi akun oleh Pusdatin Badan Pangan Nasional); jadi **tidak boleh** diklaim
dengan status yang hanya sah untuk sumber publik tanpa kunci. Halaman ini menunjukkan
**bentuk** respons yang ditandai + perintah self-check. Kunci tidak pernah disimpan
di repo — dibaca dari env var `BAPANAS_API_KEY`.

## Endpoint

Sistem Integrasi Aplikasi Data Pangan (WebAPI NFA) menyediakan akses terprogram ke
data NFA (Badan Pangan Nasional). API mengidentifikasi pengguna lewat **API Key**.

Pola umum:

```
https://webapi.badanpangan.go.id/api/<resource>...
```

Authorization header (sesuai dokumentasi resmi):

```
X-Authorization: <BAPANAS_API_KEY>
```

Contoh `curl` (self-check) — ganti `$BAPANAS_API_KEY` (env var):

```bash
curl -s -H "X-Authorization: $BAPANAS_API_KEY" \
  "https://webapi.badanpangan.go.id/api/..."; "
```

Catatan:

- Daftar akun & verifikasi di <https://webapi.badanpangan.go.id/register>; API key
  baru terbit setelah pihak Pusdatin memverifikasi akun.
- Portal **Open Data** (`data.badanpangan.go.id`) merilis data secara **bulanan**
  (dataset, visualisasi, publikasi) dan dapat diakses lewat situs web.
- Panel **harian** pernah mengalami *maintenance* saat riset — jangan menganggap
  selalu tersedia.

## Bentuk data

Respon berbentuk JSON (sesuai dokumentasi). Bentuk persis bergantung pada resource
yang dipilih. **Ini contoh bentuk yang ditandai (bukan respons nyata):**

```json
{
  "status": "sukses",
  "message": "OK",
  "data": { "id": 1, "nama": "contoh", "satuan": "kg" }
}
```

Nama field & isi yang tepat tergantung resource; verifikasi dengan key Anda dan
dokumentasi API.

## Kredensial

- Env var: `BAPANAS_API_KEY` (kunci API pengguna).
- **Jangan pernah menulis key di repo** atau di keluaran, kode, log, contoh.
  Ambil dari environment di runtime.

## Batas akses

- Data market mingguan/bulanan dirilis per periode; jangan meng-cache lintas
  periode tanpa memverifikasi ulang.
- `data.badanpangan.go.id` untuk rilis **bulanan**; panel harian bisa maintenance.

## Atribusi

> Sumber: Badan Pangan Nasional (Bapanas)

## Status: bentuk — verifikasi dengan key Anda

Karena layanan ini memakai kunci milik pengguna, halaman ini menunjukkan **bentuk**,
bukan hasil yang dijamin lewat kunci nyata. Verifikasi respons dengan key Anda sendiri
sesuai perintah self-check di atas; perbarui `Tanggal verifikasi` hanya setelah Anda
merekam respons nyata dengan key Anda.

## Tanggal verifikasi

2026-11-08 — bentuk endpoint (WebAPI NFA, header `X-Authorization`), alur
pendaftaran/verifikasi akun, dan portal Open Data diverifikasi dengan permintaan
hidup. Data nyata per resource tidak direkam tanpa key Anda.
