"use client";

import { useState } from "react";
import { saveContentAction } from "./actions";
import SubmitButton from "./SubmitButton";

export type AdminRow = {
  id: string;
  kind: string;
  locale: "id" | "en";
  title: string;
  payload: Record<string, unknown>;
  is_published: boolean;
  sort_order: number;
};

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function lines(value: unknown) {
  return Array.isArray(value) ? value.filter(item => typeof item === "string").join("\n") : text(value);
}

type GalleryImage = { url: string; caption: string };

function ParagraphTextarea({ name, defaultValue, rows = 3, placeholder }: { name: string; defaultValue: string; rows?: number; placeholder?: string }) {
  return <textarea name={name} rows={rows} defaultValue={defaultValue} placeholder={placeholder} onKeyDown={event => {
    if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    const field = event.currentTarget;
    const { selectionStart, selectionEnd, value } = field;
    if (value.length === 0) {
      field.setRangeText("• ", selectionStart, selectionEnd, "end");
    } else {
      let start = selectionStart;
      let end = selectionEnd;
      const lineStart = value.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
      const beforeCaret = value.slice(lineStart, start);
      if (beforeCaret.trim() && !/^\s*[•*-]\s/.test(beforeCaret)) {
        field.setRangeText("• ", lineStart, lineStart, "preserve");
        start += 2;
        end += 2;
      }
      field.setRangeText("\n• ", start, end, "end");
    }
    field.dispatchEvent(new Event("input", { bubbles: true }));
  }} />;
}

export default function ContentForm({ row }: { row?: AdminRow }) {
  const [kind, setKind] = useState(row?.kind || "project");
  const payload = row?.payload || {};
  const initialFeatures = Array.isArray(payload.features) ? payload.features.filter((item): item is string => typeof item === "string").slice(0, 6) : [];
  const [features, setFeatures] = useState<string[]>(() => Array.from({ length: 6 }, (_, index) => initialFeatures[index] || ""));
  const field = (name: string) => text(payload[name]);
  const list = (name: string) => lines(payload[name]);
  const mergedField = (name: string, legacy: string[]) => field(name) || legacy.map(key => field(key)).filter(Boolean).join("\n");
  const initialImages: GalleryImage[] = Array.isArray(payload.images) ? payload.images.flatMap((image): GalleryImage[] => {
    if (typeof image === "string") return [{ url: image, caption: "" }];
    if (image && typeof image === "object" && "url" in image && typeof image.url === "string") {
      return [{ url: image.url, caption: "caption" in image && typeof image.caption === "string" ? image.caption : "" }];
    }
    return [];
  }) : [];
  const [images, setImages] = useState<GalleryImage[]>(() => initialImages.length ? initialImages : [{ url: "", caption: "" }]);

  return <form action={saveContentAction} className="admin-editor">
    <input type="hidden" name="id" value={row?.id || ""} />
    <div className="admin-form-grid">
      <label>Jenis konten<select name="kind" value={kind} onChange={event => setKind(event.target.value)}><option value="project">Proyek</option><option value="experience">Pengalaman</option><option value="skill">Kategori keahlian</option><option value="education">Pendidikan</option><option value="section">Bagian situs</option></select></label>
      <label>Bahasa<select name="locale" defaultValue={row?.locale || "id"}><option value="id">Bahasa Indonesia</option><option value="en">English</option></select></label>
      <label className="wide">Judul<input name="title" defaultValue={row?.title || ""} maxLength={180} required placeholder="Contoh: MentorConnect" /></label>
      <label>Urutan<input type="number" name="sort_order" defaultValue={row?.sort_order ?? 0} step={1} /></label>
      <label className="publish-check"><input type="checkbox" name="is_published" defaultChecked={row?.is_published || false} /> Terbitkan konten ini</label>

      {kind === "project" && <>
        <p className="wide project-writing-help">Overview ditulis sebagai paragraf. Tekan Enter di kolom Challenges & Solutions atau Results & Learnings untuk membuat bullet. Key Features menampilkan maksimal enam poin.</p>
        <label>Slug URL<input name="slug" defaultValue={field("slug")} placeholder="mentorconnect" /></label>
        <label>Kategori<input name="category" defaultValue={field("category")} placeholder="Web Application" /></label>
        <label className="wide">Tagline / subjudul<input name="subtitle" defaultValue={field("subtitle")} maxLength={180} placeholder="Kalimat pendek yang mendukung judul proyek" /></label>
        <label className="wide">Overview / deskripsi singkat<textarea name="description" rows={3} defaultValue={field("description")} placeholder="Ringkasan singkat tentang proyek" /></label>
        <label>Status<input name="status" defaultValue={field("status")} placeholder="Selesai / In progress" /></label>
        <label>Technologies Used <span>(satu teknologi per baris)</span><textarea name="technologies" rows={3} defaultValue={list("technologies")} placeholder={"React\nSupabase"} /></label>
        <div className="wide feature-editor"><div className="feature-editor-heading"><label>Key Features</label><span>4–6 fitur · satu fitur per baris</span></div>{features.map((feature, index) => <div className="feature-row" key={index}><span className="feature-row-number">{String(index + 1).padStart(2, "0")}</span><input aria-label={`Fitur ${index + 1}`} name={`feature_${index}`} value={feature} onChange={event => setFeatures(current => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Fitur ${index + 1}`} /><button className="feature-remove" type="button" aria-label={`Hapus fitur ${index + 1}`} onClick={() => setFeatures(current => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}{features.length < 6 && <button className="feature-add" type="button" onClick={() => setFeatures(current => [...current, ""])}>+ Tambah fitur</button>}</div>
        <label className="wide">URL thumbnail<input name="thumbnailUrl" type="url" defaultValue={field("thumbnailUrl")} placeholder="https://..." /></label>
        <div className="wide feature-editor image-editor"><div className="feature-editor-heading"><label>Gambar detail & caption</label><span>satu gambar per baris · urutan dapat diubah</span></div>{images.map((image, index) => <div className="feature-row image-row" key={index}><span className="feature-row-number">{String(index + 1).padStart(2, "0")}</span><div className="image-fields"><input type="url" aria-label={`URL gambar detail ${index + 1}`} name={`image_${index}`} value={image.url} onChange={event => setImages(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} placeholder="URL gambar · https://..." /><input aria-label={`Caption gambar ${index + 1}`} name={`image_caption_${index}`} value={image.caption} onChange={event => setImages(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, caption: event.target.value } : item))} placeholder="Caption gambar, mis. Tampilan dashboard pemantauan" /></div><button className="image-move" type="button" aria-label={`Pindahkan gambar ${index + 1} ke atas`} disabled={index === 0} onClick={() => setImages(current => current.map((item, itemIndex) => itemIndex === index - 1 ? current[index] : itemIndex === index ? current[index - 1] : item))}>↑</button><button className="image-move" type="button" aria-label={`Pindahkan gambar ${index + 1} ke bawah`} disabled={index === images.length - 1} onClick={() => setImages(current => current.map((item, itemIndex) => itemIndex === index ? current[index + 1] : itemIndex === index + 1 ? current[index] : item))}>↓</button><button className="feature-remove" type="button" aria-label={`Hapus gambar ${index + 1}`} onClick={() => setImages(current => current.filter((_, itemIndex) => itemIndex !== index))}>×</button></div>)}{images.length < 50 && <button className="feature-add" type="button" onClick={() => setImages(current => [...current, { url: "", caption: "" }])}>+ Tambah gambar</button>}</div>
        <label className="wide">Challenges & Solutions<ParagraphTextarea name="challengesSolutions" defaultValue={mergedField("challengesSolutions", ["challenges", "solutions"])} placeholder="Jelaskan tantangan dan solusi yang diterapkan" /></label>
        <label className="wide">Results & Learnings<ParagraphTextarea name="resultsLearnings" defaultValue={mergedField("resultsLearnings", ["results", "lessons"])} placeholder="Jelaskan hasil akhir dan hal yang dipelajari" /></label>
        <label>URL repository<input name="repositoryUrl" type="url" defaultValue={field("repositoryUrl")} placeholder="https://github.com/..." /></label>
        <label>URL demo<input name="liveDemoUrl" type="url" defaultValue={field("liveDemoUrl")} placeholder="https://..." /></label>
      </>}

      {kind === "experience" && <>
        <label>Posisi / peran<input name="role" defaultValue={field("role")} /></label>
        <label>Periode<input name="period" defaultValue={field("period")} placeholder="2024 – 2025" /></label>
        <label>Proyek<input name="project" defaultValue={field("project")} /></label>
        <label>Teknologi / stack <span>(satu per baris)</span><textarea name="stack" rows={3} defaultValue={list("stack")} /></label>
        <label className="wide">Kontribusi <span>(satu poin per baris)</span><textarea name="bullets" rows={4} defaultValue={list("bullets")} /></label>
      </>}

      {kind === "skill" && <>
        <label>Tingkat keahlian<input name="level" defaultValue={field("level")} placeholder="practiced / learning" /></label>
        <label className="wide">Daftar keahlian <span>(satu per baris)</span><textarea name="items" rows={5} defaultValue={list("items")} /></label>
      </>}

      {kind === "education" && <label className="wide">Deskripsi pendidikan<textarea name="description" rows={4} defaultValue={field("description")} /></label>}
      {kind === "section" && <>
        <label>Kunci bagian<input name="key" defaultValue={field("key")} /></label>
        <label className="wide">Isi bagian<textarea name="value" rows={5} defaultValue={field("value")} /></label>
      </>}
    </div>
    <SubmitButton />
  </form>;
}
