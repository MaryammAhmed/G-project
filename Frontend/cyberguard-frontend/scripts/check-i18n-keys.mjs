// Fails (exit 1) when en.json and ar.json do not have the same keys,
// when a value is not a string, or when {placeholders} differ between them.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "lib", "i18n");
const load = (name) => JSON.parse(readFileSync(join(dir, name), "utf8"));

function flatten(obj, prefix = "", out = new Map(), problems = []) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) flatten(value, path, out, problems);
    else if (typeof value === "string") out.set(path, value);
    else problems.push(`${path}: value must be a string`);
  }
  return { out, problems };
}

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");

const en = flatten(load("en.json"));
const ar = flatten(load("ar.json"));
const problems = [...en.problems.map((p) => `en.json ${p}`), ...ar.problems.map((p) => `ar.json ${p}`)];

for (const key of en.out.keys()) if (!ar.out.has(key)) problems.push(`missing in ar.json: ${key}`);
for (const key of ar.out.keys()) if (!en.out.has(key)) problems.push(`extra in ar.json (not in en.json): ${key}`);
for (const [key, enText] of en.out) {
  const arText = ar.out.get(key);
  if (arText !== undefined && placeholders(arText) !== placeholders(enText))
    problems.push(`placeholder mismatch at ${key}: en {${placeholders(enText)}} vs ar {${placeholders(arText)}}`);
}

if (problems.length) {
  console.error(`i18n key check FAILED (${problems.length} problem${problems.length > 1 ? "s" : ""}):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`i18n key check passed: ${en.out.size} keys in en.json and ar.json match.`);
