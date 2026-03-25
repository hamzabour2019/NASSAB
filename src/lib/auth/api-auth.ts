import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { AuthResult } from "./supabase-auth";

type ApiTokens = {
  access_token: string;
  refresh_token?: string;
};

function getApiUrl(): string | undefined {
  const u = process.env.NEXT_PUBLIC_API_URL;
  return u?.replace(/\/$/, "");
}

export async function apiTrySignIn(
  email: string,
  password: string
): Promise<AuthResult<Session>> {
  const base = getApiUrl();
  if (!base) {
    return { data: null, error: new Error("API غير مهيأ") };
  }

  try {
    const res = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    if (!res.ok) {
      return { data: null, error: new Error("فشل تسجيل الدخول عبر الخادم") };
    }

    const body = (await res.json()) as ApiTokens & { session?: Session };
    const access_token = body.access_token ?? body.session?.access_token;
    const refresh_token =
      body.refresh_token ?? body.session?.refresh_token ?? "";

    if (!access_token) {
      return { data: null, error: new Error("استجابة الخادم غير صالحة") };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || access_token,
    });

    if (error || !data.session) {
      return { data: null, error: error ?? new Error("تعذر إنشاء الجلسة") };
    }

    return { data: data.session, error: null };
  } catch {
    return { data: null, error: new Error("الخادم غير متاح") };
  }
}

export async function apiTryGetSession(): Promise<AuthResult<Session | null>> {
  const base = getApiUrl();
  if (!base) {
    return { data: null, error: new Error("API غير مهيأ") };
  }

  try {
    const res = await fetch(`${base}/auth/session`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      return { data: null, error: new Error("لا توجد جلسة") };
    }

    const body = (await res.json()) as ApiTokens & { session?: Session };
    const access_token = body.access_token ?? body.session?.access_token;
    const refresh_token =
      body.refresh_token ?? body.session?.refresh_token ?? "";

    if (!access_token) {
      return { data: null, error: new Error("لا توجد جلسة") };
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || access_token,
    });

    if (error) return { data: null, error };
    return { data: data.session, error: null };
  } catch {
    return { data: null, error: new Error("الخادم غير متاح") };
  }
}
