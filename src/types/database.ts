import { Database as SupabaseDatabase } from './supabase';

// Extend the Supabase Database type with our custom tables
export interface Database extends SupabaseDatabase {
  public: {
    Tables: {
      // Include existing tables from SupabaseDatabase
      ...SupabaseDatabase['public']['Tables'],
      
      // Add our custom ai_chat_history table
      ai_chat_history: {
        Row: {
          id: string;
          user_id: string;
          messages: string; // Stored as JSON string
          summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          messages: string;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          messages?: string;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_chat_history_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
  };
} 