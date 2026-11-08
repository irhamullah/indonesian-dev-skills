# Contoh end-to-end

Berkas ini adalah **satu-satunya** tempat di skill yang boleh memuat angka
aturan di prosa — dengan syarat setiap angka wajib menyertakan sumber + tanggal
berlaku. Contoh di sini memakai data dari registry `references/aturan/*.json`.

> **Catatan:** contoh penugasan di bawah adalah **estimasi untuk ilustrasi**,
> bukan nasihat pajak / kepatuhan resmi.

## Contoh 1 — SLA hari kerja antar tanggal

Menghitung jumlah hari kerja antara dua tanggal dengan memotong akhir pekan,
hari libur nasional, dan cuti bersama.

Status: data tahun **2026** dari `references/data/hari-libur-cuti-bersama.md`
(SKB 3 Menteri, sumber: Kemenko PMK).

```js
// sumber: https://www.kemenkopmk.go.id/sites/default/files/pengumuman/2025-09/SKB%20Libur%20Nasional%20dan%20Cuti%20Bersama%20Tahun%202026.pdf
// berlaku: 2026-01-01 s.d. 2026-12-31
const libur2026 = new Set([
  "2026-01-01", // Tahun Baru
  "2026-01-16", // Isra Mikraj
  "2026-02-17", // Imlek
  "2026-03-19", // Nyepi
  "2026-03-21", "2026-03-22", // Idul Fitri
  "2026-03-23", // cuti bersama Idul Fitri
  "2026-03-24", // cuti bersama Idul Fitri
  "2026-04-03", // Wafat Yesus
  "2026-04-05", // Paskah
  "2026-05-01", // Buruh
  "2026-05-14", // Kenaikan Yesus
  "2026-05-27", // Idul Adha
  "2026-05-31", // Waisak
  "2026-06-01", // Pancasila
  "2026-06-16", // Tahun Baru Islam
  "2026-08-17", // Kemerdekaan
  "2026-08-25", // Maulid
  "2026-12-25", // Natal
]);

function hariKerja(mulai, selesai, libur) {
  let n = 0;
  const d = new Date(mulai + "T00:00:00+07:00");
  const akhir = new Date(selesai + "T00:00:00+07:00");
  while (d <= akhir) {
    const day = d.getDay(); // 0 = Minggu, 6 = Sabtu
    const iso = d.toISOString().slice(0, 10);
    if (day !== 0 && day !== 6 && !libur.has(iso)) n++;
    d.setDate(d.getDate() + 1);
  }
  return n;
}

// Contoh: 8 s.d. 12 Juni 2026 (Senin–Jumat) → 5 hari kerja
console.log(hariKerja("2026-06-08", "2026-06-12", libur2026)); // 5

// Contoh: 16 s.d. 22 Maret 2026 (termasuk Idul Fitri + cuti bersama)
// Senin 16, Selasa 17, Rabu 18, Kamis 19, Jumat 20, Sabtu 21, Minggu 22
// libur: 19 (Nyepi), 21/22 (Idul Fitri), 23/24 cuti (di luar rentang)
console.log(hariKerja("2026-03-16", "2026-03-22", libur2026)); // 3
```

Perilaku saat tahun tanpa SKB: bila tahun yang diminta belum ada SKB/registry,
**menolak** — jangan hitung pakai data tahun lain.

## Contoh 2 — potongan gaji bruto 2026 (PPh 21 TER + BPJS)

Satu kasus konkret: gaji bruto **Rp 12.000.000/bulan**, status **TK/0**
(lajang, tanpa tanggungan). Data angka dari registry:

- `ptkp-2026.json` — PTKP tahunan TK/0 = 54 juta (sumber: pajak.go.id).
- `pph21-ter-2026.json` — TER kategori A (TK/0) untuk bruto 12 juta → tarif
  **4%** (bracket `batas_atas` 12.500.000).
- `bpjs-2026.json` — iuran pekerja: BPJS Kesehatan PPU 1% (maks. upah
  12 juta), JHT 2%, JP 1% (maks. upah 11.086.300).

```js
// sumber: https://pajak.go.id/id/penghasilan-tidak-kena-pajak · berlaku: 2026-01-01
const PTKP_TK0_TAHUNAN = 54_000_000;

// sumber: https://pajak.go.id/sites/default/files/2024-02/PMK%20168%20Tahun%202023%20Tentang%20PPh%20Pasal%2021%20TER.pdf · berlaku: 2026-01-01
const TER_KATEGORI_A_UNTUK_12JT = 0.04; // bruto 12 juta → bracket 12,5 juta

// sumber: https://www.bpjsketenagakerjaan.go.id/assets/uploads/peraturan/15122015_104557_PP%2044%20Tahun%202015.pdf · berlaku: 2026-03-01
const upah = 12_000_000;
const BPJS_KES_PPU_PEKERJA = 0.01; // maks. upah 12 juta
const JHT_PEKERJA = 0.02; // tanpa batas upah
const JP_PEKERJA = 0.01; // maks. upah 11.086.300
const BATAS_UPAH_JP = 11_086_300;

const pph21Ter = upah * TER_KATEGORI_A_UNTUK_12JT;        // 480.000
const bpjsKes = Math.min(upah, 12_000_000) * BPJS_KES_PPU_PEKERJA; // 120.000
const jht = upah * JHT_PEKERJA;                             // 240.000
const jp = Math.min(upah, BATAS_UPAH_JP) * JP_PEKERJA;      // 110.863
const totalPotongan = pph21Ter + bpjsKes + jht + jp;        // 950.863
const takeHome = upah - totalPotongan;                      // 11.049.137

console.log({ pph21Ter, bpjsKes, jht, jp, totalPotongan, takeHome });
```

Jejak keluaran:

| Komponen | Nilai | Dasar hukum | Berlaku |
| --- | --- | --- | --- |
| PPh 21 TER | Rp 480.000 | PMK 168/2023 | 2026 |
| BPJS Kesehatan PPU (pekerja) | Rp 120.000 | Perpres 59/2024 | 2026-03-01 |
| JHT (pekerja) | Rp 240.000 | PP 46/2015 | 2026-03-01 |
| JP (pekerja) | Rp 110.863 | PP 45/2015 | 2026-03-01 |
| Total potongan | Rp 950.863 | — | — |
| Take-home | Rp 11.049.137 | — | — |

> **Estimasi — bukan nasihat pajak/kepatuhan.** Angka dari registry resmi;
> kembali `sumber` + `diverifikasi_pada` di tiap JSON sebelum dipakai.

## Contoh 3 — peringatan dini cuaca (nowcast BMKG)

Mengambil nowcast BMKG, menyaring `severity`/`urgency`, lalu meneruskan ke
kanal notifikasi. Atribusi BMKG dan rujukan skill `notifikasi-indonesia`.

Status: BMKG **publik tanpa kunci** → boleh `curl` + klaim `terverifikasi`
(lihat `references/data/bmkg-nowcast.md`, direkam 2026-11-08).

```bash
curl -s "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.71.03.1001"
```

```js
// sumber: https://data.bmkg.go.id/ · berlaku: per pemanggilan (data real-time)
async function cekNowcast(adm4, kanalNotif) {
  const res = await fetch(
    `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${adm4}`
  );
  const json = await res.json();
  const peringatan = json.data.flatMap((f) =>
    (f.peringatan_dini || []).filter(
      (p) => p.severity === "extreme" || p.urgency === "immediate"
    )
  );
  if (peringatan.length) {
    await kanalNotif.kirim(peringatan); // contoh: kirim ke WA/Telegram
  }
  return peringatan;
}
```

Catatan:

- Data bersifat real-time dan tidak di-cache melintasi hari.
- Kode di atas **contoh** (bukan kode produksi penuh); lindungi dengan
  retry/timeout, dan batasi panggilan (BMKG ±60 req/menit/IP).
- Atribusi: `> Sumber: BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)`.
- Kanal notifikasi (WhatsApp/Telegram/email) → gunakan skill `notifikasi-indonesia`.
