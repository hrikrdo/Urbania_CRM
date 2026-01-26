export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string
          name: string
          permissions: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          permissions?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          permissions?: Json
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          role_id: string | null
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role_id?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role_id?: string | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          manager_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          manager_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          manager_id?: string | null
          created_at?: string
        }
      }
      team_members: {
        Row: {
          team_id: string
          user_id: string
        }
        Insert: {
          team_id: string
          user_id: string
        }
        Update: {
          team_id?: string
          user_id?: string
        }
      }
      lead_statuses: {
        Row: {
          id: string
          name: string
          slug: string
          color: string
          position: number
          is_active: boolean
          auto_transition_to: string | null
          auto_transition_hours: number | null
          module: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          color?: string
          position: number
          is_active?: boolean
          auto_transition_to?: string | null
          auto_transition_hours?: number | null
          module?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          color?: string
          position?: number
          is_active?: boolean
          auto_transition_to?: string | null
          auto_transition_hours?: number | null
          module?: string | null
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          first_name: string
          last_name: string | null
          email: string | null
          phone: string | null
          phone_secondary: string | null
          cedula: string | null
          status_id: string
          assigned_to: string | null
          assigned_at: string | null
          previous_assigned_to: string | null
          project_id: string | null
          unit_type_preference: string | null
          budget_min: number | null
          budget_max: number | null
          source: string | null
          source_campaign_id: string | null
          source_ad_id: string | null
          source_adset_id: string | null
          source_keyword: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          call_attempts: number
          chat_attempts: number
          last_contact_at: string | null
          last_response_at: string | null
          lead_score: number
          temperature: string
          pool_entered_at: string | null
          pool_claimed_by: string | null
          pool_claimed_at: string | null
          attention_deadline: string | null
          attention_expired: boolean
          tags: Json
          custom_fields: Json
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          first_name: string
          last_name?: string | null
          email?: string | null
          phone?: string | null
          phone_secondary?: string | null
          cedula?: string | null
          status_id: string
          assigned_to?: string | null
          assigned_at?: string | null
          previous_assigned_to?: string | null
          project_id?: string | null
          unit_type_preference?: string | null
          budget_min?: number | null
          budget_max?: number | null
          source?: string | null
          source_campaign_id?: string | null
          source_ad_id?: string | null
          source_adset_id?: string | null
          source_keyword?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          call_attempts?: number
          chat_attempts?: number
          last_contact_at?: string | null
          last_response_at?: string | null
          lead_score?: number
          temperature?: string
          pool_entered_at?: string | null
          pool_claimed_by?: string | null
          pool_claimed_at?: string | null
          attention_deadline?: string | null
          attention_expired?: boolean
          tags?: Json
          custom_fields?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string | null
          email?: string | null
          phone?: string | null
          phone_secondary?: string | null
          cedula?: string | null
          status_id?: string
          assigned_to?: string | null
          assigned_at?: string | null
          previous_assigned_to?: string | null
          project_id?: string | null
          unit_type_preference?: string | null
          budget_min?: number | null
          budget_max?: number | null
          source?: string | null
          source_campaign_id?: string | null
          source_ad_id?: string | null
          source_adset_id?: string | null
          source_keyword?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          call_attempts?: number
          chat_attempts?: number
          last_contact_at?: string | null
          last_response_at?: string | null
          lead_score?: number
          temperature?: string
          pool_entered_at?: string | null
          pool_claimed_by?: string | null
          pool_claimed_at?: string | null
          attention_deadline?: string | null
          attention_expired?: boolean
          tags?: Json
          custom_fields?: Json
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_status_id_fkey"
            columns: ["status_id"]
            referencedRelation: "lead_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_project_id_fkey"
            columns: ["project_id"]
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          name: string
          slug: string | null
          description: string | null
          address: string | null
          city: string | null
          latitude: number | null
          longitude: number | null
          type: string | null
          status: string
          total_units: number
          available_units: number
          price_from: number | null
          price_to: number | null
          amenities: Json
          images: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string | null
          description?: string | null
          address?: string | null
          city?: string | null
          latitude?: number | null
          longitude?: number | null
          type?: string | null
          status?: string
          total_units?: number
          available_units?: number
          price_from?: number | null
          price_to?: number | null
          amenities?: Json
          images?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string | null
          description?: string | null
          address?: string | null
          city?: string | null
          latitude?: number | null
          longitude?: number | null
          type?: string | null
          status?: string
          total_units?: number
          available_units?: number
          price_from?: number | null
          price_to?: number | null
          amenities?: Json
          images?: Json
          created_at?: string
          updated_at?: string
        }
      }
      unit_types: {
        Row: {
          id: string
          project_id: string
          name: string | null
          bedrooms: number | null
          bathrooms: number | null
          area_m2: number | null
          base_price: number | null
          floor_plan_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          area_m2?: number | null
          base_price?: number | null
          floor_plan_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          name?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          area_m2?: number | null
          base_price?: number | null
          floor_plan_url?: string | null
          created_at?: string
        }
      }
      units: {
        Row: {
          id: string
          project_id: string
          unit_type_id: string | null
          unit_number: string
          floor: number | null
          view: string | null
          area_m2: number | null
          price: number
          status: string
          reserved_by: string | null
          reserved_at: string | null
          sold_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          unit_type_id?: string | null
          unit_number: string
          floor?: number | null
          view?: string | null
          area_m2?: number | null
          price: number
          status?: string
          reserved_by?: string | null
          reserved_at?: string | null
          sold_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          unit_type_id?: string | null
          unit_number?: string
          floor?: number | null
          view?: string | null
          area_m2?: number | null
          price?: number
          status?: string
          reserved_by?: string | null
          reserved_at?: string | null
          sold_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activities: {
        Row: {
          id: string
          lead_id: string | null
          user_id: string | null
          type: string
          title: string | null
          description: string | null
          metadata: Json
          is_automated: boolean
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          user_id?: string | null
          type: string
          title?: string | null
          description?: string | null
          metadata?: Json
          is_automated?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          user_id?: string | null
          type?: string
          title?: string | null
          description?: string | null
          metadata?: Json
          is_automated?: boolean
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          lead_id: string | null
          assigned_to: string | null
          created_by: string | null
          title: string
          description: string | null
          due_date: string | null
          priority: string
          status: string
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          title: string
          description?: string | null
          due_date?: string | null
          priority?: string
          status?: string
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: string
          status?: string
          completed_at?: string | null
          created_at?: string
        }
      }
      credit_checks: {
        Row: {
          id: string
          lead_id: string
          verified_by: string | null
          cedula: string
          apc_status: string | null
          apc_score: number | null
          apc_verified_at: string | null
          apc_notes: string | null
          monthly_income: number | null
          income_verified: boolean
          employment_type: string | null
          employer_name: string | null
          bank_name: string | null
          prequalified: boolean | null
          prequalified_amount: number | null
          prequalified_rate: number | null
          prequalified_term_months: number | null
          estimated_monthly_payment: number | null
          prequalification_date: string | null
          prequalification_expires: string | null
          prequalification_notes: string | null
          formal_approval: boolean | null
          formal_approval_date: string | null
          formal_approval_amount: number | null
          formal_approval_notes: string | null
          result: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          verified_by?: string | null
          cedula: string
          apc_status?: string | null
          apc_score?: number | null
          apc_verified_at?: string | null
          apc_notes?: string | null
          monthly_income?: number | null
          income_verified?: boolean
          employment_type?: string | null
          employer_name?: string | null
          bank_name?: string | null
          prequalified?: boolean | null
          prequalified_amount?: number | null
          prequalified_rate?: number | null
          prequalified_term_months?: number | null
          estimated_monthly_payment?: number | null
          prequalification_date?: string | null
          prequalification_expires?: string | null
          prequalification_notes?: string | null
          formal_approval?: boolean | null
          formal_approval_date?: string | null
          formal_approval_amount?: number | null
          formal_approval_notes?: string | null
          result?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          verified_by?: string | null
          cedula?: string
          apc_status?: string | null
          apc_score?: number | null
          apc_verified_at?: string | null
          apc_notes?: string | null
          monthly_income?: number | null
          income_verified?: boolean
          employment_type?: string | null
          employer_name?: string | null
          bank_name?: string | null
          prequalified?: boolean | null
          prequalified_amount?: number | null
          prequalified_rate?: number | null
          prequalified_term_months?: number | null
          estimated_monthly_payment?: number | null
          prequalification_date?: string | null
          prequalification_expires?: string | null
          prequalification_notes?: string | null
          formal_approval?: boolean | null
          formal_approval_date?: string | null
          formal_approval_amount?: number | null
          formal_approval_notes?: string | null
          result?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          lead_id: string | null
          unit_id: string | null
          project_id: string | null
          unit_price: number
          separation_amount: number | null
          initial_payment: number | null
          notary_costs: number | null
          status: string
          separation_paid: boolean
          separation_paid_at: string | null
          initial_payment_paid: boolean
          initial_payment_paid_at: string | null
          bank_disbursement_amount: number | null
          bank_disbursement_date: string | null
          delivery_scheduled_at: string | null
          delivery_completed_at: string | null
          delivery_notes: string | null
          contract_url: string | null
          deed_url: string | null
          cancelled_at: string | null
          cancellation_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          unit_id?: string | null
          project_id?: string | null
          unit_price: number
          separation_amount?: number | null
          initial_payment?: number | null
          notary_costs?: number | null
          status?: string
          separation_paid?: boolean
          separation_paid_at?: string | null
          initial_payment_paid?: boolean
          initial_payment_paid_at?: string | null
          bank_disbursement_amount?: number | null
          bank_disbursement_date?: string | null
          delivery_scheduled_at?: string | null
          delivery_completed_at?: string | null
          delivery_notes?: string | null
          contract_url?: string | null
          deed_url?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          unit_id?: string | null
          project_id?: string | null
          unit_price?: number
          separation_amount?: number | null
          initial_payment?: number | null
          notary_costs?: number | null
          status?: string
          separation_paid?: boolean
          separation_paid_at?: string | null
          initial_payment_paid?: boolean
          initial_payment_paid_at?: string | null
          bank_disbursement_amount?: number | null
          bank_disbursement_date?: string | null
          delivery_scheduled_at?: string | null
          delivery_completed_at?: string | null
          delivery_notes?: string | null
          contract_url?: string | null
          deed_url?: string | null
          cancelled_at?: string | null
          cancellation_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          reservation_id: string | null
          lead_id: string | null
          type: string
          amount: number
          payment_method: string | null
          reference_number: string | null
          status: string
          confirmed_by: string | null
          confirmed_at: string | null
          notes: string | null
          receipt_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reservation_id?: string | null
          lead_id?: string | null
          type: string
          amount: number
          payment_method?: string | null
          reference_number?: string | null
          status?: string
          confirmed_by?: string | null
          confirmed_at?: string | null
          notes?: string | null
          receipt_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reservation_id?: string | null
          lead_id?: string | null
          type?: string
          amount?: number
          payment_method?: string | null
          reference_number?: string | null
          status?: string
          confirmed_by?: string | null
          confirmed_at?: string | null
          notes?: string | null
          receipt_url?: string | null
          created_at?: string
        }
      }
      appointments: {
        Row: {
          id: string
          lead_id: string | null
          project_id: string | null
          assigned_to: string | null
          created_by: string | null
          type: string
          title: string | null
          description: string | null
          location: string | null
          scheduled_at: string
          duration_minutes: number
          reminder_sent: boolean
          confirmation_sent: boolean
          client_confirmed: boolean | null
          client_confirmed_at: string | null
          status: string
          attended: boolean | null
          outcome: string | null
          follow_up_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          project_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          type: string
          title?: string | null
          description?: string | null
          location?: string | null
          scheduled_at: string
          duration_minutes?: number
          reminder_sent?: boolean
          confirmation_sent?: boolean
          client_confirmed?: boolean | null
          client_confirmed_at?: string | null
          status?: string
          attended?: boolean | null
          outcome?: string | null
          follow_up_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          project_id?: string | null
          assigned_to?: string | null
          created_by?: string | null
          type?: string
          title?: string | null
          description?: string | null
          location?: string | null
          scheduled_at?: string
          duration_minutes?: number
          reminder_sent?: boolean
          confirmation_sent?: boolean
          client_confirmed?: boolean | null
          client_confirmed_at?: string | null
          status?: string
          attended?: boolean | null
          outcome?: string | null
          follow_up_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          project_id: string | null
          name: string
          platform: string
          external_id: string | null
          budget_daily: number | null
          budget_total: number | null
          budget_spent: number
          impressions: number
          clicks: number
          leads_count: number
          conversions: number
          cost_per_lead: number | null
          cost_per_conversion: number | null
          whatsapp_conversations: number
          status: string
          start_date: string | null
          end_date: string | null
          last_sync_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          name: string
          platform: string
          external_id?: string | null
          budget_daily?: number | null
          budget_total?: number | null
          budget_spent?: number
          impressions?: number
          clicks?: number
          leads_count?: number
          conversions?: number
          cost_per_lead?: number | null
          cost_per_conversion?: number | null
          whatsapp_conversations?: number
          status?: string
          start_date?: string | null
          end_date?: string | null
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          name?: string
          platform?: string
          external_id?: string | null
          budget_daily?: number | null
          budget_total?: number | null
          budget_spent?: number
          impressions?: number
          clicks?: number
          leads_count?: number
          conversions?: number
          cost_per_lead?: number | null
          cost_per_conversion?: number | null
          whatsapp_conversations?: number
          status?: string
          start_date?: string | null
          end_date?: string | null
          last_sync_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          lead_id: string | null
          reservation_id: string | null
          uploaded_by: string | null
          name: string
          type: string | null
          file_url: string
          file_size: number | null
          mime_type: string | null
          verified: boolean
          verified_by: string | null
          verified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          reservation_id?: string | null
          uploaded_by?: string | null
          name: string
          type?: string | null
          file_url: string
          file_size?: number | null
          mime_type?: string | null
          verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          reservation_id?: string | null
          uploaded_by?: string | null
          name?: string
          type?: string | null
          file_url?: string
          file_size?: number | null
          mime_type?: string | null
          verified?: boolean
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          lead_id: string | null
          type: string
          title: string
          message: string | null
          link: string | null
          read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lead_id?: string | null
          type: string
          title: string
          message?: string | null
          link?: string | null
          read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lead_id?: string | null
          type?: string
          title?: string
          message?: string | null
          link?: string | null
          read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      achievements: {
        Row: {
          id: string
          user_id: string | null
          lead_id: string | null
          project_id: string | null
          type: string
          title: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          lead_id?: string | null
          project_id?: string | null
          type: string
          title: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          lead_id?: string | null
          project_id?: string | null
          type?: string
          title?: string
          description?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          lead_id: string | null
          phone_number: string
          whatsapp_conversation_id: string | null
          assigned_to: string | null
          status: string
          last_message_at: string | null
          unread_count: number
          created_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          phone_number: string
          whatsapp_conversation_id?: string | null
          assigned_to?: string | null
          status?: string
          last_message_at?: string | null
          unread_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          phone_number?: string
          whatsapp_conversation_id?: string | null
          assigned_to?: string | null
          status?: string
          last_message_at?: string | null
          unread_count?: number
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          whatsapp_message_id: string | null
          direction: string
          message_type: string
          content: string | null
          media_url: string | null
          media_mime_type: string | null
          status: string
          sent_by: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          whatsapp_message_id?: string | null
          direction: string
          message_type: string
          content?: string | null
          media_url?: string | null
          media_mime_type?: string | null
          status?: string
          sent_by?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          whatsapp_message_id?: string | null
          direction?: string
          message_type?: string
          content?: string | null
          media_url?: string | null
          media_mime_type?: string | null
          status?: string
          sent_by?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      message_templates: {
        Row: {
          id: string
          name: string
          category: string | null
          language: string
          content: string
          variables: Json | null
          status: string
          whatsapp_template_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string | null
          language?: string
          content: string
          variables?: Json | null
          status?: string
          whatsapp_template_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string | null
          language?: string
          content?: string
          variables?: Json | null
          status?: string
          whatsapp_template_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_type:
        | "call_outbound"
        | "call_inbound"
        | "call_missed"
        | "whatsapp_sent"
        | "whatsapp_received"
        | "email_sent"
        | "email_received"
        | "meeting_scheduled"
        | "meeting_completed"
        | "meeting_cancelled"
        | "note_added"
        | "document_uploaded"
        | "status_changed"
        | "assignment_changed"
        | "reservation_created"
        | "payment_received"
        | "system_notification"
    }
  }
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]

// Convenience types
export type Role = Tables<"roles">
export type User = Tables<"users">
export type UserInsert = InsertTables<"users">
export type UserUpdate = UpdateTables<"users">

export type Team = Tables<"teams">
export type TeamMember = Tables<"team_members">

export type LeadStatus = Tables<"lead_statuses">
export type LeadStatusInsert = InsertTables<"lead_statuses">

export type Lead = Tables<"leads">
export type LeadInsert = InsertTables<"leads">
export type LeadUpdate = UpdateTables<"leads">

export type Project = Tables<"projects">
export type ProjectInsert = InsertTables<"projects">
export type ProjectUpdate = UpdateTables<"projects">

export type UnitType = Tables<"unit_types">
export type Unit = Tables<"units">
export type UnitInsert = InsertTables<"units">
export type UnitUpdate = UpdateTables<"units">

export type Activity = Tables<"activities">
export type ActivityInsert = InsertTables<"activities">

export type Task = Tables<"tasks">
export type TaskInsert = InsertTables<"tasks">
export type TaskUpdate = UpdateTables<"tasks">

export type CreditCheck = Tables<"credit_checks">
export type CreditCheckInsert = InsertTables<"credit_checks">
export type CreditCheckUpdate = UpdateTables<"credit_checks">

export type Reservation = Tables<"reservations">
export type ReservationInsert = InsertTables<"reservations">
export type ReservationUpdate = UpdateTables<"reservations">

export type Payment = Tables<"payments">
export type PaymentInsert = InsertTables<"payments">

export type Appointment = Tables<"appointments">
export type AppointmentInsert = InsertTables<"appointments">
export type AppointmentUpdate = UpdateTables<"appointments">

export type Campaign = Tables<"campaigns">
export type Document = Tables<"documents">
export type Notification = Tables<"notifications">
export type Achievement = Tables<"achievements">

export type Conversation = Tables<"conversations">
export type ConversationInsert = InsertTables<"conversations">

export type Message = Tables<"messages">
export type MessageInsert = InsertTables<"messages">

export type MessageTemplate = Tables<"message_templates">

// Enum types
export type ActivityType = Database["public"]["Enums"]["activity_type"]

// Extended types with relations
export type LeadWithRelations = Lead & {
  status?: LeadStatus
  assigned_user?: User
  project?: Project
  activities?: Activity[]
  tasks?: Task[]
  appointments?: Appointment[]
  credit_check?: CreditCheck
}

export type UserWithRole = User & {
  role?: Role
}
