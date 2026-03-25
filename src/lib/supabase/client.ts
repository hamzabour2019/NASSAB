import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

declare global {
  interface Window {
    __NASSAB_SUPABASE__?: { url: string; anonKey: string };
  }
}

/** يمنع تعطل الواجهة بالكامل إن نُسيت متغيرات البيئة أثناء التطوير */
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
/* مفتاح شكلي فقط لتفادي تعطل الإنشاء — لن يعمل ضد مشروع حقيقي */
const PLACEHOLDER_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDB9.invalid-signature";

let warnedMissingEnv = false;

/** يقرأ من الحقن في layout (يعمل مع Turbopack) ثم من process.env */
function getSupabasePublicFromRuntime(): { url: string; key: string } | null {
  if (typeof window !== "undefined") {
    const injected = window.__NASSAB_SUPABASE__;
    if (injected && typeof injected.url === "string" && typeof injected.anonKey === "string") {
      const url = injected.url.trim();
      const key = injected.anonKey.trim();
      if (url && key) return { url, key };
    }
  }
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const keyRaw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (typeof urlRaw !== "string" || typeof keyRaw !== "string") return null;
  const url = urlRaw.trim();
  const key = keyRaw.trim();
  if (!url || !key) return null;
  return { url, key };
}

export function createClient(): SupabaseClient {
  const env = getSupabasePublicFromRuntime();
  if (!env) {
    if (typeof window !== "undefined" && !warnedMissingEnv) {
      warnedMissingEnv = true;
      console.warn(
        "[نسب] لم يُعثر على NEXT_PUBLIC_SUPABASE_URL أو NEXT_PUBLIC_SUPABASE_ANON_KEY. أضفهما في .env.local ثم أعد تشغيل السيرفر."
      );
    }
    return createBrowserClient(PLACEHOLDER_URL, PLACEHOLDER_KEY);
  }
  return createBrowserClient(env.url, env.key);
}

export function isSupabaseBrowserConfigured(): boolean {
  return getSupabasePublicFromRuntime() !== null;
}
