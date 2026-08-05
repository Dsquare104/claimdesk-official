export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      claims: {
        Row: {
          agent_assigne_id: string | null;
          client_id: string;
          client_nom: string;
          commentaire_interne: string | null;
          consentement_rgpd: boolean;
          date_achat: string;
          date_creation: string;
          date_livraison: string | null;
          date_resolution: string | null;
          description: string;
          id: string;
          motif_qualification: string | null;
          numero_dossier: string;
          pays: string;
          produit: string;
          recevable: boolean | null;
          remede: string | null;
          statut: Database["public"]["Enums"]["claim_status"];
          temps_traitement_jours: number | null;
          type_reclamation: Database["public"]["Enums"]["claim_type"];
        };
        Insert: {
          agent_assigne_id?: string | null;
          client_id: string;
          client_nom: string;
          commentaire_interne?: string | null;
          consentement_rgpd?: boolean;
          date_achat: string;
          date_creation?: string;
          date_livraison?: string | null;
          date_resolution?: string | null;
          description: string;
          id?: string;
          motif_qualification?: string | null;
          numero_dossier?: string;
          pays: string;
          produit: string;
          recevable?: boolean | null;
          remede?: string | null;
          statut?: Database["public"]["Enums"]["claim_status"];
          temps_traitement_jours?: number | null;
          type_reclamation: Database["public"]["Enums"]["claim_type"];
        };
        Update: {
          agent_assigne_id?: string | null;
          client_id?: string;
          client_nom?: string;
          commentaire_interne?: string | null;
          consentement_rgpd?: boolean;
          date_achat?: string;
          date_creation?: string;
          date_livraison?: string | null;
          date_resolution?: string | null;
          description?: string;
          id?: string;
          motif_qualification?: string | null;
          numero_dossier?: string;
          pays?: string;
          produit?: string;
          recevable?: boolean | null;
          remede?: string | null;
          statut?: Database["public"]["Enums"]["claim_status"];
          temps_traitement_jours?: number | null;
          type_reclamation?: Database["public"]["Enums"]["claim_type"];
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          consentement_rgpd: boolean;
          created_at: string;
          email: string | null;
          id: string;
          nom: string | null;
        };
        Insert: {
          consentement_rgpd?: boolean;
          created_at?: string;
          email?: string | null;
          id: string;
          nom?: string | null;
        };
        Update: {
          consentement_rgpd?: boolean;
          created_at?: string;
          email?: string | null;
          id?: string;
          nom?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "client" | "agent" | "manager";
      claim_status: "cree" | "qualifie" | "rejete" | "instruction" | "resolu" | "escalade";
      claim_type: "retractation" | "non_conformite" | "livraison" | "facturation";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["client", "agent", "manager"],
      claim_status: ["cree", "qualifie", "rejete", "instruction", "resolu", "escalade"],
      claim_type: ["retractation", "non_conformite", "livraison", "facturation"],
    },
  },
} as const;
