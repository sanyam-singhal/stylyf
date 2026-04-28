import { redirect } from "@solidjs/router";
import type { EmailOtpType } from "@supabase/supabase-js";
import { env } from "~/lib/env";
import { createSupabaseAdminClient, createSupabaseServerClient } from "~/lib/supabase";

export async function getSession() {
  const supabase = createSupabaseServerClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return null;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return null;

  return {
    session: sessionData.session,
    user: userData.user,
  };
}

export async function requireSession(options?: { redirectTo?: string }) {
  const session = await getSession();
  if (!session) {
    throw redirect(options?.redirectTo ?? "/login");
  }
  return session;
}

export async function requireAnonymous(options?: { redirectTo?: string }) {
  const session = await getSession();
  if (session) {
    throw redirect(options?.redirectTo ?? "/");
  }
  return null;
}

export function createAuthAdminClient() {
  return createSupabaseAdminClient();
}

export async function signUpWithPassword(input: { email: string; password: string; metadata?: Record<string, unknown> }) {
  if (!true) {
    throw new Error("Email/password auth is disabled in this Stylyf scaffold.");
  }

  const supabase = createSupabaseServerClient();
  return supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: input.metadata ? { data: input.metadata } : undefined,
  });
}

export async function signInWithPassword(input: { email: string; password: string }) {
  if (!true) {
    throw new Error("Email/password auth is disabled in this Stylyf scaffold.");
  }

  const supabase = createSupabaseServerClient();
  return supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
}

export async function requestEmailOtp(input: { email: string; shouldCreateUser?: boolean; emailRedirectTo?: string }) {
  if (!true) {
    throw new Error("Email OTP auth is disabled in this Stylyf scaffold.");
  }

  const supabase = createSupabaseServerClient();
  return supabase.auth.signInWithOtp({
    email: input.email,
    options: {
      shouldCreateUser: input.shouldCreateUser ?? true,
      emailRedirectTo: input.emailRedirectTo ?? `${env.APP_BASE_URL.replace(/\/$/, "")}/auth/callback`,
    },
  });
}

export async function verifyEmailOtp(input: { email?: string; token?: string; tokenHash?: string; type?: EmailOtpType }) {
  const supabase = createSupabaseServerClient();
  const type = input.type ?? "email";
  if (input.tokenHash) {
    return supabase.auth.verifyOtp({
      token_hash: input.tokenHash,
      type,
    });
  }

  if (!input.email || !input.token) {
    throw new Error("verifyEmailOtp requires either tokenHash or both email and token.");
  }

  return supabase.auth.verifyOtp({
    email: input.email,
    token: input.token,
    type,
  });
}

export async function signOut() {
  const supabase = createSupabaseServerClient();
  return supabase.auth.signOut();
}
