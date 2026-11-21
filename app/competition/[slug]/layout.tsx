import type { Metadata } from "next";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { LANG_COOKIE, resolveLanguage } from "@/lib/language";
import { localize } from "@/lib/api/competitions";

/*
 * Server wrapper for the (client) competition page: shows the normal 404 for missing or draft
 * competitions (RLS hides drafts from everyone but staff) and provides sharing metadata.
 */

const loadCompetition = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("competitions")
    .select("slug, title, summary, cover_url")
    .eq("slug", slug)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: LayoutProps<"/competition/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const competition = await loadCompetition(slug);
  if (!competition) return {};

  const [cookieStore, headerList] = await Promise.all([cookies(), headers()]);
  const lang = resolveLanguage(cookieStore.get(LANG_COOKIE)?.value, headerList.get("accept-language"));
  const title = localize(competition.title, lang);
  const description = localize(competition.summary, lang) || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(competition.cover_url ? { images: [competition.cover_url] } : {}),
    },
  };
}

export default async function CompetitionLayout({ children, params }: LayoutProps<"/competition/[slug]">) {
  const { slug } = await params;
  if (!(await loadCompetition(slug))) notFound();
  return children;
}
