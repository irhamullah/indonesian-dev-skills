import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REQUIRED_FIELDS = [
  "aturan",
  "jenis",
  "dasar_hukum",
  "berlaku_dari",
  "sumber",
  "diverifikasi_pada",
];
const VALID_JENIS = ["bracket", "daftar", "komponen"];

export function validateRegistry({ aturanDir, proseFiles = [] }) {
  const findings = [];

  let files;
  try {
    files = readdirSync(aturanDir).filter((f) => f.endsWith(".json"));
  } catch {
    return { findings: [], ok: true };
  }

  for (const name of files) {
    const file = path.join(aturanDir, name);

    let data;
    try {
      data = JSON.parse(readFileSync(file, "utf8"));
    } catch (err) {
      findings.push({ file, code: "JSON_PARSE", message: err.message });
      continue;
    }

    for (const field of REQUIRED_FIELDS) {
      const value = data[field];
      if (value === undefined || value === null || value === "") {
        findings.push({
          file,
          code: "MISSING_FIELD",
          message: `field wajib '${field}' hilang atau kosong`,
        });
      }
    }

    if (data.jenis !== undefined && !VALID_JENIS.includes(data.jenis)) {
      findings.push({
        file,
        code: "BAD_JENIS",
        message: `jenis '${data.jenis}' tidak dikenal (harus salah satu dari ${VALID_JENIS.join(", ")})`,
      });
    } else if (data.jenis === "bracket") {
      checkBracket(data, file, findings);
    } else if (data.jenis === "daftar") {
      if (!Array.isArray(data.entri)) {
        findings.push({
          file,
          code: "MISSING_FIELD",
          message: "jenis 'daftar' wajib punya array 'entri'",
        });
      }
    } else if (data.jenis === "komponen") {
      if (!Array.isArray(data.komponen)) {
        findings.push({
          file,
          code: "MISSING_FIELD",
          message: "jenis 'komponen' wajib punya array 'komponen'",
        });
      }
    }
  }

  return { findings, ok: findings.length === 0 };
}

function checkBracket(data, file, findings) {
  const kategori = data.kategori !== null && typeof data.kategori === "object" ? data.kategori : {};
  const entries = [];
  for (const arr of Object.values(kategori)) {
    if (Array.isArray(arr)) entries.push(...arr);
  }
  const ceilings = entries.map((e) => (e && e.batas_atas !== undefined ? e.batas_atas : null));

  // Cakupan tutup lebih awal: null di tengah berarti tier berhenti sebelum entri
  // terakhir, sehingga nilai di atasnya tidak punya tier (celah).
  for (let i = 0; i < ceilings.length; i++) {
    if (ceilings[i] === null && i !== ceilings.length - 1) {
      findings.push({
        file,
        code: "BRACKET_GAP",
        message: `batas_atas null pada posisi ${i + 1} dari ${ceilings.length} — rentang tertutup lebih awal, ada celah di atasnya`,
      });
      break;
    }
  }

  // Batas atas harus naik tegas; nilai sama atau turun berarti tumpang tindih.
  const numeric = ceilings.filter((c) => c !== null);
  for (let i = 1; i < numeric.length; i++) {
    if (numeric[i] <= numeric[i - 1]) {
      findings.push({
        file,
        code: "BRACKET_OVERLAP",
        message: `batas_atas ${numeric[i]} tidak lebih besar dari ${numeric[i - 1]} — tumpang tindih`,
      });
      break;
    }
  }

  if (ceilings.length === 0 || ceilings[ceilings.length - 1] !== null) {
    findings.push({
      file,
      code: "NO_TERMINAL",
      message: "entri terakhir wajib batas_atas null (penutup rentang)",
    });
  }
}

const here = path.dirname(fileURLToPath(import.meta.url));

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rootIdx = process.argv.indexOf("--root");
  const repoRoot =
    rootIdx !== -1 && process.argv[rootIdx + 1]
      ? path.resolve(process.argv[rootIdx + 1])
      : path.resolve(here, "..", "..", "..");

  const aturanDir = path.join(repoRoot, "skills", "data-resmi-indonesia", "references", "aturan");
  const { findings, ok } = validateRegistry({ aturanDir });

  for (const f of findings) {
    console.log(`${path.relative(repoRoot, f.file)}: ${f.code} — ${f.message}`);
  }
  if (findings.length === 0) {
    console.log("validate-registry: OK");
  }
  process.exit(ok ? 0 : 1);
}
