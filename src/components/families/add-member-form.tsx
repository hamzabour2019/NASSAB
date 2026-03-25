"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMember } from "@/lib/actions/member-actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Opt = { id: string; full_name: string };

export function AddMemberForm({ familyId, options }: { familyId: string; options: Opt[] }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "other" | "unspecified">("unspecified");
  const [fatherId, setFatherId] = useState<string>("");
  const [motherId, setMotherId] = useState<string>("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await createMember(familyId, {
      full_name: fullName,
      gender,
      is_deceased: false,
      father_id: fatherId || undefined,
      mother_id: motherId || undefined,
    });
    setPending(false);
    if ("error" in res && res.error) {
      const msg =
        typeof res.error === "object" && res.error && "_server" in res.error
          ? (res.error as { _server?: string[] })._server?.[0]
          : "تعذر الحفظ";
      toast.error(String(msg));
      return;
    }
    toast.success("تمت إضافة الفرد");
    setFullName("");
    setFatherId("");
    setMotherId("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="full_name">الاسم الكامل</Label>
        <Input
          id="full_name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>الجنس</Label>
        <Select value={gender} onValueChange={(v) => setGender(v as typeof gender)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">ذكر</SelectItem>
            <SelectItem value="female">أنثى</SelectItem>
            <SelectItem value="other">آخر</SelectItem>
            <SelectItem value="unspecified">غير محدد</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>الأب (اختياري)</Label>
        <Select
          value={fatherId || "__none__"}
          onValueChange={(v) => setFatherId(v === "__none__" || !v ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>الأم (اختياري)</Label>
        <Select
          value={motherId || "__none__"}
          onValueChange={(v) => setMotherId(v === "__none__" || !v ? "" : v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {options.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "جاري الحفظ…" : "حفظ الفرد"}
        </Button>
      </div>
    </form>
  );
}
