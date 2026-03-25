import type { Database } from "./database";

export type { Database };

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Family = Database["public"]["Tables"]["families"]["Row"];
export type FamilyMember = Database["public"]["Tables"]["family_members"]["Row"];
export type FamilyMembership = Database["public"]["Tables"]["family_memberships"]["Row"];
export type ParentChildRelationship =
  Database["public"]["Tables"]["parent_child_relationships"]["Row"];
export type Marriage = Database["public"]["Tables"]["marriages"]["Row"];
export type EditRequest = Database["public"]["Tables"]["edit_requests"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
export type PublicFamilyLink = Database["public"]["Tables"]["public_family_links"]["Row"];

export type MembershipRole = Database["public"]["Enums"]["membership_role"];
export type FamilyVisibility = Database["public"]["Enums"]["family_visibility"];
export type EditRequestType = Database["public"]["Enums"]["edit_request_type"];
export type EditRequestStatus = Database["public"]["Enums"]["edit_request_status"];
export type GenderType = Database["public"]["Enums"]["gender_type"];
export type ParentRole = Database["public"]["Enums"]["parent_role"];
