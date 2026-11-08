# Integration with OpenCode

Copy tabel di bawah ini ke `~/.config/opencode/AGENTS.md`, tambahkan ke section `## Skill routing`.

---

## Skill routing for Indonesian Developer Skills

| Intent / trigger | Skill |
| --- | --- |
| Payment gateway Indonesia: Midtrans, Xendit, Doku, QRIS, Virtual Account, e-wallet (GoPay, OVO, DANA, ShopeePay), webhook verification, payment integration | `payment-gateway-indonesia` |
| Deploy Laravel/Node.js, VPS Indonesia (IDCloudHost, Niagahoster, Rumahweb, Biznet Gio), Nginx, Supervisor queue worker, SSL Let's Encrypt, database backup, cPanel shared hosting, zero-downtime deployment | `hosting-deployment-indonesia` |
| Validasi NIK/NPWP, wilayah administratif (provinsi/kota/kecamatan/kelurahan), format nomor HP (+62), ongkir (RajaOngkir/Biteship), format Rupiah, timezone WIB/WITA/WIT | `indonesian-data-forms` |
| Kirim notifikasi WhatsApp/Telegram/Email, WA gateway (Fonnte, Wablas, Watzap, Meta Cloud API), Telegram Bot, OTP WhatsApp, email transaksional, alert server | `notifikasi-indonesia` |
| Data resmi Indonesia: BMKG (gempa/cuaca/nowcast), BPS, Bank Indonesia (JISDOR/kurs), Bapanas (harga pangan), hari libur & cuti bersama, kalender Hijriah/Jawa, jadwal sholat, direktori sekolah/RS/kampus, aturan pajak (PTKP/PPh 21 TER/PPN), BPJS, UMP | `data-resmi-indonesia` |

---

## Installation Instructions

### 1. Clone Repository

```bash
# Clone to OpenCode config directory
git clone https://github.com/irhamullah/indonesian-dev-skills \
  ~/.config/opencode/indonesian-dev-skills
```

### 2. Update opencode.jsonc

Edit `~/.config/opencode/opencode.jsonc`:

```json
{
  "skills": [
    "~/.config/opencode/indonesian-dev-skills/skills"
  ]
}
```

### 3. Update AGENTS.md

Append skill routing table di atas ke `~/.config/opencode/AGENTS.md`:

```bash
cat >> ~/.config/opencode/AGENTS.md << 'EOF'

<!-- indonesian-dev-skills -->
## Indonesian Developer Skills

| Intent / trigger | Skill |
| --- | --- |
| Payment gateway Indonesia: Midtrans, Xendit, Doku, QRIS, Virtual Account, e-wallet (GoPay, OVO, DANA, ShopeePay), webhook verification, payment integration | `payment-gateway-indonesia` |
| Deploy Laravel/Node.js, VPS Indonesia (IDCloudHost, Niagahoster, Rumahweb, Biznet Gio), Nginx, Supervisor queue worker, SSL Let's Encrypt, database backup, cPanel shared hosting, zero-downtime deployment | `hosting-deployment-indonesia` |
| Validasi NIK/NPWP, wilayah administratif (provinsi/kota/kecamatan/kelurahan), format nomor HP (+62), ongkir (RajaOngkir/Biteship), format Rupiah, timezone WIB/WITA/WIT | `indonesian-data-forms` |
| Kirim notifikasi WhatsApp/Telegram/Email, WA gateway (Fonnte, Wablas, Watzap, Meta Cloud API), Telegram Bot, OTP WhatsApp, email transaksional, alert server | `notifikasi-indonesia` |
| Data resmi Indonesia: BMKG (gempa/cuaca/nowcast), BPS, Bank Indonesia (JISDOR/kurs), Bapanas (harga pangan), hari libur & cuti bersama, kalender Hijriah/Jawa, jadwal sholat, direktori sekolah/RS/kampus, aturan pajak (PTKP/PPh 21 TER/PPN), BPJS, UMP | `data-resmi-indonesia` |
<!-- /indonesian-dev-skills -->
EOF
```

### 4. Verify Installation

Start new OpenCode session dan test trigger:

```
"Setup Midtrans payment gateway dengan QRIS"
```

Skill `payment-gateway-indonesia` should be loaded automatically.

---

## Usage Examples

### Example 1: Payment Gateway Integration

**Trigger:**
```
"Integrate Xendit payment gateway dengan Virtual Account dan GoPay"
```

**What happens:**
1. Skill `payment-gateway-indonesia` loaded
2. Workflow guides you through:
   - Define normalized interface
   - Implement Xendit adapter
   - Setup webhook verification
   - Test sandbox integration

### Example 2: Webhook Troubleshooting

**Trigger:**
```
"Webhook signature verification failed untuk Midtrans"
```

**What happens:**
1. Skill loaded dengan focus pada webhook verification
2. References `webhook-verification.md` untuk debug
3. Check signature algorithm implementation
4. Verify credentials correct

### Example 3: Status Mapping

**Trigger:**
```
"Payment status dari Midtrans 'settlement', tapi dari Xendit 'SUCCEEDED'"
```

**What happens:**
1. Skill explains status normalization pattern
2. References `status-mapping.md` table
3. Implement normalized enum
4. Map provider statuses

---

## Skill Priority

When multiple skills could apply, Indonesian Developer Skills has **domain-specific** priority for Indonesian workflows:

1. If task mentions **Indonesian payment providers** (Midtrans/Xendit/Doku) → `payment-gateway-indonesia` first
2. If task mentions **VPS/hosting/cPanel** → `hosting-deployment-indonesia` first
3. If task mentions **NIK/NPWP/wilayah/ongkir/Rupiah** → `indonesian-data-forms` first
4. If task mentions **WhatsApp/Telegram/OTP/notifikasi** → `notifikasi-indonesia` first
5. If task mentions **data resmi Indonesia** (BMKG/BPS/BI/Bapanas/hari libur/kalender/pajak/BPJS/UMP) → `data-resmi-indonesia` first

Example:
```
"Build payment API dengan Midtrans"

Priority:
1. payment-gateway-indonesia (Indonesia-specific implementation)
2. api-and-interface-design (general API patterns)
```

---

## Testing Installation

```bash
# 1. Check skills directory exists
ls -la ~/.config/opencode/indonesian-dev-skills/skills/

# Output should show:
# payment-gateway-indonesia/

# 2. Check skill file exists
cat ~/.config/opencode/indonesian-dev-skills/skills/payment-gateway-indonesia/SKILL.md | head -5

# Output should show frontmatter:
# ---
# name: payment-gateway-indonesia
# description: Use when integrating...
# ---

# 3. Check AGENTS.md updated
grep "payment-gateway-indonesia" ~/.config/opencode/AGENTS.md

# Should return the skill routing entry
```

---

## Uninstallation

```bash
# 1. Remove from opencode.jsonc skills array
# Edit ~/.config/opencode/opencode.jsonc manually

# 2. Remove from AGENTS.md
# Delete the <!-- indonesian-dev-skills --> section

# 3. Remove directory
rm -rf ~/.config/opencode/indonesian-dev-skills
```

---

## Updating

```bash
# Pull latest changes
cd ~/.config/opencode/indonesian-dev-skills
git pull origin main

# No need to restart OpenCode - skills reloaded automatically on new session
```

---

## Troubleshooting

### Skill Not Loading

**Symptoms:**
- Mention "Midtrans" but skill not triggered
- Agent doesn't follow payment-gateway-indonesia workflow

**Fix:**
1. Check `opencode.jsonc` has correct path
2. Check `AGENTS.md` has trigger mapping
3. Restart OpenCode
4. Try explicit trigger: "Use payment-gateway-indonesia skill to..."

### Skill Conflicts

**Symptoms:**
- Multiple skills trying to handle same task
- Workflow unclear which skill to follow

**Fix:**
1. Be more specific in request: "Use payment-gateway-indonesia skill"
2. Check skill routing priority in AGENTS.md
3. Update trigger descriptions to be more distinct

### Missing References

**Symptoms:**
- Skill loaded but can't find reference files
- "File not found" errors

**Fix:**
1. Check directory structure intact:
   ```bash
   ls -la ~/.config/opencode/indonesian-dev-skills/skills/payment-gateway-indonesia/references/
   ```
2. Re-clone if files missing

---

## Skills Overview

All skills complete:

### 1. Payment Gateway Indonesia ✅
**Trigger:** "Setup Midtrans", "Integrasi QRIS", "Webhook Xendit"

### 2. Hosting & Deployment Indonesia ✅
**Trigger:** "Deploy Laravel ke IDCloudHost", "Setup Nginx", "Konfigurasi Supervisor"

### 3. Indonesian Data & Forms ✅
**Trigger:** "Validasi NIK", "Dropdown provinsi/kota", "Format nomor HP Indonesia"

### 4. Notifikasi Indonesia ✅
**Trigger:** "Kirim OTP WhatsApp", "Notifikasi Telegram", "WA gateway Fonnte", "Email transaksional"

### 5. Data Resmi Indonesia ✅
**Trigger:** "Hari libur nasional 2026", "Gempa BMKG", "Prakiraan cuaca", "JISDOR", "Kurs BI", "Harga pangan", "Kalender Hijriah", "Jadwal sholat", "UMP 2026", "PPh 21 TER", "PTKP"

**Want to contribute a new skill?** See CONTRIBUTING.md

---

## Support

- Issues: https://github.com/irhamullah/indonesian-dev-skills/issues
- Discussions: https://github.com/irhamullah/indonesian-dev-skills/discussions
