import { existsSync, readdirSync, readFileSync } from "node:fs";
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

    checkDates(data, file, findings);
  }

  scanProse(proseFiles, findings);

  return { findings, ok: findings.every((f) => f.severity === "warning") };
}

function checkDates(data, file, findings) {
  const effective = data.berlaku_dari ? Date.parse(data.berlaku_dari) : NaN;
  if (!Number.isNaN(effective) && effective > Date.now()) {
    findings.push({
      file,
      code: "FUTURE_EFFECTIVE",
      message: `berlaku_dari '${data.berlaku_dari}' berada di masa depan`,
      severity: "error",
    });
  }

  const verified = data.diverifikasi_pada ? Date.parse(data.diverifikasi_pada) : NaN;
  if (!Number.isNaN(verified) && Date.now() - verified > 400 * 86_400_000) {
    findings.push({
      file,
      code: "STALE_VERIFICATION",
      message: `diverifikasi_pada '${data.diverifikasi_pada}' lebih dari 400 hari lalu — perlu verifikasi ulang`,
      severity: "warning",
    });
  }
}

const NUMBER_IN_PROSE = /\b\d+(?:[.,]\d+)?\s*%|\bRp\s?\d/;

function scanProse(proseFiles, findings) {
  for (const file of proseFiles) {
    if (path.basename(file) === "examples.md") continue;

    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const lines = text.split(/\r?\n/);
    let inFence = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (inFence) continue;
      if (/\]\(/.test(line)) continue;
      if (/\*\*Files:\*\*/.test(line)) continue;

      if (NUMBER_IN_PROSE.test(line)) {
        findings.push({
          file,
          code: "NUMBER_IN_PROSE",
          message: `baris ${i + 1}: angka aturan di prosa — pindahkan ke JSON registry (${line.trim().slice(0, 80)})`,
          severity: "error",
        });
      }
    }
  }
}

function checkBracket(data, file, findings) {
  const kategori =
    data.kategori !== null && typeof data.kategori === "object" && !Array.isArray(data.kategori)
      ? data.kategori
      : {};
  const names = Object.keys(kategori);
  if (names.length === 0) {
    findings.push({
      file,
      code: "MISSING_FIELD",
      message: "jenis 'bracket' wajib punya objek 'kategori'",
    });
    return;
  }

  // Tiap kategori adalah jadwal lengkap yang berdiri sendiri (mis. TER A/B/C),
  // jadi kontinuitas dicek per kategori — bukan digabung lintas kategori.
  for (const kode of names) {
    const arr = kategori[kode];
    if (!Array.isArray(arr)) {
      findings.push({
        file,
        code: "MISSING_FIELD",
        message: `kategori '${kode}' wajib array entri bracket`,
      });
      continue;
    }
    checkBracketSeries(arr, file, kode, findings);
  }
}

function checkBracketSeries(arr, file, kode, findings) {
  const ceilings = arr.map((e) => (e && e.batas_atas !== undefined ? e.batas_atas : null));

  // Cakupan tutup lebih awal: null di tengah berarti tier berhenti sebelum entri
  // terakhir, sehingga nilai di atasnya tidak punya tier (celah).
  for (let i = 0; i < ceilings.length; i++) {
    if (ceilings[i] === null && i !== ceilings.length - 1) {
      findings.push({
        file,
        code: "BRACKET_GAP",
        message: `kategori '${kode}': batas_atas null pada posisi ${i + 1} dari ${ceilings.length} — rentang tertutup lebih awal, ada celah di atasnya`,
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
        message: `kategori '${kode}': batas_atas ${numeric[i]} tidak lebih besar dari ${numeric[i - 1]} — tumpang tindih`,
      });
      break;
    }
  }

  if (ceilings.length === 0 || ceilings[ceilings.length - 1] !== null) {
    findings.push({
      file,
      code: "NO_TERMINAL",
      message: `kategori '${kode}': entri terakhir wajib batas_atas null (penutup rentang)`,
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

  const proseFiles = [];
  const skillMd = path.join(repoRoot, "skills", "data-resmi-indonesia", "SKILL.md");
  if (existsSync(skillMd)) proseFiles.push(skillMd);
  try {
    for (const name of readdirSync(aturanDir)) {
      if (name.endsWith(".md")) proseFiles.push(path.join(aturanDir, name));
    }
  } catch {
    // references/aturan belum ada — belum ada registry, tidak ada prosa aturan
  }

  const { findings, ok } = validateRegistry({ aturanDir, proseFiles });

  for (const f of findings) {
    const label = f.severity === "warning" ? "WARN" : "FAIL";
    console.log(`${label} ${path.relative(repoRoot, f.file)}: ${f.code} — ${f.message}`);
  }
  if (findings.length === 0) {
    console.log("validate-registry: OK");
  }
  process.exit(ok ? 0 : 1);
}
