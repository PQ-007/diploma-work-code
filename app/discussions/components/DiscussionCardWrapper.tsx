import { ContentItem, DiscussionContent } from "@/lib/types/content";
import { useContentInteractions } from "@/lib/hooks/mutations/useContentInteractions";
import DiscussionItem from "./DiscussionItem";

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
  const { bookmark, vote } = useContentInteractions(
    item.content.id,
    item.content.type,
  );

  const mappedItem = {
    id: item.content.id,
    title: item.content.title,
    body: item.content.body,
    pinned: item.content.pinned,
    answered: item.content.answered,
    created_at: item.content.createdAt,
    author: {
      id: item.content.author.id,
      display_name: item.content.author.displayName,
      user_name: item.content.author.username,
      avatar_url: item.content.author.avatarUrl || "",
      ranking_point: item.content.author.rankingPoint || 0,
    },
    tags: item.content.tags,
    votes: item.stats.likes,
    userVote: item.interactions.userVote || null,
    commentCount: item.stats.comments,
    bookmarked: item.interactions.isBookmarked,
  };

  return (
    <DiscussionItem
      item={mappedItem}
      onVote={(id, direction) => {
        if (id !== item.content.id) return;
        vote.mutate(direction);
      }}
      onBookmark={(id) => {
        if (id !== item.content.id) return;
        bookmark.mutate();
      }}
      onClick={(id) => {
        if (id !== item.content.id) return;
        onComment?.();
      }}
    />
  );
}
