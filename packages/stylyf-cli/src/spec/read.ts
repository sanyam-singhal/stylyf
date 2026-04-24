import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { validateSpecV04 } from "./validate.js";

export async function readSpecV04(specPath: string) {
  const resolvedPath = resolve(process.cwd(), specPath);
  const source = await readFile(resolvedPath, "utf8");
  return {
    path: resolvedPath,
    spec: validateSpecV04(JSON.parse(source)),
  };
}
