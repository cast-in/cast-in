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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      actor_profiles: {
        Row: {
          affiliation: string
          bio: string | null
          birth_date: string | null
          gender: string | null
          genres: string[]
          height_cm: number | null
          image_tags: string[]
          nationalities: string[]
          region: string | null
          skills: string[]
          social_links: Json
          updated_at: string
          user_id: string
          visibility: string
          weight_kg: number | null
        }
        Insert: {
          affiliation?: string
          bio?: string | null
          birth_date?: string | null
          gender?: string | null
          genres?: string[]
          height_cm?: number | null
          image_tags?: string[]
          nationalities?: string[]
          region?: string | null
          skills?: string[]
          social_links?: Json
          updated_at?: string
          user_id: string
          visibility?: string
          weight_kg?: number | null
        }
        Update: {
          affiliation?: string
          bio?: string | null
          birth_date?: string | null
          gender?: string | null
          genres?: string[]
          height_cm?: number | null
          image_tags?: string[]
          nationalities?: string[]
          region?: string | null
          skills?: string[]
          social_links?: Json
          updated_at?: string
          user_id?: string
          visibility?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "actor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      actor_awards: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          organization: string | null
          sort_order: number
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          organization?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          organization?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "actor_awards_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      actor_credits: {
        Row: {
          actor_id: string
          created_at: string
          href: string | null
          id: string
          role: string | null
          sort_order: number
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          actor_id: string
          created_at?: string
          href?: string | null
          id?: string
          role?: string | null
          sort_order?: number
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          actor_id?: string
          created_at?: string
          href?: string | null
          id?: string
          role?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "actor_credits_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      actor_profile_views: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          viewer_id: string | null
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          viewer_id?: string | null
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "actor_profile_views_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actor_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "actor_profile_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          actor_id: string
          answers: Json
          attachments: Json
          casting_memo: string | null
          created_at: string
          id: string
          job_id: string
          memo: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          actor_id: string
          answers?: Json
          attachments?: Json
          casting_memo?: string | null
          created_at?: string
          id?: string
          job_id: string
          memo?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          actor_id?: string
          answers?: Json
          attachments?: Json
          casting_memo?: string | null
          created_at?: string
          id?: string
          job_id?: string
          memo?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actor_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          list_name: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          list_name?: string | null
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          list_name?: string | null
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      casting_profiles: {
        Row: {
          biz_number: string | null
          company_name: string
          contact: string | null
          intro: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          biz_number?: string | null
          company_name: string
          contact?: string | null
          intro?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          biz_number?: string | null
          company_name?: string
          contact?: string | null
          intro?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "casting_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          actor_id: string
          casting_id: string
          created_at: string
          id: string
          job_id: string | null
          last_message_at: string | null
        }
        Insert: {
          actor_id: string
          casting_id: string
          created_at?: string
          id?: string
          job_id?: string | null
          last_message_at?: string | null
        }
        Update: {
          actor_id?: string
          casting_id?: string
          created_at?: string
          id?: string
          job_id?: string | null
          last_message_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actor_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_rooms_casting_id_fkey"
            columns: ["casting_id"]
            isOneToOne: false
            referencedRelation: "casting_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "chat_rooms_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          casting_id: string
          created_at: string
          deadline: string | null
          description: string | null
          fee_amount: number | null
          fee_text: string | null
          fee_type: string
          genre: string | null
          id: string
          media_urls: string[]
          platforms: string[]
          production_name: string | null
          region: string | null
          requirements: string[]
          role_name: string | null
          role_type: string | null
          shooting_schedule: string | null
          status: Database["public"]["Enums"]["job_status"]
          target_age_max: number | null
          target_age_groups: string[]
          target_age_min: number | null
          target_genders: string[]
          title: string
          updated_at: string
        }
        Insert: {
          casting_id: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          fee_amount?: number | null
          fee_text?: string | null
          fee_type?: string
          genre?: string | null
          id?: string
          media_urls?: string[]
          platforms?: string[]
          production_name?: string | null
          region?: string | null
          requirements?: string[]
          role_name?: string | null
          role_type?: string | null
          shooting_schedule?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          target_age_max?: number | null
          target_age_groups?: string[]
          target_age_min?: number | null
          target_genders?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          casting_id?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          fee_amount?: number | null
          fee_text?: string | null
          fee_type?: string
          genre?: string | null
          id?: string
          media_urls?: string[]
          platforms?: string[]
          production_name?: string | null
          region?: string | null
          requirements?: string[]
          role_name?: string | null
          role_type?: string | null
          shooting_schedule?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          target_age_max?: number | null
          target_age_groups?: string[]
          target_age_min?: number | null
          target_genders?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_casting_id_fkey"
            columns: ["casting_id"]
            isOneToOne: false
            referencedRelation: "casting_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_application_questions: {
        Row: {
          created_at: string
          id: string
          job_id: string
          label: string
          required: boolean
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          label: string
          required?: boolean
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          label?: string
          required?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "job_application_questions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          body: string
          created_at: string
          id: string
          read_at: string | null
          room_id: string
          sender_id: string
        }
        Insert: {
          attachments?: Json
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          room_id: string
          sender_id: string
        }
        Update: {
          attachments?: Json
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          application_notifications_enabled: boolean
          created_at: string
          message_notifications_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          application_notifications_enabled?: boolean
          created_at?: string
          message_notifications_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          application_notifications_enabled?: boolean
          created_at?: string
          message_notifications_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          actor_id: string
          caption: string | null
          created_at: string
          id: string
          type: string
          url: string
        }
        Insert: {
          actor_id: string
          caption?: string | null
          created_at?: string
          id?: string
          type: string
          url: string
        }
        Update: {
          actor_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          type?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "actor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          marketing_consent_at: string | null
          name: string
          privacy_consent_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          marketing_consent_at?: string | null
          name: string
          privacy_consent_at?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          marketing_consent_at?: string | null
          name?: string
          privacy_consent_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_casting_profile_private: {
        Args: Record<PropertyKey, never>
        Returns: {
          company_name: string
          contact: string | null
          intro: string | null
          updated_at: string
        }[]
      }
      replace_my_actor_showcase: {
        Args: {
          target_awards: Json
          target_credits: Json
        }
        Returns: undefined
      }
      get_actor_profile_metrics: {
        Args: {
          target_actor_id: string
        }
        Returns: {
          offer_count: number
          save_count: number
          view_count: number
        }[]
      }
    }
    Enums: {
      application_status: "pending" | "reviewing" | "pass" | "hold" | "reject"
      job_status: "open" | "closed" | "draft"
      user_role: "actor" | "casting"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      application_status: ["pending", "reviewing", "pass", "hold", "reject"],
      job_status: ["open", "closed", "draft"],
      user_role: ["actor", "casting"],
    },
  },
} as const
