// Tag Similarity Service
// Provides fuzzy matching, semantic similarity, and popular tag suggestions

interface SimilarityResult {
  tagId: number;
  tagName: string;
  similarity: number;
  similarityType: "exact" | "fuzzy" | "semantic" | "popular";
  usageCount: number;
}

interface TagData {
  id: number;
  name: string;
  usage_count: number;
  last_used_at?: string;
}

export class TagSimilarityService {
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate normalized similarity score (0-1) using Levenshtein distance
   */
  private fuzzyMatchScore(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;
    if (s1.length === 0 || s2.length === 0) return 0.0;

    const maxLength = Math.max(s1.length, s2.length);
    const distance = this.levenshteinDistance(s1, s2);

    return Math.max(0, (maxLength - distance) / maxLength);
  }

  /**
   * Check if one tag is an abbreviation of another
   */
  private isAbbreviation(short: string, long: string): boolean {
    const shortLower = short.toLowerCase().replace(/[^a-z]/g, "");
    const longLower = long.toLowerCase();

    // Check if short is acronym of long (e.g., "AI" -> "Artificial Intelligence")
    const words = longLower.split(/\s+/);
    if (words.length > 1) {
      const acronym = words.map((w) => w[0]).join("");
      if (acronym === shortLower) return true;
    }

    // Check if short is contained in long
    return longLower.includes(shortLower) && shortLower.length >= 2;
  }

  /**
   * Calculate semantic similarity using simple word matching and common abbreviations
   */
  private semanticMatchScore(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1.0;

    // Check abbreviations
    if (this.isAbbreviation(s1, s2) || this.isAbbreviation(s2, s1)) {
      return 0.85;
    }

    // Word overlap scoring
    const words1 = new Set(s1.split(/\s+/).filter((w) => w.length > 2));
    const words2 = new Set(s2.split(/\s+/).filter((w) => w.length > 2));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (union.size === 0) return 0;

    const jaccardSimilarity = intersection.size / union.size;
    return jaccardSimilarity;
  }

  /**
   * Calculate popularity boost based on usage count
   */
  private popularityBoost(usageCount: number): number {
    // Logarithmic boost for popular tags
    return Math.min(0.2, Math.log10(Math.max(1, usageCount)) / 10);
  }

  /**
   * Get tag suggestions based on query string
   */
  async getTagSuggestions(
    query: string,
    existingTags: TagData[],
    limit: number = 10,
    threshold: number = 0.3,
  ): Promise<SimilarityResult[]> {
    if (!query || query.trim().length < 2) {
      // Return popular tags for short queries
      return existingTags
        .sort((a, b) => b.usage_count - a.usage_count)
        .slice(0, limit)
        .map((tag) => ({
          tagId: tag.id,
          tagName: tag.name,
          similarity: 0.0,
          similarityType: "popular" as const,
          usageCount: tag.usage_count,
        }));
    }

    const queryNormalized = query.toLowerCase().trim();
    const results: SimilarityResult[] = [];

    for (const tag of existingTags) {
      const tagNameNormalized = tag.name.toLowerCase().trim();

      // Exact match
      if (tagNameNormalized === queryNormalized) {
        results.push({
          tagId: tag.id,
          tagName: tag.name,
          similarity: 1.0,
          similarityType: "exact",
          usageCount: tag.usage_count,
        });
        continue;
      }

      // Skip if already have exact match and this is too different
      const exactMatch = results.find((r) => r.similarityType === "exact");
      if (exactMatch) continue;

      // Fuzzy matching
      const fuzzyScore = this.fuzzyMatchScore(
        queryNormalized,
        tagNameNormalized,
      );

      // Semantic matching
      const semanticScore = this.semanticMatchScore(
        queryNormalized,
        tagNameNormalized,
      );

      // Use the higher of the two scores
      const bestScore = Math.max(fuzzyScore, semanticScore);

      // Apply popularity boost
      const popularityBonus = this.popularityBoost(tag.usage_count);
      const finalScore = Math.min(1.0, bestScore + popularityBonus);

      if (finalScore >= threshold) {
        const similarityType =
          semanticScore > fuzzyScore ? "semantic" : "fuzzy";

        results.push({
          tagId: tag.id,
          tagName: tag.name,
          similarity: finalScore,
          similarityType,
          usageCount: tag.usage_count,
        });
      }
    }

    // Sort by similarity score (descending), then by usage count (descending)
    return results
      .sort((a, b) => {
        if (Math.abs(a.similarity - b.similarity) > 0.01) {
          return b.similarity - a.similarity;
        }
        return b.usageCount - a.usageCount;
      })
      .slice(0, limit);
  }

  /**
   * Batch calculate similarities for caching (used for background processing)
   */
  async batchCalculateSimilarities(
    tags: TagData[],
    threshold: number = 0.5,
  ): Promise<
    Array<{
      tagAId: number;
      tagBId: number;
      similarityScore: number;
      similarityType: string;
    }>
  > {
    const similarities: Array<{
      tagAId: number;
      tagBId: number;
      similarityScore: number;
      similarityType: string;
    }> = [];

    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const tagA = tags[i];
        const tagB = tags[j];

        const fuzzyScore = this.fuzzyMatchScore(tagA.name, tagB.name);
        const semanticScore = this.semanticMatchScore(tagA.name, tagB.name);

        const bestScore = Math.max(fuzzyScore, semanticScore);

        if (bestScore >= threshold) {
          const similarityType =
            semanticScore > fuzzyScore ? "semantic" : "fuzzy";

          similarities.push({
            tagAId: tagA.id,
            tagBId: tagB.id,
            similarityScore: Math.round(bestScore * 100) / 100, // Round to 2 decimals
            similarityType,
          });
        }
      }
    }

    return similarities;
  }
}

// Singleton instance
export const tagSimilarityService = new TagSimilarityService();
