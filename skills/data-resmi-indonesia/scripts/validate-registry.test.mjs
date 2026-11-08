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
