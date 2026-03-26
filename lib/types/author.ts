/**
 * Unified author interface used across all content types.
 * Normalizes the inconsistent naming conventions:
 * - ListItem uses: author.name, author.username
 * - DiscussionItem uses: author.display_name, author.user_name
 *
 * This interface provides a single, consistent structure.
 */
export interface Author {
  id: string;
  username: string; // Normalized from user_name
  displayName: string; // Normalized from display_name or name
  avatarUrl: string | null; // Normalized from avatar_url or avatar
  rankingPoint?: number;
  verified?: boolean;
  role?: string | null;
}
