"use client";

import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Profile | null> => {
      const supabase = createClient();
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
