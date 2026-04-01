import { ContentCard } from "@/components/content/ContentCard";
import { ContentItem, ArticleContent } from "@/lib/types/content";
import { useContentInteractions } from "@/lib/hooks/mutations/useContentInteractions";

interface ArticleCardWrapperProps {
  item: ContentItem<ArticleContent>;
}

/**
 * Wrapper component for ContentCard that handles article-specific interactions.
 * This component is needed to properly use hooks for each article item.
 */
export function ArticleCardWrapper({ item }: ArticleCardWrapperProps) {
  const { like, bookmark } = useContentInteractions(
    item.content.id,
    item.content.type,
  );

  return (
    <ContentCard
      item={item}
      onLike={() => like.mutate()}
      onBookmark={() => bookmark.mutate()}
      disabled={like.isPending || bookmark.isPending}
    />
  );
}
