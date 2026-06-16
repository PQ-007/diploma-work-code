/**
 * Supabase database types.
 *
 * SOURCE OF TRUTH for database row shapes. Derived from the schema in
 * `db.sql` (plus enum values inferred from application code, since the
 * `USER-DEFINED` enums are not expanded in db.sql).
 *
 * Regenerate canonically against the live project with:
 *   npm run gen:types
 * (requires the Supabase CLI to be logged in / linked — see supabase/config.toml).
 *
 * Do not hand-edit individual rows when regeneration is available; prefer
 * `npm run gen:types` so this stays in sync with the real schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      article_comments: {
        Row: {
          id: number;
          article_id: number;
          author_id: string;
          parent_comment_id: number | null;
          body: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          article_id: number;
          author_id: string;
          parent_comment_id?: number | null;
          body?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          article_id?: number;
          author_id?: string;
          parent_comment_id?: number | null;
          body?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comment_author";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_has_comments";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comment_replies";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "article_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      article_reactions: {
        Row: {
          user_id: string;
          article_id: number;
          reaction: string;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          article_id: number;
          reaction: string;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          article_id?: number;
          reaction?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "article_reactions_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_reactions_article";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      article_tags: {
        Row: {
          article_id: number;
          tag_id: number;
        };
        Insert: {
          article_id: number;
          tag_id: number;
        };
        Update: {
          article_id?: number;
          tag_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "article_tag_article";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_tag_tag";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      article_translation_sources: {
        Row: {
          id: string;
          translation_article_id: number;
          source_type: string;
          source_article_id: number | null;
          external_source_url: string | null;
          external_source_title: string | null;
          external_source_author: string | null;
          source_language_code: string;
          translation_request_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          translation_article_id: number;
          source_type: string;
          source_article_id?: number | null;
          external_source_url?: string | null;
          external_source_title?: string | null;
          external_source_author?: string | null;
          source_language_code: string;
          translation_request_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          translation_article_id?: number;
          source_type?: string;
          source_article_id?: number | null;
          external_source_url?: string | null;
          external_source_title?: string | null;
          external_source_author?: string | null;
          source_language_code?: string;
          translation_request_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_translation_sources_translation_article_id_fkey";
            columns: ["translation_article_id"];
            isOneToOne: true;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_translation_sources_source_article_id_fkey";
            columns: ["source_article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_translation_sources_translation_request_id_fkey";
            columns: ["translation_request_id"];
            isOneToOne: false;
            referencedRelation: "translation_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      article_translations: {
        Row: {
          id: number;
          article_id: number;
          language_code: string;
          title: string | null;
          body: string | null;
          published_at: string | null;
          created_at: string | null;
          edited_at: string | null;
          sub_title: string | null;
          views: number | null;
        };
        Insert: {
          id?: number;
          article_id: number;
          language_code: string;
          title?: string | null;
          body?: string | null;
          published_at?: string | null;
          created_at?: string | null;
          edited_at?: string | null;
          sub_title?: string | null;
          views?: number | null;
        };
        Update: {
          id?: number;
          article_id?: number;
          language_code?: string;
          title?: string | null;
          body?: string | null;
          published_at?: string | null;
          created_at?: string | null;
          edited_at?: string | null;
          sub_title?: string | null;
          views?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "article_has_translations";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      articles: {
        Row: {
          id: number;
          author_id: string;
          status: Database["public"]["Enums"]["article_status"];
          created_at: string | null;
          series: string | null;
          base_lang_code: string | null;
        };
        Insert: {
          id?: number;
          author_id: string;
          status: Database["public"]["Enums"]["article_status"];
          created_at?: string | null;
          series?: string | null;
          base_lang_code?: string | null;
        };
        Update: {
          id?: number;
          author_id?: string;
          status?: Database["public"]["Enums"]["article_status"];
          created_at?: string | null;
          series?: string | null;
          base_lang_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "article_author";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bookmarked_articles: {
        Row: {
          user_id: string;
          article_id: number;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          article_id: number;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          article_id?: number;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "bookmark_user";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookmark_article";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      dictionary_entries: {
        Row: {
          id: number;
          term: string;
          slug: string;
          reading: string | null;
          language_code: string;
          definition: string;
          status: Database["public"]["Enums"]["dictionary_status"];
          created_by: string;
          created_at: string;
          updated_at: string;
          views: number;
          saves: number;
          current_revision_id: number | null;
          search_vector: unknown | null;
        };
        Insert: {
          id?: number;
          term: string;
          slug: string;
          reading?: string | null;
          language_code: string;
          definition: string;
          status?: Database["public"]["Enums"]["dictionary_status"];
          created_by: string;
          created_at?: string;
          updated_at?: string;
          views?: number;
          saves?: number;
          current_revision_id?: number | null;
          search_vector?: unknown | null;
        };
        Update: {
          id?: number;
          term?: string;
          slug?: string;
          reading?: string | null;
          language_code?: string;
          definition?: string;
          status?: Database["public"]["Enums"]["dictionary_status"];
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          views?: number;
          saves?: number;
          current_revision_id?: number | null;
          search_vector?: unknown | null;
        };
        Relationships: [
          {
            foreignKeyName: "dictionary_entries_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dictionary_entries_current_revision_fkey";
            columns: ["current_revision_id"];
            isOneToOne: false;
            referencedRelation: "dictionary_revisions";
            referencedColumns: ["id"];
          },
        ];
      };
      dictionary_entry_tags: {
        Row: {
          entry_id: number;
          tag_id: number;
        };
        Insert: {
          entry_id: number;
          tag_id: number;
        };
        Update: {
          entry_id?: number;
          tag_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "dictionary_entry_tags_entry_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "dictionary_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dictionary_entry_tags_tag_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      dictionary_examples: {
        Row: {
          id: number;
          entry_id: number;
          example_text: string;
          source: string | null;
          context: string | null;
          language_code: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          entry_id: number;
          example_text: string;
          source?: string | null;
          context?: string | null;
          language_code: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          entry_id?: number;
          example_text?: string;
          source?: string | null;
          context?: string | null;
          language_code?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dictionary_examples_entry_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "dictionary_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dictionary_examples_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dictionary_moderation_actions: {
        Row: {
          id: number;
          revision_id: number;
          entry_id: number;
          action: string;
          reason: string | null;
          moderator_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          revision_id: number;
          entry_id: number;
          action: string;
          reason?: string | null;
          moderator_id: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          revision_id?: number;
          entry_id?: number;
          action?: string;
          reason?: string | null;
          moderator_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dictionary_mod_revision_fkey";
            columns: ["revision_id"];
            isOneToOne: false;
            referencedRelation: "dictionary_revisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dictionary_mod_entry_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "dictionary_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dictionary_mod_moderator_fkey";
            columns: ["moderator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dictionary_revisions: {
        Row: {
          id: number;
          entry_id: number;
          revision_number: number;
          term: string;
          reading: string | null;
          language_code: string;
          definition: string;
          translations_snapshot: Json;
          examples_snapshot: Json;
          tags_snapshot: Json;
          change_summary: string | null;
          status: Database["public"]["Enums"]["dictionary_status"];
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          entry_id: number;
          revision_number?: number;
          term: string;
          reading?: string | null;
          language_code: string;
          definition: string;
          translations_snapshot?: Json;
          examples_snapshot?: Json;
          tags_snapshot?: Json;
          change_summary?: string | null;
          status?: Database["public"]["Enums"]["dictionary_status"];
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          entry_id?: number;
          revision_number?: number;
          term?: string;
          reading?: string | null;
          language_code?: string;
          definition?: string;
          translations_snapshot?: Json;
          examples_snapshot?: Json;
          tags_snapshot?: Json;
          change_summary?: string | null;
          status?: Database["public"]["Enums"]["dictionary_status"];
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dictionary_revisions_entry_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "dictionary_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dictionary_revisions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dictionary_saves: {
        Row: {
          entry_id: number;
          user_id: string;
          created_at: string;
        };
        Insert: {
          entry_id: number;
          user_id: string;
          created_at?: string;
        };
        Update: {
          entry_id?: number;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dictionary_saves_entry_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "dictionary_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dictionary_saves_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      dictionary_translations: {
        Row: {
          id: number;
          entry_id: number;
          language_code: string;
          translated_term: string;
          explanation: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          entry_id: number;
          language_code: string;
          translated_term: string;
          explanation?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          entry_id?: number;
          language_code?: string;
          translated_term?: string;
          explanation?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dictionary_translations_entry_fkey";
            columns: ["entry_id"];
            isOneToOne: false;
            referencedRelation: "dictionary_entries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dictionary_translations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      discussion_bookmarks: {
        Row: {
          discussion_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          discussion_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          discussion_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discussion_bookmarks_discussion_id_fkey";
            columns: ["discussion_id"];
            isOneToOne: false;
            referencedRelation: "discussions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discussion_bookmarks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      discussion_comments: {
        Row: {
          id: string;
          discussion_id: string;
          author_id: string;
          body: string;
          parent_comment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          discussion_id: string;
          author_id: string;
          body: string;
          parent_comment_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          discussion_id?: string;
          author_id?: string;
          body?: string;
          parent_comment_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discussion_comments_discussion_id_fkey";
            columns: ["discussion_id"];
            isOneToOne: false;
            referencedRelation: "discussions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discussion_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discussion_comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "discussion_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      discussion_tags: {
        Row: {
          discussion_id: string;
          tag_id: number;
        };
        Insert: {
          discussion_id: string;
          tag_id: number;
        };
        Update: {
          discussion_id?: string;
          tag_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "discussion_tags_discussion_id_fkey";
            columns: ["discussion_id"];
            isOneToOne: false;
            referencedRelation: "discussions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discussion_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      discussion_votes: {
        Row: {
          discussion_id: string;
          user_id: string;
          vote: Database["public"]["Enums"]["vote_type"];
          created_at: string;
        };
        Insert: {
          discussion_id: string;
          user_id: string;
          vote: Database["public"]["Enums"]["vote_type"];
          created_at?: string;
        };
        Update: {
          discussion_id?: string;
          user_id?: string;
          vote?: Database["public"]["Enums"]["vote_type"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discussion_votes_discussion_id_fkey";
            columns: ["discussion_id"];
            isOneToOne: false;
            referencedRelation: "discussions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "discussion_votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      discussions: {
        Row: {
          id: string;
          author_id: string;
          title: string;
          body: string;
          pinned: boolean;
          answered: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          title: string;
          body?: string;
          pinned?: boolean;
          answered?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          title?: string;
          body?: string;
          pinned?: boolean;
          answered?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "discussions_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      flashcards: {
        Row: {
          id: number;
          user_id: string;
          front: string;
          back: string;
          source_type: string | null;
          source_id: number | null;
          deck: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          front: string;
          back: string;
          source_type?: string | null;
          source_id?: number | null;
          deck?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          front?: string;
          back?: string;
          source_type?: string | null;
          source_id?: number | null;
          deck?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "flashcards_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      language_skills: {
        Row: {
          id: number;
          user_id: string;
          language_name: string;
          flag_emoji: string | null;
          proficiency_level: string | null;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          language_name: string;
          flag_emoji?: string | null;
          proficiency_level?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          language_name?: string;
          flag_emoji?: string | null;
          proficiency_level?: string | null;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "language_skills_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      poll_options: {
        Row: {
          id: number;
          poll_id: number;
          option_text: string;
          display_order: number;
        };
        Insert: {
          id?: number;
          poll_id: number;
          option_text: string;
          display_order?: number;
        };
        Update: {
          id?: number;
          poll_id?: number;
          option_text?: string;
          display_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "poll_options_poll_fkey";
            columns: ["poll_id"];
            isOneToOne: false;
            referencedRelation: "polls";
            referencedColumns: ["id"];
          },
        ];
      };
      poll_votes: {
        Row: {
          poll_id: number;
          user_id: string;
          option_id: number;
          created_at: string;
        };
        Insert: {
          poll_id: number;
          user_id: string;
          option_id: number;
          created_at?: string;
        };
        Update: {
          poll_id?: number;
          user_id?: string;
          option_id?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_fkey";
            columns: ["poll_id"];
            isOneToOne: false;
            referencedRelation: "polls";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poll_votes_opt_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "poll_options";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poll_votes_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      polls: {
        Row: {
          id: number;
          author_id: string;
          question: string;
          ends_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          author_id: string;
          question: string;
          ends_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          author_id?: string;
          question?: string;
          ends_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "polls_author_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          user_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string | null;
          email: string | null;
          role: Database["public"]["Enums"]["user_type"] | null;
          ranking_point: number | null;
          display_name: string | null;
          skills: string | null;
          interest: string | null;
          language_level: Json | null;
          banner_gradient: string | null;
          avatar_ring_color: string | null;
          pinned_project_ids: number[] | null;
          pinned_article_ids: number[] | null;
        };
        Insert: {
          id: string;
          user_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          email?: string | null;
          role?: Database["public"]["Enums"]["user_type"] | null;
          ranking_point?: number | null;
          display_name?: string | null;
          skills?: string | null;
          interest?: string | null;
          language_level?: Json | null;
          banner_gradient?: string | null;
          avatar_ring_color?: string | null;
          pinned_project_ids?: number[] | null;
          pinned_article_ids?: number[] | null;
        };
        Update: {
          id?: string;
          user_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string | null;
          email?: string | null;
          role?: Database["public"]["Enums"]["user_type"] | null;
          ranking_point?: number | null;
          display_name?: string | null;
          skills?: string | null;
          interest?: string | null;
          language_level?: Json | null;
          banner_gradient?: string | null;
          avatar_ring_color?: string | null;
          pinned_project_ids?: number[] | null;
          pinned_article_ids?: number[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      project_comments: {
        Row: {
          id: number;
          project_id: number;
          user_id: string;
          parent_id: number | null;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          project_id: number;
          user_id: string;
          parent_id?: number | null;
          body: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          project_id?: number;
          user_id?: string;
          parent_id?: number | null;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_comments_project_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_comments_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_comments_parent_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "project_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      project_files: {
        Row: {
          id: number;
          project_id: number;
          uploaded_by: string;
          file_name: string;
          file_url: string;
          file_type: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          project_id: number;
          uploaded_by: string;
          file_name: string;
          file_url: string;
          file_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          project_id?: number;
          uploaded_by?: string;
          file_name?: string;
          file_url?: string;
          file_type?: string | null;
          file_size?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_files_project_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_files_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_likes: {
        Row: {
          project_id: number;
          user_id: string;
          created_at: string;
        };
        Insert: {
          project_id: number;
          user_id: string;
          created_at?: string;
        };
        Update: {
          project_id?: number;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_likes_project_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_likes_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_members: {
        Row: {
          project_id: number;
          user_id: string;
          role: Database["public"]["Enums"]["project_member_role"];
          joined_at: string;
        };
        Insert: {
          project_id: number;
          user_id: string;
          role?: Database["public"]["Enums"]["project_member_role"];
          joined_at?: string;
        };
        Update: {
          project_id?: number;
          user_id?: string;
          role?: Database["public"]["Enums"]["project_member_role"];
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_members_project_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_members_user_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_tags: {
        Row: {
          project_id: number;
          tag_id: number;
        };
        Insert: {
          project_id: number;
          tag_id: number;
        };
        Update: {
          project_id?: number;
          tag_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "project_tags_project_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_tags_tag_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      project_updates: {
        Row: {
          id: number;
          project_id: number;
          created_by: string;
          title: string;
          body: string;
          update_type: string;
          image_url: string | null;
          published_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          project_id: number;
          created_by: string;
          title: string;
          body: string;
          update_type?: string;
          image_url?: string | null;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          project_id?: number;
          created_by?: string;
          title?: string;
          body?: string;
          update_type?: string;
          image_url?: string | null;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_updates_project_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_updates_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: number;
          title: string;
          slug: string;
          description: string | null;
          category: string | null;
          difficulty: Database["public"]["Enums"]["project_difficulty"];
          status: Database["public"]["Enums"]["project_status"];
          is_public: boolean;
          repository_url: string | null;
          demo_url: string | null;
          thumbnail_url: string | null;
          progress: number;
          technologies: string[];
          created_by: string;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          views: number;
          likes_count: number;
          search_vector: unknown | null;
          type: Database["public"]["Enums"]["project_type"] | null;
        };
        Insert: {
          id?: number;
          title: string;
          slug: string;
          description?: string | null;
          category?: string | null;
          difficulty?: Database["public"]["Enums"]["project_difficulty"];
          status?: Database["public"]["Enums"]["project_status"];
          is_public?: boolean;
          repository_url?: string | null;
          demo_url?: string | null;
          thumbnail_url?: string | null;
          progress?: number;
          technologies?: string[];
          created_by: string;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          views?: number;
          likes_count?: number;
          search_vector?: unknown | null;
          type?: Database["public"]["Enums"]["project_type"] | null;
        };
        Update: {
          id?: number;
          title?: string;
          slug?: string;
          description?: string | null;
          category?: string | null;
          difficulty?: Database["public"]["Enums"]["project_difficulty"];
          status?: Database["public"]["Enums"]["project_status"];
          is_public?: boolean;
          repository_url?: string | null;
          demo_url?: string | null;
          thumbnail_url?: string | null;
          progress?: number;
          technologies?: string[];
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          views?: number;
          likes_count?: number;
          search_vector?: unknown | null;
          type?: Database["public"]["Enums"]["project_type"] | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tag_similarities: {
        Row: {
          id: number;
          tag_a_id: number;
          tag_b_id: number;
          similarity_score: number;
          similarity_type: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          tag_a_id: number;
          tag_b_id: number;
          similarity_score: number;
          similarity_type: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          tag_a_id?: number;
          tag_b_id?: number;
          similarity_score?: number;
          similarity_type?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tag_similarities_tag_a_fkey";
            columns: ["tag_a_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tag_similarities_tag_b_fkey";
            columns: ["tag_b_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          id: number;
          name: string;
          usage_count: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          usage_count?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          usage_count?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      translation_requests: {
        Row: {
          id: string;
          original_article_id: number;
          requester_id: string;
          target_language_code: string;
          status: string;
          request_message: string | null;
          response_message: string | null;
          responded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          original_article_id: number;
          requester_id: string;
          target_language_code: string;
          status?: string;
          request_message?: string | null;
          response_message?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          original_article_id?: number;
          requester_id?: string;
          target_language_code?: string;
          status?: string;
          request_message?: string | null;
          response_message?: string | null;
          responded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "translation_requests_original_article_id_fkey";
            columns: ["original_article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "translation_requests_requester_id_fkey";
            columns: ["requester_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_fk";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_follows_following_fk";
            columns: ["following_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      article_status: "draft" | "published";
      dictionary_status: "draft" | "pending_review" | "approved" | "rejected";
      project_difficulty: "beginner" | "intermediate" | "advanced";
      project_member_role: "owner" | "contributor" | "viewer";
      project_status: "draft" | "in_progress" | "completed" | "archived";
      project_type: "diploma" | "contest" | "intership" | "private";
      user_type: "user" | "admin" | "moderator";
      vote_type: "up" | "down";
    };
    CompositeTypes: Record<never, never>;
  };
};

/* ------------------------------------------------------------------ */
/*  Helper types (mirror the Supabase CLI output)                     */
/* ------------------------------------------------------------------ */

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"];

export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"];

export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T];
