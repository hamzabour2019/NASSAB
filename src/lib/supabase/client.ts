import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/** يمنع تعطل الواجهة بالكامل إن نُسيت متغيرات البيئة أثناء التطوير */
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
/* مفتاح شكلي فقط لتفادي تعطل الإنشاء — لن يعمل ضد مشروع حقيقي */
const PLACEHOLDER_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDB9.invalid-signature";

let warnedMissingEnv = false;

export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    if (typeof window !== "undefined" && !warnedMissingEnv) {
      warnedMissingEnv = true;
      console.warn(
        "[نسب] لم يُعثر على NEXT_PUBLIC_SUPABASE_URL أو NEXT_PUBLIC_SUPABASE_ANON_KEY. أضفهما في .env.local ثم أعد تشغيل السيرفر."
      );
    }
    return createBrowserClient(PLACEHOLDER_URL, PLACEHOLDER_KEY);
  }
  return createBrowserClient(url, key);
}

export function isSupabaseBrowserConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}
