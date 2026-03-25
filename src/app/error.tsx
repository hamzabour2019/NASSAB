"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[نسب] خطأ في الصفحة:", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h2 className="text-xl font-semibold text-foreground">حدث خطأ</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || "تعذر عرض هذه الصفحة. تحقق من وحدة التحكم (F12) للتفاصيل."}
      </p>
      <Button type="button" onClick={() => reset()} className="rounded-xl">
        إعادة المحاولة
      </Button>
    </div>
  );
}
