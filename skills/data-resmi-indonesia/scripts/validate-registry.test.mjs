import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateRegistry } from "./validate-registry.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const fixture = (name) => path.join(here, "__fixtures__", name, "aturan");

test("registry lengkap diterima tanpa finding", () => {
  const { ok, findings } = validateRegistry({ aturanDir: fixture("ok") });
  assert.equal(ok, true);
  assert.deepEqual(findings, []);
});

test("field wajib hilang dilaporkan MISSING_FIELD", () => {
  const { ok, findings } = validateRegistry({ aturanDir: fixture("missing-field") });
  assert.equal(ok, false);
  assert.equal(findings[0].code, "MISSING_FIELD");
  assert.match(findings[0].file, /ppn-2026\.json$/);
});

test("JSON rusak dilaporkan JSON_PARSE, bukan crash", () => {
  const { ok, findings } = validateRegistry({ aturanDir: fixture("bad-json") });
  assert.equal(ok, false);
  assert.equal(findings[0].code, "JSON_PARSE");
});

test("bracket bercelah dilaporkan BRACKET_GAP", () => {
  const { findings } = validateRegistry({ aturanDir: fixture("gap") });
  assert.equal(findings[0].code, "BRACKET_GAP");
});

test("bracket tumpang tindih dilaporkan BRACKET_OVERLAP", () => {
  const { findings } = validateRegistry({ aturanDir: fixture("overlap") });
  assert.equal(findings[0].code, "BRACKET_OVERLAP");
});

test("tanpa entri penutup batas_atas null dilaporkan NO_TERMINAL", () => {
  const { findings } = validateRegistry({ aturanDir: fixture("no-terminal") });
  assert.equal(findings[0].code, "NO_TERMINAL");
});

test("jenis daftar dan komponen lolos tanpa cek rentang", () => {
  assert.equal(validateRegistry({ aturanDir: fixture("daftar-ok") }).ok, true);
  assert.equal(validateRegistry({ aturanDir: fixture("komponen-ok") }).ok, true);
});

test("angka tarif di prosa dilaporkan NUMBER_IN_PROSE", () => {
  const prose = [path.join(here, "__fixtures__", "prosa", "aturan", "ppn.md")];
  const { findings } = validateRegistry({
    aturanDir: fixture("prosa"),
    proseFiles: prose,
  });
  assert.equal(findings.some((f) => f.code === "NUMBER_IN_PROSE"), true);
});

test("angka di examples.md tidak dipindai", () => {
  const prose = [path.join(here, "__fixtures__", "prosa", "examples.md")];
  const { findings } = validateRegistry({ aturanDir: fixture("prosa"), proseFiles: prose });
  assert.equal(findings.some((f) => f.code === "NUMBER_IN_PROSE"), false);
});

test("berlaku_dari di masa depan dilaporkan FUTURE_EFFECTIVE", () => {
  const { findings } = validateRegistry({ aturanDir: fixture("future") });
  assert.equal(findings[0].code, "FUTURE_EFFECTIVE");
});

test("diverifikasi_pada tua dilaporkan STALE_VERIFICATION tapi tidak menggagalkan", () => {
  const { ok, findings } = validateRegistry({ aturanDir: fixture("stale") });
  assert.equal(findings[0].code, "STALE_VERIFICATION");
  assert.equal(ok, true);
});

test("beberapa kategori, masing-masing lengkap, diterima", () => {
  assert.equal(validateRegistry({ aturanDir: fixture("multi-kategori-ok") }).ok, true);
});
