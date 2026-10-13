import { ArticleCard } from "@/components/cards/ArticleCard";
import { useContentInteractions } from "@/lib/hooks/mutations/useContentInteractions";
import type { ArticleContent, ContentItem } from "@/lib/types/content";

/** Hooks need one component per list item, so the card's mutations live here. */
export function ArticleCardWrapper({ item }: { item: ContentItem<ArticleContent> }) {
  const { bookmark } = useContentInteractions(item.content.id, item.content.type);
  return <ArticleCard item={item} onBookmark={() => bookmark.mutate()} busy={bookmark.isPending} />;
}
