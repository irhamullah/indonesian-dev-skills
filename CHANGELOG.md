# Changelog

All notable changes to Indonesian Developer Skills will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-11-08

### Added
- **Data Resmi Indonesia** skill (#5)
  - Data resmi Indonesia: BMKG (gempa/prakiraan cuaca/peringatan dini), BPS, Bank Indonesia (JISDOR/kurs), Bapanas (harga pangan), Kemenag
  - Hari libur nasional & cuti bersama (SKB 3 Menteri), kalender Hijriah/Jawa, jadwal sholat
  - Direktori sekolah/rumah sakit/kampus (PDDikti)
  - Aturan berperiode 2026 dalam registry JSON (`skills/data-resmi-indonesia/references/aturan/`): pajak (PTKP, PPh 21 TER, PPN), BPJS, UMP — digerbangi validator `scripts/validate-registry.mjs`
  - Referensi lintas skill dua arah dengan `indonesian-data-forms`
- Penyegaran dokumen repo untuk rilis v1.4.0 (README, AGENTS, QUICKSTART, CONTRIBUTING)

## [1.3.0] - 2026-11-03

### Added
- **Notifikasi Indonesia** skill
  - Unified `NotificationProvider` interface (WhatsApp, Telegram, Email)
  - WhatsApp gateway adapters: Fonnte, Wablas, Watzap, Meta Cloud API (official)
  - Telegram Bot API integration (internal alerts, inline buttons)
  - Email transaksional: Gmail SMTP, Resend, deliverability (SPF/DKIM/DMARC)
  - OTP flow: crypto-secure, hashed, rate-limited, single-use
  - Message templates multi-channel + opt-in tracking
  - Provider comparison & migration path (unofficial → official)
  - 5 reference guides: WhatsApp gateway, Telegram bot, email notification, OTP & templates, provider comparison

## [1.2.0] - 2026-11-03

### Added
- **Indonesian Data & Forms** skill
  - Wilayah administratif data strategy
  - NIK & NPWP validation
  - Phone number formatting (+62)
  - Ongkir integration (RajaOngkir, Biteship)
  - Rupiah formatting & money handling
  - Timezone WIB/WITA/WIT

## [1.1.0] - 2026-11-03

### Added
- **Hosting & Deployment Indonesia** skill
  - Complete VPS deployment workflow (Laravel & Node.js)
  - cPanel shared hosting workflow
  - 7 reference guides: Supervisor, SSL Let's Encrypt, Nginx reverse proxy, database backup, initial server setup, zero-downtime deployment, cPanel

## [1.0.0] - 2026-11-03

### Added
- Initial release
- **Payment Gateway Indonesia** skill (complete)
  - Unified normalization layer for Midtrans, Xendit, Doku
  - Complete adapter implementations with examples
  - Webhook signature verification guide
  - Status mapping table for all providers
  - Sandbox testing setup guide
  - Side-by-side provider comparison
- README with installation instructions
- AGENTS.md integration guide
- MIT License

### Key Features
- Support for QRIS, Virtual Account, e-wallet (GoPay, OVO, DANA, ShopeePay)
- Production-ready code examples
- Comprehensive testing guides
- Security best practices

[Unreleased]: https://github.com/irhamullah/indonesian-dev-skills/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/irhamullah/indonesian-dev-skills/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/irhamullah/indonesian-dev-skills/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/irhamullah/indonesian-dev-skills/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/irhamullah/indonesian-dev-skills/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/irhamullah/indonesian-dev-skills/releases/tag/v1.0.0
