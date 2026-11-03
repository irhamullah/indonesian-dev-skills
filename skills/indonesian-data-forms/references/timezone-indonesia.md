# Timezone Indonesia (WIB/WITA/WIT)

**Pain Point:** Server di UTC, user di 3 timezone berbeda, jadwal jadi kacau.

Handling 3 zona waktu Indonesia dengan benar.

---

## Zona Waktu Indonesia

| Zona | Offset | Singkatan | Wilayah |
|------|--------|-----------|---------|
| **WIB** (Waktu Indonesia Barat) | UTC+7 | Asia/Jakarta | Sumatera, Jawa, Kalimantan Barat & Tengah |
| **WITA** (Waktu Indonesia Tengah) | UTC+8 | Asia/Makassar | Bali, NTB, NTT, Kalimantan Selatan/Timur/Utara |
| **WIT** (Waktu Indonesia Timur) | UTC+9 | Asia/Jayapura | Maluku, Papua |

⚠️ **Tidak ada DST** di Indonesia. Offset tetap sepanjang tahun.

---

## Golden Rule: Store UTC, Display Local

```typescript
// Storage: always UTC
db.createdAt = new Date().toISOString();  // "2024-11-03T05:00:00.000Z"

// Display: convert to user's timezone
const display = formatInTimezone(db.createdAt, 'Asia/Jakarta');
// "03 November 2024, 12.00 WIB"
```

---

## Timezone Library (Recommended)

Gunakan `date-fns-tz` atau `luxon` (jangan manual offset math).

### date-fns-tz

```typescript
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

const JAKARTA = 'Asia/Jakarta';

// Display in Jakarta time
export function formatWIB(date: Date | string): string {
  return formatInTimeZone(new Date(date), JAKARTA, 'dd MMMM yyyy, HH:mm') + ' WIB';
}

// Convert local Jakarta time → UTC (for storage)
export function wibToUTC(localTime: string): Date {
  return fromZonedTime(localTime, JAKARTA);
}

// Examples
formatWIB('2024-11-03T05:00:00Z');  // "03 November 2024, 12:00 WIB"
wibToUTC('2024-11-03 12:00:00');    // 2024-11-03T05:00:00Z
```

### Luxon

```typescript
import { DateTime } from 'luxon';

export function formatWIB(date: Date | string): string {
  return DateTime.fromJSDate(new Date(date))
    .setZone('Asia/Jakarta')
    .toFormat('dd MMMM yyyy, HH:mm') + ' WIB';
}

// Parse local time
export function parseWIB(localTime: string): Date {
  return DateTime.fromFormat(localTime, 'yyyy-MM-dd HH:mm', {
    zone: 'Asia/Jakarta',
  }).toJSDate();
}
```

---

## Mapping Wilayah → Timezone

```typescript
export type IndonesianTimezone = 'Asia/Jakarta' | 'Asia/Makassar' | 'Asia/Jayapura';

// Province code (BPS) → Timezone
const PROVINCE_TIMEZONE: Record<string, IndonesianTimezone> = {
  // WIB (UTC+7) - Sumatra, Java, West/Central Kalimantan
  '11': 'Asia/Jakarta', '12': 'Asia/Jakarta', '13': 'Asia/Jakarta',
  '14': 'Asia/Jakarta', '15': 'Asia/Jakarta', '16': 'Asia/Jakarta',
  '17': 'Asia/Jakarta', '18': 'Asia/Jakarta', '19': 'Asia/Jakarta',
  '21': 'Asia/Jakarta', '31': 'Asia/Jakarta', '32': 'Asia/Jakarta',
  '33': 'Asia/Jakarta', '34': 'Asia/Jakarta', '35': 'Asia/Jakarta',
  '36': 'Asia/Jakarta', '61': 'Asia/Jakarta', '62': 'Asia/Jakarta',
  '63': 'Asia/Jakarta', '64': 'Asia/Jakarta',

  // WITA (UTC+8) - Bali, NT, South/East/North Kalimantan, Sulawesi
  '51': 'Asia/Makassar', '52': 'Asia/Makassar', '53': 'Asia/Makassar',
  '65': 'Asia/Makassar', '71': 'Asia/Makassar', '72': 'Asia/Makassar',
  '73': 'Asia/Makassar', '74': 'Asia/Makassar', '75': 'Asia/Makassar',
  '76': 'Asia/Makassar',

  // WIT (UTC+9) - Maluku, Papua
  '81': 'Asia/Jayapura', '82': 'Asia/Jayapura',
  '91': 'Asia/Jayapura', '92': 'Asia/Jayapura', '93': 'Asia/Jayapura',
  '94': 'Asia/Jayapura', '95': 'Asia/Jayapura', '96': 'Asia/Jayapura',
};

export function getTimezoneByProvinceCode(provinceCode: string): IndonesianTimezone {
  return PROVINCE_TIMEZONE[provinceCode] || 'Asia/Jakarta';
}
```

**Singkatan:**

```typescript
export function getTimezoneAbbr(tz: IndonesianTimezone): string {
  return { 'Asia/Jakarta': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' }[tz];
}
```

---

## Server Configuration

### Set VPS Timezone

```bash
# Set to WIB (common for Indonesian apps)
sudo timedatectl set-timezone Asia/Jakarta

# Verify
timedatectl
# Time zone: Asia/Jakarta (WIB, +0700)
```

### Laravel

```php
// config/app.php
'timezone' => 'Asia/Jakarta',  // Display timezone

// Store as UTC in DB
// database.php: 'timezone' => '+00:00'
```

```php
// Carbon usage
$utc = Carbon::now('UTC');
$wib = Carbon::now('Asia/Jakarta');

// Convert
$order->created_at->setTimezone('Asia/Jakarta')->format('d M Y H:i');
```

### Node.js

```bash
# .env
TZ=Asia/Jakarta
```

```typescript
// Per-request timezone
function formatForUser(date: Date, userTimezone: string) {
  return new Intl.DateTimeFormat('id-ID', {
    timeZone: userTimezone,
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}
```

---

## Common Scenarios

### 1. Scheduled Jobs (Daily Report at 00:00 WIB)

```typescript
// ❌ Wrong: 00:00 UTC = 07:00 WIB
cron.schedule('0 0 * * *', generateReport);  // Runs at 7 AM WIB!

// ✅ Good: Specify timezone
cron.schedule('0 0 * * *', generateReport, {
  timezone: 'Asia/Jakarta',
});

// Or compute UTC time: 00:00 WIB = 17:00 UTC (previous day)
cron.schedule('0 17 * * *', generateReport);  // 00:00 WIB
```

### 2. Order Cutoff Time

```typescript
export function isPastCutoff(orderTime: Date, cutoffHour = 15): boolean {
  // Cutoff at 15:00 WIB
  const orderWIB = DateTime.fromJSDate(orderTime).setZone('Asia/Jakarta');
  return orderWIB.hour >= cutoffHour;
}

// Same-day delivery available before 3 PM WIB
```

### 3. Display "X hours ago"

```typescript
export function timeAgoWIB(date: Date | string): string {
  const utcDate = new Date(date);
  const diffMs = Date.now() - utcDate.getTime();
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Baru saja';
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 30) return `${diffDays} hari lalu`;
  return formatWIB(date).split(',')[0];  // Just the date
}
```

### 4. Business Hours Check

```typescript
export function isBusinessHours(tz: IndonesianTimezone = 'Asia/Jakarta'): boolean {
  const now = DateTime.now().setZone(tz);
  const day = now.weekday;  // 1 = Monday, 7 = Sunday
  const hour = now.hour;

  // Mon-Fri, 09:00-17:00
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}
```

---

## Database

```sql
-- Store timestamps as UTC
CREATE TABLE orders (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- With timezone
  -- or
  created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')  -- Without tz
);
```

**PostgreSQL:**

```sql
-- Set session timezone
SET timezone = 'UTC';

-- Query and convert for display
SELECT
  created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta' AS created_wib
FROM orders;
```

**MySQL:**

```sql
-- Store UTC
SET time_zone = '+00:00';

-- Convert for display
SELECT CONVERT_TZ(created_at, '+00:00', '+07:00') AS created_wib FROM orders;
```

---

## Common Mistakes

### ❌ Storing Local Time

```typescript
// Bad: Ambiguous (which timezone?)
db.createdAt = '2024-11-03 12:00:00';

// Good: UTC
db.createdAt = new Date().toISOString();  // "2024-11-03T05:00:00.000Z"
```

### ❌ Manual Offset Math

```typescript
// Bad: Manual +7, breaks with DST (not ID issue but bad practice)
const wib = new Date(date.getTime() + 7 * 3600 * 1000);

// Good: Use library
const wib = formatInTimeZone(date, 'Asia/Jakarta', '...');
```

### ❌ Assuming Server is WIB

```typescript
// Bad: new Date() depends on server TZ
const today = new Date().toLocaleDateString();

// Good: Explicit timezone
const today = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'Asia/Jakarta',
}).format(new Date());
```

### ❌ Cron Without Timezone

```typescript
// Bad: Assumes server TZ
cron.schedule('0 9 * * *', sendReminder);

// Good: Explicit TZ
cron.schedule('0 9 * * *', sendReminder, { timezone: 'Asia/Jakarta' });
```

### ❌ Mixing WIB/WITA/WIT

```typescript
// Bad: Show WIB to a user in Makassar
"Waktu: 12:00 WIB"  // Confusing for WITA user

// Good: User's timezone
const tz = getTimezoneByProvinceCode(user.provinceCode);
`Waktu: ${formatInTimezone(date, tz)} ${getTimezoneAbbr(tz)}`;
```

---

## Testing

```typescript
describe('Timezone Handling', () => {
  it('converts UTC to WIB correctly', () => {
    // 05:00 UTC = 12:00 WIB
    expect(formatWIB('2024-11-03T05:00:00Z')).toBe('03 November 2024, 12:00 WIB');
  });

  it('maps province to correct timezone', () => {
    expect(getTimezoneByProvinceCode('31')).toBe('Asia/Jakarta');   // DKI Jakarta
    expect(getTimezoneByProvinceCode('51')).toBe('Asia/Makassar');  // Bali
    expect(getTimezoneByProvinceCode('91')).toBe('Asia/Jayapura');  // Papua
  });

  it('handles business hours per timezone', () => {
    // Mock time: 08:00 UTC = 15:00 WIB (business hours)
    vi.setSystemTime(new Date('2024-11-03T08:00:00Z'));
    expect(isBusinessHours('Asia/Jakarta')).toBe(true);
  });
});
```

---

## Checklist

- [ ] Store semua timestamp di UTC (TIMESTAMPTZ)
- [ ] Display convert ke user timezone (WIB/WITA/WIT)
- [ ] Gunakan `Intl.DateTimeFormat` atau library (bukan manual offset)
- [ ] Map province code → timezone
- [ ] Cron jobs specify timezone explicitly
- [ ] Business hours check per timezone
- [ ] VPS timezone set (Asia/Jakarta common)
- [ ] Database session timezone = UTC
- [ ] Test dengan multiple timezones
