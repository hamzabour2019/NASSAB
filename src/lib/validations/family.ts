import { z } from "zod";

export const familyCreateSchema = z.object({
  name: z.string().min(1, "اسم العائلة مطلوب").max(200),
  description: z.string().max(2000).optional(),
  place_of_origin: z.string().max(500).optional(),
  image_url: z.string().url().optional().or(z.literal("")),
});

export const familySettingsSchema = z.object({
  visibility: z.enum(["private", "public_link"]),
  hide_living_sensitive: z.boolean(),
  slug: z
    .string()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "الرابط يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطة فقط")
    .optional()
    .or(z.literal("")),
  public_enabled: z.boolean(),
});

export type FamilyCreateInput = z.infer<typeof familyCreateSchema>;
export type FamilySettingsInput = z.infer<typeof familySettingsSchema>;
