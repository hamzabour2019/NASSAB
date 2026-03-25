"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import type { SupabasePublicConfig } from "@/lib/supabase/env-public";
import type { ReactNode } from "react";
import { AuthProvider } from "./auth-provider";
import { QueryProvider } from "./query-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({
  children,
  supabasePublic,
}: {
  children: ReactNode;
  supabasePublic: SupabasePublicConfig | null;
}) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <QueryProvider>
          <AuthProvider supabasePublic={supabasePublic}>
            {children}
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </QueryProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
