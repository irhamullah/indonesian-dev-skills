#!/usr/bin/env node
/**
 * Installer Indonesian Developer Skills untuk berbagai AI agent.
 *
 *   npx indonesian-dev-skills list
 *   npx indonesian-dev-skills install --agent claude
 *   npx indonesian-dev-skills install --agent all --link
 *
 * Tanpa dependensi eksternal.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_SOURCE = path.join(PACKAGE_ROOT, "skills");

const AGENTS = {
  claude: { label: "Claude Code", global: "~/.claude/skills", project: ".claude/skills" },
  codex: { label: "OpenAI Codex", global: "~/.codex/skills", project: ".codex/skills" },
  cursor: { label: "Cursor", global: "~/.agents/skills", project: ".cursor/skills" },
  gemini: { label: "Gemini CLI", global: "~/.agents/skills", project: ".agents/skills" },
  vscode: { label: "VS Code", global: null, project: ".github/skills" },
  opencode: { label: "OpenCode", global: "~/.config/opencode/skills", project: ".opencode/skills" },
  universal: { label: "Universal (~/.agents/skills)", global: "~/.agents/skills", project: ".agents/skills" },
};

const POST_INSTALL = {
  claude: "Jalankan `/skills` di Claude Code untuk memastikan skill terdeteksi.",
  codex: "Skill dibaca otomatis dari ~/.codex/skills.",
  cursor: "Restart Cursor, lalu sebut nama skill di chat.",
  gemini: "Skill dibaca otomatis dari ~/.agents/skills.",
  vscode: "Skill dibaca otomatis dari .github/skills di repo proyek.",
  opencode:
    "Opsional: tambahkan tabel routing dari AGENTS.md ke ~/.config/opencode/AGENTS.md, lalu restart OpenCode.",
  universal: "Folder ~/.agents/skills dibaca oleh Cursor, Gemini CLI, dan OpenCode.",
};

function expandHome(target) {
  return target.startsWith("~/") ? path.join(os.homedir(), target.slice(2)) : target;
}

function readPackage() {
  return JSON.parse(readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8"));
}

function listSkills() {
  if (!existsSync(SKILLS_SOURCE)) return [];
  return readdirSync(SKILLS_SOURCE, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(SKILLS_SOURCE, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
}

function printHelp() {
  console.log(`Indonesian Developer Skills

Pemakaian:
  indonesian-dev-skills list
  indonesian-dev-skills install --agent <agent> [opsi]

Agent:
${Object.entries(AGENTS)
  .map(([key, agent]) => `  ${key.padEnd(10)} ${agent.label}`)
  .join("\n")}

Opsi install:
  --agent <agent>   Agent tujuan (wajib). Gunakan "all" untuk semua agent.
  --global          Pasang di direktori global pengguna (default).
  --project         Pasang di direktori proyek saat ini.
  --dir <path>      Tujuan khusus, menimpa --global/--project.
  --link            Symlink, bukan salin — ikut update saat repo di-pull.
  --force           Timpa skill yang sudah ada.
  --dry-run         Tampilkan rencana tanpa menulis apa pun.

Contoh:
  npx indonesian-dev-skills install --agent claude
  npx indonesian-dev-skills install --agent opencode --link
  npx indonesian-dev-skills install --agent all --force`);
}

function parseArgs(argv) {
  const options = { command: argv[0] ?? "help", agent: null, scope: null, dir: null, link: false, force: false, dryRun: false };
  for (let i = 1; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--agent") options.agent = argv[++i];
    else if (arg === "--global") options.scope = "global";
    else if (arg === "--project") options.scope = "project";
    else if (arg === "--dir") options.dir = argv[++i];
    else if (arg === "--link") options.link = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--help" || arg === "-h") options.command = "help";
    else if (arg === "--version" || arg === "-v") options.command = "version";
    else {
      console.error(`Argumen tidak dikenal: ${arg}`);
      process.exit(2);
    }
  }
  return options;
}

function resolveTargets(options) {
  if (options.dir) {
    return [{ key: "custom", label: "Custom", root: path.resolve(options.dir) }];
  }

  const requested = options.agent === "all" ? Object.keys(AGENTS) : [options.agent];
  const scope = options.scope ?? "global";
  const targets = new Map();

  for (const key of requested) {
    const agent = AGENTS[key];
    if (!agent) {
      console.error(`Agent '${key}' tidak dikenal. Pilihan: ${Object.keys(AGENTS).join(", ")}, all`);
      process.exit(2);
    }
    const configured = scope === "project" ? agent.project : agent.global;

    if (!configured) {
      if (options.scope === "global") {
        console.error(`${agent.label} hanya mendukung --project (tidak ada direktori global).`);
        process.exit(2);
      }
      if (options.agent === "all") {
        console.log(`ℹ️  ${agent.label} dilewati: tidak punya direktori global, pakai --agent ${key} --project.`);
        continue;
      }
    }

    const destination = configured ?? agent.project;
    const root = path.resolve(expandHome(destination));
    if (!targets.has(root)) targets.set(root, { key, label: agent.label, root });
  }

  return [...targets.values()];
}

function installSkill(skillName, targetRoot, options) {
  const source = path.join(SKILLS_SOURCE, skillName);
  const destination = path.join(targetRoot, skillName);

  if (existsSync(destination) && !options.force) {
    return { skillName, destination, status: "dilewati (sudah ada, pakai --force)" };
  }
  if (options.dryRun) {
    return { skillName, destination, status: options.link ? "rencana symlink" : "rencana salin" };
  }

  mkdirSync(targetRoot, { recursive: true });
  if (existsSync(destination)) rmSync(destination, { recursive: true, force: true });

  if (options.link) {
    symlinkSync(source, destination, process.platform === "win32" ? "junction" : "dir");
    return { skillName, destination, status: "symlink" };
  }

  cpSync(source, destination, { recursive: true });
  return { skillName, destination, status: "disalin" };
}

function runInstall(options) {
  if (!options.agent) {
    console.error("--agent wajib diisi. Jalankan `indonesian-dev-skills list` untuk melihat pilihan.");
    process.exit(2);
  }

  const skills = listSkills();
  if (skills.length === 0) {
    console.error(`Tidak ada skill ditemukan di ${SKILLS_SOURCE}`);
    process.exit(1);
  }

  const targets = resolveTargets(options);
  let failures = 0;

  for (const target of targets) {
    console.log(`\n${target.label} → ${target.root}`);
    for (const skillName of skills) {
      try {
        const result = installSkill(skillName, target.root, options);
        console.log(`  ${result.skillName.padEnd(32)} ${result.status}`);
      } catch (error) {
        failures++;
        console.error(`  ${skillName.padEnd(32)} GAGAL: ${error.message}`);
      }
    }
    const note = POST_INSTALL[target.key];
    if (note) console.log(`  ℹ️  ${note}`);
  }

  if (options.dryRun) console.log("\n(dry-run — tidak ada berkas yang ditulis)");
  process.exit(failures > 0 ? 1 : 0);
}

function runList() {
  const skills = listSkills();
  console.log(`${skills.length} skill tersedia:\n`);
  for (const name of skills) {
    const file = path.join(SKILLS_SOURCE, name, "SKILL.md");
    const text = readFileSync(file, "utf8");
    const description = /^description:\s*(.+)$/m.exec(text)?.[1] ?? "";
    console.log(`  ${name}`);
    console.log(`    ${description.slice(0, 140)}${description.length > 140 ? "…" : ""}\n`);
  }
}

const options = parseArgs(process.argv.slice(2));

if (options.command === "list") runList();
else if (options.command === "install") runInstall(options);
else if (options.command === "version") console.log(readPackage().version);
else printHelp();
