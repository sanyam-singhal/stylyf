import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
const repoDir = resolve(rootDir, "..");
const outputDir = resolve(repoDir, "packages/stylyf-cli/src/assets/source");

async function main() {
  await rm(outputDir, { force: true, recursive: true });
  await mkdir(outputDir, { recursive: true });

  await cp(resolve(repoDir, "src/components/registry"), resolve(outputDir, "src/components/registry"), {
    recursive: true,
  });
  await cp(resolve(repoDir, "src/lib/cn.ts"), resolve(outputDir, "src/lib/cn.ts"));
  await cp(resolve(repoDir, "src/app.css"), resolve(outputDir, "src/app.css"));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
