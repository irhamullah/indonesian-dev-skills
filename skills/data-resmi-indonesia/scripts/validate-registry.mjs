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
    }
  }

  return { findings, ok: findings.length === 0 };
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
