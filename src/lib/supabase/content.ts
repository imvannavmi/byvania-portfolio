import { createClient } from "@supabase/supabase-js";
import type { Locale } from "@/content";

export type CmsRecord = {
  id: string;
  kind: "project" | "experience" | "skill" | "education" | "section";
  locale: Locale;
  title: string;
  payload: Record<string, unknown>;
  is_published: boolean;
  sort_order: number;
};

export async function getPublishedContent(locale: Locale): Promise<CmsRecord[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase
      .from("portfolio_content")
      .select("id,kind,locale,title,payload,is_published,sort_order")
      .eq("locale", locale)
      .eq("is_published", true)
      .order("sort_order", { ascending: true });
    if (error) return [];
    return (data || []) as CmsRecord[];
  } catch {
    return [];
  }
}
