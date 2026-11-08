#!/usr/bin/env node
/**
 * Memeriksa kesegaran registry aturan berperiode di semua skill.
 *
 * Aturan dianggap perlu diverifikasi ulang bila:
 *  - `diverifikasi_pada` lebih tua dari --max-age-days (default 180), atau
 *  - `berlaku_sampai` sudah lewat.
 *
 * Pemakaian:
 *   node scripts/check-freshness.mjs [--root <dir>] [--max-age-days 180] [--today YYYY-MM-DD]
 *
 * Output: laporan markdown ke stdout.
 * Exit 0 = semua segar, 1 = ada yang perlu diverifikasi ulang.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DAY_MS = 86_400_000;

function parseArgs(argv) {
  const options = { root: null, maxAgeDays: 180, today: new Date() };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--root") options.root = argv[++i];
    else if (arg === "--max-age-days") options.maxAgeDays = Number(argv[++i]);
    else if (arg === "--today") options.today = new Date(`${argv[++i]}T00:00:00Z`);
  }
  return options;
}

function collectRegistryFiles(root) {
  const skillsDir = path.join(root, "skills");
  const files = [];
  if (!existsSync(skillsDir)) return files;

  for (const skill of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!skill.isDirectory() || skill.name.startsWith(".")) continue;
    const aturanDir = path.join(skillsDir, skill.name, "references", "aturan");
    if (!existsSync(aturanDir)) continue;
    for (const name of readdirSync(aturanDir)) {
      if (name.endsWith(".json")) files.push(path.join(aturanDir, name));
    }
  }
  return files.sort();
}

export function checkFreshness({ root, maxAgeDays = 180, today = new Date() }) {
  const findings = [];

  for (const file of collectRegistryFiles(root)) {
    let data;
    try {
      data = JSON.parse(readFileSync(file, "utf8"));
    } catch (error) {
      findings.push({ file, aturan: null, code: "JSON_PARSE", message: error.message });
      continue;
    }

    const label = data.aturan ?? path.basename(file);

    const verifiedAt = data.diverifikasi_pada ? new Date(`${data.diverifikasi_pada}T00:00:00Z`) : null;
    if (verifiedAt && !Number.isNaN(verifiedAt.valueOf())) {
      const ageDays = Math.floor((today.valueOf() - verifiedAt.valueOf()) / DAY_MS);
      if (ageDays > maxAgeDays) {
        findings.push({
          file,
          aturan: label,
          code: "STALE_VERIFICATION",
          message: `diverifikasi_pada ${data.diverifikasi_pada} (${ageDays} hari lalu, batas ${maxAgeDays})`,
        });
      }
    }

    const validUntil = data.berlaku_sampai ? new Date(`${data.berlaku_sampai}T00:00:00Z`) : null;
    if (validUntil && !Number.isNaN(validUntil.valueOf()) && validUntil < today) {
      findings.push({
        file,
        aturan: label,
        code: "EXPIRED",
        message: `berlaku_sampai ${data.berlaku_sampai} sudah lewat`,
      });
    }
  }

  return { findings, ok: findings.length === 0 };
}

export function renderReport({ findings, maxAgeDays, today, root }) {
  const date = today.toISOString().slice(0, 10);
  const lines = [
    "# Registry aturan perlu diverifikasi ulang",
    "",
    `- Tanggal pemeriksaan: **${date}**`,
    `- Batas umur verifikasi: **${maxAgeDays} hari**`,
    `- Temuan: **${findings.length}**`,
    "",
    "| Berkas | Aturan | Kode | Keterangan |",
    "| --- | --- | --- | --- |",
  ];

  for (const finding of findings) {
    const relative = path.relative(root, finding.file);
    lines.push(`| \`${relative}\` | ${finding.aturan ?? "-"} | ${finding.code} | ${finding.message} |`);
  }

  lines.push(
    "",
    "## Cara memperbaiki",
    "",
    "1. Buka sumber resmi yang tercantum di `sumber` pada berkas JSON terkait.",
    "2. Perbarui angka bila berubah, lalu perbarui `diverifikasi_pada`.",
    "3. Jika aturan sudah tidak berlaku, tambahkan `berlaku_sampai` atau hapus berkasnya.",
    "4. Jalankan `node skills/data-resmi-indonesia/scripts/validate-registry.mjs` sampai exit 0.",
    "",
  );

  return lines.join("\n");
}

const here = path.dirname(fileURLToPath(import.meta.url));

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  const root = options.root ? path.resolve(options.root) : path.resolve(here, "..");

  const result = checkFreshness({ root, maxAgeDays: options.maxAgeDays, today: options.today });

  if (result.ok) {
    console.log(`check-freshness: OK (semua aturan terverifikasi ≤ ${options.maxAgeDays} hari)`);
    process.exit(0);
  }

  console.log(renderReport({ ...result, maxAgeDays: options.maxAgeDays, today: options.today, root }));
  process.exit(1);
}
