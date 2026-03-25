"use client";

import { useProfile } from "@/hooks/use-profile";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, User } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { Logo } from "@/components/layout/logo";

export function AppHeader() {
  const { user, loading, supabaseMisconfigured } = useAuth();
  const { data: profile } = useProfile();
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "لوحة التحكم" },
    { href: "/families", label: "العائلات" },
    ...(profile?.is_super_admin ? [{ href: "/admin", label: "الإدارة" }] : []),
  ];
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 shadow-[0_1px_0_0_oklch(0_0_0/0.03)] backdrop-blur-xl dark:shadow-[0_1px_0_0_oklch(1_0_0/0.06)]">
      {supabaseMisconfigured && (
        <div className="border-b border-primary/40 bg-primary/15 px-4 py-2 text-center text-xs font-medium text-primary-foreground">
          إعدادات Supabase غير مكتملة: أنشئ ملف <code className="rounded bg-background/50 px-1">.env.local</code> مع{" "}
          <code className="rounded bg-background/50 px-1">NEXT_PUBLIC_SUPABASE_URL</code> و{" "}
          <code className="rounded bg-background/50 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> ثم أعد تشغيل{" "}
          <code className="rounded bg-background/50 px-1">npm run dev</code>.
        </div>
      )}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-8">
          <Link
            href={user ? "/dashboard" : "/"}
            className="group flex items-center gap-2.5 rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Logo size="sm" className="transition-transform group-hover:scale-[1.02]" iconClassName="w-4 h-4" />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-base font-semibold tracking-tight">نسب</span>
              <span className="hidden text-[10px] text-muted-foreground sm:block">Nassab</span>
            </span>
          </Link>
          {user && !loading && (
            <nav className="hidden items-center gap-0.5 md:flex">
              {links.map((l) => {
                const active = pathname === l.href || pathname.startsWith(`${l.href}/`);
                return (
                  <Button
                    key={l.href}
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "rounded-lg px-3",
                      active && "bg-secondary font-medium text-secondary-foreground shadow-none"
                    )}
                    asChild
                  >
                    <Link href={l.href}>{l.label}</Link>
                  </Button>
                );
              })}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {!user && !loading && (
            <>
              <Button variant="ghost" size="sm" className="rounded-lg" asChild>
                <Link href="/login">دخول</Link>
              </Button>
              <Button size="sm" className="rounded-lg shadow-sm" asChild>
                <Link href="/register">تسجيل</Link>
              </Button>
            </>
          )}
          {user && !loading && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(buttonVariants({ variant: "outline", size: "icon" }), "md:hidden rounded-xl")}
                >
                  <Menu className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[12rem]">
                  {links.map((l) => (
                    <DropdownMenuItem key={l.href} onClick={() => router.push(l.href)}>
                      {l.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-2 rounded-xl border-border/80"
                  )}
                >
                  <User className="size-4 opacity-80" />
                  <span className="hidden max-w-[140px] truncate text-xs sm:inline sm:text-sm">
                    {user.email}
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[14rem]">
                  <DropdownMenuItem disabled className="text-xs opacity-80">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="ms-2 size-4 opacity-70" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
