#!/usr/bin/env node
/**
 * Validasi semua skill terhadap spesifikasi Agent Skills terbuka.
 * Dipakai di CI agar frontmatter/link yang rusak tidak lolos ke main.
 *
 * Pemakaian:
 *   node scripts/validate-skills.mjs [--root <dir>]
 *
 * Exit 0 jika tidak ada error (warning tidak menggagalkan).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Key frontmatter yang diizinkan spesifikasi Agent Skills (Claude Code memakai daftar ini).
const ALLOWED_KEYS = new Set([
  "name",
  "description",
  "license",
  "compatibility",
  "metadata",
  "allowed-tools",
]);

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_NAME_LENGTH = 64;
const MAX_DESCRIPTION_LENGTH = 1024;
const SOFT_LINE_LIMIT = 500;
const PLACEHOLDER = /\b(TODO|TBD|FIXME|lorem ipsum)\b/i;

/**
 * Parser frontmatter YAML minimal: cukup untuk key skalar dan blok `>` / `|`.
 * Tidak perlu dependensi eksternal.
 */
export function parseFrontmatter(text) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (lines[0] !== "---") {
    return { ok: false, reason: "file tidak diawali '---'" };
  }

  const closing = lines.indexOf("---", 1);
  if (closing === -1) {
    return { ok: false, reason: "frontmatter tidak ditutup '---'" };
  }

  const entries = new Map();
  const raw = lines.slice(1, closing);
  let currentKey = null;

  for (const line of raw) {
    if (line.trim() === "" || line.trimStart().startsWith("#")) continue;

    const match = /^([A-Za-z0-9_-]+):(.*)$/.exec(line);
    if (match) {
      currentKey = match[1];
      const inline = match[2].trim();
      if (inline === ">" || inline === "|") {
        entries.set(currentKey, "");
      } else {
        entries.set(currentKey, stripQuotes(inline));
      }
      continue;
    }

    // Lanjutan blok multiline (indentasi).
    if (currentKey && /^\s+\S/.test(line)) {
      const previous = entries.get(currentKey) ?? "";
      entries.set(currentKey, `${previous} ${line.trim()}`.trim());
    }
  }

  return {
    ok: true,
    keys: [...entries.keys()],
    values: entries,
    body: lines.slice(closing + 1).join("\n"),
  };
}

function stripQuotes(value) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/** Buang blok kode berpagar agar contoh kode tidak diperiksa sebagai link. */
function stripFencedCode(markdown) {
  return markdown.replace(/^[ \t]*```[\s\S]*?^[ \t]*```[ \t]*$/gm, "");
}

/** Kumpulkan link markdown relatif (bukan http/mailto/anchor). */
export function collectRelativeLinks(markdown) {
  const links = [];
  const pattern = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;
  while ((match = pattern.exec(stripFencedCode(markdown))) !== null) {
    const target = match[1];
    if (/^(https?:|mailto:|tel:|#)/i.test(target)) continue;
    if (target.startsWith("data:")) continue;
    links.push(target.split("#")[0]);
  }
  return links;
}

function listMarkdownFiles(directory) {
  const files = [];
  const queue = [directory];
  while (queue.length > 0) {
    const current = queue.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue;
      const target = path.join(current, entry.name);
      if (entry.isDirectory()) queue.push(target);
      else if (entry.isFile() && entry.name.endsWith(".md")) files.push(target);
    }
  }
  return files.sort();
}

export function validateSkills({ root }) {
  const skillsDir = path.join(root, "skills");
  const findings = [];

  if (!existsSync(skillsDir)) {
    return {
      findings: [{ file: skillsDir, code: "MISSING_SKILLS_DIR", message: "direktori skills/ tidak ditemukan" }],
      ok: false,
    };
  }

  const skillDirs = readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort();

  const seenNames = new Map();

  for (const dirName of skillDirs) {
    const skillDir = path.join(skillsDir, dirName);
    const skillFile = path.join(skillDir, "SKILL.md");

    if (!existsSync(skillFile)) {
      findings.push({
        file: skillDir,
        code: "MISSING_SKILL_MD",
        message: `direktori '${dirName}' tidak punya SKILL.md`,
      });
      continue;
    }

    const text = readFileSync(skillFile, "utf8");
    const parsed = parseFrontmatter(text);

    if (!parsed.ok) {
      findings.push({ file: skillFile, code: "BAD_FRONTMATTER", message: parsed.reason });
      continue;
    }

    for (const key of parsed.keys) {
      if (!ALLOWED_KEYS.has(key)) {
        findings.push({
          file: skillFile,
          code: "UNKNOWN_KEY",
          message: `key frontmatter '${key}' tidak standar (diizinkan: ${[...ALLOWED_KEYS].join(", ")})`,
        });
      }
    }

    const name = parsed.values.get("name");
    if (!name) {
      findings.push({ file: skillFile, code: "MISSING_NAME", message: "frontmatter wajib punya 'name'" });
    } else {
      if (!NAME_PATTERN.test(name)) {
        findings.push({
          file: skillFile,
          code: "BAD_NAME",
          message: `name '${name}' harus kebab-case (huruf kecil, angka, tanda hubung)`,
        });
      }
      if (name.length > MAX_NAME_LENGTH) {
        findings.push({
          file: skillFile,
          code: "NAME_TOO_LONG",
          message: `name ${name.length} karakter, maksimum ${MAX_NAME_LENGTH}`,
        });
      }
      if (name !== dirName) {
        findings.push({
          file: skillFile,
          code: "NAME_MISMATCH",
          message: `name '${name}' tidak sama dengan nama direktori '${dirName}'`,
        });
      }
      if (seenNames.has(name)) {
        findings.push({
          file: skillFile,
          code: "DUPLICATE_NAME",
          message: `name '${name}' juga dipakai ${seenNames.get(name)}`,
        });
      } else {
        seenNames.set(name, path.relative(root, skillFile));
      }
    }

    const description = parsed.values.get("description");
    if (!description) {
      findings.push({
        file: skillFile,
        code: "MISSING_DESCRIPTION",
        message: "frontmatter wajib punya 'description'",
      });
    } else {
      if (description.length > MAX_DESCRIPTION_LENGTH) {
        findings.push({
          file: skillFile,
          code: "DESCRIPTION_TOO_LONG",
          message: `description ${description.length} karakter, maksimum ${MAX_DESCRIPTION_LENGTH}`,
        });
      }
      if (PLACEHOLDER.test(description)) {
        findings.push({
          file: skillFile,
          code: "PLACEHOLDER_TEXT",
          message: "description masih memuat placeholder",
        });
      }
      if (!/^use when/i.test(description)) {
        findings.push({
          file: skillFile,
          code: "DESCRIPTION_STYLE",
          message: "description sebaiknya diawali 'Use when ...' agar agent tahu kapan memuat skill",
          severity: "warning",
        });
      }
    }

    const bodyLines = parsed.body.split("\n");
    if (!/^#\s+\S/m.test(parsed.body)) {
      findings.push({ file: skillFile, code: "MISSING_TITLE", message: "body wajib punya heading H1" });
    }
    if (bodyLines.length > SOFT_LINE_LIMIT) {
      findings.push({
        file: skillFile,
        code: "SKILL_TOO_LARGE",
        message: `${bodyLines.length} baris — pertimbangkan progressive disclosure ke references/ (disarankan ≤ ${SOFT_LINE_LIMIT})`,
        severity: "warning",
      });
    }
    if (PLACEHOLDER.test(parsed.body)) {
      findings.push({
        file: skillFile,
        code: "PLACEHOLDER_TEXT",
        message: "body masih memuat penanda placeholder",
        severity: "warning",
      });
    }

    for (const markdownFile of listMarkdownFiles(skillDir)) {
      const content = readFileSync(markdownFile, "utf8");
      for (const link of collectRelativeLinks(content)) {
        const target = path.resolve(path.dirname(markdownFile), link);
        if (!existsSync(target)) {
          findings.push({
            file: markdownFile,
            code: "BROKEN_LINK",
            message: `link relatif '${link}' tidak ditemukan`,
          });
        } else if (statSync(target).isDirectory()) {
          findings.push({
            file: markdownFile,
            code: "BROKEN_LINK",
            message: `link relatif '${link}' menunjuk direktori, bukan berkas`,
          });
        }
      }
    }
  }

  return { findings, ok: findings.every((f) => f.severity === "warning") };
}

const here = path.dirname(fileURLToPath(import.meta.url));

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const rootIdx = process.argv.indexOf("--root");
  const root =
    rootIdx !== -1 && process.argv[rootIdx + 1] ? path.resolve(process.argv[rootIdx + 1]) : path.resolve(here, "..");

  const { findings, ok } = validateSkills({ root });

  for (const finding of findings) {
    const label = finding.severity === "warning" ? "WARN" : "FAIL";
    console.log(`${label} ${path.relative(root, finding.file)}: ${finding.code} — ${finding.message}`);
  }
  if (findings.length === 0) {
    console.log("validate-skills: OK");
  }
  process.exit(ok ? 0 : 1);
}
