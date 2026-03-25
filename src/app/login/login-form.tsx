"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithPassword } from "@/lib/auth/auth-service";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/layout/logo";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await signInWithPassword(email, password);
    setPending(false);
    if (res.error) {
      toast.error(res.error.message ?? "فشل تسجيل الدخول");
      return;
    }
    toast.success("تم تسجيل الدخول");
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
          <Logo size="md" className="w-full h-full" iconClassName="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">مرحباً بعودتك</h1>
        <p className="mt-2 text-sm text-muted-foreground">سجّل الدخول لمتابعة عائلاتك وشجرتك</p>
      </div>
      <Card className="border-border/70 shadow-lg shadow-primary/5">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg">تسجيل الدخول</CardTitle>
          <CardDescription>البريد الإلكتروني وكلمة المرور</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">البريد</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 rounded-xl border-border/80 bg-background/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11 rounded-xl border-border/80 bg-background/80"
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-xl text-base shadow-sm" disabled={pending}>
              {pending ? "جاري الدخول…" : "دخول"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ليس لديك حساب؟{" "}
              <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
                إنشاء حساب
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
