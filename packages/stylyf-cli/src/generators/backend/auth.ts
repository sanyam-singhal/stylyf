import type { AppIR } from "../../ir/types.js";

export function renderGeneratedAuthModule(app: AppIR) {
  const emailPasswordEnabled = app.auth?.features?.emailPassword ?? true;

  return [
    'import { betterAuth } from "better-auth";',
    'import { drizzleAdapter } from "better-auth/adapters/drizzle";',
    'import { db } from "~/lib/db";',
    'import { env } from "~/lib/env";',
    "",
    "export const auth = betterAuth({",
    "  secret: env.BETTER_AUTH_SECRET,",
    "  baseURL: env.BETTER_AUTH_URL,",
    "  database: drizzleAdapter(db, {",
    '    provider: "pg",',
    "  }),",
    "  emailAndPassword: {",
    `    enabled: ${emailPasswordEnabled ? "true" : "false"},`,
    "  },",
    "});",
    "",
  ].join("\n");
}

export function renderGeneratedAuthClientModule() {
  return [
    'import { createAuthClient } from "better-auth/solid";',
    "",
    "export const authClient = createAuthClient();",
    "export const { signIn, signUp, signOut, useSession } = authClient;",
    "",
  ].join("\n");
}

export function renderGeneratedAuthHandlerRoute() {
  return [
    'import { toSolidStartHandler } from "better-auth/solid-start";',
    'import { auth } from "~/lib/auth";',
    "",
    "export const { GET, POST } = toSolidStartHandler(auth);",
    "",
  ].join("\n");
}

export function renderGeneratedAuthGuards() {
  return [
    'import { redirect } from "@solidjs/router";',
    'import { getRequestEvent } from "solid-js/web";',
    'import { auth } from "~/lib/auth";',
    "",
    "export async function getSession() {",
    "  const event = getRequestEvent();",
    "  return auth.api.getSession({",
    "    headers: event?.request.headers ?? new Headers(),",
    "  });",
    "}",
    "",
    "export async function requireSession(options?: { redirectTo?: string }) {",
    "  const session = await getSession();",
    "  if (!session) {",
    '    throw redirect(options?.redirectTo ?? "/login");',
    "  }",
    "  return session;",
    "}",
    "",
    "export async function requireAnonymous(options?: { redirectTo?: string }) {",
    "  const session = await getSession();",
    "  if (session) {",
    '    throw redirect(options?.redirectTo ?? "/");',
    "  }",
    "  return null;",
    "}",
    "",
  ].join("\n");
}
