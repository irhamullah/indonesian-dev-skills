# NIK & NPWP Validation

**Pain Point:** Validasi dokumen identitas Indonesia gampang salah.

Struktur, algoritma validasi, dan format untuk NIK (KTP) dan NPWP (tax ID).

---

## NIK (Nomor Induk Kependudukan)

### Structure

NIK = **16 digit** dengan struktur:

```
3 2 0 1 2 3 4 5 6 7 8 9 0 0 0 1
└─────┘ └───────┘ └───────────┘
   │        │          │
   │        │          └─ 4 digit: Nomor urut (0001-9999)
   │        └─ 6 digit: Tanggal lahir DDMMYY (+40 untuk perempuan)
   └─ 6 digit: Kode wilayah (BPS: provinsi+kab/kota+kecamatan)
```

**Breakdown:**

| Digit | Length | Meaning |
|-------|--------|---------|
| 1-2 | 2 | Kode provinsi (BPS) |
| 3-4 | 2 | Kode kabupaten/kota (BPS) |
| 5-6 | 2 | Kode kecamatan (BPS) |
| 7-8 | 2 | Tanggal lahir (DD, +40 kalau perempuan) |
| 9-10 | 2 | Bulan lahir (MM) |
| 11-12 | 2 | Tahun lahir (YY) |
| 13-16 | 4 | Nomor urut |

### Gender Encoding

Tanggal lahir di NIK:
- **Laki-laki:** DD (01-31)
- **Perempuan:** DD + 40 (41-71)

Contoh:
- Laki-laki lahir 15-05-1990 → `150590`
- Perempuan lahir 15-05-1990 → `550590` (15 + 40 = 55)

### Validation Algorithm

```typescript
export interface NIKResult {
  valid: boolean;
  error?: string;
  data?: {
    provinceCode: string;
    regencyCode: string;
    districtCode: string;
    birthDate: Date;
    gender: 'male' | 'female';
  };
}

export function validateNIK(
  nik: string,
  wilayahLookup?: (code: string) => boolean
): NIKResult {
  // 1. Format: exactly 16 digits
  if (!/^\d{16}$/.test(nik)) {
    return { valid: false, error: 'NIK harus 16 digit angka' };
  }

  // 2. Extract components
  const provinceCode = nik.substring(0, 2);
  const regencyCode = nik.substring(0, 4);
  const districtCode = nik.substring(0, 6);
  const birthPart = nik.substring(6, 12);

  // 3. Parse birth date
  let day = parseInt(birthPart.substring(0, 2), 10);
  const month = parseInt(birthPart.substring(2, 4), 10);
  let year = parseInt(birthPart.substring(4, 6), 10);

  // 4. Detect gender
  let gender: 'male' | 'female' = 'male';
  if (day > 40) {
    gender = 'female';
    day -= 40;
  }

  // 5. Validate date
  if (day < 1 || day > 31) {
    return { valid: false, error: 'Tanggal lahir di NIK tidak valid' };
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Bulan lahir di NIK tidak valid' };
  }

  // 6. Expand year (assume 1900s if > current YY, else 2000s)
  const currentYear = new Date().getFullYear();
  const currentYY = currentYear % 100;
  const fullYear = year > currentYY ? 1900 + year : 2000 + year;

  // 7. Validate actual date (handles leap year, days in month)
  const birthDate = new Date(fullYear, month - 1, day);
  if (
    birthDate.getDate() !== day ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getFullYear() !== fullYear
  ) {
    return { valid: false, error: 'Tanggal lahir tidak valid' };
  }

  // 8. Optional: validate wilayah code
  if (wilayahLookup && !wilayahLookup(districtCode)) {
    return { valid: false, error: 'Kode wilayah tidak dikenal' };
  }

  return {
    valid: true,
    data: {
      provinceCode,
      regencyCode,
      districtCode,
      birthDate,
      gender,
    },
  };
}
```

### Parse NIK Data

```typescript
export function parseNIK(nik: string) {
  const result = validateNIK(nik);
  if (!result.valid) throw new Error(result.error);

  return {
    ...result.data,
    formatted: formatNIK(nik),
    age: calculateAge(result.data!.birthDate),
  };
}

function formatNIK(nik: string): string {
  // 3201234567890001 → 3201 2345 6789 0001
  return nik.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}
```

---

## NPWP (Nomor Pokok Wajib Pajak)

### Format Transition (Important!)

| Period | Format | Length | Description |
|--------|--------|--------|-------------|
| **Before 2024** | `XX.XXX.XXX.X-XXX.XXX` | 15 digit | Legacy format |
| **From July 2024** | `16 digit` | 16 digit | NIK-based for individuals |

⚠️ **As of 2024**, NPWP untuk orang pribadi diganti jadi 16 digit (= NIK). NPWP badan (corporate) tetap 15 digit.

### Validation & Normalization

```typescript
export interface NPWPResult {
  valid: boolean;
  error?: string;
  type: 'individual' | 'corporate';
  normalized: string;
  formatted: string;
}

export function validateNPWP(npwp: string): NPWPResult {
  const digits = npwp.replace(/\D/g, '');

  // 16-digit: NIK-based (individual)
  if (digits.length === 16) {
    const nikResult = validateNIK(digits);
    return {
      valid: nikResult.valid,
      error: nikResult.valid ? undefined : 'NPWP 16 digit harus valid sebagai NIK',
      type: 'individual',
      normalized: digits,
      formatted: digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim(),
    };
  }

  // 15-digit: legacy format (individual or corporate)
  if (digits.length === 15) {
    // Basic checksum validation
    const isValidChecksum = validateNPWPChecksum(digits);

    return {
      valid: isValidChecksum,
      error: isValidChecksum ? undefined : 'NPWP tidak valid',
      type: 'corporate',  // Assume corporate for 15-digit
      normalized: digits,
      formatted: formatNPWP15(digits),
    };
  }

  return {
    valid: false,
    error: 'NPWP harus 15 atau 16 digit',
    type: 'corporate',
    normalized: digits,
    formatted: npwp,
  };
}

function formatNPWP15(digits: string): string {
  // XX.XXX.XXX.X-XXX.XXX
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}.${digits.slice(8, 9)}-${digits.slice(9, 12)}.${digits.slice(12, 15)}`;
}

function validateNPWPChecksum(digits: string): boolean {
  // DJP checksum algorithm for legacy 15-digit NPWP
  // Note: This is a simplified check; full validation requires DJP API
  if (!/^\d{15}$/.test(digits)) return false;

  // The first 9 digits encode the taxpayer's registration
  // Basic sanity: cannot be all same digit
  if (/^(\d)\1{14}$/.test(digits)) return false;

  return true;
}
```

### Format for Display

```typescript
export function formatNPWP(npwp: string): string {
  const digits = npwp.replace(/\D/g, '');

  if (digits.length === 16) {
    // New format: group by 4
    return digits.match(/.{1,4}/g)!.join(' ');
  }

  if (digits.length === 15) {
    return formatNPWP15(digits);
  }

  return npwp;
}
```

---

## Complete Validation with Zod

```typescript
import { z } from 'zod';

// NIK schema
export const nikSchema = z
  .string()
  .transform(s => s.replace(/\s/g, ''))  // Strip spaces
  .refine(s => /^\d{16}$/.test(s), 'NIK harus 16 digit')
  .refine(s => validateNIK(s).valid, {
    message: 'NIK tidak valid (periksa tanggal lahir dan kode wilayah)',
  });

// NPWP schema
export const npwpSchema = z
  .string()
  .transform(s => s.replace(/\D/g, ''))
  .refine(s => s.length === 15 || s.length === 16, 'NPWP harus 15 atau 16 digit')
  .refine(s => validateNPWP(s).valid, 'NPWP tidak valid');

// Usage
const userSchema = z.object({
  nik: nikSchema,
  npwp: npwpSchema.optional(),
  name: z.string().min(1),
});
```

---

## PII Handling (Security!)

⚠️ **NIK dan NPWP adalah PII (Personally Identifiable Information).**

### Mask for Display

```typescript
export function maskNIK(nik: string): string {
  // 3201234567890001 → 3201********0001
  if (nik.length !== 16) return nik;
  return nik.slice(0, 4) + '********' + nik.slice(12);
}

export function maskNPWP(npwp: string): string {
  const digits = npwp.replace(/\D/g, '');
  if (digits.length === 16) {
    return digits.slice(0, 4) + '********' + digits.slice(12);
  }
  // 15-digit
  return digits.slice(0, 4) + '*******' + digits.slice(11);
}
```

### Storage

```typescript
// Encrypt at rest
import crypto from 'crypto';

export function encryptPII(value: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptPII(encrypted: string, key: string): string {
  const [ivHex, authTagHex, dataHex] = encrypted.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return decipher.update(Buffer.from(dataHex, 'hex')) + decipher.final('utf8');
}
```

### Logging

```typescript
// Bad: Log full PII
console.log('User NIK:', user.nik);

// Good: Mask or hash
console.log('User NIK:', maskNIK(user.nik));
// Or for correlation without exposure:
console.log('User NIK hash:', crypto.createHash('sha256').update(user.nik).digest('hex').slice(0, 8));
```

---

## Testing

```typescript
describe('NIK Validation', () => {
  it('validates correct NIK structure', () => {
    // Male, born 15-05-1990, Jakarta
    const result = validateNIK('3174051508900001');
    expect(result.valid).toBe(true);
    expect(result.data?.gender).toBe('male');
  });

  it('detects female from +40 offset', () => {
    // Female: day 15 + 40 = 55
    const result = validateNIK('3174551508900001');
    expect(result.data?.gender).toBe('female');
  });

  it('rejects invalid date', () => {
    // February 30 doesn't exist
    const result = validateNIK('3174300299900001');
    expect(result.valid).toBe(false);
  });

  it('handles leap year', () => {
    // Feb 29, 2000 (leap year) - valid
    const result = validateNIK('3174290200000001');
    expect(result.valid).toBe(true);

    // Feb 29, 1999 (not leap) - invalid
    const bad = validateNIK('3174290299900001');
    expect(bad.valid).toBe(false);
  });

  it('rejects wrong length', () => {
    expect(validateNIK('123').valid).toBe(false);
    expect(validateNIK('12345678901234567').valid).toBe(false);
  });

  it('rejects non-digits', () => {
    expect(validateNIK('3174-0515-0890-0001').valid).toBe(false);
  });
});

describe('NPWP Validation', () => {
  it('validates 15-digit legacy format', () => {
    const result = validateNPWP('01.234.567.8-901.000');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('corporate');
  });

  it('validates 16-digit NIK-based format', () => {
    const result = validateNPWP('3174051508900001');
    expect(result.valid).toBe(true);
    expect(result.type).toBe('individual');
  });

  it('normalizes to digits only', () => {
    expect(normalizeNPWP('01.234.567.8-901.000')).toBe('012345678901000');
  });
});
```

---

## Common Mistakes

### ❌ Only Checking Length

```typescript
// Bad: 16 digits but date invalid
if (nik.length === 16) return true;

// Good: Validate structure
return validateNIK(nik).valid;
```

### ❌ Forgetting +40 Gender Offset

```typescript
// Bad: Female NIK with day 55 fails validation
if (day > 31) return false;  // Wrong!

// Good: Handle offset
if (day > 40) { day -= 40; gender = 'female'; }
```

### ❌ Assuming 2-Digit Year is 1900s

```typescript
// Bad: 05 → always 1905
const year = 1900 + parseInt(yy);

// Good: Context-aware
const currentYY = new Date().getFullYear() % 100;
const fullYear = parseInt(yy) > currentYY ? 1900 + parseInt(yy) : 2000 + parseInt(yy);
```

### ❌ Logging Full NIK

```typescript
// Bad: PII in logs
logger.info(`Processing user ${user.nik}`);

// Good: Mask it
logger.info(`Processing user ${maskNIK(user.nik)}`);
```

---

## Integration with Dukcapil (Advanced)

Untuk verifikasi resmi, integrate dengan Dukcapil API (memerlukan partnership):

```typescript
async function verifyNIKWithDukcapil(nik: string, name: string) {
  // Requires Dukcapil API access (via partner like Privy, VIDA, etc.)
  const response = await dukcapilClient.post('/verify', {
    nik,
    nama: name,
  });

  return response.data.match;  // true/false
}
```

**Note:** Dukcapil verification berbayar dan memerlukan legal agreement. Untuk basic validation, struktur check saja cukup.

---

## Checklist

- [ ] NIK: 16 digit format check
- [ ] NIK: tanggal lahir valid (handle leap year)
- [ ] NIK: gender offset (+40) handled
- [ ] NIK: kode wilayah validated (with dataset)
- [ ] NPWP: 15 dan 16 digit support
- [ ] NPWP: normalized ke digits only
- [ ] PII encrypted at rest
- [ ] PII masked in logs dan UI
- [ ] Server-side validation (bukan cuma client)
- [ ] Tests untuk edge cases
