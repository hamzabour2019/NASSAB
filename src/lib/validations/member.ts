import { z } from "zod";

export const memberCreateSchema = z
  .object({
    full_name: z.string().min(1).max(300),
    gender: z.enum(["male", "female", "other", "unspecified"]),
    date_of_birth: z.string().optional().nullable(),
    date_of_death: z.string().optional().nullable(),
    is_deceased: z.boolean(),
    biography: z.string().max(5000).optional().nullable(),
    place_of_birth: z.string().max(500).optional().nullable(),
    occupation: z.string().max(300).optional().nullable(),
    profile_image_url: z.string().url().optional().or(z.literal("")).nullable(),
    father_id: z
      .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string().uuid().optional()),
    mother_id: z
      .preprocess((v) => (v === "" || v === null || v === undefined ? undefined : v), z.string().uuid().optional()),
  })
  .refine(
    (d) => {
      if (d.father_id && d.mother_id && d.father_id === d.mother_id) return false;
      return true;
    },
    { message: "لا يمكن أن يكون الأب والأم نفس الشخص" }
  );

const optionalUuid = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.string().uuid().optional()
);

export const memberUpdateSchema = z
  .object({
    full_name: z.string().min(1).max(300).optional(),
    gender: z.enum(["male", "female", "other", "unspecified"]).optional(),
    date_of_birth: z.string().optional().nullable(),
    date_of_death: z.string().optional().nullable(),
    is_deceased: z.boolean().optional(),
    biography: z.string().max(5000).optional().nullable(),
    place_of_birth: z.string().max(500).optional().nullable(),
    occupation: z.string().max(300).optional().nullable(),
    profile_image_url: z.string().url().optional().or(z.literal("")).nullable(),
    father_id: optionalUuid,
    mother_id: optionalUuid,
  })
  .refine(
    (d) => {
      if (d.father_id && d.mother_id && d.father_id === d.mother_id) return false;
      return true;
    },
    { message: "لا يمكن أن يكون الأب والأم نفس الشخص" }
  );

export type MemberCreateInput = z.infer<typeof memberCreateSchema>;
