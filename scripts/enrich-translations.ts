/**
 * DICTIONARY ENRICHER
 * ───────────────────────────────────────────────────────────────────────────
 * Adds Japanese + Mongolian translations AND usage examples to the ~700
 * English CS entries that were imported by import-cs-words.ts.
 *
 * Data sources
 *   Translations   → Japanese / Mongolian Wikipedia via Wikidata sitelinks
 *   EN examples    → Sentences 2+ of the English Wikipedia intro paragraph
 *   JA examples    → First sentence of the Japanese Wikipedia intro
 *   MN examples    → First sentence of the Mongolian Wikipedia intro
 *
 * Run:
 *   npx tsx scripts/enrich-translations.ts
 *
 * Safe to re-run — checks existing DB rows and keeps a progress checkpoint
 * at scripts/.enrich-progress.json to skip already-processed entries.
 * ───────────────────────────────────────────────────────────────────────────
 */

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync } from "fs";
import * as path from "path";

// ── env loader (reads .env.local then .env) ───────────────────────────────────
for (const f of [".env.local", ".env"]) {
  const fp = path.join(process.cwd(), f);
  if (!existsSync(fp)) continue;
  for (const line of readFileSync(fp, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)="?([^"]*)"?$/);
    if (m) process.env[m[1]] ??= m[2];
  }
  break;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const AUTHOR_UUID = process.env.SEED_AUTHOR_UUID ?? "";

if (!SUPABASE_URL || !SERVICE_KEY || !AUTHOR_UUID) {
  console.error(
    "✗  Missing env vars — check .env.local for NEXT_PUBLIC_SUPABASE_URL, " +
      "SUPABASE_SERVICE_ROLE_KEY, SEED_AUTHOR_UUID",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── tuning ────────────────────────────────────────────────────────────────────
const CONCURRENCY = 4; // parallel Wikipedia fetches per batch
const BATCH_PAUSE = 400; // ms between concurrent batches (Wikipedia rate limit)
const WIKIDATA_PAUSE = 300; // ms between Wikidata calls
const MAX_EXPL_LEN = 500; // max chars for translation explanation
const MAX_EXAMPLE = 420; // max chars for example text
const PROGRESS_FILE = path.join(
  process.cwd(),
  "scripts",
  ".enrich-progress.json",
);

// ── types ─────────────────────────────────────────────────────────────────────
interface DBEntry {
  id: number;
  term: string;
}

interface WikiSummary {
  title: string;
  extract: string;
  wikibase_item?: string;
}

interface EnrichResult {
  entryId: number;
  term: string;
  enExample?: string;
  jaTitle?: string;
  jaExplanation?: string;
  jaExample?: string;
  mnTitle?: string;
  mnExplanation?: string;
  mnExample?: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(" ", max);
  return text.substring(0, cut > 0 ? cut : max) + "…";
}

/**
 * Returns everything after the first sentence of an English extract.
 * Removes IPA pronunciation blocks like (/ˈæl.ɡə.rɪð.əm/) first.
 */
function sentencesAfterFirst(extract: string): string | null {
  const cleaned = extract
    .replace(/\(\/[^/)]+\/\)/g, "") // remove IPA
    .replace(/\s+/g, " ")
    .trim();

  // Match up to and including the first sentence-ending punctuation
  // followed by a capital or Unicode letter (handles EN, JA, MN)
  const firstEnd = cleaned.search(
    /[.!?]\s+[A-Z\u0400-\u04FF\u3040-\u9FFFぁ-ん\u4E00-\u9FFF]/,
  );
  if (firstEnd === -1) return null;

  const rest = cleaned.substring(firstEnd + 2).trim();
  return rest.length >= 30 ? truncate(rest, MAX_EXAMPLE) : null;
}

/** Returns just the first sentence of any language extract. */
function firstSentence(extract: string): string | null {
  // Match up to the first . ! ? 。
  const m = extract.trim().match(/^.+?[.!?。]/s);
  if (!m) return null;
  const s = m[0].trim();
  return s.length >= 20 ? truncate(s, MAX_EXAMPLE) : null;
}

// ── Wikipedia / Wikidata API ──────────────────────────────────────────────────
async function fetchWikiSummary(
  lang: string,
  title: string,
): Promise<WikiSummary | null> {
  const url =
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/` +
    encodeURIComponent(title);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FutureHubDictionaryEnricher/1.0 (student project)",
      },
    });
    if (!res.ok) return null;
    const d = (await res.json()) as {
      type?: string;
      title: string;
      extract?: string;
      wikibase_item?: string;
    };
    if (d.type === "disambiguation") return null;
    const extract = d.extract?.trim() ?? "";
    if (extract.length < 15) return null;
    return { title: d.title, extract, wikibase_item: d.wikibase_item };
  } catch {
    return null;
  }
}

async function fetchWikidataLinks(
  qid: string,
): Promise<{ jawiki?: string; mnwiki?: string }> {
  const url =
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${qid}` +
    `&props=sitelinks&sitefilter=jawiki%7Cmnwiki&format=json`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "FutureHubDictionaryEnricher/1.0 (student project)",
      },
    });
    if (!res.ok) return {};
    const d = (await res.json()) as {
      entities?: Record<
        string,
        { sitelinks?: Record<string, { title: string }> }
      >;
    };
    const sl = d.entities?.[qid]?.sitelinks ?? {};
    return { jawiki: sl.jawiki?.title, mnwiki: sl.mnwiki?.title };
  } catch {
    return {};
  }
}

// ── progress ──────────────────────────────────────────────────────────────────
function loadProgress(): Set<number> {
  if (!existsSync(PROGRESS_FILE)) return new Set();
  try {
    return new Set(JSON.parse(readFileSync(PROGRESS_FILE, "utf8")) as number[]);
  } catch {
    return new Set();
  }
}

function saveProgress(done: Set<number>) {
  writeFileSync(PROGRESS_FILE, JSON.stringify([...done], null, 2));
}

// ── concurrent runner ─────────────────────────────────────────────────────────
async function runBatched<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, globalIdx: number) => Promise<R>,
): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    out.push(...(await Promise.all(batch.map((item, j) => fn(item, i + j)))));
    if (i + concurrency < items.length) await sleep(BATCH_PAUSE);
  }
  return out;
}

// ── per-entry enrichment ──────────────────────────────────────────────────────
async function enrichOne(
  entry: DBEntry,
  idx: number,
  total: number,
): Promise<EnrichResult> {
  const label = `[${String(idx + 1).padStart(4)}/${total}] ${entry.term.substring(0, 44).padEnd(44)}`;
  const result: EnrichResult = { entryId: entry.id, term: entry.term };

  // 1. English Wikipedia → Q ID + extract for EN example
  const en = await fetchWikiSummary("en", entry.term);
  if (!en) {
    process.stdout.write(`${label} ✗ EN 404\n`);
    return result;
  }

  result.enExample = sentencesAfterFirst(en.extract) ?? undefined;

  if (!en.wikibase_item) {
    process.stdout.write(`${label} ~ no QID\n`);
    return result;
  }

  // 2. Wikidata → JA and MN sitelink titles
  await sleep(WIKIDATA_PAUSE);
  const links = await fetchWikidataLinks(en.wikibase_item);

  // 3. Japanese Wikipedia
  if (links.jawiki) {
    const ja = await fetchWikiSummary("ja", links.jawiki);
    if (ja) {
      result.jaTitle = ja.title;
      result.jaExplanation = truncate(ja.extract, MAX_EXPL_LEN);
      result.jaExample = firstSentence(ja.extract) ?? undefined;
    }
  }

  // 4. Mongolian Wikipedia
  if (links.mnwiki) {
    const mn = await fetchWikiSummary("mn", links.mnwiki);
    if (mn) {
      result.mnTitle = mn.title;
      result.mnExplanation = truncate(mn.extract, MAX_EXPL_LEN);
      result.mnExample = firstSentence(mn.extract) ?? undefined;
    }
  }

  const langs =
    [result.jaTitle ? "JA" : "", result.mnTitle ? "MN" : ""]
      .filter(Boolean)
      .join("+") || "EN only";
  process.stdout.write(`${label} ✓ ${langs}\n`);
  return result;
}

// ── DB write ──────────────────────────────────────────────────────────────────
async function writeToDb(
  results: EnrichResult[],
  alreadyHasJa: Set<number>,
  alreadyHasMn: Set<number>,
  alreadyHasEnExample: Set<number>,
) {
  const translations: object[] = [];
  const examples: object[] = [];

  for (const r of results) {
    // Only insert if not already present in DB (table has no unique constraint)
    if (r.jaTitle && !alreadyHasJa.has(r.entryId)) {
      translations.push({
        entry_id: r.entryId,
        language_code: "ja",
        translated_term: r.jaTitle,
        explanation: r.jaExplanation ?? null,
        created_by: AUTHOR_UUID,
      });
      alreadyHasJa.add(r.entryId); // prevent duplicates if run twice in same session
    }

    if (r.mnTitle && !alreadyHasMn.has(r.entryId)) {
      translations.push({
        entry_id: r.entryId,
        language_code: "mn",
        translated_term: r.mnTitle,
        explanation: r.mnExplanation ?? null,
        created_by: AUTHOR_UUID,
      });
      alreadyHasMn.add(r.entryId);
    }

    if (r.enExample && !alreadyHasEnExample.has(r.entryId)) {
      examples.push({
        entry_id: r.entryId,
        example_text: r.enExample,
        source: "Wikipedia",
        context: null,
        language_code: "en",
        created_by: AUTHOR_UUID,
      });
      alreadyHasEnExample.add(r.entryId);
    }

    if (r.jaExample) {
      examples.push({
        entry_id: r.entryId,
        example_text: r.jaExample,
        source: "Wikipedia (ja)",
        context: null,
        language_code: "ja",
        created_by: AUTHOR_UUID,
      });
    }

    if (r.mnExample) {
      examples.push({
        entry_id: r.entryId,
        example_text: r.mnExample,
        source: "Wikipedia (mn)",
        context: null,
        language_code: "mn",
        created_by: AUTHOR_UUID,
      });
    }
  }

  // Batch insert translations (50 per call)
  for (let i = 0; i < translations.length; i += 50) {
    const { error } = await supabase
      .from("dictionary_translations")
      .insert(translations.slice(i, i + 50));
    if (error) console.error("  ! translation insert error:", error.message);
  }

  // Batch insert examples (50 per call)
  for (let i = 0; i < examples.length; i += 50) {
    const { error } = await supabase
      .from("dictionary_examples")
      .insert(examples.slice(i, i + 50));
    if (error) console.error("  ! examples insert error:", error.message);
  }

  return {
    transInserted: translations.length,
    examplesInserted: examples.length,
  };
}

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🌍  FutureHub Dictionary Enricher");
  console.log("   Translations: JA + MN via Wikipedia/Wikidata");
  console.log("   Examples:     EN sentences 2+, JA/MN first sentence\n");

  // 1. Load all EN approved entries (up to 2000)
  const { data: allEntries, error: fetchErr } = await supabase
    .from("dictionary_entries")
    .select("id, term")
    .eq("language_code", "en")
    .eq("status", "approved")
    .range(0, 1999);

  if (fetchErr || !allEntries?.length) {
    console.error("✗  Could not fetch entries:", fetchErr?.message);
    process.exit(1);
  }

  const allIds = allEntries.map((e) => e.id);
  console.log(`   Total EN entries in DB : ${allEntries.length}`);

  // 2. Determine which entries already have JA / MN translations and EN examples
  //    (Fetch in batches of 500 because Supabase IN filter has limits)
  async function fetchExistingSet(
    lang: string,
    table: string,
    col: string,
  ): Promise<Set<number>> {
    const s = new Set<number>();
    for (let i = 0; i < allIds.length; i += 500) {
      const { data } = await supabase
        .from(table)
        .select(col)
        .in("entry_id", allIds.slice(i, i + 500))
        .eq("language_code", lang);
      (data ?? []).forEach((r) => s.add(r[col] as number));
    }
    return s;
  }

  const [alreadyHasJa, alreadyHasMn, alreadyHasEnExample] = await Promise.all([
    fetchExistingSet("ja", "dictionary_translations", "entry_id"),
    fetchExistingSet("mn", "dictionary_translations", "entry_id"),
    fetchExistingSet("en", "dictionary_examples", "entry_id"),
  ]);

  console.log(`   Already have JA translation : ${alreadyHasJa.size}`);
  console.log(`   Already have MN translation : ${alreadyHasMn.size}`);
  console.log(`   Already have EN example     : ${alreadyHasEnExample.size}`);

  // 3. Filter to entries that need at least one thing added
  const progress = loadProgress();

  const toProcess = allEntries.filter(
    (e) =>
      !progress.has(e.id) &&
      (!alreadyHasJa.has(e.id) ||
        !alreadyHasMn.has(e.id) ||
        !alreadyHasEnExample.has(e.id)),
  );

  console.log(`   Entries to process now      : ${toProcess.length}\n`);

  if (!toProcess.length) {
    console.log("✓  All entries are already enriched! Nothing to do.");
    return;
  }

  // 4. Process in checkpointed chunks of 20 entries
  const CHECKPOINT_SIZE = 20;
  let totalTrans = 0;
  let totalExamples = 0;
  let chunksDone = 0;

  for (let i = 0; i < toProcess.length; i += CHECKPOINT_SIZE) {
    const chunk = toProcess.slice(i, i + CHECKPOINT_SIZE);

    const results = await runBatched(chunk, CONCURRENCY, (entry, j) =>
      enrichOne(entry, i + j, toProcess.length),
    );

    const { transInserted, examplesInserted } = await writeToDb(
      results,
      alreadyHasJa,
      alreadyHasMn,
      alreadyHasEnExample,
    );

    totalTrans += transInserted;
    totalExamples += examplesInserted;
    chunksDone++;

    results.forEach((r) => progress.add(r.entryId));
    saveProgress(progress);

    const sofar = Math.min(i + CHECKPOINT_SIZE, toProcess.length);
    console.log(
      `\n   ✦ Checkpoint ${chunksDone}: ${sofar}/${toProcess.length} processed` +
        ` (${transInserted} translations, ${examplesInserted} examples this batch)\n`,
    );
  }

  // 5. Final summary
  console.log("─────────────────────────────────────────────────────");
  console.log(`✓  Processed        : ${toProcess.length} entries`);
  console.log(`✓  Translations     : ${totalTrans} rows inserted`);
  console.log(`✓  Examples         : ${totalExamples} rows inserted`);
  console.log(
    `   JA coverage      : ~${alreadyHasJa.size + toProcess.filter((e) => !alreadyHasJa.has(e.id)).length} entries`,
  );
  console.log("─────────────────────────────────────────────────────");
  console.log("\n   Open /dictionary and search in any language to verify.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
