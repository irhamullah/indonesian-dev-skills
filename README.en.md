<div align="center">

# 🇮🇩 Indonesian Developer Skills

**A skill bundle for every AI coding agent** (Claude Code, OpenAI Codex, Cursor, Gemini CLI, VS Code, OpenCode) — purpose-built for Indonesian developer workflows.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.5.0-blue.svg)](CHANGELOG.md)
[![Skills](https://img.shields.io/badge/skills-6-green.svg)](#-skills-included)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

*Local payment gateways · Indonesian VPS deployment · Indonesian data & forms · Notifications · Official data & 2026 rates · PDP/privacy compliance — ready-to-use, production-ready.*

</div>

---

> 🇮🇩 **Pembaca Indonesia:** README ini dalam **bahasa Inggris**. Versi **Bahasa Indonesia tersedia di → [README.md](README.md)**.

---

## Why This Bundle?

Indonesian developers face **unique pain points** that generic skill bundles don't cover:

- 🏦 Local payment gateways (Midtrans, Xendit, Doku) with **different formats & webhook signatures**
- ☁️ Deploying to **local VPS** (Biznet Gio, IDCloudHost, Niagahoster, Rumahweb) & cPanel shared hosting
- 📋 **NIK/NPWP** validation, administrative regions, phone number formats, shipping costs, Rupiah, WIB/WITA/WIT timezones
- 📲 Notifications via **WhatsApp** (Fonnte, Wablas, Watzap, Meta Cloud API), Telegram, and Email
- 🧾 **Official data** (BMKG, BPS, Bank Indonesia, Bapanas, Kemenag) & **periodic 2026 rates** (PTKP, PPh 21 TER, PPN, BPJS, UMP) in an auto-validated JSON registry
- 🛡️ **Personal data protection** compliance under UU 27/2022 (UU PDP) & PP 33/2026

Every skill is **100% built from real pain points**, not repackaged generic skills — **production-ready** with complete implementation examples, not just concepts.

---

## ✨ Skills Included

| # | Skill | Main Focus |
| --- | --- | --- |
| 1 | **Payment Gateway Indonesia** | Midtrans, Xendit, Doku — webhook verification, status mapping, sandbox, QRIS/VA/e-wallet |
| 2 | **Hosting & Deployment Indonesia** | Deploy Laravel/Node.js to local VPS & cPanel — Nginx, SSL, Supervisor, backup, zero-downtime |
| 3 | **Indonesian Data & Forms** | Administrative regions, NIK/NPWP, phone numbers (+62), shipping (RajaOngkir/Biteship), Rupiah, timezone |
| 4 | **Notifikasi Indonesia** | WhatsApp (Fonnte, Wablas, Watzap, Meta Cloud API), Telegram, Email — secure OTP, multi-channel fallback |
| 5 | **Official Indonesian Data** | BMKG, BPS, Bank Indonesia (JISDOR/kurs), Bapanas, holidays, Hijriah/Javanese calendar, prayer times, directories, 2026 rates |
| 6 | **Personal Data Protection (PDP)** | UU 27/2022 & PP 33/2026 — lawful bases, data subject rights, breach notification (3×24h), processor contracts, sanctions |

### Skill Details

<details>
<summary><b>1. Payment Gateway Indonesia</b> — Midtrans, Xendit, Doku</summary>

**Solves:**
- ✅ Webhook signature verification (SHA-512 Midtrans, HMAC-SHA256 Xendit)
- ✅ Consistent cross-provider status mapping
- ✅ Sandbox testing setup (URL, credentials, ngrok webhook)
- ✅ QRIS, Virtual Account, e-wallet (GoPay, OVO, DANA, ShopeePay)

**Use when:** integrating Indonesian payment gateways, verifying webhooks, mapping statuses, sandbox testing.

**Files:** `SKILL.md` · `examples.md` (full adapters) · `references/provider-comparison.md` · `references/webhook-verification.md` · `references/status-mapping.md` · `references/sandbox-setup.md`
</details>

<details>
<summary><b>2. Hosting & Deployment Indonesia</b> — local VPS & cPanel</summary>

**Solves:**
- ✅ Supervisor queue worker config (always forgotten)
- ✅ Let's Encrypt SSL + auto-renewal (renewal failures)
- ✅ Nginx reverse proxy for Node.js (WebSocket)
- ✅ Database backup automation
- ✅ Initial server setup & hardening
- ✅ Zero-downtime deployment
- ✅ cPanel shared hosting deployment

**Use when:** deploying Laravel/Node.js to Indonesian VPS, setting up Nginx/SSL/Supervisor, cPanel deployment.

**Files:** `SKILL.md` · `references/supervisor-config.md` · `references/ssl-letsencrypt.md` · `references/nginx-reverse-proxy.md` · `references/database-backup.md` · `references/initial-server-setup.md` · `references/zero-downtime-deployment.md` · `references/cpanel-deployment.md`
</details>

<details>
<summary><b>3. Indonesian Data & Forms</b> — validation & formatting</summary>

**Solves:**
- ✅ Administrative regions (province → sub-district, often outdated)
- ✅ NIK & NPWP validation
- ✅ Phone number formatting (+62 normalization)
- ✅ Shipping cost integration (RajaOngkir, Biteship)
- ✅ Rupiah formatting (float error handling)
- ✅ WIB/WITA/WIT timezone

**Use when:** address dropdowns, NIK/NPWP validation, phone normalization, shipping cost, Rupiah formatting.

**Files:** `SKILL.md` · `references/wilayah-administratif.md` · `references/nik-npwp-validation.md` · `references/phone-formatting.md` · `references/ongkir-integration.md` · `references/rupiah-formatting.md` · `references/timezone-indonesia.md`
</details>

<details>
<summary><b>4. Notifikasi Indonesia</b> — WhatsApp, Telegram, Email</summary>

**Solves:**
- ✅ Different WhatsApp gateways (Fonnte, Wablas, Watzap, Meta Cloud API)
- ✅ Unified WhatsApp/Telegram/Email interface
- ✅ Secure OTP flow (crypto-secure, hashed, rate-limited)
- ✅ Internal alerts to Telegram
- ✅ Transactional email & deliverability
- ✅ Multi-channel fallback

**Use when:** sending OTP via WhatsApp, transaction notifications, server alerts, transactional email.

**Files:** `SKILL.md` · `examples.md` (full adapters) · `references/whatsapp-gateway.md` · `references/telegram-bot.md` · `references/email-notification.md` · `references/otp-and-templates.md` · `references/provider-comparison.md`
</details>

<details>
<summary><b>5. Official Indonesian Data</b> — official data & 2026 rates</summary>

**Solves:**
- ✅ National holidays & collective leave (SKB 3 Menteri)
- ✅ BMKG earthquakes/forecast/early warnings
- ✅ Bank Indonesia rates & JISDOR
- ✅ BPS statistics & Bapanas food prices
- ✅ Hijriah/Javanese calendar & prayer times
- ✅ School/hospital/campus directories (PDDikti)
- ✅ 2026 tax rates (PTKP, PPh 21 TER, PPN), BPJS, UMP via **JSON registry + validator**

**Use when:** need official Indonesian data, need periodic rates (change yearly), check holidays/calendar/prayer times.

**Files:** `SKILL.md` (data-vs-rates router) · `references/data/*.md` · `references/aturan/*.json` (registry) · `scripts/validate-registry.mjs`

> 🔑 **Skill #5 differentiator:** periodic figures live in a **JSON registry** (`references/aturan/`), not prose. The validator ensures every figure has a `sumber` + `diverifikasi_pada` and never leaks into text.
</details>

<details>
<summary><b>6. Personal Data Protection (PDP)</b> — UU 27/2022 & PP 33/2026</summary>

**Solves:**
- ✅ Identify personal data (general vs specific) & applicable lawful bases
- ✅ Implement data subject rights (access, correction, erasure, portability, objection)
- ✅ Controller/processor obligations, incl. DPA contracts & cross-border transfer
- ✅ Breach notification procedure within **3×24 hours**
- ✅ Sanction risk matrix (admin up to 2% annual revenue; criminal).)

**Use when:** your app processes Indonesian users' personal data and must comply with UU 27/2022 (UU PDP) & PP 33/2026 — consent flows, privacy policies, data subject rights, breach response, processor agreements, cross-border transfers.

**Files:** `SKILL.md` (router) · `references/konsep-dasar.md` · `references/hak-subjek-data.md` · `references/kewajiban-pengendali-prosesor.md` · `references/notifikasi-insiden.md` · `references/sanksi.md`

> 🔑 **Skill #6 differentiator:** grounded in verified legal facts (UU 27/2022, PP 33/2026 effective 16 Jan 2027), turning abstract privacy law into concrete engineering checklists.
</details>

---

## 🚀 Installation

### Option 1: Direct Install (Recommended)

```bash
# 1. Clone into your OpenCode config directory
git clone https://github.com/irhamullah/indonesian-dev-skills \
  ~/.config/opencode/indonesian-dev-skills

# 2. Register in opencode.jsonc
{
  "skills": [
    "~/.config/opencode/indonesian-dev-skills/skills"
  ]
}

# 3. Append the skill routing table to your OpenCode AGENTS.md
cat ~/.config/opencode/indonesian-dev-skills/AGENTS.md >> ~/.config/opencode/AGENTS.md

# 4. Restart OpenCode
```

### Option 2: Test Locally First

```bash
git clone https://github.com/irhamullah/indonesian-dev-skills ~/test-skills
# Add "~/test-skills/skills" to the skills array in opencode.jsonc
# Test, then move it if it fits
```

### After Installing

Trigger skills directly from OpenCode chat, e.g.:

```
"Setup Midtrans payment gateway dengan QRIS"
"Deploy Laravel ke IDCloudHost"
"Validasi NIK"
"Kirim OTP WhatsApp"
"Jadwal sholat hari ini"
"Berapa PPh 21 TER untuk penghasilan 15 juta?"
"Implementasikan consent flow UU PDP"
```

---

## 🖥️ Installation Across AI Agents

The bundle uses the **open Agent Skills format** (`name` + `description` frontmatter in `SKILL.md`) initiated by Anthropic and adopted across tools. The same skill folder can be installed on **all popular AI agents** without format conversion.

> All agents below load skills by **copying the `skills/<skill-name>/` directory** to the appropriate location. No rewriting needed.

| AI Agent | Skills location | Support |
| --- | --- | --- |
| **Claude Code** | `~/.claude/skills/` | ✅ native |
| **OpenAI Codex** | `~/.codex/skills/` | ✅ native |
| **Cursor** | `.cursor/skills/` (project) / `~/.agents/skills/` (user) | ✅ native |
| **Gemini CLI** | `~/.agents/skills/` | ✅ native |
| **VS Code** | `.github/skills/` | ✅ native |
| **OpenCode** | `opencode.jsonc` → `skills` array | ✅ native |

### 1. Claude Code

```bash
git clone https://github.com/irhamullah/indonesian-dev-skills ~/indonesian-dev-skills
# Copy skills (each folder contains a SKILL.md)
cp -R ~/indonesian-dev-skills/skills/payment-gateway-indonesia ~/.claude/skills/
cp -R ~/indonesian-dev-skills/skills/hosting-deployment-indonesia ~/.claude/skills/
cp -R ~/indonesian-dev-skills/skills/indonesian-data-forms ~/.claude/skills/
cp -R ~/indonesian-dev-skills/skills/notifikasi-indonesia ~/.claude/skills/
cp -R ~/indonesian-dev-skills/skills/data-resmi-indonesia ~/.claude/skills/
cp -R ~/indonesian-dev-skills/skills/pelindungan-data-pribadi ~/.claude/skills/
```

Claude Code auto-detects skills from `~/.claude/skills/<name>/SKILL.md`.

### 2. OpenAI Codex

```bash
mkdir -p ~/.codex/skills
cp -R ~/indonesian-dev-skills/skills/* ~/.codex/skills/
```

Codex (since Dec 2025) reads directories containing `SKILL.md` in `~/.codex/skills/`.

### 3. Cursor

```bash
# Project-level (use in a specific repo)
cp -R ~/indonesian-dev-skills/skills/* .cursor/skills/

# or user-level (global)
mkdir -p ~/.agents/skills
cp -R ~/indonesian-dev-skills/skills/* ~/.agents/skills/
```

Cursor follows the same open Agent Skills format — the same folder also works in Codex & Claude Code.

### 4. Gemini CLI

```bash
mkdir -p ~/.agents/skills
cp -R ~/indonesian-dev-skills/skills/* ~/.agents/skills/
```

### 5. VS Code

```bash
mkdir -p .github/skills
cp -R ~/indonesian-dev-skills/skills/* .github/skills/
```

### 6. OpenCode

```bash
git clone https://github.com/irhamullah/indonesian-dev-skills \
  ~/.config/opencode/indonesian-dev-skills
```

Then in `opencode.jsonc`:

```json
{
  "skills": [
    "~/.config/opencode/indonesian-dev-skills/skills"
  ]
}
```

And append the routing table to `~/.config/opencode/AGENTS.md`:

```bash
cat ~/.config/opencode/indonesian-dev-skills/AGENTS.md >> ~/.config/opencode/AGENTS.md
```

> 💡 **Tip:** GitHub's *"Use this template"* button or `git submodule` can keep you in sync with the latest updates.

---

## 🧪 Running the Validator (Skill #5 & #6)

Skill #5 (official data) has a registry validator:

```bash
node skills/data-resmi-indonesia/scripts/validate-registry.mjs
```

Expect exit code `0`. Run it every time you change/add a rate in `references/aturan/*.json`.

All skills (including #6) are validated by the frontmatter/link validator:

```bash
node scripts/validate-skills.mjs
```

---

## 🎯 Design Principles

1. **Original, not derivative** — no repackaging of generic skills
2. **Indonesia-specific** — solve unique pain points of Indonesian developers
3. **Production-ready** — complete implementations, not just concepts
4. **Maintainable** — clear abstractions, easy to extend
5. **Well-documented** — examples, references, troubleshooting

| Aspect | Generic skill bundle | Indonesian Dev Skills |
| --- | --- | --- |
| **Focus** | General practices | Indonesia-specific implementation |
| **Scope** | Framework-agnostic patterns | Deep in local ecosystem (payment, hosting, data, notifications, privacy) |
| **Examples** | Abstract concepts | Production-ready, Indonesian context |
| **Coverage** | Broad & shallow | Narrow & deep |

---

## 🤝 Contributing

Contributions are welcome! Have another Indonesian developer pain point that's missing?

- Fork the repo & create a new skill in `skills/your-skill-name/`
- Use `skills/payment-gateway-indonesia/` as a template
- Include working code examples
- For skill #5: add rates only via the JSON registry, run the validator
- Full details: see [`CONTRIBUTING.md`](CONTRIBUTING.md)

---

## 📊 Project Stats

```
Skills    : 6 (each with SKILL.md + examples/references)
Structure  : skills/<skill-name>/{SKILL.md, examples.md, references/}
Validator  : skills/data-resmi-indonesia/scripts/validate-registry.mjs
License    : MIT
```

---

## 🗺️ Repo Structure

```
.
├── README.md
├── README.en.md            # English readme
├── AGENTS.md               # skill routing table (for OpenCode)
├── QUICKSTART.md           # quickstart
├── CHANGELOG.md            # version history
├── CONTRIBUTING.md         # contribution guide
├── LICENSE                  # MIT
└── skills/
    ├── payment-gateway-indonesia/
    ├── hosting-deployment-indonesia/
    ├── indonesian-data-forms/
    ├── notifikasi-indonesia/
    ├── data-resmi-indonesia/
    │   ├── SKILL.md
    │   ├── examples.md
    │   ├── references/data/    # per-topic guide
    │   ├── references/aturan/  # 2026 JSON registry
    │   └── scripts/validate-registry.mjs
    └── pelindungan-data-pribadi/
        ├── SKILL.md
        └── references/         # PDP compliance guides
```

---

## 🆚 Version & Changelog

See [`CHANGELOG.md`](CHANGELOG.md) for the full history. Latest version: **v1.5.0**.

---

## 📮 Support & Contact

- **Issues**: https://github.com/irhamullah/indonesian-dev-skills/issues
- **Discussions**: https://github.com/irhamullah/indonesian-dev-skills/discussions
- **Email**: irhamullah01@gmail.com

---

> **Built with ❤️ by Indonesian developers, for Indonesian developers.**

Distributed under the [MIT License](LICENSE).
