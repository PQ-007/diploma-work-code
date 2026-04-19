export interface Deck {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  cloned_from_deck_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface DeckWithCount extends Deck {
  card_count: number;
}

export interface DeckPreview extends DeckWithCount {
  previews: { id: number; front: string; back: string }[];
  owner: {
    id: string;
    display_name: string;
    user_name: string;
    avatar_url: string | null;
  } | null;
  already_cloned: boolean;
}

export interface Flashcard {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  source_type: string | null;
  source_id: number | null;
  created_at: string;
}
