# Indonesian Developer Skills

Skill bundle untuk workflow khas Indonesian developers. Setiap skill fokus pada pain point implementasi yang spesifik untuk ekosistem Indonesia.

## 🇮🇩 Why This Bundle?

Indonesian developers punya pain points unik:
- Payment gateway lokal (Midtrans, Xendit, Doku) dengan format berbeda-beda
- Deploy di VPS lokal (Biznet Gio, IDCloudHost, Niagahoster)
- Data Indonesia (provinsi/kota, NIK/NPWP validation, format Rupiah)
- Data resmi & aturan berperiode Indonesia (BMKG, BPS, Bank Indonesia, pajak, upah minimum, hari libur)
- Notifikasi via WhatsApp/Telegram (WhatsApp gateway berbeda-beda + OTP yang aman)

Skill bundle ini solve masalah-masalah yang **specific ke Indonesia** dan belum ada di skill bundle lain.

## 📦 Skills Included

### 1. Payment Gateway Indonesia ✅

**Status:** Complete

Integrasi payment gateway lokal (Midtrans, Xendit, Doku) dengan unified normalization layer.

**Solves:**
- ✅ Webhook signature verification berbeda-beda
- ✅ Status mapping tidak konsisten
- ✅ Sandbox testing setup
- ✅ QRIS, Virtual Account, e-wallet (GoPay, OVO, DANA, ShopeePay)

**Use when:**
- Integrating Indonesian payment gateways
- Handling webhooks dari Midtrans/Xendit/Doku
- Mapping payment status
- Testing payment integration

**Files:**
- `SKILL.md` - Main workflow
- `examples.md` - Complete implementation (Midtrans, Xendit, Doku adapters)
- `references/provider-comparison.md` - Side-by-side comparison
- `references/webhook-verification.md` - Signature algorithms
- `references/status-mapping.md` - Complete status mapping table
- `references/sandbox-setup.md` - Testing guide

### 2. Hosting & Deployment Indonesia ✅

**Status:** Complete

Deploy Laravel/Node.js ke VPS lokal (IDCloudHost, Niagahoster, Rumahweb, Biznet Gio) atau shared hosting cPanel.

**Solves:**
- ✅ Supervisor queue worker config (selalu lupa config)
- ✅ SSL Let's Encrypt + auto-renewal (renewal gagal)
- ✅ Nginx reverse proxy untuk Node.js (WebSocket tricky)
- ✅ Database backup automation (sering skip)
- ✅ Initial server setup & hardening (lupa urutan)
- ✅ Zero-downtime deployment (deploy bikin down)
- ✅ cPanel shared hosting deployment

**Use when:**
- Deploy Laravel/Node.js ke VPS Indonesia
- Setup Nginx, SSL, Supervisor
- Deploy ke shared hosting cPanel

**Files:**
- `SKILL.md` - Main workflow (VPS + cPanel)
- `references/supervisor-config.md` - Queue worker setup
- `references/ssl-letsencrypt.md` - SSL setup & troubleshooting
- `references/nginx-reverse-proxy.md` - Reverse proxy Node.js
- `references/database-backup.md` - Backup automation
- `references/initial-server-setup.md` - Server hardening
- `references/zero-downtime-deployment.md` - Deploy strategies
- `references/cpanel-deployment.md` - Shared hosting guide

### 3. Indonesian Data & Forms ✅

**Status:** Complete

Wilayah administratif, validasi identitas, format data khas Indonesia.

**Solves:**
- ✅ Wilayah administratif data (provinsi → kelurahan, sering outdated)
- ✅ NIK & NPWP validation (gampang salah)
- ✅ Format nomor HP (+62 normalization)
- ✅ Ongkir integration (RajaOngkir, Biteship)
- ✅ Format Rupiah (float error handling)
- ✅ Timezone WIB/WITA/WIT

**Use when:**
- Form alamat dengan dropdown wilayah
- Validasi NIK/NPWP
- Normalize nomor HP Indonesia
- Cek ongkir
- Format Rupiah

**Files:**
- `SKILL.md` - Main workflow
- `references/wilayah-administratif.md` - Data wilayah strategy
- `references/nik-npwp-validation.md` - Identity validation
- `references/phone-formatting.md` - Phone normalization
- `references/ongkir-integration.md` - Shipping cost integration
- `references/rupiah-formatting.md` - Currency handling
- `references/timezone-indonesia.md` - WIB/WITA/WIT

### 4. Notifikasi Indonesia ✅

**Status:** Complete

Kirim notifikasi via WhatsApp, Telegram, dan Email — channel yang benar-benar dipakai user Indonesia.

**Solves:**
- ✅ WhatsApp gateway berbeda-beda (Fonnte, Wablas, Watzap, Meta Cloud API)
- ✅ Unified interface WhatsApp/Telegram/Email
- ✅ OTP flow yang aman
- ✅ Alert internal ke Telegram
- ✅ Email transaksional & deliverability
- ✅ Multi-channel fallback

**Use when:**
- Kirim OTP via WhatsApp
- Notifikasi transaksi ke customer
- Alert server ke Telegram/WhatsApp
- Email transaksional (invoice, reset password)

**Files:**
- `SKILL.md` - Main workflow (channel abstraction + OTP)
- `examples.md` - Complete adapters (Fonnte, Wablas, Watzap, Meta, Telegram, Email)
- `references/whatsapp-gateway.md` - WA gateway guide
- `references/telegram-bot.md` - Telegram Bot API
- `references/email-notification.md` - SMTP/Gmail/transactional
- `references/otp-and-templates.md` - OTP flow & templates
- `references/provider-comparison.md` - Perbandingan & rekomendasi

### 5. Data Resmi Indonesia ✅

**Status:** Complete

Data resmi Indonesia (BMKG, BPS, Bank Indonesia, Badan Pangan Nasional, Kemenag) dan aturan berperiode (pajak, BPJS, upah minimum) dalam registry bertanggal.

**Solves:**
- ✅ Hari libur nasional & cuti bersama (SKB 3 Menteri)
- ✅ Gempa/prakiraan cuaca/peringatan dini BMKG
- ✅ Kurs BI & JISDOR
- ✅ Statistik BPS & harga pangan Bapanas
- ✅ Kalender Hijriah/Jawa & jadwal sholat
- ✅ Direktori sekolah/rumah sakit/kampus (PDDikti)
- ✅ Aturan pajak 2026 (PTKP, PPh 21 TER, PPN), BPJS, UMP lewat registry JSON + validator

**Use when:**
- Butuh data resmi Indonesia (BMKG, BPS, BI, Bapanas, Kemenag)
- Butuh aturan berperiode yang angkanya berubah tiap tahun (pajak, BPJS, UMP)
- Cek hari libur, kalender Hijriah, jadwal sholat

**Files:**
- `SKILL.md` - Main workflow (router data vs aturan)
- `references/data/*.md` - Panduan per topik data (BMKG, BI, BPS, Bapanas, hari libur, kalender, sholat, direktori)
- `references/aturan/*.json` - Registry bertanggal angka aturan (pajak, ketenagakerjaan)
- `scripts/validate-registry.mjs` - Validator registry aturan
- Catatan: **aturan berperiode** angka-angka ada di registry JSON (`skills/data-resmi-indonesia/references/aturan/`), bukan di prosa.

## 🚀 Installation

### Option 1: Direct Install (Recommended)

```bash
# Clone ke OpenCode config directory
git clone https://github.com/irhamullah/indonesian-dev-skills \
  ~/.config/opencode/indonesian-dev-skills

# Update opencode.jsonc
{
  "skills": [
    "~/.config/opencode/indonesian-dev-skills/skills"
  ]
}

# Update AGENTS.md (copy dari AGENTS.md di bundle ini)
cat ~/.config/opencode/indonesian-dev-skills/AGENTS.md >> ~/.config/opencode/AGENTS.md

# Restart OpenCode
```

### Option 2: Test Locally First

```bash
# Clone ke temporary directory
git clone https://github.com/irhamullah/indonesian-dev-skills ~/test-skills

# Update opencode.jsonc
{
  "skills": [
    "~/test-skills/skills"
  ]
}

# Test, then move to config directory kalau cocok
```

## 📚 Usage Examples

### Payment Gateway Integration

```typescript
// Trigger: "integrate Midtrans payment gateway"
// or: "setup payment dengan QRIS dan Virtual Account"

// Skill akan guide kamu:
// 1. Define normalized interface
// 2. Implement adapter per provider
// 3. Setup webhook verification
// 4. Test di sandbox
```

### Quick Reference

```bash
# Check which provider supports what
→ See references/provider-comparison.md

# Verify webhook signature not working?
→ See references/webhook-verification.md

# Payment status confusing?
→ See references/status-mapping.md

# Setup sandbox testing
→ See references/sandbox-setup.md
```

### Notifikasi WhatsApp / Telegram / Email

```typescript
// Trigger: "kirim OTP via WhatsApp"
// or: "alert server ke Telegram", "email invoice transaksional"

// Skill akan guide kamu:
// 1. Define unified NotificationProvider interface
// 2. Implement adapter (Fonnte/Wablas/Watzap/Meta, Telegram, Email)
// 3. OTP flow aman (crypto-secure, hashed, rate-limited)
// 4. Multi-channel fallback
```

```bash
# Pilih WA gateway (official vs unofficial)?
→ See references/provider-comparison.md

# Setup Fonnte/Wablas/Watzap/Meta Cloud API?
→ See references/whatsapp-gateway.md

# Alert server ke Telegram?
→ See references/telegram-bot.md

# OTP flow & template?
→ See references/otp-and-templates.md
```

## 🎯 Design Principles

1. **Original, not derivative** - Tidak copy/repackage existing skills
2. **Indonesia-specific** - Solve pain points unique to Indonesian devs
3. **Production-ready** - Complete implementation, not just concepts
4. **Maintainable** - Clear abstraction layers, easy to extend
5. **Well-documented** - Examples, references, troubleshooting guides

## 🆚 What Makes This Different

| Aspect | Typical skill bundles | Indonesian Dev Skills |
|--------|----------------------|----------------------|
| **Focus** | General software practices | Indonesian-specific implementations |
| **Scope** | Framework-agnostic patterns | Deep on local ecosystem (payment, hosting, data, notifikasi) |
| **Examples** | Abstract concepts | Production-ready, Indonesia-context |
| **Coverage** | Broad & shallow | Narrow & deep |

**Key differentiator:** Kami fokus ke **implementation-specific workflows khas Indonesia** — bukan general development practices.

## 🤝 Contributing

Contributions welcome! Punya pain point Indonesian developer lain yang belum ada?

### Adding New Skills

1. Fork repo
2. Create skill folder di `skills/your-skill-name/`
3. Copy `skills/payment-gateway-indonesia/` sebagai template
4. Update `SKILL.md` dengan workflow konkrit
5. Add examples dan references
6. Update `AGENTS.md` dengan trigger mapping
7. Submit PR

### Contribution Guidelines

- ✅ Skill harus **specific ke Indonesia**
- ✅ Include working code examples
- ✅ Add testing guide
- ✅ Fokus pada pain point Indonesia (bukan duplikasi general practices)
- ✅ Production-ready quality

## 📝 License

MIT License - Free to use, modify, and distribute.

## 🙏 Credits

Created by Indonesian developers, for Indonesian developers.

Special thanks to:
- Indonesian developer community for pain point feedback
- Everyone who contributed ideas, reviews, and testing

## 📮 Support

- **Issues**: https://github.com/irhamullah/indonesian-dev-skills/issues
- **Discussions**: https://github.com/irhamullah/indonesian-dev-skills/discussions
- **Email**: irhamullah01@gmail.com

---

**Built with ❤️ by Indonesian developers**
