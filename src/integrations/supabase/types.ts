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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string | null
          author_name: string | null
          class_id: string | null
          content: string
          created_at: string
          id: string
          published_on: string
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          class_id?: string | null
          content?: string
          created_at?: string
          id?: string
          published_on?: string
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          class_id?: string | null
          content?: string
          created_at?: string
          id?: string
          published_on?: string
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          class_hour_points: number
          first_hour_points: number
          id: number
          leaderboard_mode: Database["public"]["Enums"]["leaderboard_mode"]
          updated_at: string
        }
        Insert: {
          class_hour_points?: number
          first_hour_points?: number
          id?: number
          leaderboard_mode?: Database["public"]["Enums"]["leaderboard_mode"]
          updated_at?: string
        }
        Update: {
          class_hour_points?: number
          first_hour_points?: number
          id?: number
          leaderboard_mode?: Database["public"]["Enums"]["leaderboard_mode"]
          updated_at?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          id: string
          recorded_at: string
          session_id: string
          student_id: string
        }
        Insert: {
          id?: string
          recorded_at?: string
          session_id: string
          student_id: string
        }
        Update: {
          id?: string
          recorded_at?: string
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string
          expires_at: string
          id: string
          is_active: boolean
          session_type: Database["public"]["Enums"]["session_type"]
          start_time: string
          token: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          is_active?: boolean
          session_type: Database["public"]["Enums"]["session_type"]
          start_time?: string
          token?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          session_type?: Database["public"]["Enums"]["session_type"]
          start_time?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_members: {
        Row: {
          class_id: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_servants: {
        Row: {
          class_id: string
          created_at: string
          id: string
          servant_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          servant_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          servant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_servants_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_servants_servant_id_fkey"
            columns: ["servant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          class_id: string | null
          content_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          item_date: string
          title: string
          updated_at: string
          url: string | null
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          class_id?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          item_date?: string
          title: string
          updated_at?: string
          url?: string | null
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          class_id?: string | null
          content_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          item_date?: string
          title?: string
          updated_at?: string
          url?: string | null
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "content_items_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          event_type: string
          id: string
          location: string | null
          start_time: string | null
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["content_visibility"]
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          event_type?: string
          id?: string
          location?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_type?: string
          id?: string
          location?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["content_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_records: {
        Row: {
          created_at: string
          date: string
          id: string
          note: string | null
          servant_id: string
          status: Database["public"]["Enums"]["followup_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          servant_id: string
          status: Database["public"]["Enums"]["followup_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          servant_id?: string
          status?: Database["public"]["Enums"]["followup_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "followup_records_servant_id_fkey"
            columns: ["servant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "followup_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          amount: number
          attendance_record_id: string | null
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          reason: string
          student_id: string
          type: Database["public"]["Enums"]["point_type"]
        }
        Insert: {
          amount: number
          attendance_record_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          reason: string
          student_id: string
          type: Database["public"]["Enums"]["point_type"]
        }
        Update: {
          amount?: number
          attendance_record_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          reason?: string
          student_id?: string
          type?: Database["public"]["Enums"]["point_type"]
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_attendance_record_id_fkey"
            columns: ["attendance_record_id"]
            isOneToOne: true
            referencedRelation: "attendance_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      program_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          hour: number
          id: string
          program_date: string
          sort_order: number
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          hour: number
          id?: string
          program_date?: string
          sort_order?: number
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          hour?: number
          id?: string
          program_date?: string
          sort_order?: number
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          speaker: string | null
          title: string
          topic_date: string
          updated_at: string
          verse: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          speaker?: string | null
          title: string
          topic_date?: string
          updated_at?: string
          verse?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          speaker?: string | null
          title?: string
          topic_date?: string
          updated_at?: string
          verse?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_followup: {
        Args: { _student: string; _uid: string }
        Returns: boolean
      }
      can_manage_session: {
        Args: {
          _class: string
          _type: Database["public"]["Enums"]["session_type"]
          _uid: string
        }
        Returns: boolean
      }
      can_see_content: {
        Args: {
          _class: string
          _vis: Database["public"]["Enums"]["content_visibility"]
        }
        Returns: boolean
      }
      can_view_profile: {
        Args: { _target: string; _viewer: string }
        Returns: boolean
      }
      get_class_summary: { Args: { _class: string }; Returns: Json }
      get_leaderboard: {
        Args: { _class?: string }
        Returns: {
          full_name: string
          is_me: boolean
          rank: number
          student_id: string
          total: number
        }[]
      }
      get_public_classes: {
        Args: never
        Returns: {
          description: string
          id: string
          name: string
          servant_names: string[]
          student_count: number
        }[]
      }
      has_permission: {
        Args: { _perm: string; _uid: string }
        Returns: boolean
      }
      is_main_admin: { Args: { _uid: string }; Returns: boolean }
      is_member_of_class: {
        Args: { _class: string; _uid: string }
        Returns: boolean
      }
      is_servant_of_class: {
        Args: { _class: string; _uid: string }
        Returns: boolean
      }
      is_servant_of_student: {
        Args: { _student: string; _uid: string }
        Returns: boolean
      }
      record_attendance: { Args: { _token: string }; Returns: Json }
    }
    Enums: {
      content_visibility: "PUBLIC" | "MEMBERS" | "SERVANTS"
      followup_status:
        | "PRESENT"
        | "ABSENT"
        | "CONTACTED"
        | "NEEDS_FOLLOWUP"
        | "DONE"
      leaderboard_mode: "DISABLED" | "CLASS" | "SERVICE"
      point_type:
        | "attendance"
        | "activity"
        | "competition"
        | "special_event"
        | "manual_adjustment"
      session_type: "FIRST_HOUR" | "CLASS_HOUR"
      user_type: "STUDENT" | "SERVANT" | "MAIN_ADMIN"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      content_visibility: ["PUBLIC", "MEMBERS", "SERVANTS"],
      followup_status: [
        "PRESENT",
        "ABSENT",
        "CONTACTED",
        "NEEDS_FOLLOWUP",
        "DONE",
      ],
      leaderboard_mode: ["DISABLED", "CLASS", "SERVICE"],
      point_type: [
        "attendance",
        "activity",
        "competition",
        "special_event",
        "manual_adjustment",
      ],
      session_type: ["FIRST_HOUR", "CLASS_HOUR"],
      user_type: ["STUDENT", "SERVANT", "MAIN_ADMIN"],
    },
  },
} as const
