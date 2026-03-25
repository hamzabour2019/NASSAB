export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          is_super_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          is_super_admin?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      families: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          place_of_origin: string | null;
          image_url: string | null;
          owner_id: string;
          visibility: "private" | "public_link";
          hide_living_sensitive: boolean;
          public_visible_fields: Json;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          place_of_origin?: string | null;
          image_url?: string | null;
          owner_id: string;
          visibility?: "private" | "public_link";
          hide_living_sensitive?: boolean;
          public_visible_fields?: Json;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["families"]["Insert"]> & {
          deleted_at?: string | null;
        };
      };
      family_memberships: {
        Row: {
          id: string;
          family_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member";
        };
        Update: Partial<Database["public"]["Tables"]["family_memberships"]["Insert"]>;
      };
      family_members: {
        Row: {
          id: string;
          family_id: string;
          full_name: string;
          gender: "male" | "female" | "other" | "unspecified";
          date_of_birth: string | null;
          date_of_death: string | null;
          is_deceased: boolean;
          biography: string | null;
          place_of_birth: string | null;
          occupation: string | null;
          profile_image_url: string | null;
          linked_user_id: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          family_id: string;
          full_name: string;
          gender?: "male" | "female" | "other" | "unspecified";
          date_of_birth?: string | null;
          date_of_death?: string | null;
          is_deceased?: boolean;
          biography?: string | null;
          place_of_birth?: string | null;
          occupation?: string | null;
          profile_image_url?: string | null;
          linked_user_id?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["family_members"]["Insert"]> & {
          deleted_at?: string | null;
        };
      };
      parent_child_relationships: {
        Row: {
          id: string;
          family_id: string;
          child_member_id: string;
          parent_member_id: string;
          parent_role: "father" | "mother";
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          family_id: string;
          child_member_id: string;
          parent_member_id: string;
          parent_role: "father" | "mother";
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["parent_child_relationships"]["Insert"]>;
      };
      marriages: {
        Row: {
          id: string;
          family_id: string;
          spouse_a_id: string;
          spouse_b_id: string;
          started_on: string | null;
          ended_on: string | null;
          is_current: boolean;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          family_id: string;
          spouse_a_id: string;
          spouse_b_id: string;
          started_on?: string | null;
          ended_on?: string | null;
          is_current?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["marriages"]["Insert"]>;
      };
      edit_requests: {
        Row: {
          id: string;
          family_id: string;
          requester_id: string;
          request_type: string;
          status: "pending" | "approved" | "rejected";
          payload: Json;
          target_member_id: string | null;
          reviewer_id: string | null;
          reviewer_note: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          requester_id: string;
          request_type: string;
          status?: "pending" | "approved" | "rejected";
          payload?: Json;
          target_member_id?: string | null;
        };
        Update: Partial<{
          status: "pending" | "approved" | "rejected";
          reviewer_id: string | null;
          reviewer_note: string | null;
          reviewed_at: string | null;
        }>;
      };
      audit_logs: {
        Row: {
          id: string;
          family_id: string | null;
          actor_id: string | null;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string | null;
          read_at: string | null;
          link_url: string | null;
          family_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body?: string | null;
          link_url?: string | null;
          family_id?: string | null;
        };
        Update: Partial<{ read_at: string | null }>;
      };
      public_family_links: {
        Row: {
          family_id: string;
          slug: string;
          is_enabled: boolean;
          created_at: string;
        };
        Insert: {
          family_id: string;
          slug: string;
          is_enabled?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["public_family_links"]["Insert"]>;
      };
    };
    Enums: {
      family_visibility: "private" | "public_link";
      membership_role: "owner" | "admin" | "member";
      gender_type: "male" | "female" | "other" | "unspecified";
      parent_role: "father" | "mother";
      edit_request_status: "pending" | "approved" | "rejected";
      edit_request_type:
        | "update_member"
        | "add_parent"
        | "add_spouse"
        | "add_child"
        | "correct_relationship"
        | "change_image";
    };
  };
};
