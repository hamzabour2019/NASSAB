"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateFamilySettings } from "@/lib/actions/family-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  familyId: string;
  initial: {
    visibility: "private" | "public_link";
    hide_living_sensitive: boolean;
    slug: string;
    public_enabled: boolean;
  };
};

export function SettingsForm({ familyId, initial }: Props) {
  const router = useRouter();
  const [visibility, setVisibility] = useState(initial.visibility);
  const [hideLiving, setHideLiving] = useState(initial.hide_living_sensitive);
  const [slug, setSlug] = useState(initial.slug);
  const [publicEnabled, setPublicEnabled] = useState(initial.public_enabled);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await updateFamilySettings(familyId, {
      visibility,
      hide_living_sensitive: hideLiving,
      slug: slug || undefined,
      public_enabled: publicEnabled,
    });
    setPending(false);
    if ("error" in res && res.error) {
      toast.error("تعذر حفظ الإعدادات");
      return;
    }
    toast.success("تم حفظ الإعدادات");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold">ظهور العائلة</CardTitle>
          <CardDescription>خاصة أو عبر رابط عام</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>الوضع</Label>
            <Select
              value={visibility}
              onValueChange={(v) => setVisibility(v as typeof visibility)}
            >
              <SelectTrigger className="h-11 rounded-xl border-border/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">خاصة</SelectItem>
                <SelectItem value="public_link">رابط عام (مع تمكين الرابط أدناه)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div>
              <p className="font-medium">إخفاء بيانات حساسة للأحياء على الصفحة العامة</p>
              <p className="text-sm text-muted-foreground">مثل المهنة والنبذة عند التفعيل</p>
            </div>
            <Switch checked={hideLiving} onCheckedChange={setHideLiving} />
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-lg font-semibold">الرابط العام</CardTitle>
          <CardDescription>مثال: /public/family/al-shami-demo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <span className="font-medium">تفعيل الرابط</span>
            <Switch checked={publicEnabled} onCheckedChange={setPublicEnabled} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">المسار (إنجليزي صغير وشرطة)</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              placeholder="al-shami-demo"
              className="h-11 rounded-xl border-border/80 font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>
      <Button type="submit" className="rounded-xl px-8 shadow-sm" disabled={pending}>
        حفظ الإعدادات
      </Button>
    </form>
  );
}
