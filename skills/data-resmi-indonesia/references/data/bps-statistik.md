# BPS — Statistik (WebAPI, kunci pengguna)

## Sumber & portal resmi

- Portal resmi BPS: <https://www.bps.go.id/>
- Dokumentasi WebAPI BPS: <https://webapi.bps.go.id/>
- Basis data: Badan Pusat Statistik (BPS)

## Kelas sumber: kunci milik pengguna

Layanan ini **membutuhkan kunci API pengguna**; jadi **tidak boleh** diklaim
dengan status yang hanya sah untuk sumber publik tanpa kunci (klaim semacam itu
dilarang untuk kelas ini). Halaman ini menunjukkan **bentuk** respons yang
ditandai, plus perintah self-check. Kunci tidak pernah disimpan di repo —
dibaca dari env var `BPS_API_KEY`.

## Endpoint

```
https://webapi.bps.go.id/v1/api/<pola>/<entitas>/<var>/<id>?domain=<kode_wilayah>&key=<BPS_API_KEY>
```

Pola utama:

- `list` — daftar (variabel, domain, atau model).
- `view` — mengambil data satu variabel / id.

Parameter:

- `domain` — kode wilayah BPS. `0000` = **nasional** (seluruh Indonesia);
  kode 2/4 digit untuk provinsi/kabupaten-kota.
- `key` — kunci API pengguna, dari env var `BPS_API_KEY`.

Bentuk permintaan contoh (dengan placeholder):

```
https://webapi.bps.go.id/v1/api/list/model/var/1?domain=0000&key=$BPS_API_KEY
```

## Contoh `curl` (self-check)

<!-- perintah di bawah memerlukan kunci; ganti `$BPS_API_KEY` (env var) -->
```bash
# Cetak daftar variabel model 1 (nasional)
curl -s "https://webapi.bps.go.id/v1/api/list/model/var/1?domain=0000&key=$BPS_API_KEY"

# Ambil data variabel 1 model 1, periode 2024 (nasional)
curl -s "https://webapi.bps.go.id/v1/api/view/model/var/1/2024?domain=0000&key=$BPS_API_KEY"
```

Perintah self-check (tanpa menampilkan key ke log):

```bash
# Harus mengembalikan JSON; status non-200 berarti key/pola salah.
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  "https://webapi.bps.go.id/v1/api/list/model/var/1?domain=0000&key=$BPS_API_KEY"
```

Tanpa key (atau dengan key salah), layanan mengembalikan JSON error, mis.:

- Tanpa key valid: `{"status":"Error","code":"KEY_MISSING","message":"Invalid API KEY"}`
- `domain` hilang: `{"status":"Error","message":"'domain' parameter is required and must be a 4-digit numeric string."}`

## Bentuk data

JSON (UTF-8). Bentuk persis respons `list`/`view` bergantung pada model dan
`var`; struktur tingkat atas umumnya:

- `status` — string, mis. `"OK"` atau `"Error"`.
- `message` — pesan / keterangan.
- `data` — objek berisi hasil (daftar variabel, atau tabel data).

**Ini contoh bentuk respons yang ditandai (bukan respons nyata):**

```json
{
  "status": "OK",
  "message": "sukses",
  "data": {
    "var": { "1": { "id": 1, "nama": "Contoh variabel" } }
  }
}
```

Nama field dan isi yang tepat tergantung pada model yang Anda pilih; gunakan
`list` dulu untuk melihat variabel yang tersedia sebelum `view`.

## Kredensial

- Env var: `BPS_API_KEY` (kunci API pengguna).
- **Jangan pernah menulis key di repo** atau di keluaran, kode, log, atau
  contoh. Ambil dari environment di runtime.

## Batas akses

- Rate limit kira-kira **2 permintaan per detik per key**. Hindari pemanggilan
  beruntun tanpa jeda.
- Data adalah statistik resmi; perbarui `view` bila butuh periode terbaru.

## Atribusi

> Sumber: Badan Pusat Statistik (BPS)

## Status: bentuk — verifikasi dengan key Anda

Karena layanan ini memakai kunci milik pengguna, halaman ini menunjukkan
**bentuk**, bukan hasil yang dijamin lewat kunci nyata. Verifikasi respons
dengan key Anda sendiri sesuai perintah self-check di atas; perbarui bagian
`Tanggal verifikasi` hanya setelah Anda merekam respons nyata dengan key Anda.

## Tanggal verifikasi

2026-11-08 — bentuk endpoint (pola `list`/`view`), perilaku tanpa key
(`KEY_MISSING`), dan format error `domain` diverifikasi dengan permintaan
hidup. Data nyata per model tidak direkam tanpa key Anda.
