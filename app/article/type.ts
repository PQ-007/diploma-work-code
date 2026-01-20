export type TocEntry = { id: string; text: string; level: number };

export type AuthorPayload = {
  id?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  username?: string | null;
  role?: string | null;
  bio?: string | null;
  
};

export type ArticlePayload = {
  id?: string;
  status?: string;
  title: string;
  sub_title?: string;
  is_serial?: boolean;
  body: string;
  tags: string[];
  definitions?: { term: string; definition: string }[];
  language_code: string;
  published_at: string | null;
  edited_at?: string | null;
  author?: AuthorPayload | null;
  views?: number; // Optional views property added
};

export type RelatedLink = { label: string; href: string };
