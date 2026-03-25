import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-muted-foreground">جاري التحميل…</p>}>
      <LoginForm />
    </Suspense>
  );
}
