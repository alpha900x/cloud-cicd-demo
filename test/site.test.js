// Smoke tests for the site itself: if these fail, the pipeline stops before deploying a broken page.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const html = readFileSync(join(src, "index.html"), "utf8");

test("index.html has a doctype, language and title", () => {
  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="en">/);
  assert.match(html, /<title>[^<]+<\/title>/);
});

test("every local asset referenced by index.html exists", () => {
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((ref) => !/^(https?:)?\/\//.test(ref) && !ref.startsWith("#"));
  assert.ok(refs.length > 0, "expected at least one local asset");
  for (const ref of refs) assert.ok(existsSync(join(src, ref)), `missing asset: ${ref}`);
});

test("asset paths are relative so the site works under /<repo-name>/ on GitHub Pages", () => {
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) assert.ok(!ref.startsWith("/") || ref.startsWith("//"), `absolute path: ${ref}`);
});

test("element ids used by app.js exist in index.html", () => {
  const js = readFileSync(join(src, "app.js"), "utf8");
  const ids = [...js.matchAll(/getElementById\("([^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(ids.length > 0);
  for (const id of ids) assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
});
