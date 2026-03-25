"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitEditRequest } from "@/lib/actions/request-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export function MemberEditRequestForm({
  familyId,
  memberId,
}: {
  familyId: string;
  memberId: string;
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [occupation, setOccupation] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await submitEditRequest({
      family_id: familyId,
      request_type: "update_member",
      target_member_id: memberId,
      payload: { full_name: fullName || undefined, occupation: occupation || undefined },
    });
    setPending(false);
    if ("error" in res && res.error) {
      toast.error("تعذر إرسال الطلب");
      return;
    }
    toast.success("تم إرسال طلب التعديل");
    setFullName("");
    setOccupation("");
    router.refresh();
  }

  return (
    <Card className="border-border/70 bg-card/90 shadow-sm">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="text-lg font-semibold">طلب تعديل معلومات</CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          لن تُطبَّق التغييرات إلا بعد موافقة مالك العائلة
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="fn">الاسم الكامل المقترح</Label>
            <Input
              id="fn"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-11 rounded-xl border-border/80"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="oc">المهنة المقترحة</Label>
            <Input
              id="oc"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              className="h-11 rounded-xl border-border/80"
            />
          </div>
          <Button type="submit" className="rounded-xl shadow-sm" disabled={pending}>
            إرسال الطلب
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
