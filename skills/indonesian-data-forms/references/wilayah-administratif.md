# Wilayah Administratif Indonesia

**Pain Point:** Data referensi wilayah (provinsi → kelurahan) sering outdated.

Strategi mengambil, menyimpan, dan maintain data wilayah administratif Indonesia.

---

## Struktur Wilayah Indonesia

```
Provinsi (38)          Kode BPS: 2 digit   Contoh: 32 = Jawa Barat
└── Kabupaten/Kota     Kode BPS: 2 digit   Contoh: 3204 = Kab. Bandung
    └── Kecamatan      Kode BPS: 2 digit   Contoh: 3204010
        └── Kelurahan/Desa  Kode BPS: 3 digit  Contoh: 3204010001
```

**Jumlah (per 2024):**
- 38 Provinsi
- 514 Kabupaten/Kota
- 7.266 Kecamatan
- 83.447 Kelurahan/Desa

**Kode Pos:** 5 digit (bukan bagian dari kode BPS, tapi terikat ke kelurahan)

---

## Import Points untuk NIK

6 digit pertama NIK = kode wilayah:

```
3201234567890001
├────┤
  3201 = Kota/Provinsi (BPS code)
```

⚠️ **NIK hanya encode sampai level kecamatan/Kota** (6 digit). Kelurahan tidak ada di NIK.

---

## Strategy Comparison

| Strategy | Freshness | Offline | Effort | Best For |
|----------|-----------|---------|--------|----------|
| **API (wilayah.id/emsifa)** | ✅ Always fresh | ❌ Needs network | Low | Simple apps |
| **Local JSON + refresh** | ⚠️ Depends on refresh | ✅ Yes | Medium | Production apps |
| **DB table + sync job** | ⚠️ Depends on sync | ✅ Yes | High | Complex, custom data |

**Recommendation:** Local JSON dataset with monthly refresh job.

---

## Option 1: API Integration

### wilayah.id API

```typescript
const WILAYAH_API = 'https://wilayah.id/api';

export class WilayahAPI {
  async getProvinces() {
    const res = await fetch(`${WILAYAH_API}/provinces.json`);
    const data = await res.json();
    return data.data.map((p: any) => ({
      code: p.code,
      name: p.name,
    }));
  }

  async getRegencies(provinceCode: string) {
    const res = await fetch(`${WILAYAH_API}/regencies/${provinceCode}.json`);
    const data = await res.json();
    return data.data;
  }

  async getDistricts(regencyCode: string) {
    const res = await fetch(`${WILAYAH_API}/districts/${regencyCode}.json`);
    const data = await res.json();
    return data.data;
  }

  async getVillages(districtCode: string) {
    const res = await fetch(`${WILAYAH_API}/villages/${districtCode}.json`);
    const data = await res.json();
    return data.data;
  }
}
```

### emsifa API

```typescript
// https://emsifa.github.io/api-wilayah-indonesia/api/
const EMSIFA_API = 'https://emsifa.github.io/api-wilayah-indonesia/api';

export async function getProvincesEmsifa() {
  const res = await fetch(`${EMSIFA_API}/provinces.json`);
  return res.json(); // [{ id: "11", name: "ACEH" }]
}

export async function getRegenciesEmsifa(provinceId: string) {
  const res = await fetch(`${EMSIFA_API}/regencies/${provinceId}.json`);
  return res.json();
}
```

**Pros:** Zero maintenance, always fresh
**Cons:** Network dependency, rate limits (emsifa rate-limited), no SLA

---

## Option 2: Local Dataset (Recommended)

### 1. Seed Download Script

```bash
#!/bin/bash
# scripts/update-wilayah.sh

DATA_DIR="./data/wilayah"
mkdir -p $DATA_DIR

# Download from source (BPS-based dataset)
curl -o $DATA_DIR/provinces.json \
  "https://raw.githubusercontent.com/.../provinces.json"

curl -o $DATA_DIR/regencies.json \
  "https://raw.githubusercontent.com/.../regencies.json"

curl -o $DATA_DIR/districts.json \
  "https://raw.githubusercontent.com/.../districts.json"

curl -o $DATA_DIR/villages.json \
  "https://raw.githubusercontent.com/.../villages.json"

echo "Wilayah data updated: $(date)"
```

### 2. Load & Index Locally

```typescript
// wilayah.service.ts
import provinces from './data/wilayah/provinces.json';
import regencies from './data/wilayah/regencies.json';
import districts from './data/wilayah/districts.json';
import villages from './data/wilayah/villages.json';

interface Wilayah {
  code: string;
  name: string;
  parentCode?: string;
}

export class WilayahService {
  private provinces: Wilayah[] = provinces;
  private regenciesByProvince = new Map<string, Wilayah[]>();
  private districtsByRegency = new Map<string, Wilayah[]>();
  private villagesByDistrict = new Map<string, Wilayah[]>();

  constructor() {
    // Build indexes for O(1) lookup
    for (const r of regencies) {
      const list = this.regenciesByProvince.get(r.parentCode!) || [];
      list.push(r);
      this.regenciesByProvince.set(r.parentCode!, list);
    }
    // ... same for districts, villages
  }

  getProvinces() {
    return this.provinces;
  }

  getRegencies(provinceCode: string) {
    return this.regenciesByProvince.get(provinceCode) || [];
  }

  getDistricts(regencyCode: string) {
    return this.districtsByRegency.get(regencyCode) || [];
  }

  getVillages(districtCode: string) {
    return this.villagesByDistrict.get(districtCode) || [];
  }

  // Reverse lookup untuk NIK validation
  lookupByCode(code: string): { province?: Wilayah; regency?: Wilayah; district?: Wilayah } {
    return {
      province: this.provinces.find(p => p.code === code.substring(0, 2)),
      regency: regencies.find(r => r.code === code.substring(0, 4)),
      district: districts.find(d => d.code === code.substring(0, 7)),
    };
  }
}
```

### 3. Database Seeding (Large Apps)

```typescript
// seeders/WilayahSeeder.ts
export async function seedWilayah(db) {
  const provinces = await loadJSON('provinces.json');

  await db.transaction(async (trx) => {
    for (const province of provinces) {
      await trx('provinces').insert({
        code: province.code,
        name: province.name,
      }).onConflict('code').merge();
    }
    // ... regencies, districts, villages
  });
}
```

**Query via DB:**

```sql
-- Get regencies by province
SELECT code, name FROM regencies WHERE province_code = '32';

-- Full address lookup
SELECT
  p.name AS province,
  r.name AS regency,
  d.name AS district,
  v.name AS village,
  v.postal_code
FROM villages v
JOIN districts d ON v.district_code = d.code
JOIN regencies r ON d.regency_code = r.code
JOIN provinces p ON r.province_code = p.code
WHERE v.code = '3204010001';
```

---

## Refresh Job (Keep Data Fresh)

```typescript
// jobs/RefreshWilayahData.ts (run monthly via cron)

export async function refreshWilayahData() {
  const sources = [
    'provinces', 'regencies', 'districts', 'villages'
  ];

  for (const source of sources) {
    const fresh = await downloadLatest(source);
    const current = await db(source).select('*');

    // Diff
    const added = fresh.filter(f => !current.find(c => c.code === f.code));
    const removed = current.filter(c => !fresh.find(f => f.code === c.code));
    const changed = fresh.filter(f => {
      const c = current.find(x => x.code === f.code);
      return c && c.name !== f.name;
    });

    if (added.length || removed.length || changed.length) {
      console.log(`[${source}] +${added.length} -${removed.length} ~${changed.length}`);

      // Update DB
      await db.transaction(async (trx) => {
        if (added.length) await trx(source).insert(added);
        if (removed.length) await trx(source).whereIn('code', removed.map(r => r.code)).del();
        for (const c of changed) {
          await trx(source).where('code', c.code).update({ name: c.name });
        }
      });

      // Alert admin
      await notifyAdmin({ source, added, removed, changed });
    }
  }
}
```

**Cron (monthly):**
```bash
0 3 1 * * cd /var/www/app && node dist/jobs/refresh-wilayah.js
```

---

## Cascading Dropdown Implementation

```typescript
// React example
function AddressForm() {
  const [province, setProvince] = useState('');
  const [regency, setRegency] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');

  const { data: provinces } = useQuery(['provinces'], getProvinces);
  const { data: regencies } = useQuery(
    ['regencies', province],
    () => getRegencies(province),
    { enabled: !!province }
  );
  const { data: districts } = useQuery(
    ['districts', regency],
    () => getDistricts(regency),
    { enabled: !!regency }
  );
  const { data: villages } = useQuery(
    ['villages', district],
    () => getVillages(district),
    { enabled: !!district }
  );

  return (
    <>
      <Select value={province} onChange={e => {
        setProvince(e.target.value);
        setRegency(''); setDistrict(''); setVillage('');
      }}>
        <option value="">Pilih Provinsi</option>
        {provinces?.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
      </Select>

      <Select value={regency} disabled={!province} onChange={e => {
        setRegency(e.target.value);
        setDistrict(''); setVillage('');
      }}>
        <option value="">Pilih Kota/Kabupaten</option>
        {regencies?.map(r => <option key={r.code} value={r.code}>{r.name}</option>)}
      </Select>

      {/* ... districts, villages */}
    </>
  );
}
```

**Caching strategy:** Cache provinces in localStorage (rarely changes), regencies/districts fetched on demand.

---

## Data Sources (Reference)

| Source | Format | Update | License |
|--------|--------|--------|---------|
| **BPS (bps.go.id)** | Master data | Official | Public |
| **wilayah.id** | JSON API | Regular | Free |
| **emsifa/api-wilayah-indonesia** | JSON API | Regular | MIT |
| **cahyadsn/wilayah** | CSV/JSON/SQL | Regular | Open |

⚠️ **Kode wilayah BPS bisa berubah** (pemekaran daerah baru, e.g., provinsi baru Papua 2022-2023). Selalu refresh berkala.

---

## Edge Cases

### 1. Pemekaran Daerah

Provinsi/kabupaten baru muncul. Contoh:
- 2022: Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya
- Kode lama masih valid untuk data historis

**Handle:** Store both kode dan nama. Kalau lookup gagal, fallback ke raw code.

### 2. Duplikasi Nama

Banyak kecamatan/kelurahan punya nama sama di wilayah berbeda. **Always use code, not name** untuk identifikasi.

```typescript
// Bad: Ambiguous
WHERE district_name = 'Cibadak'  // Ada di banyak kabupaten

// Good: Unique
WHERE district_code = '3204010'
```

### 3. Kode Pos Not Unique

Satu kode pos bisa cover beberapa kelurahan, dan satu kelurahan bisa punya beberapa kode pos.

**Handle:** Kode pos adalah attribute kelurahan, bukan identifier.

---

## Checklist

- [ ] Pilih strategy (API vs local vs DB)
- [ ] Data source BPS-based dan maintained
- [ ] Index untuk fast lookup (Map atau DB index)
- [ ] Refresh job untuk keep data fresh
- [ ] Cascading dropdown dengan proper reset logic
- [ ] Caching untuk reduce API calls
- [ ] Use code (not name) untuk identifikasi
- [ ] Alembic/migration untuk DB schema
- [ ] Monitor data changes (alert on diff)
