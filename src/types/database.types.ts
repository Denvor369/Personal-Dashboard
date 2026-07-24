export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string;
          id: string;
          locale: string;
          profile_completed: boolean;
          theme: 'system' | 'light' | 'dark';
          timezone: string;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          locale?: string;
          profile_completed?: boolean;
          theme?: 'system' | 'light' | 'dark';
          timezone?: string;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          locale?: string;
          profile_completed?: boolean;
          theme?: 'system' | 'light' | 'dark';
          timezone?: string;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: Relationship[];
      };
      connected_accounts: {
        Row: {
          access_token: string;
          account_label: string;
          created_at: string;
          id: string;
          provider: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_token: string;
          account_label?: string;
          created_at?: string;
          id?: string;
          provider: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token?: string;
          account_label?: string;
          created_at?: string;
          id?: string;
          provider?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: Relationship[];
      };
      inbox_items: {
        Row: {
          archived: boolean;
          attachment_path: string | null;
          created_at: string;
          description: string;
          id: string;
          processed: boolean;
          processed_at: string | null;
          properties: Json;
          related_id: string | null;
          related_type: string | null;
          search_vector: string | null;
          title: string;
          type: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived?: boolean;
          attachment_path?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          processed?: boolean;
          processed_at?: string | null;
          properties?: Json;
          related_id?: string | null;
          related_type?: string | null;
          search_vector?: never;
          title: string;
          type: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived?: boolean;
          attachment_path?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          processed?: boolean;
          processed_at?: string | null;
          properties?: Json;
          related_id?: string | null;
          related_type?: string | null;
          search_vector?: never;
          title?: string;
          type?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: Relationship[];
      };
      item_links: {
        Row: {
          created_at: string;
          id: string;
          relationship_type: string;
          source_id: string;
          source_type: string;
          target_id: string;
          target_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          relationship_type?: string;
          source_id: string;
          source_type: string;
          target_id: string;
          target_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          relationship_type?: string;
          source_id?: string;
          source_type?: string;
          target_id?: string;
          target_type?: string;
          user_id?: string;
        };
        Relationships: Relationship[];
      };
      item_tags: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          item_type: string;
          tag_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          item_type: string;
          tag_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          item_type?: string;
          tag_id?: string;
          user_id?: string;
        };
        Relationships: Relationship[];
      };
      note_templates: {
        Row: {
          archived: boolean;
          content: string;
          created_at: string;
          description: string;
          icon: string;
          id: string;
          name: string;
          properties: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived?: boolean;
          content?: string;
          created_at?: string;
          description?: string;
          icon?: string;
          id?: string;
          name: string;
          properties?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived?: boolean;
          content?: string;
          created_at?: string;
          description?: string;
          icon?: string;
          id?: string;
          name?: string;
          properties?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: Relationship[];
      };
      notes: {
        Row: {
          archived: boolean;
          content: string;
          created_at: string;
          id: string;
          pinned: boolean;
          properties: Json;
          search_vector: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived?: boolean;
          content?: string;
          created_at?: string;
          id?: string;
          pinned?: boolean;
          properties?: Json;
          search_vector?: never;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived?: boolean;
          content?: string;
          created_at?: string;
          id?: string;
          pinned?: boolean;
          properties?: Json;
          search_vector?: never;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: Relationship[];
      };
      smart_collections: {
        Row: {
          created_at: string;
          filters: Json;
          icon: string;
          id: string;
          name: string;
          pinned: boolean;
          preferred_layout: string;
          record_types: string[];
          sorting: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          filters?: Json;
          icon?: string;
          id?: string;
          name: string;
          pinned?: boolean;
          preferred_layout?: string;
          record_types?: string[];
          sorting?: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          filters?: Json;
          icon?: string;
          id?: string;
          name?: string;
          pinned?: boolean;
          preferred_layout?: string;
          record_types?: string[];
          sorting?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: Relationship[];
      };
      skills: {
        Row: {
          category: 'Music' | 'DevOps' | 'Programming' | 'Language' | 'Fitness' | 'Design' | 'Other';
          created_at: string;
          goal: string;
          id: string;
          name: string;
          practice_minutes: number;
          progress: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category?: 'Music' | 'DevOps' | 'Programming' | 'Language' | 'Fitness' | 'Design' | 'Other';
          created_at?: string;
          goal?: string;
          id?: string;
          name: string;
          practice_minutes?: number;
          progress?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: 'Music' | 'DevOps' | 'Programming' | 'Language' | 'Fitness' | 'Design' | 'Other';
          created_at?: string;
          goal?: string;
          id?: string;
          name?: string;
          practice_minutes?: number;
          progress?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: Relationship[];
      };
      tasks: {
        Row: {
          completed_at: string | null;
          created_at: string;
          description: string | null;
          due_at: string | null;
          id: string;
          position: number;
          priority: 'high' | 'medium' | 'low';
          project: string | null;
          status: 'today' | 'upcoming' | 'completed';
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          position?: number;
          priority?: 'high' | 'medium' | 'low';
          project?: string | null;
          status?: 'today' | 'upcoming' | 'completed';
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          description?: string | null;
          due_at?: string | null;
          id?: string;
          position?: number;
          priority?: 'high' | 'medium' | 'low';
          project?: string | null;
          status?: 'today' | 'upcoming' | 'completed';
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: Relationship[];
      };
      tags: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          normalized_name: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          normalized_name?: never;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          normalized_name?: never;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: Relationship[];
      };
    };
    Views: Record<string, never>;
    Functions: {
      ensure_default_note_templates: {
        Args: Record<PropertyKey, never>;
        Returns: Database['public']['Tables']['note_templates']['Row'][];
      };
      search_knowledge: {
        Args: { result_limit?: number; result_offset?: number; search_query: string };
        Returns: {
          id: string;
          preview: string;
          rank: number;
          record_type: string;
          title: string;
          updated_at: string;
        }[];
      };
      set_note_tags: {
        Args: { note_id: string; tag_names: string[] };
        Returns: Database['public']['Tables']['tags']['Row'][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type TableRow<Table extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Table]['Row'];
export type TableInsert<Table extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Table]['Insert'];
export type TableUpdate<Table extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][Table]['Update'];
