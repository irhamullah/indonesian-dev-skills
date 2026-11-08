# Skill #5 `data-resmi-indonesia` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambah skill ke-5 `data-resmi-indonesia` (umpan data resmi Indonesia + aturan berperiode dengan registry bertanggal yang digerbangi validator), lalu merilis repo ke v1.4.0.

**Architecture:** Satu skill, dua bagian. Bagian **Data** = berkas rujukan per topik yang memuat `curl` nyata + bukti respons + atribusi. Bagian **Aturan** = registry JSON per aturan per periode, digerbangi `scripts/validate-registry.mjs` (node polos, tanpa dependency) yang menolak angka tanpa sumber/tanggal dan bracket bercelah; agen menolak menghitung periode di luar cakupan.

**Tech Stack:** Markdown + JSON; `node --test` dan `node:assert` bawaan Node (tanpa dependency apa pun).

**Spec:** `docs/superpowers/specs/2026-11-08-data-resmi-indonesia-design.md`

## Global Constraints

- Tanpa dependency: seluruh tooling memakai modul bawaan Node (`node:test`, `node:assert`, `node:fs`, `node:path`). Dilarang menambah `package.json`/`node_modules`.
- Registry memakai **JSON**, bukan YAML, dan satu berkas per aturan per periode: `ptkp-2026.json`, `pph21-ter-2026.json`, `ppn-2026.json`, `bpjs-2026.json`, `umpp-2026.json`. Dilarang ada berkas registry tanpa tahun.
- Field wajib setiap registry: `aturan`, `jenis`, `dasar_hukum`, `berlaku_dari`, `sumber`, `diverifikasi_pada`.
- `jenis` hanya boleh `bracket` | `daftar` | `komponen`. Cek celah/tumpang-tindih hanya berlaku untuk `bracket`.
- Payload per jenis: `bracket` → `kategori.<KODE>: [{batas_atas, tarif}]`; `daftar` → `entri: [{kunci, nilai, satuan}]`; `komponen` → `komponen: [{nama, batas_upah, tarif_pemberi, tarif_pekerja}]`.
- Dilarang menulis angka aturan di `SKILL.md` dan `references/aturan/*.md`. `examples.md` dikecualikan, tapi setiap angkanya wajib membawa sumber + tanggal berlaku. Pemindaian prosa hanya menyasar skill #5 (`skills/data-resmi-indonesia/SKILL.md` + `skills/data-resmi-indonesia/references/aturan/*.md`) — `SKILL.md` skill #1–#4 tidak dipindai, karena memang memuat contoh `Rp`/persen.
- Nama env var kredensial pengguna: `BPS_API_KEY`, `BAPANAS_API_KEY`. Tidak ada kredensial, key contoh, atau respons palsu di repo.
- Kelas sumber: tanpa kunci (BMKG, BI, MyQuran) → wajib contoh respons **nyata** yang direkam; berkey (BPS, Bapanas) → contoh bentuk yang **ditandai** + perintah self-check, dan dilarang berlabel "terverifikasi".
- Atribusi wajib dicantumkan di setiap halaman data: BMKG, BPS, Bank Indonesia, Badan Pangan Nasional, Kemenag.
- Batas akses BMKG: 60 permintaan/menit/IP; sifat data (gempa/nowcast) tidak boleh di-cache lintas hari.
- Data pemerintah yang ditulis di repo hanya fakta turunan minimum (mis. 38 angka UMP + nomor SK, daftar libur per tahun + nomor SKB). Dataset besar (kode wilayah Kepmendagri, NPSN, direktori RS/kampus) dirujuk, tidak di-dump.
- Cakupan registry: fokus periode 2026; tambah periode sebelumnya hanya bila sumbernya mudah diverifikasi.
- Rilis: `CHANGELOG.md` → `[1.4.0] - 2026-11-08`.
- Frontmatter `SKILL.md` wajib punya `name` dan `description` yang memuat trigger (pola sama dengan 4 skill lama).

## Review Focus

1. Permintaan hitung untuk periode di luar registry (2019, 2027) → harus **menolak** dan menampilkan sumber resmi, bukan menghitung dengan tabel 2026.
2. Penghasilan tepat di `batas_atas` sebuah bracket → harus masuk kategori bawah (mis. Rp5.400.000 → tarif 0%), bukan bracket berikutnya.
3. `batas_atas: null` di posisi bukan terakhir, atau dua entri berbagi batas yang sama → validator harus menolak, bukan menerima "kira-kira".
4. Sumber tanpa kunci yang berubah bentuk/mati (BMKG nowcast CAP, BI ASMX) → halaman wajib menyatakan bentuk apa adanya + langkah bila berubah, dan tidak mengklaim terverifikasi setelah lewat.
5. Hari libur tahun yang SKB-nya belum terbit → harus menolak (bukan mengembalikan tahun itu apa adanya), dan `diverifikasi_pada` > 400 hari → hitung boleh tapi wajib ditandai "perlu verifikasi ulang".

---

### Task 1: Validator — kerangka, field wajib, dan JSON rusak

**Files:**
- Create: `skills/data-resmi-indonesia/scripts/validate-registry.mjs`
- Create: `skills/data-resmi-indonesia/scripts/validate-registry.test.mjs`
- Create (fixture): `skills/data-resmi-indonesia/scripts/__fixtures__/ok/aturan/ppn-2026.json`
- Create (fixture): `skills/data-resmi-indonesia/scripts/__fixtures__/missing-field/aturan/ppn-2026.json`
- Create (fixture): `skills/data-resmi-indonesia/scripts/__fixtures__/bad-json/aturan/ppn-2026.json`

**Interfaces:**
- Consumes: —
- Produces: `export function validateRegistry({ aturanDir, proseFiles = [] }) -> { findings: Array<{ file: string, code: string, message: string }>, ok: boolean }`; CLI `node skills/data-resmi-indonesia/scripts/validate-registry.mjs [--root <repoRoot>]` → exit 0 bila `ok`, exit 1 bila ada finding. Kode finding: `JSON_PARSE`, `MISSING_FIELD`, `BAD_JENIS`, `BRACKET_GAP`, `BRACKET_OVERLAP`, `NO_TERMINAL`, `FUTURE_EFFECTIVE`, `NUMBER_IN_PROSE`, `STALE_VERIFICATION`.

- [ ] **Step 1: Tulis uji yang gagal**

```javascript
// skills/data-resmi-indonesia/scripts/validate-registry.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateRegistry } from "./validate-registry.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => path.join(here, "__fixtures__", name, "aturan");

test("registry lengkap diterima tanpa finding", () => {
  const { ok, findings } = validateRegistry({ aturanDir: fixture("ok") });
  assert.equal(ok, true);
  assert.deepEqual(findings, []);
});

test("field wajib hilang dilaporkan MISSING_FIELD", () => {
  const { ok, findings } = validateRegistry({ aturanDir: fixture("missing-field") });
  assert.equal(ok, false);
  assert.equal(findings[0].code, "MISSING_FIELD");
  assert.match(findings[0].file, /ppn-2026\.json$/);
});

test("JSON rusak dilaporkan JSON_PARSE, bukan crash", () => {
  const { ok, findings } = validateRegistry({ aturanDir: fixture("bad-json") });
  assert.equal(ok, false);
  assert.equal(findings[0].code, "JSON_PARSE");
});
```

- [ ] **Step 2: Jalankan uji, pastikan gagal**

Run: `node --test skills/data-resmi-indonesia/scripts/`
Expected: FAIL — `Cannot find module './validate-registry.mjs'`

- [ ] **Step 3: Buat fixture**

`ok/aturan/ppn-2026.json`: field wajib lengkap, `jenis: "bracket"`, `kategori.P: [{batas_atas: null, tarif: 0.11}]`, `berlaku_dari: "2026-01-01"`, `sumber` URL resmi pajak.go.id, `diverifikasi_pada` = tanggal hari ini.
`missing-field/aturan/ppn-2026.json`: salinan fixture `ok` tanpa `sumber`.
`bad-json/aturan/ppn-2026.json`: berkas berisi `{ "aturan": ` (sengaja terpotong).

- [ ] **Step 4: Implementasikan `validateRegistry`**

Baca semua `*.json` di `aturanDir` dengan `readdirSync`. Untuk tiap berkas: `JSON.parse` di dalam `try/catch` (gagal → temuan `JSON_PARSE`); cek field wajib ada dan non-kosong (`MISSING_FIELD`); cek `jenis` salah satu dari tiga nilai (`BAD_JENIS`). Kembalikan `{ findings, ok: findings.length === 0 }`. Tambahkan blok CLI di akhir berkas yang memanggil `validateRegistry` dengan `aturanDir` dari `--root` (default: akar repo dihitung dari posisi berkas) dan mencetak tiap finding sebagai `file: CODE — message`, lalu `process.exit(ok ? 0 : 1)`.

- [ ] **Step 5: Jalankan uji, pastikan lulus**

Run: `node --test skills/data-resmi-indonesia/scripts/`
Expected: PASS — 3 uji lulus

- [ ] **Step 6: Commit**

```bash
git add skills/data-resmi-indonesia/scripts
git commit -m "feat(skill-5): validator registry (field wajib, JSON rusak)"
```

### Task 2: Validator — kontinuitas bracket per `jenis`

**Files:**
- Modify: `skills/data-resmi-indonesia/scripts/validate-registry.mjs`
- Modify: `skills/data-resmi-indonesia/scripts/validate-registry.test.mjs`
- Create (fixture): `scripts/__fixtures__/gap/aturan/ppn-2026.json`, `__fixtures__/overlap/aturan/ppn-2026.json`, `__fixtures__/no-terminal/aturan/ppn-2026.json`, `__fixtures__/daftar-ok/aturan/umpp-2026.json`, `__fixtures__/komponen-ok/aturan/bpjs-2026.json`

**Interfaces:**
- Consumes: `validateRegistry` dari Task 1 (signature tidak berubah)
- Produces: kode finding tambahan `BRACKET_GAP`, `BRACKET_OVERLAP`, `NO_TERMINAL`; jenis `daftar` dan `komponen` hanya dicek kelengkapan field payload (tanpa cek rentang).

- [ ] **Step 1: Tulis uji yang gagal**

```javascript
test("bracket bercelah dilaporkan BRACKET_GAP", () => {
  const { findings } = validateRegistry({ aturanDir: fixture("gap") });
  assert.equal(findings[0].code, "BRACKET_GAP");
});

test("bracket tumpang tindih dilaporkan BRACKET_OVERLAP", () => {
  const { findings } = validateRegistry({ aturanDir: fixture("overlap") });
  assert.equal(findings[0].code, "BRACKET_OVERLAP");
});

test("tanpa entri penutup batas_atas null dilaporkan NO_TERMINAL", () => {
  const { findings } = validateRegistry({ aturanDir: fixture("no-terminal") });
  assert.equal(findings[0].code, "NO_TERMINAL");
});

test("jenis daftar dan komponen lolos tanpa cek rentang", () => {
  assert.equal(validateRegistry({ aturanDir: fixture("daftar-ok") }).ok, true);
  assert.equal(validateRegistry({ aturanDir: fixture("komponen-ok") }).ok, true);
});
```

- [ ] **Step 2: Jalankan uji, pastikan gagal**

Run: `node --test skills/data-resmi-indonesia/scripts/`
Expected: FAIL — 4 uji baru gagal (finding belum ada)

- [ ] **Step 3: Buat fixture**

`gap`: dua entri, `batas_atas` 1000 lalu 3000 (rentang 1.001–3.000 hilang).
`overlap`: `batas_atas` 1000 lalu 1000.
`no-terminal`: entri terakhir punya `batas_atas` angka, tanpa penutup `null`.
`daftar-ok`: `jenis: "daftar"`, `entri: [{kunci: "ACEH", nilai: 1, satuan: "IDR"}]` — sengaja hanya 1 entri (kelengkapan isi bukan urusan validator).
`komponen-ok`: `jenis: "komponen"`, `komponen: [{nama: "JKK", batas_upah: null, tarif_pemberi: 0.0024, tarif_pekerja: 0}]`.

- [ ] **Step 4: Implementasikan cek bracket**

Untuk `jenis: "bracket"`: kumpulkan semua entri dari seluruh `kategori.*` sebagai daftar terurut, validasi `batas_atas` naik monoton tanpa celah (bandingkan `batas_atas` sebelumnya dengan `batas_atas` berikutnya — celah hanya boleh nol), tanpa nilai sama (`BRACKET_OVERLAP`), dan entri terakhir wajib `batas_atas === null` (`NO_TERMINAL`). Selain itu, setiap `batas_atas === null` yang muncul **bukan** di posisi terakhir juga dilaporkan `NO_TERMINAL`. Untuk `jenis: "daftar"` cek `Array.isArray(entri)`, untuk `komponen` cek `Array.isArray(komponen)` — keduanya tanpa cek rentang.

- [ ] **Step 5: Jalankan uji, pastikan lulus**

Run: `node --test skills/data-resmi-indonesia/scripts/`
Expected: PASS — 7 uji lulus

- [ ] **Step 6: Commit**

```bash
git add skills/data-resmi-indonesia/scripts
git commit -m "feat(skill-5): validator cek kontinuitas bracket per jenis"
```

### Task 3: Validator — scan angka di prosa, efek samping tanggal, dan wiring repo

**Files:**
- Modify: `skills/data-resmi-indonesia/scripts/validate-registry.mjs`
- Modify: `skills/data-resmi-indonesia/scripts/validate-registry.test.mjs`
- Create (fixture): `scripts/__fixtures__/prosa/aturan/ppn-2026.json`, `scripts/__fixtures__/prosa/aturan/ppn.md`, `scripts/__fixtures__/prosa/examples.md`
- Create (fixture): `scripts/__fixtures__/future/aturan/ppn-2026.json`, `scripts/__fixtures__/stale/aturan/ppn-2026.json`

**Interfaces:**
- Consumes: `validateRegistry` dari Task 2
- Produces: parameter `proseFiles: string[]` di `validateRegistry`; kode `NUMBER_IN_PROSE`, `FUTURE_EFFECTIVE`, `STALE_VERIFICATION`; CLI default `--root .` memindai `skills/*/SKILL.md` + `skills/data-resmi-indonesia/references/aturan/*.md`.

- [ ] **Step 1: Tulis uji yang gagal**

```javascript
test("angka tarif di prosa dilaporkan NUMBER_IN_PROSE", () => {
  const prose = [path.join(here, "__fixtures__", "prosa", "aturan", "ppn.md")];
  const { findings } = validateRegistry({
    aturanDir: fixture("prosa"),
    proseFiles: prose,
  });
  assert.equal(findings.some((f) => f.code === "NUMBER_IN_PROSE"), true);
});

test("angka di examples.md tidak dipindai", () => {
  const prose = [path.join(here, "__fixtures__", "prosa", "examples.md")];
  const { findings } = validateRegistry({ aturanDir: fixture("prosa"), proseFiles: prose });
  assert.equal(findings.some((f) => f.code === "NUMBER_IN_PROSE"), false);
});

test("berlaku_dari di masa depan dilaporkan FUTURE_EFFECTIVE", () => {
  const { findings } = validateRegistry({ aturanDir: fixture("future") });
  assert.equal(findings[0].code, "FUTURE_EFFECTIVE");
});

test("diverifikasi_pada tua dilaporkan STALE_VERIFICATION tapi tidak menggagalkan", () => {
  const { ok, findings } = validateRegistry({ aturanDir: fixture("stale") });
  assert.equal(findings[0].code, "STALE_VERIFICATION");
  assert.equal(ok, true);
});
```

- [ ] **Step 2: Jalankan uji, pastikan gagal**

Run: `node --test skills/data-resmi-indonesia/scripts/`
Expected: FAIL — 4 uji baru gagal

- [ ] **Step 3: Buat fixture**

`prosa/aturan/ppn-2026.json`: salinan `ok`. `prosa/aturan/ppn.md`: satu baris menjelaskan aturan lalu menulis tarif sebagai angka (`11%`). `prosa/examples.md`: memuat beberapa angka aturan (`Rp 5.400.000`, `11%`) dan **harus** dilewati oleh pemindai. `future/aturan/ppn-2026.json`: `berlaku_dari` = 5 tahun ke depan. `stale/aturan/ppn-2026.json`: `diverifikasi_pada` 500 hari lalu.

- [ ] **Step 4: Implementasikan tiga pemeriksaan**

`NUMBER_IN_PROSE`: baca tiap berkas di `proseFiles`, abaikan baris yang memuat tautan Markdown (`](...`), blok kode (di antara ``` ``` ```), dan baris `**Files:**`/path; kalau masih ada token yang cocok `/\b\d+(?:[.,]\d+)?\s*%|\bRp\s?\d/` → temuan. Berkas bernama `examples.md` selalu dilewati.
`FUTURE_EFFECTIVE`: `Date.parse(berlaku_dari) > Date.now()` → temuan (menggagalkan).
`STALE_VERIFICATION`: `Date.now() - Date.parse(diverifikasi_pada) > 400 * 86400000` → temuan yang **tidak** menggagalkan (`ok` tetap `true`; hitung `ok` dari finding yang tidak berakhiran keterangan peringatan — tandai finding peringatan dengan field `severity: "warning"`).
Update CLI: kalau `--root` tidak diberikan, pakai akar repo dan bangun `proseFiles` **hanya** dari `skills/data-resmi-indonesia/SKILL.md` + `skills/data-resmi-indonesia/references/aturan/*.md`. Kalau `aturanDir` tidak ada, kembalikan `{ findings: [], ok: true }` — bukan crash.

- [ ] **Step 5: Jalankan uji, pastikan lulus**

Run: `node --test skills/data-resmi-indonesia/scripts/`
Expected: PASS — 11 uji lulus

- [ ] **Step 6: Jalankan validator pada repo (harus lulus sebelum ada registry nyata)**

Run: `node skills/data-resmi-indonesia/scripts/validate-registry.mjs`
Expected: exit 0, tanpa finding

- [ ] **Step 7: Commit**

```bash
git add skills/data-resmi-indonesia/scripts
git commit -m "feat(skill-5): validator scan prosa, efek samping tanggal, wiring repo"
```

### Task 4: Registry pajak 2026 (`ptkp`, `pph21-ter`, `ppn`)

**Files:**
- Create: `skills/data-resmi-indonesia/references/aturan/ptkp-2026.json`, `ptkp.md`
- Create: `skills/data-resmi-indonesia/references/aturan/pph21-ter-2026.json`, `pph21-ter.md`
- Create: `skills/data-resmi-indonesia/references/aturan/ppn-2026.json`, `ppn.md`

**Interfaces:**
- Consumes: skema `Global Constraints`; gate dari Task 3
- Produces: berkas registry 2026 yang dipakai `SKILL.md` (Task 12) dan `examples.md` (Task 13)

- [ ] **Step 1: Ambil angka dari sumber resmi**

Buka sumber resmi DJP (halaman PMK 168/2023 untuk TER, aturan PTKP yang berlaku, dan tarif PPN yang berlaku) dan catat: angka, dasar hukum, tanggal mulai berlaku, URL sumber, tanggal verifikasi. Angka yang tidak berhasil dikonfirmasi di sumber resmi **tidak ditulis** — kembalikan ke pemilik.

- [ ] **Step 2: Tulis tiga JSON**

`jenis: "bracket"` untuk PPh 21 TER (bracket kategori A/B/C bulanan) dan PPN (`kategori.*` dengan entri penutup `batas_atas: null`). `jenis: "daftar"` untuk PTKP (`entri` per status PTKP/K/I/K/I+1/…). Semua field wajib terisi.

- [ ] **Step 3: Tulis tiga `.md` pasangan**

Tiap berkas: kegunaan, dasar hukum, periode yang tersedia, cara membaca field, contoh **pseudokode** perhitungan (tanpa angka), tautan JSON pasangannya, dan kalimat penutup "angka ada di `<file>.json`; jangan menyalin angka ke dokumen". `pph21-ter.md` wajib menyatakan batas bracket bersifat inklusif: penghasilan tepat di `batas_atas` masuk bracket itu, bukan bracket berikutnya.

- [ ] **Step 4: Verifikasi**

Run: `node skills/data-resmi-indonesia/scripts/validate-registry.mjs && grep -rn "%" skills/data-resmi-indonesia/references/aturan/*.md`
Expected: validator exit 0; `grep` tidak menemukan angka tarif (boleh menemukan kata "persen" tanpa angka)

- [ ] **Step 5: Commit**

```bash
git add skills/data-resmi-indonesia/references/aturan
git commit -m "feat(skill-5): registry pajak 2026 (PTKP, PPh 21 TER, PPN)"
```

### Task 5: Registry ketenagakerjaan 2026 (`bpjs`, `umpp`)

**Files:**
- Create: `skills/data-resmi-indonesia/references/aturan/bpjs-2026.json`, `bpjs.md`
- Create: `skills/data-resmi-indonesia/references/aturan/umpp-2026.json`, `umpp.md`

**Interfaces:**
- Consumes: skema `Global Constraints`; gate dari Task 3
- Produces: registry ketenagakerjaan untuk `SKILL.md` + `examples.md`

- [ ] **Step 1: Ambil angka dari sumber resmi**

BPJS: tarif dan batas upah tiap program (Kesehatan, JHT, JKK, JKM, JP) dari sumber resmi BPJS/regulasi. UMP: 38 nilai provinsi + nomor SK/dasar hukum + tanggal berlaku, dari sumber resmi Kemnaker/pemerintah provinsi. Yang tidak terkonfirmasi tidak ditulis.

- [ ] **Step 2: Tulis dua JSON**

`bpjs-2026.json` → `jenis: "komponen"`, `komponen: [{nama, batas_upah, tarif_pemberi, tarif_pekerja}]`. `umpp-2026.json` → `jenis: "daftar"`, `entri: [{kunci: "<PROVINSI>", nilai, satuan: "IDR/bulan"}]` dengan 38 entri.

- [ ] **Step 3: Tulis dua `.md` pasangan**

Tanpa angka. Wajib memuat: dasar hukum per komponen, peringatan bahwa **UMK kabupaten/kota tidak disediakan** (rujuk sumber resmi), dan catatan bahwa nilai berlaku per tahun.

- [ ] **Step 4: Verifikasi**

Run: `node skills/data-resmi-indonesia/scripts/validate-registry.mjs && node -e "const j=require('./skills/data-resmi-indonesia/references/aturan/umpp-2026.json');console.log(j.entri.length)"`
Expected: validator exit 0; jumlah entri UMP `38`

- [ ] **Step 5: Commit**

```bash
git add skills/data-resmi-indonesia/references/aturan skills/data-resmi-indonesia/references/aturan
git commit -m "feat(skill-5): registry ketenagakerjaan 2026 (BPJS, UMP provinsi)"
```

### Task 6: Berkas pola (`registry-bertanggal`, `verifikasi-dan-atribusi`)

**Files:**
- Create: `skills/data-resmi-indonesia/references/pola/registry-bertanggal.md`
- Create: `skills/data-resmi-indonesia/references/pola/verifikasi-dan-atribusi.md`

**Interfaces:**
- Consumes: skema registry (`Global Constraints`), perilaku agen (§5.3 spek)
- Produces: dua prosedur yang dirujuk `SKILL.md` (Task 12) dan seluruh halaman data

- [ ] **Step 1: Tulis `registry-bertanggal.md`**

Isi: skema field wajib + payload per `jenis`; prosedur menambah periode baru; tiga perilaku menolak/ditandai (di luar cakupan → menolak; `diverifikasi_pada` > 400 hari → jalan + tanda; SKB/aturan belum terbit → menolak); format jejak keluaran (`dasar hukum`, `berlaku_dari`, `sumber`, label *estimasi — bukan nasihat pajak/kepatuhan*).

- [ ] **Step 2: Tulis `verifikasi-dan-atribusi.md`**

Isi: dua kelas sumber + syarat bukti berbeda; format wajib tiap halaman data (sumber, `curl`, bentuk, kredensial, batas akses, atribusi, tanggal verifikasi); daftar atribusi wajib per instansi; larangan menyimpan/meng-cache data pribadi (hasil PDDikti, NIK); prosedur bila sumber berubah bentuk/mati.

- [ ] **Step 3: Verifikasi**

Run: `grep -c "^#" skills/data-resmi-indonesia/references/pola/*.md && node skills/data-resmi-indonesia/scripts/validate-registry.mjs`
Expected: kedua berkas punya minimal satu heading; validator exit 0

- [ ] **Step 4: Commit**

```bash
git add skills/data-resmi-indonesia/references/pola
git commit -m "docs(skill-5): pola registry bertanggal + verifikasi/atribusi"
```

### Task 7: Halaman data BMKG (gempa, prakiraan cuaca, nowcast)

**Files:**
- Create: `skills/data-resmi-indonesia/references/data/bmkg-gempa.md`
- Create: `skills/data-resmi-indonesia/references/data/bmkg-cuaca.md`
- Create: `skills/data-resmi-indonesia/references/data/bmkg-nowcast.md`

**Interfaces:**
- Consumes: format wajib dari `references/pola/verifikasi-dan-atribusi.md` (Task 6)
- Produces: tiga halaman kelas "publik tanpa kunci" dengan contoh respons nyata

- [ ] **Step 1: Rekam respons nyata ketiga topik**

Run:
```bash
curl -s "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json" | head -c 600
curl -s "https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=31.71.03.1001" | head -c 600
curl -s "https://www.bmkg.go.id/alerts/nowcast/id" | head -c 600
```
Expected: gempa JSON dengan `Infogempa`; cuaca JSON dengan `lokasi`/`data`; nowcast RSS XML dengan `item`. Kalau salah satu tidak sesuai, halaman itu ditandai "perlu verifikasi" dan dilaporkan — tidak ditulis seolah-olah jalan.

- [ ] **Step 2: Tulis ketiga halaman**

Mengikuti format wajib: sumber + portal, `curl`, potongan respons nyata, bentuk data (JSON/XML/RSS), tanpa kredensial, batas 60 req/menit/IP, atribusi BMKG, tanggal verifikasi. Halaman gempa menyebut 3 jenis data + shakemap. Halaman nowcast menyebut CAP, level kecamatan, dan arti `urgency`/`severity`/`certainty` + menegaskan ini **tidak ada di katalog APIPedia**.

- [ ] **Step 3: Verifikasi**

Run: `grep -l "bmkg" skills/data-resmi-indonesia/references/data/bmkg-*.md | wc -l && grep -c "curl" skills/data-resmi-indonesia/references/data/bmkg-*.md`
Expected: 3 berkas; tiap berkas minimal 1 `curl`

- [ ] **Step 4: Commit**

```bash
git add skills/data-resmi-indonesia/references/data
git commit -m "docs(skill-5): halaman data BMKG (gempa, cuaca, nowcast)"
```

### Task 8: Halaman data kurs (BI) dan statistik (BPS, berkey)

**Files:**
- Create: `skills/data-resmi-indonesia/references/data/bi-kurs.md`
- Create: `skills/data-resmi-indonesia/references/data/bps-statistik.md`

**Interfaces:**
- Consumes: format wajib Task 6; aturan kelas sumber berkey
- Produces: satu halaman kelas "publik tanpa kunci" (BI) dan satu halaman kelas "kunci pengguna" (BPS)

- [ ] **Step 1: Rekam/verifikasi BI**

Run: `curl -s "https://www.bi.go.id/biwebservice/wskursbi.asmx?WSDL" | head -c 600`
Expected: XML WSDL memuat `getSubKursJisdor1..4`, `getSubKursNonUSD_IDR*`, `getSubKursLokal*`. Catat bentuk SOAP/XML-nya apa adanya, termasuk bahwa ini bukan REST.

- [ ] **Step 2: Tulis `bi-kurs.md`**

`curl` WSDL + contoh pemanggilan operasi, potongan respons nyata, daftar operasi (JISDOR, kurs acuan, kurs transaksi), rujukan BI-Rate, atribusi Bank Indonesia, catatan bahwa ini sumber resmi (berbeda dari ECB), dan langkah bila ASMX berubah.

- [ ] **Step 3: Tulis `bps-statistik.md`**

Kelas **kunci pengguna**: `webapi.bps.go.id/v1/api/.../key/<BPS_API_KEY>`, pola `list` vs `view`, kode wilayah BPS (`0000` nasional), rate ~2 req/s, atribusi wajib BPS, **contoh bentuk respons yang ditandai** + perintah self-check, dan larangan menulis key di repo. Tanpa label "terverifikasi".

- [ ] **Step 4: Verifikasi**

Run: `grep -c "BPS_API_KEY" skills/data-resmi-indonesia/references/data/bps-statistik.md && grep -ci "terverifikasi" skills/data-resmi-indonesia/references/data/bps-statistik.md`
Expected: minimal 1 kemunculan `BPS_API_KEY`; 0 klaim terverifikasi

- [ ] **Step 5: Commit**

```bash
git add skills/data-resmi-indonesia/references/data
git commit -m "docs(skill-5): halaman data BI (kurs/JISDOR) dan BPS (berkey)"
```

### Task 9: Halaman data Bapanas dan jadwal sholat

**Files:**
- Create: `skills/data-resmi-indonesia/references/data/bapanas-pangan.md`
- Create: `skills/data-resmi-indonesia/references/data/jadwal-sholat.md`

**Interfaces:**
- Consumes: format wajib Task 6
- Produces: satu halaman kelas "kunci pengguna" (Bapanas) dan satu halaman kombinasi sumber (jadwal sholat)

- [ ] **Step 1: Rekam respons mirror jadwal sholat**

Run: `curl -s "https://api.myquran.com/v2/sholat/kota/semua" | head -c 400`
Expected: JSON dengan `status: true` dan `data` berisi `id`/`lokasi`. Kalau tidak sesuai, halaman ditulis tanpa contoh rekaman dan ditandai.

- [ ] **Step 2: Tulis `jadwal-sholat.md`**

Sumber utama Kemenag (Bimasislam) — kalau endpoint resminya tidak berhasil diverifikasi, tulis apa adanya sebagai "sumber utama: portal Kemenag" tanpa contoh, dan mirror MyQuran sebagai jalur praktis dengan contoh rekaman + atribusi. Sebutkan periode berlaku jadwal dan zona WIB/WITA/WIT.

- [ ] **Step 3: Tulis `bapanas-pangan.md`**

Kelas **kunci pengguna**: `webapi.badanpangan.go.id` (wajib login, env `BAPANAS_API_KEY`) + `data.badanpangan.go.id` untuk rilis **bulanan**; catat panel harian bisa maintenance (pernah terjadi saat riset). Contoh bentuk respons ditandai + perintah self-check; tanpa klaim terverifikasi.

- [ ] **Step 4: Verifikasi**

Run: `grep -c "BAPANAS_API_KEY" skills/data-resmi-indonesia/references/data/bapanas-pangan.md && grep -ci "myquran" skills/data-resmi-indonesia/references/data/jadwal-sholat.md`
Expected: minimal 1 untuk keduanya

- [ ] **Step 5: Commit**

```bash
git add skills/data-resmi-indonesia/references/data
git commit -m "docs(skill-5): halaman data Bapanas (berkey) dan jadwal sholat"
```

### Task 10: Halaman hari libur/cuti bersama dan kalender Hijriah/Jawa

**Files:**
- Create: `skills/data-resmi-indonesia/references/data/hari-libur-cuti-bersama.md`
- Create: `skills/data-resmi-indonesia/references/data/kalender-masehi-hijriah-jawa.md`

**Interfaces:**
- Consumes: format wajib Task 6; perilaku "SKB belum terbit → menolak"
- Produces: dua halaman yang dipakai contoh SLA/hari kerja (Task 13)

- [ ] **Step 1: Kumpulkan dasar penetapan**

Catat sumber penetapan hari libur & cuti bersama (SKB 3 Menteri) dan sumber kalender Hijriah (penetapan/ketetapan Kemenag) + nomor & tahun dokumen yang berlaku. Kalau dokumen tahun berjalan belum ditemukan, tulis sebagai belum terbit.

- [ ] **Step 2: Tulis `hari-libur-cuti-bersama.md`**

Tabel per tahun (hanya tahun yang dokumennya ada, mulai 2026 bila tersedia), dasar hukum, cara menghitung hari kerja/SLA (algoritma + pseudokode, **tanpa angka tarif**), dan perilaku wajib: tahun tanpa SKB → menolak, bukan mengembalikan daftar kosong.

- [ ] **Step 3: Tulis `kalender-masehi-hijriah-jawa.md`**

Konversi Masehi↔Hijriah↔Jawa: dasar (tab/aritmetik atau tabel penetapan), contoh keluaran format, catatan perbedaan hisab/rukyat dan tanggal yang bisa bergeser, rujukan sumber resmi.

- [ ] **Step 4: Verifikasi**

Run: `grep -ci "SKB" skills/data-resmi-indonesia/references/data/hari-libur-cuti-bersama.md && grep -ci "hijriah" skills/data-resmi-indonesia/references/data/kalender-masehi-hijriah-jawa.md && node skills/data-resmi-indonesia/scripts/validate-registry.mjs`
Expected: kedua grep ≥ 1; validator exit 0

- [ ] **Step 5: Commit**

```bash
git add skills/data-resmi-indonesia/references/data
git commit -m "docs(skill-5): halaman hari libur/cuti bersama dan kalender Hijriah/Jawa"
```

### Task 11: Halaman direktori (sekolah, RS, kampus, PDDikti)

**Files:**
- Create: `skills/data-resmi-indonesia/references/data/direktori-sekolah-rs-kampus.md`

**Interfaces:**
- Consumes: format wajib Task 6; batas privasi (tanpa persist data pribadi)
- Produces: satu halaman direktori yang sudah disaring sesuai hasil verifikasi

- [ ] **Step 1: Coba verifikasi tiap kandidat sumber**

Uji satu per satu: referensi DAPODIK/NPSN (sekolah), SIRS Kemenkes (RS), PDDikti (kampus/mahasiswa/dosen/prodi). Catat mana yang merespons dan mana yang tidak.

- [ ] **Step 2: Tulis halaman berisi hanya yang lolos**

Untuk setiap sumber yang lolos: portal, `curl`, potongan respons nyata, atribusi. Untuk PDDikti: tegaskan data pribadi hanya diteruskan — dilarang masuk log/cache/contoh. Sumber yang gagal diverifikasi **dikeluarkan** dari halaman, dan dicatat di laporan ke pemilik (bukan ditulis sebagai "akan datang").

- [ ] **Step 3: Verifikasi**

Run: `grep -c "curl" skills/data-resmi-indonesia/references/data/direktori-sekolah-rs-kampus.md && grep -ci "jangan.*cache\|tidak.*cache" skills/data-resmi-indonesia/references/data/direktori-sekolah-rs-kampus.md`
Expected: minimal 1 `curl`; minimal 1 kalimat larangan cache data pribadi

- [ ] **Step 4: Commit**

```bash
git add skills/data-resmi-indonesia/references/data
git commit -m "docs(skill-5): halaman direktori (sekolah/RS/kampus) hasil verifikasi"
```

### Task 12: `SKILL.md` — router Data vs Aturan

**Files:**
- Create: `skills/data-resmi-indonesia/SKILL.md`

**Interfaces:**
- Consumes: seluruh `references/` dari Task 4–11; pola Task 6
- Produces: pintu masuk skill; frontmatter `name: data-resmi-indonesia` + `description` (dipakai tabel routing AGENTS.md Task 14)

- [ ] **Step 1: Tulis frontmatter dan struktur**

```markdown
---
name: data-resmi-indonesia
description: Use when an app needs Indonesian official data or periodic Indonesian rates — BMKG earthquake/forecast/nowcast alerts, BPS statistics, Bank Indonesia JISDOR & kurs, Bapanas food prices, national holidays & collective leave, Hijriah/Javanese calendar, prayer times, school/hospital/campus directories, and the PPh 21 TER / PTKP / PPN / BPJS / UMP figures that change every year. Triggers on "hari libur nasional", "gempa BMKG", "prakiraan cuaca", "JISDOR", "kurs BI", "harga pangan", "hari kerja", "kalender Hijriah", "jadwal sholat", "UMP 2026", "PPh 21 TER", "BPJS rate", "PTKP".
---
```

- [ ] **Step 2: Tulis isi**

Wajib memuat: **When to Use** (termasuk daftar trigger); **router** Data vs Aturan dengan tabel `topik → berkas`; **Workflow** bagian Data (identifikasi topik → buka halaman → perhatikan atribusi & batas akses); **Workflow** bagian Aturan (petakan tanggal → periode → registry → hitung → jejak keluaran; kalau periode tidak tercakup → menolak); **Anti-patterns** (menyalin angka dari dokumen, menghitung periode luar cakupan, meng-cache data pribadi, menaruh key di kode, menyalin isi cek-APIPedia); **Verification checklist** (jalankan `node skills/data-resmi-indonesia/scripts/validate-registry.mjs`); **Rujukan lintas skill** (wilayah/kode pos/NIK/NPWP/ongkir → `indonesian-data-forms`; QRIS/rekening → `payment-gateway-indonesia`).

- [ ] **Step 3: Verifikasi**

Run: `head -5 skills/data-resmi-indonesia/SKILL.md && node skills/data-resmi-indonesia/scripts/validate-registry.mjs && grep -ci "indonesian-data-forms" skills/data-resmi-indonesia/SKILL.md`
Expected: frontmatter `name` + `description` ada; validator exit 0; rujukan lintas skill ≥ 1

- [ ] **Step 4: Commit**

```bash
git add skills/data-resmi-indonesia/SKILL.md
git commit -m "feat(skill-5): SKILL.md router Data vs Aturan"
```

### Task 13: `examples.md` — tiga contoh end-to-end

**Files:**
- Create: `skills/data-resmi-indonesia/examples.md`

**Interfaces:**
- Consumes: registry Task 4–5; perilaku menolak Task 6; `SKILL.md` Task 12
- Produces: satu-satunya berkas yang boleh memuat angka aturan, dengan syarat sumber + tanggal

- [ ] **Step 1: Tulis contoh 1 — SLA hari kerja**

Menghitung jumlah hari kerja antara dua tanggal dengan memotong hari libur/cuti bersama; sebutkan tahun data, sumber SKB, dan perilaku bila tahun itu belum ada SKB.

- [ ] **Step 2: Tulis contoh 2 — gaji bruto → potongan 2026**

Hitung PPh 21 TER + BPJS untuk satu kasus konkret. Setiap angka wajib disertai komentar `// sumber: <url> · berlaku: <tanggal>`; tampilkan jejak keluaran (dasar hukum, tanggal berlaku, label *estimasi — bukan nasihat pajak/kepatuhan*).

- [ ] **Step 3: Tulis contoh 3 — peringatan dini cuaca**

Ambil nowcast BMKG, saring `severity`/`urgency`, kirim ke kanal notifikasi; tunjukkan atribusi BMKG dan rujukan ke skill `notifikasi-indonesia`. Tetap tandai kode sebagai contoh (bukan kode produksi penuh).

- [ ] **Step 4: Verifikasi**

Run: `grep -c "berlaku:" skills/data-resmi-indonesia/examples.md && node skills/data-resmi-indonesia/scripts/validate-registry.mjs`
Expected: setiap angka aturan di contoh 2 punya `berlaku:`; validator tetap exit 0 (examples.md tidak dipindai)

- [ ] **Step 5: Commit**

```bash
git add skills/data-resmi-indonesia/examples.md
git commit -m "docs(skill-5): tiga contoh end-to-end (SLA hari kerja, payroll, nowcast)"
```

### Task 14: Repo docs — README, AGENTS, CHANGELOG, QUICKSTART, CONTRIBUTING

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `CHANGELOG.md`
- Modify: `QUICKSTART.md`
- Modify: `CONTRIBUTING.md`

**Interfaces:**
- Consumes: frontmatter + daftar berkas skill #5 (Task 12–13)
- Produces: rilis v1.4.0 yang konsisten

- [ ] **Step 1: README**

Tambah seksi **5. Data Resmi Indonesia ✅** (Status/Use when/Files mengikuti pola 4 seksi sebelumnya), tambahkan barisnya di kalimat pembuka daftar pain point, dan cantumkan catatan bahwa skill ini juga memuat aturan berperiode (angka di registry JSON, bukan prosa).

- [ ] **Step 2: AGENTS.md**

Tambah satu baris tabel routing untuk `data-resmi-indonesia` di **kedua** tempat (tabel utama dan blok `cat >> … EOF` instalasi), tambahkan bagian **5. Data Resmi Indonesia ✅** di "Skills Overview", dan tambahkan butir prioritas skill untuk topik data resmi/pajak.

- [ ] **Step 3: CHANGELOG**

Isi `[Unreleased]` menjadi `## [1.4.0] - 2026-11-08` berisi: skill #5 (daftar topik + registri aturan + validator), penyegaran dokumen, dan rujukan lintas skill. Perbarui tautan bawah: `[Unreleased]: …compare/v1.4.0...HEAD` dan tambahkan `[1.4.0]: …compare/v1.3.0...v1.4.0`.

- [ ] **Step 4: QUICKSTART**

Buang narasi basi ("skill pertama", `git init`, `gh repo create`) dan ganti dengan keadaan sekarang: 5 skill, cara install, cara menjalankan validator.

- [ ] **Step 5: CONTRIBUTING**

Hapus usulan "High Priority" yang sudah terwujud (VPS Deployment → skill #2, Indonesian Data & Forms → skill #3), dan ganti langkah rilis `gh` dengan git + web/API karena `gh` tidak terpasang. Tambahkan satu baris: kalau menambah aturan berperiode, wajib lewat registry JSON + jalankan validator.

- [ ] **Step 6: Verifikasi**

Run: `grep -c "data-resmi-indonesia" README.md AGENTS.md CHANGELOG.md && node skills/data-resmi-indonesia/scripts/validate-registry.mjs`
Expected: tiap berkas ≥ 1; validator exit 0

- [ ] **Step 7: Gate rilis**

Run:
```bash
grep -rl "perlu verifikasi" skills/data-resmi-indonesia/references/data/ ; grep -c "menolak" skills/data-resmi-indonesia/references/pola/registry-bertanggal.md ; node skills/data-resmi-indonesia/scripts/validate-registry.mjs
```
Expected: `grep -rl` tidak menghasilkan berkas (tidak ada label "perlu verifikasi" tersisa); prosedur menolak ≥ 1; validator exit 0. Kalau ada yang gagal, **jangan rilis** — selesaikan dulu.

- [ ] **Step 8: Commit**

```bash
git add README.md AGENTS.md CHANGELOG.md QUICKSTART.md CONTRIBUTING.md docs
git commit -m "docs: rilis v1.4.0 - skill Data Resmi Indonesia"
```

### Task 15: Rujukan silang dua arah dengan skill #3

**Files:**
- Modify: `skills/indonesian-data-forms/SKILL.md`
- Modify: `skills/data-resmi-indonesia/SKILL.md`

**Interfaces:**
- Consumes: Task 12 (bagian rujukan lintas skill)
- Produces: tidak ada duplikasi isi antara #3 dan #5

- [ ] **Step 1: Tambah rujukan di skill #3**

Sisipkan blok pendek di `indonesian-data-forms/SKILL.md`: untuk hari libur/hari kerja, kurs BI/JISDOR, UMP, dan aturan pajak → pakai `data-resmi-indonesia`; sebutkan bahwa wilayah/kode pos/NIK/NPWP/ongkir tetap di skill ini.

- [ ] **Step 2: Pastikan arah balik ada**

Periksa `skills/data-resmi-indonesia/SKILL.md` menunjuk ke `indonesian-data-forms` untuk wilayah/kode pos/NIK/NPWP/ongkir (Task 12 Step 3). Kalau belum, tambahkan.

- [ ] **Step 3: Verifikasi**

Run: `grep -c "data-resmi-indonesia" skills/indonesian-data-forms/SKILL.md && grep -c "indonesian-data-forms" skills/data-resmi-indonesia/SKILL.md`
Expected: keduanya ≥ 1

- [ ] **Step 4: Commit**

```bash
git add skills/indonesian-data-forms/SKILL.md skills/data-resmi-indonesia/SKILL.md
git commit -m "docs: rujukan silang skill #3 <-> skill #5"
```

### Task 16: Audit skill #1–#4 (gerbong 2) — serahkan sebelum patch

**Files:**
- Create: `docs/superpowers/notes/2026-11-08-audit-skill-1-4.md`

**Interfaces:**
- Consumes: 4 skill lama (`skills/payment-gateway-indonesia`, `hosting-deployment-indonesia`, `indonesian-data-forms`, `notifikasi-indonesia`)
- Produces: daftar temuan untuk diveto pemilik; **patch dikerjakan di plan terpisah setelah veto**

- [ ] **Step 1: Sisir klaim yang bisa basi**

Untuk tiap skill, catat: versi/endpoint API provider yang disebut (Midtrans, Xendit, Doku, Meta Cloud API, gateway WA, ongkir), daftar provider, tautan yang perlu dicek hidup, dan angka/kebijakan berperiode yang salah tempat (seharusnya di registry).

- [ ] **Step 2: Tulis laporan audit**

Format per temuan: `skill` · `berkas:baris` · `klaim saat ini` · `kenapa dicurigai basi` · `usulan perubahan` · `cara verifikasi`. Pisahkan mana yang berhasil diverifikasi dan mana yang belum.

- [ ] **Step 3: Verifikasi**

Run: `grep -c "^### " docs/superpowers/notes/2026-11-08-audit-skill-1-4.md`
Expected: ≥ 4 (satu heading per skill yang diperiksa), dan setiap temuan punya keenam field

- [ ] **Step 4: Commit + serahkan**

```bash
git add docs/superpowers/notes/2026-11-08-audit-skill-1-4.md
git commit -m "docs: audit skill #1-#4 (temuan, menunggu veto)"
```

Laporkan ke pemilik: daftar temuan + usulan patch, minta veto sebelum mengerjakan. **Berhenti di sini** — patch skill lama masuk plan terpisah.

---

## Setelah Plan Ini

1. Tinjau diff menyeluruh sebelum push; `git push origin main` sudah terverifikasi punya kredensial (keychain).
2. Rilis v1.4.0: tag `v1.4.0` + catatan rilis dari `CHANGELOG.md` lewat web GitHub (CLI `gh` tidak terpasang).
