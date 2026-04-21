import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const packageDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(packageDir, "..");
const distDir = resolve(rootDir, "dist");
const srcDir = resolve(rootDir, "src");

async function main() {
  await rm(distDir, { force: true, recursive: true });
  await execFileAsync("tsc", ["-p", "tsconfig.build.json"], {
    cwd: rootDir,
  });

  await mkdir(resolve(distDir, "manifests"), { recursive: true });

  for (const assetDirectory of ["manifests/generated", "templates", "assets"]) {
    const source = resolve(srcDir, assetDirectory);
    const destination = resolve(distDir, assetDirectory);

    try {
      await cp(source, destination, { recursive: true });
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
        throw error;
      }
    }
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
