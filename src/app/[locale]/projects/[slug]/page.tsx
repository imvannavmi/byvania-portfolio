import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { projects, type Locale } from "@/content";
import { getPublishedContent } from "@/lib/supabase/content";

export const dynamic = "force-dynamic";

const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const stringValue = (value: unknown) => typeof value === "string" ? value : "";
const listValue = (value: unknown): string[] => Array.isArray(value) ? value.flatMap(item => typeof item === "string" ? [item] : item && typeof item === "object" && "url" in item && typeof item.url === "string" ? [item.url] : []) : [];
const safeUrl = (value: unknown) => {
  if (typeof value !== "string") return "";
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : ""; } catch { return ""; }
};
const staticDescriptions: Record<string, Record<Locale, string>> = {
  "home-lab": { id: "Lingkungan belajar Blue Team pemula untuk memahami pemantauan Windows, Event Viewer, dan investigasi log secara aman dan terdokumentasi.", en: "A beginner Blue Team learning environment for understanding Windows monitoring, Event Viewer, and safe, documented log investigation." },
  mentorconnect: { id: "Platform mentoring berbasis web yang dikerjakan selama program magang Full Stack Developer.", en: "A web-based mentoring platform developed during a Full Stack Developer internship." },
  bms: { id: "Dukungan desain mekanik dan hardware untuk sistem manajemen gedung dan pemantauan energi.", en: "Mechanical design and hardware support for a building management and energy monitoring system." },
  unboxbrief: { id: "Generator brief tantangan proyek IT dan pemrograman dalam pengalaman mystery box.", en: "A project brief generator for IT and programming challenges, presented through a mystery-box experience." },
  journal: { id: "Aplikasi jurnal personal dan scrapbook cetak berbasis Flutter.", en: "A Flutter-based personal journaling and printable scrapbook application." },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  return { title: `${slug.replace(/-/g, " ")} · by.vania`, description: locale === "id" ? "Studi kasus proyek oleh Vania Bunga Febrina." : "Project case study by Vania Bunga Febrina." };
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: rawLocale, slug } = await params;
  if (rawLocale !== "id" && rawLocale !== "en") notFound();
  const locale: Locale = rawLocale;
  const entries = await getPublishedContent(locale);
  const cms = entries.find(row => row.kind === "project" && (stringValue(row.payload.slug) || slugify(row.title)) === slug);
  const fallback = projects.find(item => item.id === slug);
  if (!cms && !fallback) notFound();

  const title = cms?.title || fallback!.title;
  const payload = cms?.payload || {};
  const subtitle = stringValue(payload.subtitle);
  const description = stringValue(payload.description) || (fallback ? staticDescriptions[fallback.id]?.[locale] || "" : "");
  const category = stringValue(payload.category) || fallback?.category || (locale === "id" ? "Proyek" : "Project");
  const tags = (listValue(payload.technologies).length ? listValue(payload.technologies) : listValue(payload.tools).length ? listValue(payload.tools) : fallback?.tags || []).map(tag => tag.trim()).filter(Boolean);
  const gallery = Array.isArray(payload.images) ? payload.images.flatMap((image): { url: string; caption: string }[] => {
    if (typeof image === "string") {
      const url = safeUrl(image);
      return url ? [{ url, caption: "" }] : [];
    }
    if (image && typeof image === "object" && "url" in image && typeof image.url === "string") {
      const url = safeUrl(image.url);
      return url ? [{ url, caption: "caption" in image && typeof image.caption === "string" ? image.caption : "" }] : [];
    }
    return [];
  }) : [];
  const thumbnail = safeUrl(payload.thumbnailUrl) || gallery[0]?.url || "";
  const features = listValue(payload.features).map(feature => feature.trim()).filter(Boolean).slice(0, 6);
  const repository = safeUrl(payload.repositoryUrl);
  const demo = safeUrl(payload.liveDemoUrl);
  const pending = locale === "id" ? "Detail belum ditambahkan." : "Details have not been added yet.";
  return <main className="detail-page project-detail-page"><div className="detail-wrap project-detail-wrap">
    <header className="docs-topbar"><Link className="detail-back" href={`/${locale}#projects`}>← {locale === "id" ? "Semua proyek" : "All projects"}</Link><span className="docs-breadcrumb">PROJECT FILE <i>/</i> {slug}</span><Link className="docs-home" href={`/${locale}`}>by.vania <span>↗</span></Link></header>
    <div className="project-showcase-grid">
      <div className="project-showcase-left">
        <section className="project-showcase-overview" id="overview"><div className="docs-eyebrow"><span />{category}<i>·</i>{locale === "id" ? "STUDI KASUS" : "CASE STUDY"}</div><h1>{title}</h1>{subtitle && <p className="project-detail-tagline">{subtitle}</p>}<p className="project-showcase-description">{description || pending}</p><div className="project-showcase-stats"><div><span className="showcase-stat-icon">&lt;/&gt;</span><b>{tags.length}</b><small>{locale === "id" ? "Teknologi" : "Technologies used"}</small></div><div><span className="showcase-stat-icon">✳</span><b>{features.length}</b><small>{locale === "id" ? "Fitur utama" : "Key features"}</small></div></div><div className="project-detail-links">{repository ? <a href={repository} target="_blank" rel="noreferrer">↗ {locale === "id" ? "Lihat kode" : "View source"}</a> : <span className="project-no-link">↗ {locale === "id" ? "Kode belum tersedia" : "Source unavailable"}</span>}{demo ? <a href={demo} target="_blank" rel="noreferrer">⌘ {locale === "id" ? "Buka demo" : "Open demo"}</a> : <span className="project-no-link">⌘ {locale === "id" ? "Demo belum tersedia" : "Demo unavailable"}</span>}</div>
          {tags.length > 0 && <section className="project-showcase-tech" id="technologies"><h2><span>&lt;/&gt;</span>{locale === "id" ? "Teknologi yang digunakan" : "Technologies used"}</h2><div className="project-tech-chips">{tags.map(tag => <span key={tag}><i />{tag}</span>)}</div></section>}
        </section>
      </div>
      <div className="project-showcase-right">{thumbnail ? <figure className="project-detail-cover"><img src={thumbnail} alt={`${title} ${locale === "id" ? "tampilan proyek" : "project preview"}`} /><figcaption><span>PREVIEW / 01</span>{locale === "id" ? "Gambar utama proyek" : "Project cover"}</figcaption></figure> : <div className="project-detail-art"><span>&lt;/&gt;</span><small>{slug.toUpperCase()}</small></div>}
        {features.length > 0 && <section className="project-feature-panel" id="features"><h2><span>✳</span>{locale === "id" ? "Fitur utama" : "Key features"}</h2><ol>{features.map((feature, index) => <li key={`${feature}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><p>{feature}</p></li>)}</ol></section>}
      </div>
    </div>
    <div className="project-detail-content">
      {gallery.length > 0 && <section className="project-section project-gallery-section" id="gallery"><div className="project-section-heading"><span>APPENDIX / GALLERY</span><h2>{locale === "id" ? "Galeri proyek" : "Project gallery"}</h2></div><div className="detail-gallery-grid">{gallery.map((image, index) => <figure key={`${image.url}-${index}`}><img src={image.url} alt={image.caption || `${title} ${locale === "id" ? "gambar" : "image"} ${index + 1}`} loading="lazy" /><figcaption><span>FIG. {String(index + 2).padStart(2, "0")}</span>{image.caption || (locale === "id" ? `Lampiran ${index + 1}` : `Appendix ${index + 1}`)}</figcaption></figure>)}</div></section>}
    </div>
    <footer className="detail-footer"><span>&lt;/&gt; by.vania</span><Link href={`/${locale}#projects`}>{locale === "id" ? "← Kembali ke daftar proyek" : "← Back to all projects"}</Link></footer>
  </div></main>;
}
