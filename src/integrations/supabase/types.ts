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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      agent_traces: {
        Row: {
          agent_name: string
          created_at: string
          error: string | null
          id: string
          input: Json | null
          latency_ms: number | null
          model: string | null
          output: Json | null
          reasoning: string | null
          run_id: string
          status: string
          step_order: number
          tokens_in: number | null
          tokens_out: number | null
        }
        Insert: {
          agent_name: string
          created_at?: string
          error?: string | null
          id?: string
          input?: Json | null
          latency_ms?: number | null
          model?: string | null
          output?: Json | null
          reasoning?: string | null
          run_id: string
          status?: string
          step_order?: number
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Update: {
          agent_name?: string
          created_at?: string
          error?: string | null
          id?: string
          input?: Json | null
          latency_ms?: number | null
          model?: string | null
          output?: Json | null
          reasoning?: string | null
          run_id?: string
          status?: string
          step_order?: number
          tokens_in?: number | null
          tokens_out?: number | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      broadcast_segments: {
        Row: {
          broadcast_id: string
          created_at: string
          duration_s: number
          event_cluster_id: string | null
          id: string
          kind: string
          played_at: string | null
          script: string
          segment_order: number
          voice: string
        }
        Insert: {
          broadcast_id: string
          created_at?: string
          duration_s?: number
          event_cluster_id?: string | null
          id?: string
          kind: string
          played_at?: string | null
          script: string
          segment_order: number
          voice?: string
        }
        Update: {
          broadcast_id?: string
          created_at?: string
          duration_s?: number
          event_cluster_id?: string | null
          id?: string
          kind?: string
          played_at?: string | null
          script?: string
          segment_order?: number
          voice?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_segments_broadcast_id_fkey"
            columns: ["broadcast_id"]
            isOneToOne: false
            referencedRelation: "live_broadcasts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_segments_event_cluster_id_fkey"
            columns: ["event_cluster_id"]
            isOneToOne: false
            referencedRelation: "event_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_evidence: {
        Row: {
          claim_id: string
          created_at: string
          excerpt: string | null
          id: string
          retrieved_at: string
          source_id: string | null
          stance: string
          url: string | null
          weight: number
        }
        Insert: {
          claim_id: string
          created_at?: string
          excerpt?: string | null
          id?: string
          retrieved_at?: string
          source_id?: string | null
          stance: string
          url?: string | null
          weight?: number
        }
        Update: {
          claim_id?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          retrieved_at?: string
          source_id?: string | null
          stance?: string
          url?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "claim_evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_evidence_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sources"
            referencedColumns: ["id"]
          },
        ]
      }
      claims: {
        Row: {
          claim_text: string
          confidence: number
          created_at: string
          embedding: string | null
          entities: Json
          first_seen_at: string
          id: string
          last_seen_at: string
          metadata: Json
          normalized_text: string
          status: string
          topic: string | null
          updated_at: string
          verification_count: number
        }
        Insert: {
          claim_text: string
          confidence?: number
          created_at?: string
          embedding?: string | null
          entities?: Json
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json
          normalized_text: string
          status?: string
          topic?: string | null
          updated_at?: string
          verification_count?: number
        }
        Update: {
          claim_text?: string
          confidence?: number
          created_at?: string
          embedding?: string | null
          entities?: Json
          first_seen_at?: string
          id?: string
          last_seen_at?: string
          metadata?: Json
          normalized_text?: string
          status?: string
          topic?: string | null
          updated_at?: string
          verification_count?: number
        }
        Relationships: []
      }
      entities: {
        Row: {
          aliases: string[]
          created_at: string
          embedding: string | null
          id: string
          last_seen_at: string
          mention_count: number
          metadata: Json
          name: string
          salience: number
          type: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          embedding?: string | null
          id?: string
          last_seen_at?: string
          mention_count?: number
          metadata?: Json
          name: string
          salience?: number
          type: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          embedding?: string | null
          id?: string
          last_seen_at?: string
          mention_count?: number
          metadata?: Json
          name?: string
          salience?: number
          type?: string
        }
        Relationships: []
      }
      entity_edges: {
        Row: {
          created_at: string
          dst_entity: string
          evidence_claim_ids: string[]
          id: string
          last_seen: string
          relation: string
          src_entity: string
          weight: number
        }
        Insert: {
          created_at?: string
          dst_entity: string
          evidence_claim_ids?: string[]
          id?: string
          last_seen?: string
          relation: string
          src_entity: string
          weight?: number
        }
        Update: {
          created_at?: string
          dst_entity?: string
          evidence_claim_ids?: string[]
          id?: string
          last_seen?: string
          relation?: string
          src_entity?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "entity_edges_dst_entity_fkey"
            columns: ["dst_entity"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_edges_src_entity_fkey"
            columns: ["src_entity"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_mentions: {
        Row: {
          claim_id: string
          confidence: number
          created_at: string
          entity_id: string
          id: string
          span: string | null
        }
        Insert: {
          claim_id: string
          confidence?: number
          created_at?: string
          entity_id: string
          id?: string
          span?: string | null
        }
        Update: {
          claim_id?: string
          confidence?: number
          created_at?: string
          entity_id?: string
          id?: string
          span?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_mentions_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_mentions_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      event_clusters: {
        Row: {
          broadcasted_at: string | null
          claim_ids: string[]
          embedding: string | null
          entity_ids: string[]
          hotness: number
          id: string
          label: string
          last_updated: string
          started_at: string
          summary: string | null
        }
        Insert: {
          broadcasted_at?: string | null
          claim_ids?: string[]
          embedding?: string | null
          entity_ids?: string[]
          hotness?: number
          id?: string
          label: string
          last_updated?: string
          started_at?: string
          summary?: string | null
        }
        Update: {
          broadcasted_at?: string | null
          claim_ids?: string[]
          embedding?: string | null
          entity_ids?: string[]
          hotness?: number
          id?: string
          label?: string
          last_updated?: string
          started_at?: string
          summary?: string | null
        }
        Relationships: []
      }
      generated_videos: {
        Row: {
          category: string | null
          claim_ids: string[]
          created_at: string | null
          duration: string | null
          event_cluster_id: string | null
          generated_at: string | null
          id: string
          newsletter_md: string | null
          raw_headlines: Json | null
          script: string
          short_script: string | null
          social_caption: string | null
          thumbnail_prompt: string | null
          thumbnail_url: string | null
          title: string
        }
        Insert: {
          category?: string | null
          claim_ids?: string[]
          created_at?: string | null
          duration?: string | null
          event_cluster_id?: string | null
          generated_at?: string | null
          id?: string
          newsletter_md?: string | null
          raw_headlines?: Json | null
          script: string
          short_script?: string | null
          social_caption?: string | null
          thumbnail_prompt?: string | null
          thumbnail_url?: string | null
          title: string
        }
        Update: {
          category?: string | null
          claim_ids?: string[]
          created_at?: string | null
          duration?: string | null
          event_cluster_id?: string | null
          generated_at?: string | null
          id?: string
          newsletter_md?: string | null
          raw_headlines?: Json | null
          script?: string
          short_script?: string | null
          social_caption?: string | null
          thumbnail_prompt?: string | null
          thumbnail_url?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_videos_event_cluster_id_fkey"
            columns: ["event_cluster_id"]
            isOneToOne: false
            referencedRelation: "event_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      ground_truth_labels: {
        Row: {
          claim_id: string
          created_at: string
          id: string
          label: string
          labeled_by: string
          rationale: string | null
        }
        Insert: {
          claim_id: string
          created_at?: string
          id?: string
          label: string
          labeled_by: string
          rationale?: string | null
        }
        Update: {
          claim_id?: string
          created_at?: string
          id?: string
          label?: string
          labeled_by?: string
          rationale?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ground_truth_labels_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "claims"
            referencedColumns: ["id"]
          },
        ]
      }
      live_broadcasts: {
        Row: {
          current_segment_id: string | null
          ended_at: string | null
          headline: string | null
          id: string
          metadata: Json
          started_at: string
          status: string
        }
        Insert: {
          current_segment_id?: string | null
          ended_at?: string | null
          headline?: string | null
          id?: string
          metadata?: Json
          started_at?: string
          status?: string
        }
        Update: {
          current_segment_id?: string | null
          ended_at?: string | null
          headline?: string | null
          id?: string
          metadata?: Json
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      news_preferences: {
        Row: {
          categories: string[]
          created_at: string
          id: string
          interest_embedding: string | null
          last_signal_at: string | null
          regional_weights: Json
          regions: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          categories?: string[]
          created_at?: string
          id?: string
          interest_embedding?: string | null
          last_signal_at?: string | null
          regional_weights?: Json
          regions?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          categories?: string[]
          created_at?: string
          id?: string
          interest_embedding?: string | null
          last_signal_at?: string | null
          regional_weights?: Json
          regions?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pipeline_decisions: {
        Row: {
          category: string | null
          created_at: string
          endpoint: string
          fallback_reason: string | null
          flag_enabled: boolean | null
          id: string
          latency_ms: number | null
          region: string | null
          rollout_pct: number | null
          route: string
          run_id: string | null
          topic: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          endpoint: string
          fallback_reason?: string | null
          flag_enabled?: boolean | null
          id?: string
          latency_ms?: number | null
          region?: string | null
          rollout_pct?: number | null
          route: string
          run_id?: string | null
          topic?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          endpoint?: string
          fallback_reason?: string | null
          flag_enabled?: boolean | null
          id?: string
          latency_ms?: number | null
          region?: string | null
          rollout_pct?: number | null
          route?: string
          run_id?: string | null
          topic?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      saved_articles: {
        Row: {
          article_id: string
          category: string | null
          headline: string
          id: string
          image_url: string | null
          published_at: string | null
          read_time: number | null
          region: string | null
          saved_at: string
          source_url: string | null
          summary: string | null
          user_id: string
        }
        Insert: {
          article_id: string
          category?: string | null
          headline: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          read_time?: number | null
          region?: string | null
          saved_at?: string
          source_url?: string | null
          summary?: string | null
          user_id: string
        }
        Update: {
          article_id?: string
          category?: string | null
          headline?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          read_time?: number | null
          region?: string | null
          saved_at?: string
          source_url?: string | null
          summary?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sources: {
        Row: {
          citation_quality: number
          consistency_score: number
          created_at: string
          display_name: string | null
          domain: string
          historical_accuracy: number
          id: string
          last_seen_at: string | null
          metadata: Json
          refuted_claims: number
          reliability_score: number
          total_claims: number
          updated_at: string
          verified_claims: number
        }
        Insert: {
          citation_quality?: number
          consistency_score?: number
          created_at?: string
          display_name?: string | null
          domain: string
          historical_accuracy?: number
          id?: string
          last_seen_at?: string | null
          metadata?: Json
          refuted_claims?: number
          reliability_score?: number
          total_claims?: number
          updated_at?: string
          verified_claims?: number
        }
        Update: {
          citation_quality?: number
          consistency_score?: number
          created_at?: string
          display_name?: string | null
          domain?: string
          historical_accuracy?: number
          id?: string
          last_seen_at?: string | null
          metadata?: Json
          refuted_claims?: number
          reliability_score?: number
          total_claims?: number
          updated_at?: string
          verified_claims?: number
        }
        Relationships: []
      }
      topic_memory: {
        Row: {
          created_at: string
          embedding: string | null
          entities: Json
          id: string
          last_updated: string
          story_count: number
          summary: string | null
          topic: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          entities?: Json
          id?: string
          last_updated?: string
          story_count?: number
          summary?: string | null
          topic: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          entities?: Json
          id?: string
          last_updated?: string
          story_count?: number
          summary?: string | null
          topic?: string
        }
        Relationships: []
      }
      twitter_posts: {
        Row: {
          article_id: string
          article_url: string
          category: string
          created_at: string
          error_message: string | null
          headline: string
          id: string
          kind: string
          posted_at: string | null
          source_name: string
          status: string
          trust_score: number
          tweet_id: string | null
          tweet_text: string
        }
        Insert: {
          article_id: string
          article_url: string
          category: string
          created_at?: string
          error_message?: string | null
          headline: string
          id?: string
          kind?: string
          posted_at?: string | null
          source_name: string
          status?: string
          trust_score: number
          tweet_id?: string | null
          tweet_text: string
        }
        Update: {
          article_id?: string
          article_url?: string
          category?: string
          created_at?: string
          error_message?: string | null
          headline?: string
          id?: string
          kind?: string
          posted_at?: string | null
          source_name?: string
          status?: string
          trust_score?: number
          tweet_id?: string | null
          tweet_text?: string
        }
        Relationships: []
      }
      user_events: {
        Row: {
          article_id: string
          category: string | null
          dwell_ms: number | null
          event_type: string
          id: string
          metadata: Json
          ts: string
          user_id: string
        }
        Insert: {
          article_id: string
          category?: string | null
          dwell_ms?: number | null
          event_type: string
          id?: string
          metadata?: Json
          ts?: string
          user_id: string
        }
        Update: {
          article_id?: string
          category?: string | null
          dwell_ms?: number | null
          event_type?: string
          id?: string
          metadata?: Json
          ts?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_runs: {
        Row: {
          agent_votes: Json
          claim_ids: string[]
          consensus_score: number
          created_at: string
          id: string
          metadata: Json
          published: boolean
          published_at: string | null
          run_id: string
          story_headline: string | null
          threshold: number
          threshold_met: boolean
          topic: string | null
          total_latency_ms: number | null
          total_tokens: number | null
        }
        Insert: {
          agent_votes?: Json
          claim_ids?: string[]
          consensus_score?: number
          created_at?: string
          id?: string
          metadata?: Json
          published?: boolean
          published_at?: string | null
          run_id: string
          story_headline?: string | null
          threshold?: number
          threshold_met?: boolean
          topic?: string | null
          total_latency_ms?: number | null
          total_tokens?: number | null
        }
        Update: {
          agent_votes?: Json
          claim_ids?: string[]
          consensus_score?: number
          created_at?: string
          id?: string
          metadata?: Json
          published?: boolean
          published_at?: string | null
          run_id?: string
          story_headline?: string | null
          threshold?: number
          threshold_met?: boolean
          topic?: string | null
          total_latency_ms?: number | null
          total_tokens?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_claims: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          claim_text: string
          confidence: number
          id: string
          similarity: number
          status: string
          topic: string
        }[]
      }
      match_entities: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          id: string
          name: string
          similarity: number
          type: string
        }[]
      }
      match_events: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          hotness: number
          id: string
          label: string
          similarity: number
          summary: string
        }[]
      }
      match_topics: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          entities: Json
          id: string
          similarity: number
          summary: string
          topic: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
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
    Enums: {
      app_role: ["admin", "editor", "user"],
    },
  },
} as const
