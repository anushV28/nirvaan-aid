export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name?: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          assigned_at: string
          id: string
          request_id: string
          resolved_at: string | null
          responder_id: string
          responder_type: string
        }
        Insert: {
          assigned_at?: string
          id?: string
          request_id: string
          resolved_at?: string | null
          responder_id: string
          responder_type: string
        }
        Update: {
          assigned_at?: string
          id?: string
          request_id?: string
          resolved_at?: string | null
          responder_id?: string
          responder_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "requests"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          approval_status: string
          area_of_operation: string | null
          contact_person: string
          contact_phone: string
          created_at: string
          email: string
          id: string
          location_lat: number
          location_lng: number
          org_name: string
          registration_number: string | null
          resources_available: string | null
          verification_notes: string | null
          verification_score: number | null
          verification_status: string
          verified_at: string | null
          website: string | null
        }
        Insert: {
          approval_status?: string
          area_of_operation?: string | null
          contact_person: string
          contact_phone: string
          created_at?: string
          email: string
          id?: string
          location_lat: number
          location_lng: number
          org_name: string
          registration_number?: string | null
          resources_available?: string | null
          verification_notes?: string | null
          verification_score?: number | null
          verification_status?: string
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          approval_status?: string
          area_of_operation?: string | null
          contact_person?: string
          contact_phone?: string
          created_at?: string
          email?: string
          id?: string
          location_lat?: number
          location_lng?: number
          org_name?: string
          registration_number?: string | null
          resources_available?: string | null
          verification_notes?: string | null
          verification_score?: number | null
          verification_status?: string
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      requests: {
        Row: {
          assigned_responder_id: string | null
          assigned_responder_type: string | null
          category: string
          created_at: string
          description: string
          id: string
          is_sos: boolean
          landmark: string | null
          location_lat: number
          location_lng: number
          photo_url: string | null
          relationship: string
          reporter_name: string
          reporter_phone: string
          status: string
          updated_at: string
          urgency: string
        }
        Insert: {
          assigned_responder_id?: string | null
          assigned_responder_type?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          is_sos?: boolean
          landmark?: string | null
          location_lat: number
          location_lng: number
          photo_url?: string | null
          relationship?: string
          reporter_name: string
          reporter_phone: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Update: {
          assigned_responder_id?: string | null
          assigned_responder_type?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          is_sos?: boolean
          landmark?: string | null
          location_lat?: number
          location_lng?: number
          photo_url?: string | null
          relationship?: string
          reporter_name?: string
          reporter_phone?: string
          status?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
      volunteers: {
        Row: {
          contact_phone: string
          id: string
          last_active: string
          location_lat: number
          location_lng: number
          member_count: number | null
          name: string
          signup_type: string
          skills: string[]
          status: string
        }
        Insert: {
          contact_phone: string
          id?: string
          last_active?: string
          location_lat: number
          location_lng: number
          member_count?: number | null
          name: string
          signup_type?: string
          skills?: string[]
          status?: string
        }
        Update: {
          contact_phone?: string
          id?: string
          last_active?: string
          location_lat?: number
          location_lng?: number
          member_count?: number | null
          name?: string
          signup_type?: string
          skills?: string[]
          status?: string
        }
        Relationships: []
      }
      zone_allocations: {
        Row: {
          area_name: string
          category: string
          center_lat: number
          center_lng: number
          created_at: string
          id: string
          org_id: string
          radius_km: number
          status: string
          urgency: string
        }
        Insert: {
          area_name: string
          category?: string
          center_lat: number
          center_lng: number
          created_at?: string
          id?: string
          org_id: string
          radius_km?: number
          status?: string
          urgency?: string
        }
        Update: {
          area_name?: string
          category?: string
          center_lat?: number
          center_lng?: number
          created_at?: string
          id?: string
          org_id?: string
          radius_km?: number
          status?: string
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_allocations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      km_between: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
