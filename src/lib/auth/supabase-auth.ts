import type { AuthError, Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type AuthResult<T> = { data: T; error: null } | { data: null; error: AuthError | Error };

export async function supabaseSignInWithPassword(
  email: string,
  password: string
): Promise<AuthResult<Session>> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { data: null, error };
  if (!data.session) return { data: null, error: new Error("لا توجد جلسة") };
  return { data: data.session, error: null };
}

export async function supabaseSignUp(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthResult<Session | null>> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });
  if (error) return { data: null, error };
  return { data: data.session, error: null };
}

export async function supabaseSignOut(): Promise<AuthResult<void>> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { data: null, error };
  return { data: undefined, error: null };
}

export async function supabaseGetSession(): Promise<AuthResult<Session | null>> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) return { data: null, error };
  return { data: data.session, error: null };
}

export async function supabaseGetUser(): Promise<AuthResult<User | null>> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return { data: null, error };
  return { data: data.user, error: null };
}
