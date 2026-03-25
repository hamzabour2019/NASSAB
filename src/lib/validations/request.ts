import { z } from "zod";

export const editRequestCreateSchema = z.object({
  family_id: z.string().uuid(),
  request_type: z.enum([
    "update_member",
    "add_parent",
    "add_spouse",
    "add_child",
    "correct_relationship",
    "change_image",
  ]),
  target_member_id: z.string().uuid().optional().nullable(),
  payload: z.record(z.string(), z.unknown()),
});

export const editRequestReviewSchema = z.object({
  request_id: z.string().uuid(),
  family_id: z.string().uuid(),
  approve: z.boolean(),
  note: z.string().max(1000).optional().nullable(),
});

export type EditRequestCreateInput = z.infer<typeof editRequestCreateSchema>;
export type EditRequestReviewInput = z.infer<typeof editRequestReviewSchema>;
