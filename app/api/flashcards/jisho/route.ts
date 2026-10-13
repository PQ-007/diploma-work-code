import { NextRequest, NextResponse } from "next/server";

/* ═══════════════════════════════════════════
   GET /api/flashcards/jisho?q=<term>
   Server-side proxy to Jisho.org API (avoids CORS).
   Returns a standardized card front/back shape.
   ═══════════════════════════════════════════ */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 });
  }

  try {
    const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "FutureHub/1.0" },
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Jisho API unavailable" },
        { status: 502 },
      );
    }

    const json = (await res.json()) as {
      data: Array<{
        slug: string;
        japanese: Array<{ word?: string; reading?: string }>;
        senses: Array<{
          english_definitions: string[];
          parts_of_speech: string[];
        }>;
      }>;
    };

    if (!json.data?.length) {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }

    const entry = json.data[0];
    const jp = entry.japanese?.[0] ?? {};
    const sense = entry.senses?.[0] ?? { english_definitions: [], parts_of_speech: [] };

    return NextResponse.json(
      {
        term: jp.word ?? entry.slug,
        reading: jp.reading ?? null,
        partsOfSpeech: sense.parts_of_speech ?? [],
        definition: sense.english_definitions.join("; "),
        // All senses for user to review
        allSenses: entry.senses.slice(0, 5).map((s) => ({
          definition: s.english_definitions.join("; "),
          partsOfSpeech: s.parts_of_speech,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Jisho proxy error", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
