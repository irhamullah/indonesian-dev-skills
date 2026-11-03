# Contributing to Indonesian Developer Skills

Thank you for your interest in contributing! We welcome contributions from Indonesian developers who want to share their expertise.

## What We're Looking For

Skills that solve **pain points unique to Indonesian developers**:

- ✅ Indonesia-specific integrations (payment, shipping, government APIs)
- ✅ Local provider workflows (hosting, cloud, SaaS)
- ✅ Indonesian data formats and validation
- ✅ Compliance with Indonesian regulations
- ❌ General development practices (diluar scope bundle ini)

## How to Contribute

### 1. Propose a Skill

Before writing code, open a **Discussion** or **Issue** with:

- **Pain point**: What problem does it solve?
- **Target audience**: Who needs this?
- **Scope**: What workflows will it cover?
- **Uniqueness**: Why isn't this covered by existing skills?

Example:
```
Title: [Skill Proposal] E-commerce Indonesia Compliance

Pain Point: Indonesian e-commerce harus comply dengan:
- Kominfo regulations
- Consumer protection law
- Tax reporting (NPWP integration)

Target: E-commerce developers di Indonesia

Scope:
- Kominfo product registration checklist
- Consumer complaint handling workflow
- Tax invoice generation (Faktur Pajak)

Uniqueness: Tidak ada skill yang handle Indonesian e-commerce compliance
```

### 2. Write the Skill

Use existing skills as template:

```bash
# Copy payment-gateway-indonesia as starting point
cp -r skills/payment-gateway-indonesia skills/your-skill-name

# Update files:
# - SKILL.md (main workflow)
# - examples.md (working code)
# - references/ (supporting docs)
```

#### Skill Structure Requirements

**SKILL.md must have:**
- YAML frontmatter with `name` and `description`
- Clear "When to Use" section
- Step-by-step workflow (numbered or checkboxes)
- Anti-patterns section
- Verification checklist
- References to supporting files

**examples.md must have:**
- At least 3 complete working examples
- Code comments explaining the why, not just what
- Real-world scenarios

**references/ should include:**
- Quick reference tables
- Comparison charts (if multiple options)
- Troubleshooting guides
- Testing instructions

### 3. Test Your Skill

```bash
# 1. Install locally
cp -r your-skill ~/.config/opencode/test-skills/skills/

# 2. Update opencode.jsonc
{
  "skills": ["~/.config/opencode/test-skills/skills"]
}

# 3. Test triggers
# Start OpenCode and try triggering your skill

# 4. Verify workflow
# Follow SKILL.md step-by-step, ensure it works end-to-end
```

### 4. Submit Pull Request

```bash
# 1. Fork repo
gh repo fork irhamullah/indonesian-dev-skills

# 2. Create branch
git checkout -b skill/your-skill-name

# 3. Add files
git add skills/your-skill-name/

# 4. Update AGENTS.md with trigger mapping
# Add row to skill routing table

# 5. Update README.md
# Add skill to "Skills Included" section

# 6. Commit
git commit -m "Add skill: your-skill-name"

# 7. Push and create PR
git push origin skill/your-skill-name
gh pr create
```

## Quality Standards

### Code Examples

✅ **Good:**
```typescript
// Good: Complete, runnable, documented
export class ShippingIntegration {
  /**
   * Calculate shipping cost via RajaOngkir API
   * @param origin - Origin city ID (get from RajaOngkir city list)
   * @param destination - Destination city ID
   * @param weight - Weight in grams
   * @param courier - 'jne' | 'tiki' | 'pos'
   */
  async calculateCost(params: {
    origin: number;
    destination: number;
    weight: number;
    courier: string;
  }): Promise<ShippingCost[]> {
    // Implementation
  }
}
```

❌ **Bad:**
```typescript
// Bad: Incomplete, no context, magic numbers
function calc(a, b, c) {
  return fetch('https://api.com/' + a);  // What API? What params?
}
```

### Documentation

✅ **Good:**
- Explains the why, not just the what
- Real-world examples
- Troubleshooting section
- Links to official documentation

❌ **Bad:**
- Code dumps without explanation
- "Just do X" without context
- No error handling guidance

### Testing

Every skill should include:
- [ ] Unit test examples
- [ ] Integration test scenarios
- [ ] Sandbox/staging setup guide
- [ ] Common error cases

## Skill Ideas

Looking for contribution ideas? Here are pain points we've heard:

### High Priority

1. **VPS Deployment Indonesia**
   - Biznet Gio, IDCloudHost, Niagahosta setup
   - Nginx + SSL + queue workers
   - Backup automation

2. **Indonesian Data & Forms**
   - Provinsi/kota/kecamatan/kelurahan
   - NIK & NPWP validation
   - Phone number formatting
   - Ongkir integration (RajaOngkir, Biteship)

3. **E-commerce Indonesia Compliance**
   - Kominfo registration
   - Consumer protection workflows
   - Tax invoice (Faktur Pajak)

### Medium Priority

4. **Indonesian Fintech Integration**
   - P2P lending APIs
   - Digital banking APIs (BCA, Mandiri)
   - Credit scoring services

5. **Government API Integration**
   - NIK verification (Dukcapil)
   - Business registration (OSS)
   - Tax reporting (DJP)

6. **Indonesian SaaS Tools**
   - Qontak (CRM)
   - Mekari (HR/Accounting)
   - Sales1 (CRM)

### Lower Priority (but still welcome!)

7. **Indonesian Content Moderation**
   - Bahasa Indonesia profanity filter
   - Cultural sensitivity checks
   - Religious content guidelines

8. **Indonesian SEO & Marketing**
   - Tokopedia/Shopee/Lazada integration
   - Indonesian keyword research
   - Social media (Instagram/TikTok Indonesia)

## Review Process

1. **Proposal review** (1-3 days)
   - Check uniqueness
   - Validate pain point
   - Suggest scope adjustments

2. **Code review** (3-7 days)
   - Verify completeness
   - Check code quality
   - Test examples work

3. **Documentation review** (1-2 days)
   - Clarity check
   - Grammar/formatting
   - Link validation

4. **Merge** 🎉

## Code of Conduct

- Be respectful and constructive
- Focus on Indonesian developer needs
- No plagiarism - cite sources
- No promotion of specific commercial services (unless relevant to skill)

## Questions?

- Open a [Discussion](https://github.com/irhamullah/indonesian-dev-skills/discussions)
- Ask in Issues
- Email: irhamullah01@gmail.com

---

**Terima kasih atas kontribusinya! 🇮🇩**
