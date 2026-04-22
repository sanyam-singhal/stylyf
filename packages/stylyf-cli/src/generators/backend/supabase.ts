import type { AppIR, DatabaseColumnType, DatabaseSchemaIR } from "../../ir/types.js";

function postgresType(type: DatabaseColumnType) {
  switch (type) {
    case "text":
      return "text";
    case "varchar":
      return "text";
    case "integer":
      return "integer";
    case "boolean":
      return "boolean";
    case "timestamp":
      return "timestamptz";
    case "jsonb":
      return "jsonb";
    case "uuid":
      return "uuid";
    default:
      return "text";
  }
}

function renderSqlColumn(column: DatabaseSchemaIR["columns"][number]) {
  const parts = [`"${column.name}" ${postgresType(column.type)}`];

  if (column.primaryKey) {
    parts.push("primary key");
  }

  if (column.unique) {
    parts.push("unique");
  }

  if (!column.nullable && !column.primaryKey) {
    parts.push("not null");
  }

  return `  ${parts.join(" ")}`;
}

function renderSqlTable(table: DatabaseSchemaIR) {
  const columns = table.columns.map(renderSqlColumn);

  if (table.timestamps) {
    columns.push(
      '  "created_at" timestamptz not null default timezone(\'utc\'::text, now())',
      '  "updated_at" timestamptz not null default timezone(\'utc\'::text, now())',
    );
  }

  return [`create table if not exists public."${table.table}" (`, columns.join(",\n"), ");", ""].join("\n");
}

export function renderGeneratedSupabaseBrowserModule() {
  return [
    'import { createBrowserClient } from "@supabase/ssr";',
    'import { publicEnv } from "~/lib/env";',
    "",
    "let browserClient: ReturnType<typeof createBrowserClient> | undefined;",
    "",
    "export function createSupabaseBrowserClient() {",
    "  if (!browserClient) {",
    "    browserClient = createBrowserClient(",
    "      publicEnv.VITE_SUPABASE_URL,",
    "      publicEnv.VITE_SUPABASE_PUBLISHABLE_KEY,",
    "    );",
    "  }",
    "",
    "  return browserClient;",
    "}",
    "",
  ].join("\n");
}

export function renderGeneratedSupabaseServerModule() {
  return [
    'import { createServerClient } from "@supabase/ssr";',
    'import { createClient, type SupabaseClient } from "@supabase/supabase-js";',
    'import { deleteCookie, getEvent, parseCookies, setCookie, setHeader, type HTTPEvent } from "vinxi/http";',
    'import { env } from "~/lib/env";',
    "",
    "function readCookies(event: HTTPEvent) {",
    "  const cookies = parseCookies(event) ?? {};",
    "  return Object.entries(cookies).map(([name, value]) => ({ name, value }));",
    "}",
    "",
    "function writeCookies(event: HTTPEvent, cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }>, headers: Record<string, string>) {",
    "  for (const [name, value] of Object.entries(headers)) {",
    "    setHeader(event, name, value);",
    "  }",
    "",
    "  for (const { name, value, options } of cookiesToSet) {",
    '    if (typeof options.maxAge === "number" && options.maxAge <= 0) {',
    "      deleteCookie(event, name, options);",
    "      continue;",
    "    }",
    "",
    "    setCookie(event, name, value, options);",
    "  }",
    "}",
    "",
    "export function createSupabaseServerClient(event: HTTPEvent = getEvent()) {",
    "  return createServerClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {",
    "    cookies: {",
    "      getAll() {",
    "        return readCookies(event);",
    "      },",
    "      setAll(cookiesToSet, headers) {",
    "        writeCookies(event, cookiesToSet, headers);",
    "      },",
    "    },",
    "  });",
    "}",
    "",
    "export function createSupabaseAdminClient(): SupabaseClient {",
    "  return createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {",
    "    auth: {",
    "      persistSession: false,",
    "      autoRefreshToken: false,",
    "      detectSessionInUrl: false,",
    "    },",
    "  });",
    "}",
    "",
  ].join("\n");
}

export function renderGeneratedSupabaseAuthModule(app: AppIR) {
  const emailPasswordEnabled = app.auth?.features?.emailPassword ?? true;
  const emailOtpEnabled = app.auth?.features?.emailOtp ?? true;

  return [
    'import { redirect } from "@solidjs/router";',
    'import type { EmailOtpType } from "@supabase/supabase-js";',
    'import { env } from "~/lib/env";',
    'import { createSupabaseAdminClient, createSupabaseServerClient } from "~/lib/supabase";',
    "",
    "export async function getSession() {",
    "  const supabase = createSupabaseServerClient();",
    "  const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] = await Promise.all([",
    "    supabase.auth.getSession(),",
    "    supabase.auth.getUser(),",
    "  ]);",
    "",
    "  if (sessionError) throw sessionError;",
    "  if (userError) throw userError;",
    "",
    "  if (!userData.user) return null;",
    "",
    "  return {",
    "    session: sessionData.session,",
    "    user: userData.user,",
    "  };",
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
    "export function createAuthAdminClient() {",
    "  return createSupabaseAdminClient();",
    "}",
    "",
    "export async function signUpWithPassword(input: { email: string; password: string; metadata?: Record<string, unknown> }) {",
    `  if (!${emailPasswordEnabled ? "true" : "false"}) {`,
    '    throw new Error("Email/password auth is disabled in this Stylyf scaffold.");',
    "  }",
    "",
    "  const supabase = createSupabaseServerClient();",
    "  return supabase.auth.signUp({",
    "    email: input.email,",
    "    password: input.password,",
    "    options: input.metadata ? { data: input.metadata } : undefined,",
    "  });",
    "}",
    "",
    "export async function signInWithPassword(input: { email: string; password: string }) {",
    `  if (!${emailPasswordEnabled ? "true" : "false"}) {`,
    '    throw new Error("Email/password auth is disabled in this Stylyf scaffold.");',
    "  }",
    "",
    "  const supabase = createSupabaseServerClient();",
    "  return supabase.auth.signInWithPassword({",
    "    email: input.email,",
    "    password: input.password,",
    "  });",
    "}",
    "",
    "export async function requestEmailOtp(input: { email: string; shouldCreateUser?: boolean; emailRedirectTo?: string }) {",
    `  if (!${emailOtpEnabled ? "true" : "false"}) {`,
    '    throw new Error("Email OTP auth is disabled in this Stylyf scaffold.");',
    "  }",
    "",
    "  const supabase = createSupabaseServerClient();",
    "  return supabase.auth.signInWithOtp({",
    "    email: input.email,",
    "    options: {",
    "      shouldCreateUser: input.shouldCreateUser ?? true,",
    '      emailRedirectTo: input.emailRedirectTo ?? `${env.APP_BASE_URL.replace(/\\/$/, "")}/auth/callback`,',
    "    },",
    "  });",
    "}",
    "",
    'export async function verifyEmailOtp(input: { email?: string; token?: string; tokenHash?: string; type?: EmailOtpType }) {',
    "  const supabase = createSupabaseServerClient();",
    '  const type = input.type ?? "email";',
    "  if (input.tokenHash) {",
    "    return supabase.auth.verifyOtp({",
    "      token_hash: input.tokenHash,",
    "      type,",
    "    });",
    "  }",
    "",
    "  if (!input.email || !input.token) {",
    '    throw new Error("verifyEmailOtp requires either tokenHash or both email and token.");',
    "  }",
    "",
    "  return supabase.auth.verifyOtp({",
    "    email: input.email,",
    "    token: input.token,",
    "    type,",
    "  });",
    "}",
    "",
    "export async function signOut() {",
    "  const supabase = createSupabaseServerClient();",
    "  return supabase.auth.signOut();",
    "}",
    "",
  ].join("\n");
}

export function renderGeneratedSupabaseAuthClientModule(app: AppIR) {
  const emailPasswordEnabled = app.auth?.features?.emailPassword ?? true;
  const emailOtpEnabled = app.auth?.features?.emailOtp ?? true;

  return [
    'import type { EmailOtpType } from "@supabase/supabase-js";',
    'import { createSupabaseBrowserClient } from "~/lib/supabase-browser";',
    "",
    "export function authClient() {",
    "  return createSupabaseBrowserClient();",
    "}",
    "",
    "export async function signUpWithPassword(input: { email: string; password: string; metadata?: Record<string, unknown> }) {",
    `  if (!${emailPasswordEnabled ? "true" : "false"}) {`,
    '    throw new Error("Email/password auth is disabled in this Stylyf scaffold.");',
    "  }",
    "",
    "  return createSupabaseBrowserClient().auth.signUp({",
    "    email: input.email,",
    "    password: input.password,",
    "    options: input.metadata ? { data: input.metadata } : undefined,",
    "  });",
    "}",
    "",
    "export async function signInWithPassword(input: { email: string; password: string }) {",
    `  if (!${emailPasswordEnabled ? "true" : "false"}) {`,
    '    throw new Error("Email/password auth is disabled in this Stylyf scaffold.");',
    "  }",
    "",
    "  return createSupabaseBrowserClient().auth.signInWithPassword(input);",
    "}",
    "",
    "export async function requestEmailOtp(input: { email: string; shouldCreateUser?: boolean; emailRedirectTo?: string }) {",
    `  if (!${emailOtpEnabled ? "true" : "false"}) {`,
    '    throw new Error("Email OTP auth is disabled in this Stylyf scaffold.");',
    "  }",
    "",
    "  return createSupabaseBrowserClient().auth.signInWithOtp({",
    "    email: input.email,",
    "    options: {",
    "      shouldCreateUser: input.shouldCreateUser ?? true,",
    "      emailRedirectTo: input.emailRedirectTo,",
    "    },",
    "  });",
    "}",
    "",
    'export async function verifyEmailOtp(input: { email?: string; token?: string; tokenHash?: string; type?: EmailOtpType }) {',
    '  const type = input.type ?? "email";',
    "  if (input.tokenHash) {",
    "    return createSupabaseBrowserClient().auth.verifyOtp({",
    "      token_hash: input.tokenHash,",
    "      type,",
    "    });",
    "  }",
    "",
    "  if (!input.email || !input.token) {",
    '    throw new Error("verifyEmailOtp requires either tokenHash or both email and token.");',
    "  }",
    "",
    "  return createSupabaseBrowserClient().auth.verifyOtp({",
    "    email: input.email,",
    "    token: input.token,",
    "    type,",
    "  });",
    "}",
    "",
    "export async function signOut() {",
    "  return createSupabaseBrowserClient().auth.signOut();",
    "}",
    "",
    "export async function getSession() {",
    "  return createSupabaseBrowserClient().auth.getSession();",
    "}",
    "",
  ].join("\n");
}

export function renderGeneratedSupabaseAuthGuards() {
  return [
    'import { getSession, requireAnonymous, requireSession } from "~/lib/auth";',
    "",
    "export { getSession, requireAnonymous, requireSession };",
    "",
  ].join("\n");
}

export function renderGeneratedSupabaseMiddleware() {
  return [
    'import { defineMiddleware } from "vinxi/http";',
    'import { createSupabaseServerClient } from "~/lib/supabase";',
    "",
    "function shouldSkip(path: string) {",
    '  return path.startsWith("/_build") || path === "/favicon.ico";',
    "}",
    "",
    "export default defineMiddleware({",
    "  async onRequest(event) {",
    "    if (shouldSkip(event.path)) {",
    "      return;",
    "    }",
    "",
    "    const supabase = createSupabaseServerClient(event);",
    "    await supabase.auth.getUser();",
    "  },",
    "});",
    "",
  ].join("\n");
}

export function renderGeneratedSupabaseAuthCallbackRoute() {
  return [
    'import type { APIEvent } from "@solidjs/start/server";',
    'import type { EmailOtpType } from "@supabase/supabase-js";',
    'import { createSupabaseServerClient } from "~/lib/supabase";',
    "",
    "export async function GET(event: APIEvent) {",
    "  const url = new URL(event.request.url);",
    '  const tokenHash = url.searchParams.get("token_hash");',
    '  const type = (url.searchParams.get("type") ?? "email") as EmailOtpType;',
    '  const redirectTo = url.searchParams.get("redirect_to") ?? "/";',
    "",
    "  if (!tokenHash) {",
    '    return Response.redirect(new URL("/login?error=missing_token_hash", url), 302);',
    "  }",
    "",
    "  const supabase = createSupabaseServerClient();",
    "  const { error } = await supabase.auth.verifyOtp({",
    "    token_hash: tokenHash,",
    "    type,",
    "  });",
    "",
    "  if (error) {",
    '    return Response.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url), 302);',
    "  }",
    "",
    "  return Response.redirect(new URL(redirectTo, url), 302);",
    "}",
    "",
  ].join("\n");
}

export function renderGeneratedSupabaseAuthApiRoutes() {
  const sessionRoute = [
    'import type { APIEvent } from "@solidjs/start/server";',
    'import { getSession } from "~/lib/auth";',
    "",
    "export async function GET(_event: APIEvent) {",
    "  const session = await getSession();",
    "  return Response.json({",
    "    ok: true,",
    "    session,",
    "  });",
    "}",
    "",
  ].join("\n");

  const signUpRoute = [
    'import type { APIEvent } from "@solidjs/start/server";',
    'import { signUpWithPassword } from "~/lib/auth";',
    "",
    "export async function POST(event: APIEvent) {",
    "  const body = await event.request.json().catch(() => ({} as Record<string, unknown>));",
    '  const email = typeof body.email === "string" ? body.email.trim() : "";',
    '  const password = typeof body.password === "string" ? body.password : "";',
    '  const metadata = typeof body.metadata === "object" && body.metadata ? body.metadata : undefined;',
    "",
    "  if (!email || !password) {",
    '    return Response.json({ ok: false, error: "Email and password are required." }, { status: 400 });',
    "  }",
    "",
    "  const { data, error } = await signUpWithPassword({ email, password, metadata: metadata as Record<string, unknown> | undefined });",
    '  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });',
    "  return Response.json({ ok: true, data });",
    "}",
    "",
  ].join("\n");

  const signInRoute = [
    'import type { APIEvent } from "@solidjs/start/server";',
    'import { signInWithPassword } from "~/lib/auth";',
    "",
    "export async function POST(event: APIEvent) {",
    "  const body = await event.request.json().catch(() => ({} as Record<string, unknown>));",
    '  const email = typeof body.email === "string" ? body.email.trim() : "";',
    '  const password = typeof body.password === "string" ? body.password : "";',
    "",
    "  if (!email || !password) {",
    '    return Response.json({ ok: false, error: "Email and password are required." }, { status: 400 });',
    "  }",
    "",
    "  const { data, error } = await signInWithPassword({ email, password });",
    '  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });',
    "  return Response.json({ ok: true, data });",
    "}",
    "",
  ].join("\n");

  const otpRequestRoute = [
    'import type { APIEvent } from "@solidjs/start/server";',
    'import { requestEmailOtp } from "~/lib/auth";',
    "",
    "export async function POST(event: APIEvent) {",
    "  const body = await event.request.json().catch(() => ({} as Record<string, unknown>));",
    '  const email = typeof body.email === "string" ? body.email.trim() : "";',
    '  const emailRedirectTo = typeof body.emailRedirectTo === "string" ? body.emailRedirectTo : undefined;',
    '  const shouldCreateUser = typeof body.shouldCreateUser === "boolean" ? body.shouldCreateUser : undefined;',
    "",
    "  if (!email) {",
    '    return Response.json({ ok: false, error: "Email is required." }, { status: 400 });',
    "  }",
    "",
    "  const { data, error } = await requestEmailOtp({ email, emailRedirectTo, shouldCreateUser });",
    '  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });',
    "  return Response.json({ ok: true, data });",
    "}",
    "",
  ].join("\n");

  const otpVerifyRoute = [
    'import type { APIEvent } from "@solidjs/start/server";',
    'import type { EmailOtpType } from "@supabase/supabase-js";',
    'import { verifyEmailOtp } from "~/lib/auth";',
    "",
    "export async function POST(event: APIEvent) {",
    "  const body = await event.request.json().catch(() => ({} as Record<string, unknown>));",
    '  const email = typeof body.email === "string" ? body.email.trim() : undefined;',
    '  const token = typeof body.token === "string" ? body.token.trim() : undefined;',
    '  const tokenHash = typeof body.tokenHash === "string" ? body.tokenHash.trim() : undefined;',
    '  const type = (typeof body.type === "string" && body.type ? body.type : "email") as EmailOtpType;',
    "",
    "  if (!token && !tokenHash) {",
    '    return Response.json({ ok: false, error: "Either token or tokenHash is required." }, { status: 400 });',
    "  }",
    "",
    "  const { data, error } = await verifyEmailOtp({ email, token, tokenHash, type });",
    '  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });',
    "  return Response.json({ ok: true, data });",
    "}",
    "",
  ].join("\n");

  const signOutRoute = [
    'import type { APIEvent } from "@solidjs/start/server";',
    'import { signOut } from "~/lib/auth";',
    "",
    "export async function POST(_event: APIEvent) {",
    "  const { error } = await signOut();",
    '  if (error) return Response.json({ ok: false, error: error.message }, { status: 400 });',
    "  return Response.json({ ok: true });",
    "}",
    "",
  ].join("\n");

  return {
    "src/routes/api/auth/session.ts": sessionRoute,
    "src/routes/api/auth/sign-up/password.ts": signUpRoute,
    "src/routes/api/auth/sign-in/password.ts": signInRoute,
    "src/routes/api/auth/sign-in/otp.ts": otpRequestRoute,
    "src/routes/api/auth/verify-otp.ts": otpVerifyRoute,
    "src/routes/api/auth/sign-out.ts": signOutRoute,
  };
}

export function renderGeneratedSupabaseSqlSchema(app: AppIR) {
  const tables = app.database?.schema ?? [];

  if (tables.length === 0) {
    return [
      "-- Generated by Stylyf CLI",
      "-- Add your own SQL here or update the App IR schema to emit table definitions.",
      "",
    ].join("\n");
  }

  return [
    "-- Generated by Stylyf CLI",
    "-- Apply this in the Supabase SQL editor or through the Supabase CLI when bootstrapping the hosted database path.",
    "",
    ...tables.map(renderSqlTable),
    "",
  ].join("\n");
}
