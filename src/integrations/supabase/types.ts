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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analysis_results: {
        Row: {
          ai_explanation: Json | null
          application_id: string
          approval_probability: number | null
          created_at: string
          debt_to_income_ratio: number | null
          emi_affordability: string | null
          factors: Json | null
          financial_health_score: number | null
          id: string
          recommended_banks: Json | null
          risk_category: string | null
          roadmap: Json | null
        }
        Insert: {
          ai_explanation?: Json | null
          application_id: string
          approval_probability?: number | null
          created_at?: string
          debt_to_income_ratio?: number | null
          emi_affordability?: string | null
          factors?: Json | null
          financial_health_score?: number | null
          id?: string
          recommended_banks?: Json | null
          risk_category?: string | null
          roadmap?: Json | null
        }
        Update: {
          ai_explanation?: Json | null
          application_id?: string
          approval_probability?: number | null
          created_at?: string
          debt_to_income_ratio?: number | null
          emi_affordability?: string | null
          factors?: Json | null
          financial_health_score?: number | null
          id?: string
          recommended_banks?: Json | null
          risk_category?: string | null
          roadmap?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      loan_applications: {
        Row: {
          age: number | null
          bank_balance: number | null
          car_year: number | null
          created_at: string
          credit_score: number | null
          dependent_children: number | null
          education: string | null
          employer_name: string | null
          existing_loans: number | null
          family_members: number | null
          gender: string | null
          has_collateral: boolean | null
          has_health_insurance: boolean | null
          has_investments: boolean | null
          has_life_insurance: boolean | null
          has_vehicle_insurance: boolean | null
          id: string
          income_stability: string | null
          job_type: string | null
          language: string | null
          loan_amount: number | null
          loan_purpose: string | null
          loan_tenure: number | null
          location_city: string | null
          location_state: string | null
          marital_status: string | null
          monthly_income: number | null
          monthly_savings: number | null
          owns_car: boolean | null
          owns_house: boolean | null
          property_value: number | null
          secondary_income: boolean | null
          session_id: string
          total_monthly_expenses: number | null
          years_experience: number | null
        }
        Insert: {
          age?: number | null
          bank_balance?: number | null
          car_year?: number | null
          created_at?: string
          credit_score?: number | null
          dependent_children?: number | null
          education?: string | null
          employer_name?: string | null
          existing_loans?: number | null
          family_members?: number | null
          gender?: string | null
          has_collateral?: boolean | null
          has_health_insurance?: boolean | null
          has_investments?: boolean | null
          has_life_insurance?: boolean | null
          has_vehicle_insurance?: boolean | null
          id?: string
          income_stability?: string | null
          job_type?: string | null
          language?: string | null
          loan_amount?: number | null
          loan_purpose?: string | null
          loan_tenure?: number | null
          location_city?: string | null
          location_state?: string | null
          marital_status?: string | null
          monthly_income?: number | null
          monthly_savings?: number | null
          owns_car?: boolean | null
          owns_house?: boolean | null
          property_value?: number | null
          secondary_income?: boolean | null
          session_id: string
          total_monthly_expenses?: number | null
          years_experience?: number | null
        }
        Update: {
          age?: number | null
          bank_balance?: number | null
          car_year?: number | null
          created_at?: string
          credit_score?: number | null
          dependent_children?: number | null
          education?: string | null
          employer_name?: string | null
          existing_loans?: number | null
          family_members?: number | null
          gender?: string | null
          has_collateral?: boolean | null
          has_health_insurance?: boolean | null
          has_investments?: boolean | null
          has_life_insurance?: boolean | null
          has_vehicle_insurance?: boolean | null
          id?: string
          income_stability?: string | null
          job_type?: string | null
          language?: string | null
          loan_amount?: number | null
          loan_purpose?: string | null
          loan_tenure?: number | null
          location_city?: string | null
          location_state?: string | null
          marital_status?: string | null
          monthly_income?: number | null
          monthly_savings?: number | null
          owns_car?: boolean | null
          owns_house?: boolean | null
          property_value?: number | null
          secondary_income?: boolean | null
          session_id?: string
          total_monthly_expenses?: number | null
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
