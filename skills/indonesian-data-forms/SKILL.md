---
name: indonesian-data-forms
description: Use when building forms, validation, or data handling for Indonesian users - wilayah administratif (provinsi/kota/kecamatan/kelurahan), NIK & NPWP validation, phone number formatting (+62), shipping cost (RajaOngkir, Biteship), and Rupiah currency. Triggers on "validasi NIK", "validasi NPWP", "dropdown provinsi", "format nomor HP Indonesia", "ongkir RajaOngkir", "format Rupiah", "kode pos Indonesia", "waktu Indonesia"
---

# Indonesian Data & Forms

## Overview

Handle Indonesian-specific data: wilayah administratif, validasi identitas (NIK/NPWP), format nomor HP, kalkulasi ongkir, dan format Rupiah. Skill ini mengatasi pain points utama: data referensi wilayah yang sering outdated, validasi dokumen yang gampang salah, dan format data yang tidak konsisten.

**Core principle:** Selalu validasi dan normalize di boundary (input), simpan dalam bentuk canonical, format saat render.

## When to Use

- Ketika bikin form alamat dengan dropdown wilayah (provinsi → kelurahan)
- Ketika validasi NIK (KTP) atau NPWP (tax ID)
- Ketika normalize nomor HP Indonesia (+62, 08xx)
- Ketika integrasi ongkir (RajaOngkir, Biteship)
- Ketika format Rupiah untuk display atau parsing
- Ketika handling kode pos Indonesia
- Ketika konversi waktu ke WIB/WITA/WIT

**Jangan pakai kalau:**
- International forms only (no Indonesian data)
- Data sudah validated dan stored di canonical form (cuma read)

## Core Principles

### Prinsip 1: Canonical Form for Storage

Simpan data dalam bentuk normalized. Format hanya saat display.

```typescript
// Bad: Simpan as-is (formatted)
db.user.phone = "+62 812-3456-7890"  // Inconsistent, hard to query
db.user.nik = "3201 2345 6789 0001"  // With spaces

// Good: Canonical form
db.user.phone = "+6281234567890"     // E.164 format
db.user.nik = "3201234567890001"     // 16 digits, no spaces
db.user.amount = 100000              // Integer (in smallest unit), not string
```

### Prinsip 2: Validate at Input Boundary

Validasi ketat saat input. Trust internal data.

```typescript
// Validation before storing
const schema = z.object({
  nik: z.string().regex(/^\d{16}$/).refine(isValidNIKStructure),
  phone: z.string().transform(normalizePhone).refine(isValidPhone),
  npwp: z.string().transform(normalizeNPWP).optional(),
});
```

### Prinsip 3: Never Hardcode Wilayah Data

Data wilayah berubah (pemekaran daerah). Ambil dari source yang maintained.

```typescript
// Bad: Hardcoded list (will be outdated)
const provinces = ['DKI Jakarta', 'Jawa Barat', ...];  // Outdated!

// Good: From API or maintained dataset
const provinces = await wilayahAPI.getProvinces();
```

## Workflow

### Step 1: Pilih Strategy untuk Wilayah Administratif

| Strategy | Kapan pakai | Trade-off |
|----------|-------------|-----------|
| **API (wilayah.id, emsifa)** | Always-connected apps, butuh selalu fresh | Network dependency, rate limit |
| **Local dataset + periodic update** | Offline capable, high traffic | Perlu update berkala |
| **Seeded DB table** | Full control, custom wilayah | Perlu maintenance sendiri |

**Recommendation:** Local dataset (BPS-based) dengan periodic refresh script.

See `references/wilayah-administratif.md` for implementation.

### Step 2: Implement Validasi NIK

NIK = 16 digit dengan struktur:

```
3201234567890001
││││││││││││││││
├─────┤ Provinsi(2)+Kab/Kota(2)+Kecamatan(2) = kode wilayah
      ├─────┤ DDMMYY tanggal lahir (+40 hari untuk perempuan)
            ├───┤ Nomor urut (0001-9999)
```

```typescript
export function validateNIK(nik: string): NIKValidationResult {
  // 1. Format check
  if (!/^\d{16}$/.test(nik)) {
    return { valid: false, error: 'NIK harus 16 digit angka' };
  }

  // 2. Extract parts
  const wilayahCode = nik.substring(0, 6);
  const birthPart = nik.substring(6, 12);
  const sequence = nik.substring(12, 16);

  // 3. Validate birth date
  let day = parseInt(birthPart.substring(0, 2));
  const month = parseInt(birthPart.substring(2, 4));
  const year = parseInt(birthPart.substring(4, 6));

  const isFemale = day > 40;
  if (isFemale) day -= 40;

  if (day < 1 || day > 31 || month < 1 || month > 12) {
    return { valid: false, error: 'Tanggal lahir tidak valid' };
  }

  // 4. Validate wilayah code (needs wilayah dataset)
  const wilayah = lookupWilayah(wilayahCode);
  if (!wilayah) {
    return { valid: false, error: 'Kode wilayah tidak dikenal' };
  }

  return {
    valid: true,
    data: {
      province: wilayah.province,
      city: wilayah.city,
      district: wilayah.district,
      birthDate: expandYear(year, month, day),
      gender: isFemale ? 'female' : 'male',
    },
  };
}
```

See `references/nik-npwp-validation.md` for full details.

### Step 3: Implement Validasi & Normalisasi NPWP

```typescript
// NPWP format:
// Old (15 digit): XX.XXX.XXX.X-XXX.XXX
// New (16 digit, NIK-based sejak 2024): same as NIK

export function normalizeNPWP(npwp: string): string {
  // Strip all non-digits
  const digits = npwp.replace(/\D/g, '');

  if (digits.length === 15) {
    // Format: XX.XXX.XXX.X-XXX.XXX
    return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}.${digits.slice(8,9)}-${digits.slice(9,12)}.${digits.slice(12,15)}`;
  }

  if (digits.length === 16) {
    // New format: same as NIK
    return digits;
  }

  throw new Error('NPWP harus 15 atau 16 digit');
}

export function validateNPWP(npwp: string): boolean {
  const digits = npwp.replace(/\D/g, '');

  if (digits.length === 16) {
    // Validate as NIK
    return validateNIK(digits).valid;
  }

  if (digits.length === 15) {
    // Old format: just check digits
    return /^\d{15}$/.test(digits);
  }

  return false;
}
```

### Step 4: Normalize Nomor HP

```typescript
export function normalizePhone(phone: string): string {
  // Remove all non-digits and leading symbols
  let cleaned = phone.replace(/[\s\-().]/g, '');
  cleaned = cleaned.replace(/^\+/, '');

  // Convert to +62 format
  if (cleaned.startsWith('62')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+62' + cleaned.substring(1);
  }
  if (cleaned.startsWith('8')) {
    return '+62' + cleaned;
  }

  throw new Error('Format nomor HP tidak dikenal');
}

export function formatPhoneDisplay(phone: string): string {
  // +6281234567890 → +62 812-3456-7890
  const normalized = normalizePhone(phone);
  const withoutPrefix = normalized.substring(3); // Remove +62

  return `+62 ${withoutPrefix.slice(0, 3)}-${withoutPrefix.slice(3, 7)}-${withoutPrefix.slice(7)}`;
}

export function isValidPhone(phone: string): boolean {
  try {
    const normalized = normalizePhone(phone);
    // Indonesian mobile: +62 8xx (8 followed by 7-12 digits)
    return /^\+628\d{7,12}$/.test(normalized);
  } catch {
    return false;
  }
}
```

### Step 5: Integrasi Ongkir

```typescript
// Abstract interface (provider-agnostic)
interface ShippingProvider {
  searchDestination(query: string): Promise<Destination[]>;
  calculateCost(params: {
    origin: string;
    destination: string;
    weight: number;  // grams
    courier: string;
  }): Promise<ShippingCost[]>;
}

// RajaOngkir implementation
class RajaOngkirProvider implements ShippingProvider {
  constructor(private apiKey: string, private type: 'starter' | 'basic' | 'pro') {}

  async calculateCost(params) {
    const response = await fetch(`${this.baseUrl}/cost`, {
      method: 'POST',
      headers: {
        key: this.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        origin: params.origin,
        destination: params.destination,
        weight: params.weight.toString(),
        courier: params.courier,
      }),
    });

    const data = await response.json();
    return this.normalize(data);
  }
}
```

**Important:** RajaOngkir API berubah - Starter/Basic/Pro punya endpoint berbeda. See `references/ongkir-integration.md`.

### Step 6: Rupiah Formatting & Parsing

```typescript
export function formatRupiah(amount: number, options?: { decimals?: boolean }): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: options?.decimals ? 2 : 0,
    maximumFractionDigits: options?.decimals ? 2 : 0,
  }).format(amount);

  return formatted; // "Rp 100.000"
}

export function parseRupiah(input: string): number {
  // Remove currency symbol, dots (thousand sep), spaces
  const cleaned = input
    .replace(/Rp/i, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')       // Thousand separator
    .replace(/,/g, '.');      // Decimal separator

  const amount = parseFloat(cleaned);
  if (isNaN(amount)) throw new Error('Format Rupiah tidak valid');

  return amount;
}
```

## Anti-Patterns

### ❌ **Float untuk Money**

```typescript
// Bad: Floating point errors
const total = 0.1 + 0.2;  // 0.30000000000000004

// Good: Integer (smallest unit) or decimal library
const total = 10000 + 20000;  // In rupiah (integer)
// Or use decimal.js for fractional
```

### ❌ **Hardcoded Wilayah List**

```typescript
// Bad
const cities = ['Jakarta', 'Bandung', ...];  // Outdated

// Good: From maintained source
```

### ❌ **Storing Formatted Phone**

```typescript
// Bad: Query jadi sulit
WHERE phone = '+62 812-3456-7890'

// Good: Canonical
WHERE phone = '+6281234567890'
```

### ❌ **Trust Client-Side Validation Only**

```typescript
// Bad: Client validation bisa di-bypass
if (isValidNIK(req.body.nik)) { save(); }

// Good: Validate server-side juga
if (isValidNIK(req.body.nik) && validateNIKServer(req.body.nik)) { save(); }
```

## Verification

- [ ] Wilayah data source maintained (API atau periodic update)
- [ ] NIK validation check struktur (16 digit, tanggal valid, kode wilayah)
- [ ] NPWP handle both 15 dan 16 digit formats
- [ ] Phone normalization ke E.164 (+62)
- [ ] Ongkir integration dengan provider abstraction
- [ ] Rupiah menggunakan integer (atau decimal library), bukan float
- [ ] Validation di server-side, bukan cuma client
- [ ] Timezone handling correct (WIB/WITA/WIT)
- [ ] Tests untuk edge cases (leap year, invalid date, etc)

## References

- `references/wilayah-administratif.md` - Data wilayah strategy & implementation
- `references/nik-npwp-validation.md` - NIK & NPWP validation algorithms
- `references/phone-formatting.md` - Phone number normalization
- `references/ongkir-integration.md` - RajaOngkir & Biteship integration
- `references/rupiah-formatting.md` - Currency handling
- `references/timezone-indonesia.md` - WIB/WITA/WIT handling

## Related Skills

- `api-and-interface-design` - Untuk design validation interface
- `security-and-hardening` - Untuk PII data handling (NIK = sensitive)
- `performance-optimization` - Untuk optimize wilayah data loading
- `data-resmi-indonesia` - **Data resmi & aturan berperiode Indonesia**:
  - Hari libur nasional / cuti bersama / hari kerja → `data-resmi-indonesia`
  - Kurs BI & JISDOR → `data-resmi-indonesia`
  - UMP / upah minimum → `data-resmi-indonesia`
  - Aturan pajak (PTKP, PPh 21 TER, PPN) & BPJS → `data-resmi-indonesia`
  - Wilayah administratif, kode pos, NIK/NPWP, ongkir, Rupiah, timezone **tetap di skill ini**
