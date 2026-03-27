import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

type RouteParams = { slug?: string } | Promise<{ slug?: string }>;

const normalizeLanguageCode = (raw: string | null, fallback = "") => {
  const code = (raw || "").trim().toLowerCase();
  if (code === "ja") return "jp";
  if (code === "mn" || code === "en" || code === "jp") return code;
  return fallback;
};

export async function GET(_: NextRequest, context: { params: RouteParams }) {
  const resolvedParams =
    "then" in context.params ? await context.params : context.params;
  const articleId = resolvedParams?.slug ? String(resolvedParams.slug) : "";

  if (!articleId) {
    return NextResponse.json({ error: "Missing article id" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    const { data: article, error: articleError } = await supabase
      .from("articles")
      .select("id, base_lang_code")
      .eq("id", articleId)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const { data: translations, error: translationsError } = await supabase
      .from("article_translations")
      .select("language_code")
      .eq("article_id", articleId);

    if (translationsError) {
      return NextResponse.json(
        { error: translationsError.message },
        { status: 500 },
      );
    }

    const availableTranslations = Array.from(
      new Set(
        (translations || [])
          .map((item) => normalizeLanguageCode(item.language_code, ""))
          .filter(Boolean),
      ),
    );

    return NextResponse.json(
      {
        id: String(article.id),
        base_lang_code: normalizeLanguageCode(article.base_lang_code, "mn"),
        available_translations: availableTranslations,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching article translations", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
