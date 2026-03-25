"use client";

import type { ReactNode } from "react";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // نعطّل next-themes تماماً لأن زر الثيم الجديد يبدّل class=dark يدوياً على <html>.
  // هذا يمنع التعارض الذي كان يؤدي إلى شاشة بيضاء عند تغيير الثيم.
  return <>{children}</>;
}
