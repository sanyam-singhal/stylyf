import { expect, type Page } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

type AuthCredentials = {
  email: string;
  password: string;
};

const envCache = new Map<string, string>();
let envLoaded = false;

function parseEnvFile(path: string) {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!envCache.has(key)) envCache.set(key, value);
  }
}

function loadEnvFiles() {
  if (envLoaded) return;
  envLoaded = true;
  for (const candidate of [
    resolve(process.cwd(), ".env.local"),
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env.local"),
    resolve(process.cwd(), "../../.env"),
    join(new URL("../../../..", import.meta.url).pathname, ".env.local"),
    join(new URL("../../../..", import.meta.url).pathname, ".env"),
  ]) {
    parseEnvFile(candidate);
  }
}

function readEnv(key: string) {
  loadEnvFiles();
  return process.env[key] ?? envCache.get(key) ?? "";
}

export function getAuthCredentials(): AuthCredentials | null {
  const email =
    readEnv("STYLYF_BUILDER_TEST_EMAIL") ||
    readEnv("SUPABASE_USER_EMAIL") ||
    readEnv("BUILDER_USER_EMAIL");
  const password =
    readEnv("STYLYF_BUILDER_TEST_PASSWORD") ||
    readEnv("SUPABASE_USER_PASSWORD") ||
    readEnv("BUILDER_USER_PASSWORD");

  if (!email || !password) return null;
  return { email, password };
}

export async function signInThroughApi(page: Page) {
  const credentials = getAuthCredentials();
  if (!credentials) {
    throw new Error("Set STYLYF_BUILDER_TEST_EMAIL/STYLYF_BUILDER_TEST_PASSWORD or SUPABASE_USER_EMAIL/SUPABASE_USER_PASSWORD for authenticated smoke tests.");
  }

  const response = await page.request.post("/api/auth/sign-in/password", {
    data: credentials,
  });
  expect(response.status(), "password sign-in should not expose implementation errors").toBeLessThan(500);
  const result = (await response.json()) as { ok?: boolean; error?: string };
  expect(result.ok, result.error ?? "password sign-in failed").toBe(true);
}

export function installClientErrorGuards(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", error => {
    errors.push(error.message);
  });
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  return () => {
    expect(errors, "page should not emit uncaught client errors").toEqual([]);
  };
}
