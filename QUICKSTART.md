# 🚀 Quick Start - Indonesian Developer Skills

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.4.0-blue.svg)](CHANGELOG.md)

Skill bundle untuk workflow khas Indonesian developers. Saat ini berisi **5 skill**.

## 📦 What's Included

| # | Skill | Fokus |
| --- | --- | --- |
| 1 | **Payment Gateway Indonesia** | Midtrans, Xendit, Doku; webhook verification, status mapping, sandbox, QRIS/VA/e-wallet |
| 2 | **Hosting & Deployment Indonesia** | Deploy Laravel/Node.js ke VPS lokal (IDCloudHost, Niagahoster, Rumahweb, Biznet Gio) & cPanel |
| 3 | **Indonesian Data & Forms** | Wilayah administratif, NIK/NPWP, nomor HP (+62), ongkir, Rupiah, timezone |
| 4 | **Notifikasi Indonesia** | WhatsApp (Fonnte, Wablas, Watzap, Meta Cloud API), Telegram, Email; OTP aman |
| 5 | **Data Resmi Indonesia** | BMKG, BPS, Bank Indonesia (JISDOR/kurs), Bapanas, hari libur, kalender, aturan pajak/BPJS/UMP |

## 🚀 Installation

```bash
# 1. Clone ke OpenCode config directory
git clone https://github.com/irhamullah/indonesian-dev-skills \
  ~/.config/opencode/indonesian-dev-skills

# 2. Update opencode.jsonc
# Tambahkan skills array:
{
  "skills": [
    "~/.config/opencode/indonesian-dev-skills/skills"
  ]
}

# 3. Update AGENTS.md (copy tabel routing dari AGENTS.md di bundle ini)
cat ~/.config/opencode/indonesian-dev-skills/AGENTS.md >> ~/.config/opencode/AGENTS.md

# 4. Restart OpenCode
```

Setelah install, trigger skill langsung dari chat OpenCode, misalnya:

```
"Setup Midtrans payment gateway dengan QRIS"
"Deploy Laravel ke IDCloudHost"
"Validasi NIK"
"Kirim OTP WhatsApp"
"Jadwal sholat hari ini"
"Berapa PPh 21 TER untuk penghasilan 15 juta?"
```

## 🧪 Menjalankan Validator

Skill #5 (Data Resmi Indonesia) memakai registry JSON untuk aturan berperiode
(pajak, BPJS, UMP). Validator memastikan angka aturan hanya ada di JSON,
memiliki `sumber` + `diverifikasi_pada`, dan tidak bocor ke prosa:

```bash
node skills/data-resmi-indonesia/scripts/validate-registry.mjs
```

Harapkan exit code `0`. Jalankan setelah mengubah/menambah aturan di `references/aturan/*.json`.

## 📊 Project Stats

```
Total Files: 5 skill (masing-masing SKILL.md + examples/references)
Skills: 5 (Payment Gateway, Hosting & Deployment, Indonesian Data & Forms, Notifikasi, Data Resmi Indonesia)
Validator: skills/data-resmi-indonesia/scripts/validate-registry.mjs

Structure:
├── README.md
├── AGENTS.md (integration guide)
├── CHANGELOG.md (version history)
├── CONTRIBUTING.md (contribution guide)
├── LICENSE (MIT)
├── .gitignore
└── skills/
    ├── payment-gateway-indonesia/
    ├── hosting-deployment-indonesia/
    ├── indonesian-data-forms/
    ├── notifikasi-indonesia/
    └── data-resmi-indonesia/
        ├── SKILL.md
        ├── references/data/   (panduan per topik: BMKG, BI, BPS, Bapanas, ...)
        ├── references/aturan/ (registry JSON: pajak-*-2026.json, ketenagakerjaan-*-2026.json)
        └── scripts/validate-registry.mjs
```

## 🎓 What Makes This Special

- **Original, not derivative** — 100% dibuat dari pain point nyata Indonesian developers
- **Indonesia-specific** — solve masalah yang specific ke ekosistem Indonesia
- **Production-ready** — example dan reference lengkap, bukan konsep abstrak
- **Angka aturan di registry JSON** — tidak ada angka pajak/BPJS/UMP di prosa; divalidasi otomatis

## 🤝 Contributing

Lihat `CONTRIBUTING.md`. Catatan khusus untuk skill #5: kalau menambah aturan
berperiode, **wajib** lewat registry JSON (`references/aturan/*.json`) dan
jalankan validator.

## 📮 Support

- **Issues**: https://github.com/irhamullah/indonesian-dev-skills/issues
- **Discussions**: https://github.com/irhamullah/indonesian-dev-skills/discussions
- **Email**: irhamullah01@gmail.com

---

**Built with ❤️ by Indonesian developers**
