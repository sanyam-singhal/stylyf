import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname } from "node:path";

function assetUrl(relativePath: string) {
  return new URL(`../assets/source/${relativePath}`, import.meta.url);
}

export async function readBundledSourceFile(relativePath: string) {
  return readFile(assetUrl(relativePath), "utf8");
}

export async function bundledSourcePathExists(relativePath: string) {
  try {
    await access(assetUrl(relativePath), constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function writeGeneratedFile(targetPath: string, content: string) {
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, content);
}
