# BMKG — Prakiraan Cuaca

## Sumber & portal resmi

- Portal Data Terbuka BMKG: <https://data.bmkg.go.id/>
- Prakiraan cuaca: <https://www.bmkg.go.id/cuaca/prakiraan-cuaca>
- Basis data: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)

## Endpoint

```
https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=<kode_wilayah>
```

- Parameter `adm4` = kode wilayah **level IV** (desa/kelurahan), format
  berpola `31.71.03.1001` (provinsi.kabupaten/kota.kecamatan.kelurahan).
- Kode wilayah mengikuti **Kepmendagri** (kode wilayah administrasi
  pemerintahan). Confirming the current Kepmendagri file is the caller's
  responsibility; skill ini tidak men-dump dataset kode wilayah.
- Keluaran: prakiraan per **3 jam** untuk **3 hari**.

## Contoh `curl`

```bash
# Kemayoran, Kota Adm. Jakarta Pusat
curl -s "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.71.03.1001"
```

## Bentuk data

JSON. Tingkat atas `data` berupa array; tiap elemen berisi:

- `lokasi` — `adm1`..`adm4`, `desa`, `kecamatan`, `kotkab`, `provinsi`, `lat`,
  `lon`, `timezone`, `type`.
- `cuaca` — array per hari, tiap harinya array slot 3-jaman.

Field tiap slot cuaca: `datetime` (UTC), `t` (suhu °C), `tcc` (tutupan awan),
`tp` (curah hujan), `weather`/`weather_desc`, `wd`/`wd_deg`/`wd_to` (arah
angin), `ws` (kecepatan angin), `hu` (kelembapan), `vs`/`vs_text`
(jarak pandang), `local_datetime`, `utc_datetime`, `image` (ikon SVG).

Contoh potongan respons nyata (direkam 2026-11-08):

```json
{"data":[{"lokasi":{"adm1":"31","adm2":"31.71","adm3":"31.71.03","adm4":"31.71.03.1001","desa":"Kemayoran","kecamatan":"Kemayoran","kotkab":"Kota Adm. Jakarta Pusat","lat":-6.1647214778,"lon":106.8453837867,"provinsi":"DKI Jakarta","timezone":"+0700","type":"adm4"},"cuaca":[[{"datetime":"2026-11-08T12:00:00Z","t":29,"tcc":60,"tp":0.3,"weather":1,"weather_desc":"Cerah","weather_desc_en":"Sunny","wd_deg":335,"wd":"NW","wd_to":"SE","ws":0.9,"hu":76,"vs":null,"vs_text":null,"time_index":"10-11","analysis_date":"2026-11-08T00:00:00","image":"https://api-apps.bmkg.go.id/storage/icon/cuaca/cerah-pm.svg","utc_datetime":"2026-11-08 12:00:00","local_datetime":"2026-11-08 19:00:00"}]}]}
```

Catatan: `datetime` dalam UTC; gunakan `local_datetime`/`timezone` untuk
waktu setempat. `t`/`hu`/`ws` berupa angka, sedangkan sebagian field lain
(mis. `vs`) bisa `null`.

## Kredensial

Tidak diperlukan.

## Batas akses

- **60 permintaan per menit per IP**.
- Prakiraan berubah (ada `analysis_date`); jangan sajikan sebagai data
  beku jangka panjang — ambil ulang saat dipakai.

## Atribusi

> Sumber: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)

## Tanggal verifikasi

2026-11-08 — endpoint direkam hidup (`adm4=31.71.03.1001`, Kemayoran).
