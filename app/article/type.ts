export type TocEntry = { id: string; text: string; level: number };

export type AuthorPayload = {
  id?: string;
  avatar_url?: string | null;
  user_name?: string | null;
  role?: string | null;
  bio?: string | null;
  ranking_point?: number;
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
  base_lang_code?: string | null;
  available_translations?: string[];
  published_at: string | null;
  edited_at?: string | null;
  author?: AuthorPayload | null;
  views?: number; // Optional views property added
};

export type RelatedLink = { label: string; href: string };

export interface ApiArticle {
  article_id: string;
  title: string;
  sub_title: string | null;
  body: string;
  language_code: string;
  published_at: string | null;
  author_id: string | null;
  author: {
    user_name: string | null;
    avatar_url: string | null;
    ranking_point: number | null;
  } | null;
  tags: string[];
}

export interface FeedItem {
  id: string;
  type: string;
  day: number;
  author: {
    name: string;
    avatar: string;
    username: string;
    verified: boolean;
    reputation: number;
    contributions: number;
    ranking_point: number;
  };
  timestamp: string;
  readTime: string;
  content: {
    title: string;
    description: string;
    image?: string;
    tags: string[];
  };
  stats: {
    likes: number;
    comments: number;
    views: number;
    shares?: number;
  };
  featured: boolean;
  trending: boolean;
}