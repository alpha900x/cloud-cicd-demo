// Build step: copies src/ into dist/ and stamps build metadata so the live page
// can prove which commit the pipeline deployed.
import { cpSync, rmSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "src");
const distDir = join(root, "dist");

if (!existsSync(join(srcDir, "index.html"))) {
  console.error("Build failed: src/index.html not found");
  process.exit(1);
}

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
cpSync(srcDir, distDir, { recursive: true });

const sha = process.env.GITHUB_SHA ?? "local";
const info = {
  commit: sha,
  commitShort: sha.slice(0, 7),
  builtAt: new Date().toISOString(),
  environment: process.env.GITHUB_ACTIONS ? "GitHub Actions" : "local build",
  runId: process.env.GITHUB_RUN_ID ?? null,
};

writeFileSync(join(distDir, "build-info.json"), JSON.stringify(info, null, 2));
// Stops GitHub Pages from running Jekyll over the output.
writeFileSync(join(distDir, ".nojekyll"), "");

console.log(`Built dist/ (${info.commitShort}, ${info.environment})`);
