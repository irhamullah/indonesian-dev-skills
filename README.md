# Indonesian Developer Skills

Skill bundle untuk workflow khas Indonesian developers. Original skills yang tidak overlap dengan superpowers, omo, atau agent-skills.

## 🇮🇩 Why This Bundle?

Indonesian developers punya pain points unik:
- Payment gateway lokal (Midtrans, Xendit, Doku) dengan format berbeda-beda
- Deploy di VPS lokal (Biznet Gio, IDCloudHost, Niagahoster)
- Data Indonesia (provinsi/kota, NIK/NPWP validation, format Rupiah)

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

### 2. VPS Deployment Indonesia 🚧

**Status:** Planned

Setup Laravel/Node.js di VPS lokal (Biznet Gio, IDCloudHost, Niagahoster).

**Will solve:**
- Nginx configuration
- SSL setup (Let's Encrypt)
- Queue worker dengan Supervisor
- Database backup automation
- Basic hardening

### 3. Indonesian Data & Forms 🚧

**Status:** Planned

Wilayah administratif, validation, dan format khas Indonesia.

**Will solve:**
- Provinsi/kota/kecamatan/kelurahan data
- NIK & NPWP validation
- Format nomor HP (+62)
- Ongkir integration (RajaOngkir, Biteship)
- Format Rupiah

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

## 🎯 Design Principles

1. **Original, not derivative** - Tidak copy/repackage existing skills
2. **Indonesia-specific** - Solve pain points unique to Indonesian devs
3. **Production-ready** - Complete implementation, not just concepts
4. **Maintainable** - Clear abstraction layers, easy to extend
5. **Well-documented** - Examples, references, troubleshooting guides

## 🆚 Comparison with Other Bundles

| Bundle | Focus | Overlap with Indonesian Dev Skills |
|--------|-------|-----------------------------------|
| **superpowers** | Process & discipline (TDD, debugging, brainstorming) | ❌ No overlap |
| **omo** | Multi-model orchestration, LSP/AST tooling | ❌ No overlap |
| **agent-skills** | Domain expertise (security, performance, observability) | ❌ No overlap |
| **indonesian-dev-skills** | Indonesian developer workflows | ✅ This bundle |

**Key differentiator:** Kami fokus ke **implementation-specific workflows khas Indonesia**, bukan general development practices.

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
- ✅ No overlap dengan existing skills (superpowers/omo/agent-skills)
- ✅ Production-ready quality

## 📝 License

MIT License - Free to use, modify, and distribute.

## 🙏 Credits

Created by Indonesian developers, for Indonesian developers.

Special thanks to:
- [superpowers](https://github.com/obra/superpowers) for workflow inspiration
- [oh-my-openagent](https://github.com/meistrari/oh-my-openagent) for tooling patterns
- Indonesian developer community for pain point feedback

## 📮 Support

- **Issues**: https://github.com/irhamullah/indonesian-dev-skills/issues
- **Discussions**: https://github.com/irhamullah/indonesian-dev-skills/discussions
- **Email**: irhamullah01@gmail.com

---

**Built with ❤️ by Indonesian developers**
