import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "~/lib/supabase-browser";

export function authClient() {
  return createSupabaseBrowserClient();
}

export async function signUpWithPassword(input: { email: string; password: string; metadata?: Record<string, unknown> }) {
  if (!true) {
    throw new Error("Email/password auth is disabled in this Stylyf scaffold.");
  }

  return createSupabaseBrowserClient().auth.signUp({
    email: input.email,
    password: input.password,
    options: input.metadata ? { data: input.metadata } : undefined,
  });
}

export async function signInWithPassword(input: { email: string; password: string }) {
  if (!true) {
    throw new Error("Email/password auth is disabled in this Stylyf scaffold.");
  }

  return createSupabaseBrowserClient().auth.signInWithPassword(input);
}

export async function requestEmailOtp(input: { email: string; shouldCreateUser?: boolean; emailRedirectTo?: string }) {
  if (!true) {
    throw new Error("Email OTP auth is disabled in this Stylyf scaffold.");
  }

  return createSupabaseBrowserClient().auth.signInWithOtp({
    email: input.email,
    options: {
      shouldCreateUser: input.shouldCreateUser ?? true,
      emailRedirectTo: input.emailRedirectTo,
    },
  });
}

export async function verifyEmailOtp(input: { email?: string; token?: string; tokenHash?: string; type?: EmailOtpType }) {
  const type = input.type ?? "email";
  if (input.tokenHash) {
    return createSupabaseBrowserClient().auth.verifyOtp({
      token_hash: input.tokenHash,
      type,
    });
  }

  if (!input.email || !input.token) {
    throw new Error("verifyEmailOtp requires either tokenHash or both email and token.");
  }

  return createSupabaseBrowserClient().auth.verifyOtp({
    email: input.email,
    token: input.token,
    type,
  });
}

export async function signOut() {
  return createSupabaseBrowserClient().auth.signOut();
}

export async function getSession() {
  return createSupabaseBrowserClient().auth.getSession();
}
