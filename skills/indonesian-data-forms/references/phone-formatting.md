# Phone Number Formatting (Indonesia)

**Pain Point:** Nomor HP Indonesia ditulis dalam berbagai format, sulit di-normalize.

Normalization, validation, dan formatting nomor telepon Indonesia.

---

## Format Chaos

Nomor HP Indonesia punya banyak format:

```
0812-3456-7890
081234567890
+6281234567890
6281234567890
0812 3456 7890
(0812) 3456-7890
81234567890
+62 812-3456-7890
```

**Semua nomor di atas = nomor yang sama.** Solusi: normalize ke **E.164** (`+6281234567890`).

---

## E.164 Standard

```
+62 812 3456 7890
│   │   └─ Subscriber number
│   └─ Mobile prefix (8xx)
└─ Country code (Indonesia = 62)
```

- **Stored:** `+6281234567890` (E.164, no spaces)
- **Displayed:** `+62 812-3456-7890` (formatted)

---

## Normalization

```typescript
export function normalizePhone(phone: string): string {
  if (!phone) throw new Error('Nomor HP kosong');

  // 1. Remove all non-digit characters except leading +
  let cleaned = phone.trim().replace(/[\s\-().]/g, '');
  const hasPlus = cleaned.startsWith('+');
  cleaned = cleaned.replace(/\+/g, '');

  // 2. Remove country code variations
  if (cleaned.startsWith('62')) {
    cleaned = cleaned.substring(2);
  }
  // 6208xxx → handle edge case
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // 3. Now cleaned should start with 8 (mobile prefix)
  if (!cleaned.startsWith('8')) {
    throw new Error('Nomor HP Indonesia harus diawali 8 setelah kode negara');
  }

  // 4. Validate length (mobile: 9-13 digits total after country code)
  if (cleaned.length < 9 || cleaned.length > 13) {
    throw new Error('Panjang nomor HP tidak valid');
  }

  return '+62' + cleaned;
}
```

### Test Cases

```typescript
const testCases = [
  ['081234567890', '+6281234567890'],
  ['0812-3456-7890', '+6281234567890'],
  ['+6281234567890', '+6281234567890'],
  ['6281234567890', '+6281234567890'],
  ['0812 3456 7890', '+6281234567890'],
  ['(0812) 3456-7890', '+6281234567890'],
  ['81234567890', '+6281234567890'],
  ['+62 812-3456-7890', '+6281234567890'],
];

for (const [input, expected] of testCases) {
  console.log(normalizePhone(input) === expected ? '✅' : '❌', input, '→', normalizePhone(input));
}
```

---

## Validation

```typescript
export function isValidPhone(phone: string): boolean {
  try {
    const normalized = normalizePhone(phone);
    // Indonesian mobile: +62 8xx followed by 7-11 more digits
    return /^\+628\d{7,11}$/.test(normalized);
  } catch {
    return false;
  }
}
```

### Mobile Prefixes (Valid)

Indonesian mobile numbers start with `8`, then specific operator prefixes:

| Prefix | Operator |
|--------|----------|
| 811, 812, 813, 821, 822, 823, 851, 852, 853 | Telkomsel |
| 814, 815, 816, 855, 856, 857, 858 | Indosat |
| 817, 818, 819, 859, 877, 878 | XL |
| 831, 832, 833, 838 | Axis |
| 895, 896, 897, 898, 899 | Three (3) |
| 881-889 | Smartfren |

```typescript
export function detectOperator(phone: string): string | null {
  const normalized = normalizePhone(phone);
  const prefix = normalized.substring(3, 6); // After +62

  const operators: Record<string, string[]> = {
    'Telkomsel': ['811', '812', '813', '821', '822', '823', '851', '852', '853'],
    'Indosat': ['814', '815', '816', '855', '856', '857', '858'],
    'XL': ['817', '818', '819', '859', '877', '878'],
    'Axis': ['831', '832', '833', '838'],
    'Tri': ['895', '896', '897', '898', '899'],
    'Smartfren': ['881', '882', '883', '884', '885', '886', '887', '888', '889'],
  };

  for (const [operator, prefixes] of Object.entries(operators)) {
    if (prefixes.includes(prefix)) return operator;
  }
  return null;
}
```

⚠️ **Note:** Operator prefix bisa berubah via MNP (Mobile Number Portability) - nomor bisa pindah operator tanpa ganti prefix. Gunakan hanya sebagai hint, bukan penentu.

---

## Display Formatting

```typescript
export function formatPhoneDisplay(phone: string, style: 'dash' | 'space' | 'international' = 'dash'): string {
  const normalized = normalizePhone(phone);
  const local = normalized.substring(3); // Remove +62

  // Group: 3-4-4 (mobile standard)
  const part1 = local.slice(0, 3);
  const part2 = local.slice(3, 7);
  const part3 = local.slice(7);

  switch (style) {
    case 'dash':
      return `+62 ${part1}-${part2}-${part3}`;      // +62 812-3456-7890
    case 'space':
      return `+62 ${part1} ${part2} ${part3}`;      // +62 812 3456 7890
    case 'international':
      return `+62${local}`;                          // +6281234567890
    default:
      return `+62 ${part1}-${part2}-${part3}`;
  }
}

export function formatPhoneLocal(phone: string): string {
  // Display as local format (08xx)
  const normalized = normalizePhone(phone);
  return '0' + normalized.substring(3);  // +6281234567890 → 081234567890
}
```

---

## WhatsApp Integration

WhatsApp link format:

```typescript
export function toWhatsAppLink(phone: string, message?: string): string {
  const normalized = normalizePhone(phone);
  const number = normalized.substring(1); // Remove + → 6281234567890

  const url = `https://wa.me/${number}`;
  return message ? `${url}?text=${encodeURIComponent(message)}` : url;
}

// Usage
toWhatsAppLink('081234567890', 'Halo, pesanan Anda siap!');
// → https://wa.me/6281234567890?text=Halo%2C%20pesanan%20Anda%20siap!
```

---

## Landline Numbers

⚠️ **Landline berbeda** dari mobile:

```
021-1234567      Jakarta (area code 21)
022-1234567      Bandung (area code 22)
031-1234567      Surabaya (area code 31)
+6221-1234567    International format
```

```typescript
export function normalizeLandline(phone: string): string {
  let cleaned = phone.replace(/[\s\-().]/g, '').replace(/^\+/, '');

  if (cleaned.startsWith('62')) cleaned = cleaned.substring(2);
  if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);

  return '+62' + cleaned;
}

export function isLandline(phone: string): boolean {
  try {
    const cleaned = phone.replace(/[\s\-().]/g, '').replace(/^(\+62|62|0)/, '');
    return !cleaned.startsWith('8');  // Landline starts with area code (2, 3, 4...)
  } catch {
    return false;
  }
}
```

**Common area codes:**
| Area Code | City |
|-----------|------|
| 21 | Jakarta |
| 22 | Bandung |
| 31 | Surabaya |
| 24 | Semarang |
| 61 | Medan |
| 411 | Makassar |
| 361 | Denpasar |

---

## Complete Schema (Zod)

```typescript
import { z } from 'zod';

export const phoneSchema = z
  .string()
  .transform(s => s.trim())
  .refine(s => isValidPhone(s), {
    message: 'Nomor HP tidak valid. Contoh: 08123456789',
  })
  .transform(s => normalizePhone(s));  // Store as E.164

// Usage
const formSchema = z.object({
  phone: phoneSchema,
  whatsapp: phoneSchema.optional(),
});
```

---

## Formatting in Input (UX)

```tsx
function PhoneInput({ value, onChange }) {
  const [display, setDisplay] = useState('');

  const handleChange = (e) => {
    const raw = e.target.value;
    // Allow user to type freely, format on blur
    setDisplay(raw);
    try {
      onChange(normalizePhone(raw));
    } catch {
      // Invalid, keep raw for user to fix
    }
  };

  const handleBlur = () => {
    try {
      setDisplay(formatPhoneDisplay(display));
    } catch {
      // Keep as-is if invalid
    }
  };

  return (
    <input
      type="tel"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder="0812-3456-7890"
      inputMode="numeric"
    />
  );
}
```

### Progressive Formatting (Mask)

```typescript
export function maskPhoneInput(input: string): string {
  const digits = input.replace(/\D/g, '');
  let formatted = '';

  if (digits.length <= 4) {
    formatted = digits;
  } else if (digits.length <= 8) {
    formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
  } else {
    formatted = `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
  }

  return formatted;
}
```

---

## Common Mistakes

### ❌ Trusting User Input Format

```typescript
// Bad: Store as-is
user.phone = req.body.phone;  // Could be any format

// Good: Normalize
user.phone = normalizePhone(req.body.phone);
```

### ❌ String Comparison for Uniqueness

```typescript
// Bad: Same number, different format = considered different
WHERE phone = '08123456789'  // Misses '+628123456789'

// Good: Store normalized, compare normalized
WHERE phone = '+628123456789'
```

### ❌ Ignoring Country Code on Display

```typescript
// Bad: Show raw E.164
"Phone: +6281234567890"

// Good: Format for humans
"Phone: +62 812-3456-7890"
```

### ❌ SMS Gateway Without Normalization

```typescript
// Bad: SMS gateway rejects inconsistent format
sendSMS(req.body.phone, 'OTP...');

// Good: Normalize first
sendSMS(normalizePhone(req.body.phone), 'OTP...');
```

---

## Testing

```typescript
describe('Phone Normalization', () => {
  it('normalizes all common formats', () => {
    const formats = [
      '081234567890', '0812-3456-7890', '+6281234567890',
      '6281234567890', '81234567890', '+62 812 3456 7890',
    ];
    for (const f of formats) {
      expect(normalizePhone(f)).toBe('+6281234567890');
    }
  });

  it('rejects invalid numbers', () => {
    expect(() => normalizePhone('021-1234567')).toThrow();  // Landline
    expect(() => normalizePhone('123')).toThrow();
    expect(() => normalizePhone('+1234567890')).toThrow();  // Not Indonesia
  });

  it('formats for display', () => {
    expect(formatPhoneDisplay('081234567890')).toBe('+62 812-3456-7890');
    expect(formatPhoneLocal('081234567890')).toBe('081234567890');
  });

  it('converts to WhatsApp link', () => {
    expect(toWhatsAppLink('081234567890'))
      .toBe('https://wa.me/6281234567890');
  });
});
```

---

## Checklist

- [ ] Normalize ke E.164 (`+6281234567890`) untuk storage
- [ ] Strip spaces, dashes, parentheses, country code variations
- [ ] Validate mobile prefix (8xx) dan length
- [ ] Format untuk display (dash/space style)
- [ ] WhatsApp link helper
- [ ] Landline handled separately (if needed)
- [ ] Zod schema untuk form validation
- [ ] Input masking untuk UX
- [ ] SMS gateway integration menggunakan normalized form
