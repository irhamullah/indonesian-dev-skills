# Rupiah Formatting & Money Handling

**Pain Point:** Format Rupiah tidak konsisten, float error di perhitungan uang.

Handling mata uang Rupiah yang benar: formatting, parsing, dan storage.

---

## Core Rule: Never Use Float for Money

```typescript
// ❌ Bad: Floating point errors
const price = 19900;
const qty = 3;
const total = price * qty;          // 59700 (ok here)
const withTax = total * 1.11;       // 66267.00000000001 (float error!)

// ❌ Worse
const a = 0.1 + 0.2;                // 0.30000000000000004

// ✅ Good: Integer (rupiah has no practical fractions)
const total = 59700;                // Integer rupiah
const tax = Math.round(59700 * 0.11);  // Round explicitly
const grandTotal = 59700 + tax;
```

**Why:** Rupiah practically has no sub-unit in daily use (sen already obsolete). Store as **integer rupiah**.

```typescript
// Storage
amount: number  // 100000 = Rp 100.000 (integer)
```

---

## Formatting

### Basic Formatting

```typescript
export function formatRupiah(amount: number, options?: {
  decimals?: boolean;
  symbol?: boolean;
  sign?: boolean;
}): string {
  const { decimals = false, symbol = true, sign = false } = options || {};

  const formatted = new Intl.NumberFormat('id-ID', {
    style: symbol ? 'currency' : 'decimal',
    currency: 'IDR',
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  }).format(amount);

  // Intl outputs "Rp 100.000" (with space)
  if (symbol) {
    return formatted;  // "Rp 100.000"
  }

  // Without symbol, add sign manually
  const prefix = sign && amount > 0 ? '+' : '';
  return prefix + formatted;  // "100.000"
}

// Examples
formatRupiah(100000);              // "Rp 100.000"
formatRupiah(1500000);             // "Rp 1.500.000"
formatRupiah(1500.5, { decimals: true });  // "Rp 1.500,50"
formatRupiah(100000, { symbol: false });   // "100.000"
```

### Compact Formatting (for dashboards)

```typescript
export function formatRupiahCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  }
  if (amount >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return `Rp ${amount}`;
}

// Examples
formatRupiahCompact(1_500_000);      // "Rp 1,5 jt"
formatRupiahCompact(250_000_000);    // "Rp 250,0 jt"
formatRupiahCompact(2_500_000_000);  // "Rp 2,5 M"
formatRupiahCompact(150_000);        // "Rp 150 rb"
```

---

## Parsing

```typescript
export function parseRupiah(input: string | number): number {
  if (typeof input === 'number') return input;

  // Remove currency symbol, spaces
  let cleaned = input
    .replace(/Rp/gi, '')
    .replace(/\s/g, '')
    .trim();

  // Detect format: Indonesian uses . as thousand, , as decimal
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    // "1.500.000,50" → dots are thousands, comma is decimal
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    // Could be "1500,50" (decimal) or "1,500" (thousands)
    const commaPosition = cleaned.indexOf(',');
    const afterComma = cleaned.substring(commaPosition + 1);
    if (afterComma.length === 3) {
      // "1,500" → thousands separator
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // "1500,50" → decimal
      cleaned = cleaned.replace(',', '.');
    }
  } else if (hasDot) {
    // Could be "1.500.000" (thousands) or "1500.50" (decimal)
    const parts = cleaned.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      // "1.500.000" → thousands
      cleaned = cleaned.replace(/\./g, '');
    }
    // else: keep as decimal "1500.50"
  }

  const amount = parseFloat(cleaned);
  if (isNaN(amount)) {
    throw new Error(`Format Rupiah tidak valid: ${input}`);
  }

  return Math.round(amount);  // Return integer rupiah
}

// Examples
parseRupiah('Rp 100.000');       // 100000
parseRupiah('100000');           // 100000
parseRupiah('1.500.000');        // 1500000
parseRupiah('Rp 1.500.000,50');  // 1500001 (rounded)
```

---

## Input Masking (UX)

```typescript
export function maskRupiahInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');  // Keep only digits
  if (!digits) return '';

  const number = parseInt(digits, 10);
  return new Intl.NumberFormat('id-ID').format(number);
  // "100000" → "100.000"
}

// React component
function RupiahInput({ value, onChange }) {
  return (
    <div className="rupiah-input">
      <span>Rp</span>
      <input
        type="text"
        inputMode="numeric"
        value={value ? formatRupiah(value, { symbol: false }) : ''}
        onChange={(e) => onChange(parseRupiah(e.target.value) || 0)}
        placeholder="0"
      />
    </div>
  );
}
```

---

## Percentage & Tax Calculation

```typescript
// Tarif PPN adalah aturan berperiode — ambil dari registry skill `data-resmi-indonesia`
// (references/aturan/ppn-2026.json) alih-alih hardcode di sini.
const PPN_RATE = 0.11;  // sebagai default; verifikasi angka terbaru di registry

export function calculatePPN(amount: number): number {
  return Math.round(amount * PPN_RATE);
}

export function addPPN(amount: number): { subtotal: number; ppn: number; total: number } {
  const ppn = calculatePPN(amount);
  return {
    subtotal: amount,
    ppn,
    total: amount + ppn,
  };
}

export function extractPPN(total: number): { subtotal: number; ppn: number } {
  // When total already includes PPN
  const subtotal = Math.round(total / (1 + PPN_RATE));
  return {
    subtotal,
    ppn: total - subtotal,
  };
}
```

⚠️ **Rounding matters:** Selalu `Math.round()` untuk hindari fractional rupiah. Konsisten untuk semua kalkulasi.

---

## Discount Calculation

```typescript
export function applyDiscount(amount: number, discount: {
  type: 'fixed' | 'percentage';
  value: number;
  maxDiscount?: number;
}): { discountAmount: number; finalAmount: number } {
  let discountAmount: number;

  if (discount.type === 'percentage') {
    discountAmount = Math.round(amount * (discount.value / 100));
    if (discount.maxDiscount) {
      discountAmount = Math.min(discountAmount, discount.maxDiscount);
    }
  } else {
    discountAmount = discount.value;
  }

  // Don't discount below zero
  discountAmount = Math.min(discountAmount, amount);

  return {
    discountAmount,
    finalAmount: amount - discountAmount,
  };
}

// Examples
applyDiscount(100000, { type: 'percentage', value: 10 });
// → { discountAmount: 10000, finalAmount: 90000 }

applyDiscount(100000, { type: 'percentage', value: 50, maxDiscount: 30000 });
// → { discountAmount: 30000, finalAmount: 70000 }

applyDiscount(50000, { type: 'fixed', value: 60000 });
// → { discountAmount: 50000, finalAmount: 0 }  (capped)
```

---

## Database & API

### Storage

```sql
-- Store as BIGINT (integer rupiah)
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  amount BIGINT NOT NULL,        -- 100000 = Rp 100.000
  tax BIGINT NOT NULL DEFAULT 0,
  total BIGINT NOT NULL,
  created_at TIMESTAMP
);
```

**Why BIGINT not NUMERIC/DECIMAL?**
- Rupiah has no practical sub-unit
- Integer math = no float errors
- BIGINT max = 9.2 quintillion (way more than enough)

### API Response

```typescript
// Bad: Send formatted string
{
  "total": "Rp 1.500.000"  // Client must parse
}

// Good: Send integer + let client format
{
  "total": 1500000,
  "currency": "IDR"
}
```

---

## Common Mistakes

### ❌ Floating Point Money

```typescript
// Bad
let total = 0;
for (const item of cart) {
  total += item.price * 1.11;  // Accumulating float errors
}

// Good
let total = 0;
for (const item of cart) {
  total += Math.round(item.price * 1.11);
}
```

### ❌ Storing Formatted Strings

```typescript
// Bad: Ambiguous, hard to compute
price: "Rp 1.500.000"

// Good: Integer
price: 1500000
```

### ❌ Inconsistent Rounding

```typescript
// Bad: different rounding methods
const tax1 = amount * 0.11;              // Truncate
const tax2 = Math.floor(amount * 0.11);  // Floor
const tax3 = Math.round(amount * 0.11);  // Round

// Good: one method everywhere
const tax = Math.round(amount * PPN_RATE);
```

### ❌ Assuming Dot is Decimal

```typescript
// Bad: "1.500" parsed as 1.5
parseFloat('1.500');  // 1.5 (WRONG! means 1500)

// Good: Context-aware parsing
parseRupiah('1.500');  // 1500
```

### ❌ Using Comma as Thousands in JS

```typescript
// Bad: JS toLocaleString uses comma by default
(1000000).toLocaleString();  // "1,000,000" (US format)

// Good: Specify locale
(1000000).toLocaleString('id-ID');  // "1.000.000"
```

---

## Testing

```typescript
describe('Rupiah Formatting', () => {
  it('formats with thousand separators', () => {
    expect(formatRupiah(1000)).toBe('Rp 1.000');
    expect(formatRupiah(1000000)).toBe('Rp 1.000.000');
  });

  it('parses various formats', () => {
    expect(parseRupiah('Rp 1.500.000')).toBe(1500000);
    expect(parseRupiah('1.500.000')).toBe(1500000);
    expect(parseRupiah('1500000')).toBe(1500000);
  });

  it('calculates PPN correctly', () => {
    expect(calculatePPN(100000)).toBe(11000);
    expect(addPPN(100000).total).toBe(111000);
  });

  it('handles percentage discount with cap', () => {
    const result = applyDiscount(100000, {
      type: 'percentage', value: 50, maxDiscount: 30000,
    });
    expect(result.discountAmount).toBe(30000);
  });

  it('never produces fractional rupiah', () => {
    for (let i = 1; i <= 100; i++) {
      const result = calculatePPN(i * 333);
      expect(Number.isInteger(result)).toBe(true);
    }
  });
});
```

---

## Checklist

- [ ] Store money as INTEGER rupiah (BIGINT in DB)
- [ ] Never use float untuk money calculation
- [ ] Consistent rounding (`Math.round()`) everywhere
- [ ] Format dengan `Intl.NumberFormat('id-ID')`
- [ ] Parse handle both `.` dan `,` separators
- [ ] API returns integer, client formats
- [ ] Input masking untuk UX
- [ ] PPN calculation correct — pakai tarif dari registry `data-resmi-indonesia` (references/aturan/ppn-2026.json)
- [ ] Discount dengan proper capping
- [ ] Tests untuk edge cases (rounding, cap, zero)
