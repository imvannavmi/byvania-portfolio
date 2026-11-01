import Portfolio from "@/components/Portfolio";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedContent } from "@/lib/supabase/content";

export const dynamic = "force-dynamic";

export function generateStaticParams() { return [{ locale: "id" }, { locale: "en" }]; }
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const en = locale === "en";
  return {
    title: en ? "Vania Bunga Febrina — Developer & IT Enthusiast" : "Vania Bunga Febrina — Developer & Antusias TI",
    description: en ? "Computer Engineering graduate exploring development, IT infrastructure, and cybersecurity." : "Lulusan Teknik Komputer yang mengeksplorasi pengembangan web, infrastruktur TI, dan keamanan siber.",
    openGraph: { locale: en ? "en_US" : "id_ID", title: "</> by.vania", type: "website" },
  };
}
export default async function LocalePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== "id" && locale !== "en") notFound();
  const entries = await getPublishedContent(locale);
  return <Portfolio locale={locale} entries={entries} />;
}
