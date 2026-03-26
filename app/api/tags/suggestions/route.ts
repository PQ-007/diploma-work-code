import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { tagSimilarityService } from "@/lib/services/tagSimilarity";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const entityType = searchParams.get("type") || "article";

    // Validate parameters
    if (!query || query.trim().length === 0) {
      // Return popular tags for empty query
      const { data: popularTags, error } = await supabase
        .from("tags")
        .select("id, name, usage_count")
        .order("usage_count", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching popular tags:", error);
        return NextResponse.json({ error: "Failed to fetch popular tags" }, { status: 500 });
      }

      return NextResponse.json({
        suggestions: popularTags.map(tag => ({
          id: tag.id,
          name: tag.name,
          similarity: 0.0,
          similarityType: "popular",
          usageCount: tag.usage_count || 0
        }))
      });
    }

    // Fetch all tags for similarity calculation
    // In production, you might want to optimize this with search indexes
    const { data: allTags, error } = await supabase
      .from("tags")
      .select("id, name, usage_count, last_used_at")
      .order("usage_count", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("Error fetching tags:", error);
      return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    }

    // Convert to required format
    const tagData = allTags.map(tag => ({
      id: tag.id,
      name: tag.name,
      usage_count: tag.usage_count || 0,
      last_used_at: tag.last_used_at
    }));

    // Get suggestions using similarity service
    const suggestions = await tagSimilarityService.getTagSuggestions(
      query,
      tagData,
      limit,
      0.3 // threshold for similarity
    );

    return NextResponse.json({
      query,
      suggestions: suggestions.map(suggestion => ({
        id: suggestion.tagId,
        name: suggestion.tagName,
        similarity: suggestion.similarity,
        similarityType: suggestion.similarityType,
        usageCount: suggestion.usageCount
      }))
    });

  } catch (error) {
    console.error("Error in tag suggestions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}