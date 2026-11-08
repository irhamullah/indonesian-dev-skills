# BMKG — Peringatan Dini Cuaca (Nowcast / CAP)

## Sumber & portal resmi

- Portal Data Terbuka BMKG: <https://data.bmkg.go.id/>
- Peringatan dini cuaca: <https://www.bmkg.go.id/alerts/nowcast/id>
- Basis data: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)

> **Catatan cakupan:** peringatan dini cuaca (nowcast/CAP) **tidak ada di
> katalog APIPedia**. Ini salah satu tambahan yang skill ini sediakan sendiri
> di atas cakupan APIPedia.

## Endpoint

| Isi | Endpoint |
| --- | --- |
| Daftar peringatan (RSS) | `https://www.bmkg.go.id/alerts/nowcast/id` (alias `/rss.xml`) |
| Satu peringatan (CAP XML) | `https://www.bmkg.go.id/alerts/nowcast/id/<kode>_alert.xml` |

- RSS memuat item per provinsi; tiap `<item>` menautkan berkas CAP XML-nya.
- Berkas CAP XML memuat rincian sampai **level kecamatan** (daftar wilayah
  pada `areaDesc`).

## Contoh `curl`

```bash
# Daftar peringatan aktif (RSS)
curl -s "https://www.bmkg.go.id/alerts/nowcast/id/rss.xml"

# Ambil kode dari <link> item RSS, lalu:
curl -s "https://www.bmkg.go.id/alerts/nowcast/id/CKS20261108006_alert.xml"
```

## Bentuk data

- **RSS 2.0** (XML) untuk daftar: `<channel>` dengan banyak `<item>`, tiap
  item punya `<title>`, `<link>`, `<description>`, `<pubDate>`.
- **CAP 1.2** (XML) untuk rincian: root `<alert>` pada namespace
  `urn:oasis:names:tc:emergency:cap:1.2`, berisi `<info>` dengan `event`,
  `urgency`, `severity`, `certainty`, `headline`, `description`, `effective`,
  `expires`, `senderName`, dan daftar `<area>`/`areaDesc`.

Contoh potongan respons nyata (direkam 2026-11-08):

```xml
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>2.49.0.1.360.0.2026.11.08.11.63.006</identifier>
  <sender>cuaca.ekstrem@bmkg.go.id</sender>
  <sent>2026-11-08T19:00:00+08:00</sent>
  <status>Actual</status>
  <msgType>Alert</msgType>
  <scope>Public</scope>
  <info>
    <language>id</language>
    <category>Met</category>
    <event>Hujan Lebat dan Petir</event>
    <urgency>Immediate</urgency>
    <severity>Moderate</severity>
    <certainty>Observed</certainty>
    <effective>2026-11-08T19:12:00+08:00</effective>
    <expires>2026-11-08T20:36:00+08:00</expires>
    <senderName>Badan Meteorologi Klimatologi dan Geofisika</senderName>
    <headline>Hujan Lebat disertai Petir di Kalimantan Selatan</headline>
    <description>Hujan lebat disertai petir akan terjadi ... khususnya di AMUNTAI SELATAN, BANUA LAWAS, ... KUSAN HULU, ...</description>
  </info>
</alert>
```

## Arti field CAP

- `urgency` — seberapa cepat ancaman muncul: `Immediate`, `Expected`,
  `Future`, `Past`, `Unknown`.
- `severity` — tingkat keparahan: `Extreme`, `Severe`, `Moderate`, `Minor`,
  `Unknown`.
- `certainty` — keyakinan terjadinya: `Observed`, `Likely`, `Possible`,
  `Unlikely`, `Unknown`.
- `effective` / `expires` — jendela berlaku (dalam contoh memakai offset
  `+08:00` WITA; ikuti offset di `sent`).
- Perhatikan `msgType` (`Alert`/`Update`/`Cancel`) dan `status` (`Actual`,
  `Test`); hiraukan selain `Actual`.

## Kredensial

Tidak diperlukan.

## Batas akses

- **60 permintaan per menit per IP**.
- Sifat peringatan: mendesak dan berumur pendek (lihat `expires`);
  **jangan di-cache lintas hari** dan jangan simpan sebagai arsip.

## Bila sumber berubah bentuk/mati

- RSS dan CAP sekarang dilayani di `bmkg.go.id/alerts/nowcast/id`. Bila
  berubah, cek halaman Data Terbuka BMKG untuk tautan terbaru; jangan
  menebak path lama.
- Bila CAP hanya tersedia per provinsi (seperti sekarang) dan butuh level
  kecamatan, baca `areaDesc` di dalam XML, bukan RSS.

## Atribusi

> Sumber: Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)

## Tanggal verifikasi

2026-11-08 — RSS daftar + satu CAP XML provinsi direkam hidup pada tanggal
ini.
