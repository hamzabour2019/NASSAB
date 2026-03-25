"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createFamily } from "@/lib/actions/family-actions";
import { UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NewFamilyPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [place, setPlace] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await createFamily({
      name,
      description: description || undefined,
      place_of_origin: place || undefined,
    });
    setPending(false);
    if ("error" in res && res.error) {
      const msg =
        typeof res.error === "object" && "_server" in res.error ? res.error._server?.[0] : "تعذر الإنشاء";
      toast.error(String(msg));
      return;
    }
    if ("data" in res && res.data) {
      toast.success("تم إنشاء العائلة");
      router.push(`/families/${res.data.id}`);
      router.refresh();
    }
  }

  return (
    <div className="mx-auto max-w-lg py-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <UsersRound className="size-6" strokeWidth={1.75} aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">عائلة جديدة</h1>
          <p className="text-sm text-muted-foreground">ستكون مالك العائلة ويمكنك إدارة الأفراد والإعدادات</p>
        </div>
      </div>
      <Card className="border-border/70 shadow-md shadow-primary/5">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">بيانات العائلة</CardTitle>
          <CardDescription>يمكنك تعديل التفاصيل لاحقاً من الإعدادات</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">اسم العائلة</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11 rounded-xl border-border/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">وصف (اختياري)</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="rounded-xl border-border/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="place">أصل العائلة (اختياري)</Label>
              <Input
                id="place"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="h-11 rounded-xl border-border/80"
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-xl shadow-sm sm:w-auto" disabled={pending}>
              {pending ? "جاري الحفظ…" : "إنشاء العائلة"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
