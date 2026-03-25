import { apiTryGetSession, apiTrySignIn } from "./api-auth";
import {
  supabaseGetSession,
  supabaseGetUser,
  supabaseSignInWithPassword,
  supabaseSignOut,
  supabaseSignUp,
  type AuthResult,
} from "./supabase-auth";
import type { Session, User } from "@supabase/supabase-js";

function hasApiUrl(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_API_URL?.trim());
}

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthResult<Session>> {
  if (hasApiUrl()) {
    const api = await apiTrySignIn(email, password);
    if (api.data && !api.error) return api;
  }
  return supabaseSignInWithPassword(email, password);
}

export async function signUp(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult<Session | null>> {
  return supabaseSignUp(email, password, displayName);
}

export async function signOut(): Promise<AuthResult<void>> {
  return supabaseSignOut();
}

export async function getSession(): Promise<AuthResult<Session | null>> {
  if (hasApiUrl()) {
    const api = await apiTryGetSession();
    if (api.data && !api.error) return api;
  }
  return supabaseGetSession();
}

export async function getUser(): Promise<AuthResult<User | null>> {
  return supabaseGetUser();
}
