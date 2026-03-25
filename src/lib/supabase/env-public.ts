/** قراءة متغيرات Supabase العامة — يُستدعى من Server Components حيث تُحمَّل .env دائماً */
export type SupabasePublicConfig = { url: string; anonKey: string };

export function readSupabasePublicEnv(): SupabasePublicConfig | null {
  const urlRaw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const keyRaw = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (typeof urlRaw !== "string" || typeof keyRaw !== "string") return null;
  const url = urlRaw.trim();
  const anonKey = keyRaw.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
