<div align="center">

# 🇮🇩 Indonesian Developer Skills

**Skill bundle untuk OpenCode & AI coding agents** — dibangun khusus untuk alur kerja developer Indonesia.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](CHANGELOG.md)
[![Skills](https://img.shields.io/badge/skills-5-green.svg)](#-skills-included)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

*Payment gateway lokal · Deploy VPS Indonesia · Data & formulir Indonesia · Notifikasi · Data resmi & aturan 2026 — siap pakai, production-ready.*

</div>

---

## Kenapa Bundle Ini?

Developer Indonesia menghadapi **pain point unik** yang tidak dicakup skill bundle umum:

- 🏦 Gateway pembayaran lokal (Midtrans, Xendit, Doku) dengan **format & webhook signature berbeda-beda**
- ☁️ Deploy ke **VPS lokal** (Biznet Gio, IDCloudHost, Niagahoster, Rumahweb) & shared hosting cPanel
- 📋 Validasi **NIK/NPWP**, wilayah administratif, format nomor HP, ongkir, Rupiah, timezone WIB/WITA/WIT
- 📲 Notifikasi via **WhatsApp** (Fonnte, Wablas, Watzap, Meta Cloud API), Telegram, dan Email
- 🧾 **Data resmi** (BMKG, BPS, Bank Indonesia, Bapanas, Kemenag) & **aturan berperiode 2026** (PTKP, PPh 21 TER, PPN, BPJS, UMP) dalam registry JSON yang divalidasi otomatis

Semua skill **100% dibuat dari pain point nyata**, bukan repackage skill umum. Solusi **production-ready** dengan contoh implementasi lengkap, bukan sekadar konsep.

---

## ✨ Skills Included

| # | Skill | Fokus Utama |
| --- | --- | --- |
| 1 | **Payment Gateway Indonesia** | Midtrans, Xendit, Doku — webhook verification, status mapping, sandbox, QRIS/VA/e-wallet |
| 2 | **Hosting & Deployment Indonesia** | Deploy Laravel/Node.js ke VPS lokal & cPanel — Nginx, SSL, Supervisor, backup, zero-downtime |
| 3 | **Indonesian Data & Forms** | Wilayah administratif, NIK/NPWP, nomor HP (+62), ongkir (RajaOngkir/Biteship), Rupiah, timezone |
| 4 | **Notifikasi Indonesia** | WhatsApp (Fonnte, Wablas, Watzap, Meta Cloud API), Telegram, Email — OTP aman, fallback multi-channel |
| 5 | **Data Resmi Indonesia** | BMKG, BPS, Bank Indonesia (JISDOR/kurs), Bapanas, hari libur, kalender Hijriah/Jawa, jadwal sholat, direktori, aturan 2026 |

### Detail Skill

<details>
<summary><b>1. Payment Gateway Indonesia</b> — Midtrans, Xendit, Doku</summary>

**Solves:**
- ✅ Webhook signature verification (SHA-512 Midtrans, HMAC-SHA256 Xendit)
- ✅ Status mapping yang konsisten antar-provider
- ✅ Sandbox testing setup (URL, kredensial, webhook ngrok)
- ✅ QRIS, Virtual Account, e-wallet (GoPay, OVO, DANA, ShopeePay)

**Use when:** integrasi payment gateway Indonesia, verifikasi webhook, mapping status, testing sandbox.

**Files:** `SKILL.md` · `examples.md` (adapter lengkap) · `references/provider-comparison.md` · `references/webhook-verification.md` · `references/status-mapping.md` · `references/sandbox-setup.md`
</details>

<details>
<summary><b>2. Hosting & Deployment Indonesia</b> — VPS lokal & cPanel</summary>

**Solves:**
- ✅ Supervisor queue worker config (selalu lupa)
- ✅ SSL Let's Encrypt + auto-renewal (renewal gagal)
- ✅ Nginx reverse proxy untuk Node.js (WebSocket)
- ✅ Database backup automation
- ✅ Initial server setup & hardening
- ✅ Zero-downtime deployment
- ✅ cPanel shared hosting deployment

**Use when:** deploy Laravel/Node.js ke VPS Indonesia, setup Nginx/SSL/Supervisor, deploy cPanel.

**Files:** `SKILL.md` · `references/supervisor-config.md` · `references/ssl-letsencrypt.md` · `references/nginx-reverse-proxy.md` · `references/database-backup.md` · `references/initial-server-setup.md` · `references/zero-downtime-deployment.md` · `references/cpanel-deployment.md`
</details>

<details>
<summary><b>3. Indonesian Data & Forms</b> — validasi & format</summary>

**Solves:**
- ✅ Wilayah administratif (provinsi → kelurahan, sering outdated)
- ✅ NIK & NPWP validation
- ✅ Format nomor HP (+62 normalization)
- ✅ Ongkir integration (RajaOngkir, Biteship)
- ✅ Format Rupiah (float error handling)
- ✅ Timezone WIB/WITA/WIT

**Use when:** form alamat dropdown wilayah, validasi NIK/NPWP, normalize nomor HP, cek ongkir, format Rupiah.

**Files:** `SKILL.md` · `references/wilayah-administratif.md` · `references/nik-npwp-validation.md` · `references/phone-formatting.md` · `references/ongkir-integration.md` · `references/rupiah-formatting.md` · `references/timezone-indonesia.md`
</details>

<details>
<summary><b>4. Notifikasi Indonesia</b> — WhatsApp, Telegram, Email</summary>

**Solves:**
- ✅ WhatsApp gateway berbeda-beda (Fonnte, Wablas, Watzap, Meta Cloud API)
- ✅ Unified interface WhatsApp/Telegram/Email
- ✅ OTP flow yang aman (crypto-secure, hashed, rate-limited)
- ✅ Alert internal ke Telegram
- ✅ Email transaksional & deliverability
- ✅ Multi-channel fallback

**Use when:** kirim OTP via WhatsApp, notifikasi transaksi, alert server, email transaksional.

**Files:** `SKILL.md` · `examples.md` (adapter lengkap) · `references/whatsapp-gateway.md` · `references/telegram-bot.md` · `references/email-notification.md` · `references/otp-and-templates.md` · `references/provider-comparison.md`
</details>

<details>
<summary><b>5. Data Resmi Indonesia</b> — data resmi & aturan 2026</summary>

**Solves:**
- ✅ Hari libur nasional & cuti bersama (SKB 3 Menteri)
- ✅ Gempa/prakiraan cuaca/peringatan dini BMKG
- ✅ Kurs BI & JISDOR
- ✅ Statistik BPS & harga pangan Bapanas
- ✅ Kalender Hijriah/Jawa & jadwal sholat
- ✅ Direktori sekolah/rumah sakit/kampus (PDDikti)
- ✅ Aturan pajak 2026 (PTKP, PPh 21 TER, PPN), BPJS, UMP lewat **registry JSON + validator**

**Use when:** butuh data resmi Indonesia, butuh aturan berperiode (angkanya berubah tiap tahun), cek hari libur/kalender/jadwal sholat.

**Files:** `SKILL.md` (router data vs aturan) · `references/data/*.md` · `references/aturan/*.json` (registry) · `scripts/validate-registry.mjs`

> 🔑 **Keunggulan skill #5:** aturan berperiode angka-angka ada di **registry JSON** (`references/aturan/`), bukan di prosa. Validator memastikan setiap angka punya `sumber` + `diverifikasi_pada` dan tidak bocor ke teks.
</details>

---

## 🚀 Instalasi

### Pilihan 1: Instal Langsung (Direkomendasikan)

```bash
# 1. Clone ke direktori konfigurasi OpenCode
git clone https://github.com/irhamullah/indonesian-dev-skills \
  ~/.config/opencode/indonesian-dev-skills

# 2. Registrasikan di opencode.jsonc
{
  "skills": [
    "~/.config/opencode/indonesian-dev-skills/skills"
  ]
}

# 3. Tambahkan tabel routing skill ke AGENTS.md OpenCode kamu
cat ~/.config/opencode/indonesian-dev-skills/AGENTS.md >> ~/.config/opencode/AGENTS.md

# 4. Restart OpenCode
```

### Pilihan 2: Uji Lokal Dulu

```bash
git clone https://github.com/irhamullah/indonesian-dev-skills ~/test-skills
# Tambahkan "~/test-skills/skills" ke skills array di opencode.jsonc
# Uji, lalu pindahkan kalau cocok
```

### Setelah Instal

Trigger skill langsung dari chat OpenCode, misalnya:

```
"Setup Midtrans payment gateway dengan QRIS"
"Deploy Laravel ke IDCloudHost"
"Validasi NIK"
"Kirim OTP WhatsApp"
"Jadwal sholat hari ini"
"Berapa PPh 21 TER untuk penghasilan 15 juta?"
```

---

## 🧪 Menjalankan Validator (Skill #5)

```bash
node skills/data-resmi-indonesia/scripts/validate-registry.mjs
```

Harapkan exit code `0`. Jalankan tiap kali mengubah/menambah aturan di `references/aturan/*.json`.

---

## 🎯 Design Principles

1. **Original, not derivative** — tidak repackage skill umum
2. **Indonesia-specific** — solve pain point unik developer Indonesia
3. **Production-ready** — implementasi lengkap, bukan hanya konsep
4. **Maintainable** — abstraksi jelas, mudah diekstensi
5. **Well-documented** — contoh, referensi, troubleshooting

| Aspek | Skill bundle umum | Indonesian Dev Skills |
| --- | --- | --- |
| **Fokus** | Praktik umum | Implementasi khusus Indonesia |
| **Scope** | Pola framework-agnostic | Dalam di ekosistem lokal (payment, hosting, data, notifikasi) |
| **Contoh** | Konsep abstrak | Production-ready, konteks Indonesia |
| **Cakupan** | Luas & dangkal | Sempit & dalam |

---

## 🤝 Berkontribusi

Kontribusi sangat diterima! Punya pain point developer Indonesia lain yang belum ada?

- Fork repo & buat skill baru di `skills/your-skill-name/`
- Gunakan `skills/payment-gateway-indonesia/` sebagai template
- Sertakan contoh kode yang berfungsi
- Untuk skill #5: tambahkan aturan hanya via registry JSON, jalankan validator
- Detail lengkap: lihat [`CONTRIBUTING.md`](CONTRIBUTING.md)

---

## 📊 Project Stats

```
Skills    : 5 (masing-masing SKILL.md + examples/references)
Struktur  : skills/<nama-skill>/{SKILL.md, examples.md, references/}
Validator  : skills/data-resmi-indonesia/scripts/validate-registry.mjs
Lisensi   : MIT
```

---

## 🗺️ Struktur Repo

```
.
├── README.md
├── AGENTS.md               # tabel routing skill (untuk OpenCode)
├── QUICKSTART.md           # mulai cepat
├── CHANGELOG.md            # riwayat versi
├── CONTRIBUTING.md         # panduan kontribusi
├── LICENSE                  # MIT
└── skills/
    ├── payment-gateway-indonesia/
    ├── hosting-deployment-indonesia/
    ├── indonesian-data-forms/
    ├── notifikasi-indonesia/
    └── data-resmi-indonesia/
        ├── SKILL.md
        ├── examples.md
        ├── references/data/    # panduan per topik
        ├── references/aturan/  # registry JSON 2026
        └── scripts/validate-registry.mjs
```

---

## 🆚 Versi & Changelog

Lihat [`CHANGELOG.md`](CHANGELOG.md) untuk riwayat lengkap. Versi terbaru: **v1.4.0**.

---

## 📮 Dukungan & Kontak

- **Issues**: https://github.com/irhamullah/indonesian-dev-skills/issues
- **Discussions**: https://github.com/irhamullah/indonesian-dev-skills/discussions
- **Email**: irhamullah01@gmail.com

---

> **Built with ❤️ oleh Indonesian developers, untuk Indonesian developers.**

Distributed under the [MIT License](LICENSE).
