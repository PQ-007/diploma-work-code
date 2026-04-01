import { ContentCard } from "@/components/content/ContentCard";
import { ContentItem, DiscussionContent } from "@/lib/types/content";
import { useContentInteractions } from "@/lib/hooks/mutations/useContentInteractions";

interface DiscussionCardWrapperProps {
  item: ContentItem<DiscussionContent>;
  onComment?: () => void;
}

/**
 * Wrapper component for ContentCard that handles discussion-specific interactions.
 * This component is needed to properly use hooks for each discussion item.
 */
export function DiscussionCardWrapper({
  item,
  onComment,
}: DiscussionCardWrapperProps) {
  const { like, bookmark, vote } = useContentInteractions(
    item.content.id,
    item.content.type,
  );

  return (
    <ContentCard
      item={item}
      onVote={(direction) => vote.mutate(direction)}
      onBookmark={() => bookmark.mutate()}
      onComment={onComment}
      disabled={vote.isPending || bookmark.isPending}
    />
  );
}
