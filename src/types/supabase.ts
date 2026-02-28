export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      ai_chat_messages: {
        Row: {
          chat_id: string;
          content: string;
          created_at: string;
          id: string;
          role: string;
          tool_calls: Json | null;
        };
        Insert: {
          chat_id: string;
          content: string;
          created_at?: string;
          id?: string;
          role: string;
          tool_calls?: Json | null;
        };
        Update: {
          chat_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          role?: string;
          tool_calls?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "ai_chats";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_chats: {
        Row: {
          created_at: string;
          id: string;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      banks: {
        Row: {
          balance: number;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          balance: number;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          balance?: number;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          amount: number;
          created_at: string;
          currency: string;
          id: string;
          label: string;
          notes: string | null;
          period_end: string;
          period_start: string;
          tag_id: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: string;
          id?: string;
          label: string;
          notes?: string | null;
          period_end: string;
          period_start: string;
          tag_id?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          label?: string;
          notes?: string | null;
          period_end?: string;
          period_start?: string;
          tag_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      contacts: {
        Row: {
          address: string | null;
          category: string | null;
          company: string | null;
          created_at: string;
          email: string | null;
          id: string;
          is_active: boolean;
          name: string;
          notes: string | null;
          phone: string | null;
          type: Database["public"]["Enums"]["contact_type"];
          updated_at: string;
          website: string | null;
        };
        Insert: {
          address?: string | null;
          category?: string | null;
          company?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          notes?: string | null;
          phone?: string | null;
          type?: Database["public"]["Enums"]["contact_type"];
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          address?: string | null;
          category?: string | null;
          company?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          type?: Database["public"]["Enums"]["contact_type"];
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [];
      };
      email_list: {
        Row: {
          created_at: string;
          email: string;
          id: number;
        };
        Insert: {
          created_at?: string;
          email: string;
          id?: number;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: number;
        };
        Relationships: [];
      };
      reminders: {
        Row: {
          created_at: string;
          id: string;
          message: string | null;
          notify_via: string[] | null;
          remind_at: string;
          snoozed_until: string | null;
          status: Database["public"]["Enums"]["reminder_status"];
          transaction_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string | null;
          notify_via?: string[] | null;
          remind_at: string;
          snoozed_until?: string | null;
          status?: Database["public"]["Enums"]["reminder_status"];
          transaction_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string | null;
          notify_via?: string[] | null;
          remind_at?: string;
          snoozed_until?: string | null;
          status?: Database["public"]["Enums"]["reminder_status"];
          transaction_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminders_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "v_pending_payments";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          color: string | null;
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      transaction_tags: {
        Row: {
          tag_id: string;
          transaction_id: string;
        };
        Insert: {
          tag_id: string;
          transaction_id: string;
        };
        Update: {
          tag_id?: string;
          transaction_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_tags_transaction_id_fkey";
            columns: ["transaction_id"];
            isOneToOne: false;
            referencedRelation: "v_pending_payments";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          amount: number;
          attachments: Json | null;
          contact_id: string | null;
          created_at: string;
          currency: string;
          description: string | null;
          due_date: string | null;
          id: string;
          invoice_number: string | null;
          metadata: Json | null;
          notes: string | null;
          paid_date: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"] | null;
          payment_status: Database["public"]["Enums"]["payment_status"];
          receipt_url: string | null;
          reference_number: string | null;
          title: string;
          transaction_date: string;
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at: string;
        };
        Insert: {
          amount: number;
          attachments?: Json | null;
          contact_id?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_number?: string | null;
          metadata?: Json | null;
          notes?: string | null;
          paid_date?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"] | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          receipt_url?: string | null;
          reference_number?: string | null;
          title: string;
          transaction_date: string;
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          attachments?: Json | null;
          contact_id?: string | null;
          created_at?: string;
          currency?: string;
          description?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_number?: string | null;
          metadata?: Json | null;
          notes?: string | null;
          paid_date?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"] | null;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          receipt_url?: string | null;
          reference_number?: string | null;
          title?: string;
          transaction_date?: string;
          type?: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "v_contact_summary";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_contact_summary: {
        Row: {
          company: string | null;
          contact_type: Database["public"]["Enums"]["contact_type"] | null;
          id: string | null;
          last_transaction: string | null;
          name: string | null;
          net_amount: number | null;
          total_received: number | null;
          total_spent: number | null;
          total_transactions: number | null;
        };
        Relationships: [];
      };
      v_monthly_summary: {
        Row: {
          currency: string | null;
          month: string | null;
          total_amount: number | null;
          transaction_count: number | null;
          type: Database["public"]["Enums"]["transaction_type"] | null;
        };
        Relationships: [];
      };
      v_pending_payments: {
        Row: {
          amount: number | null;
          company: string | null;
          contact_name: string | null;
          contact_type: Database["public"]["Enums"]["contact_type"] | null;
          currency: string | null;
          days_until_due: number | null;
          due_date: string | null;
          id: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"] | null;
          payment_status: Database["public"]["Enums"]["payment_status"] | null;
          reference_number: string | null;
          title: string | null;
          type: Database["public"]["Enums"]["transaction_type"] | null;
        };
        Relationships: [];
      };
      v_tag_breakdown: {
        Row: {
          color: string | null;
          count: number | null;
          currency: string | null;
          tag: string | null;
          total: number | null;
          type: Database["public"]["Enums"]["transaction_type"] | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      contact_type: "client" | "vendor" | "both";
      payment_method:
        | "cash"
        | "bank_transfer"
        | "credit_card"
        | "debit_card"
        | "upi"
        | "cheque"
        | "crypto"
        | "other";
      payment_status:
        | "pending"
        | "paid"
        | "overdue"
        | "cancelled"
        | "partially_paid";
      reminder_status: "pending" | "sent" | "dismissed" | "snoozed";
      transaction_type: "income" | "expense";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema =
  DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  } ? keyof (
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
        "Tables"
      ]
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
        "Views"
      ]
    )
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
} ? (
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Tables"
    ]
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Views"
    ]
  )[TableName] extends {
    Row: infer R;
  } ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (
    & DefaultSchema["Tables"]
    & DefaultSchema["Views"]
  ) ? (
      & DefaultSchema["Tables"]
      & DefaultSchema["Views"]
    )[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    } ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Tables"
    ]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
    "Tables"
  ][TableName] extends {
    Insert: infer I;
  } ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    } ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
      "Tables"
    ]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]][
    "Tables"
  ][TableName] extends {
    Update: infer U;
  } ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    } ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]][
      "Enums"
    ]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][
    EnumName
  ]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[
      PublicCompositeTypeNameOrOptions["schema"]
    ]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]][
    "CompositeTypes"
  ][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      contact_type: ["client", "vendor", "both"],
      payment_method: [
        "cash",
        "bank_transfer",
        "credit_card",
        "debit_card",
        "upi",
        "cheque",
        "crypto",
        "other",
      ],
      payment_status: [
        "pending",
        "paid",
        "overdue",
        "cancelled",
        "partially_paid",
      ],
      reminder_status: ["pending", "sent", "dismissed", "snoozed"],
      transaction_type: ["income", "expense"],
    },
  },
} as const;
