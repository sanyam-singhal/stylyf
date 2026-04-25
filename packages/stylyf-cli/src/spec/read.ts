import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateSpecV10 } from "./validate.js";

export async function readSpecV10(specPath: string) {
  const resolvedPath = resolve(process.cwd(), specPath);
  const source = await readFile(resolvedPath, "utf8");
  return {
    path: resolvedPath,
    spec: validateSpecV10(JSON.parse(source)),
  };
}
