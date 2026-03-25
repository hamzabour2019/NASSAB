"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reviewEditRequest } from "@/lib/actions/request-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function RequestReviewRow({
  familyId,
  requestId,
}: {
  familyId: string;
  requestId: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"a" | "r" | null>(null);

  async function go(approve: boolean) {
    setBusy(approve ? "a" : "r");
    const res = await reviewEditRequest({
      request_id: requestId,
      family_id: familyId,
      approve,
      note: note || null,
    });
    setBusy(null);
    if ("error" in res && res.error) {
      toast.error("تعذر تنفيذ الإجراء");
      return;
    }
    toast.success(approve ? "تم القبول" : "تم الرفض");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <Textarea
        placeholder="ملاحظة (اختياري)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-[60px] sm:max-w-xs"
      />
      <div className="flex gap-2">
        <Button size="sm" variant="default" disabled={busy !== null} onClick={() => go(true)}>
          {busy === "a" ? "…" : "موافقة"}
        </Button>
        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => go(false)}>
          {busy === "r" ? "…" : "رفض"}
        </Button>
      </div>
    </div>
  );
}
