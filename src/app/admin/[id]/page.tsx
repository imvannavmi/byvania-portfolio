import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { uploadProjectImageAction } from "../actions";
import { AdminFooter, AdminHeader, Notice } from "../AdminChrome";
import ContentForm, { type AdminRow } from "../ContentForm";
import { createSupabaseServerClient, hasSupabaseConfig } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Edit konten · Admin by.vania", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditContentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; uploaded?: string }> }) {
  if (!hasSupabaseConfig()) redirect("/admin");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin?error=login");
  const { data: admin, error } = await supabase.from("portfolio_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  if (error) redirect("/admin?error=save");
  if (!admin) redirect("/admin?error=access");
  const { id } = await params;
  const { data } = await supabase.from("portfolio_content").select("id,kind,locale,title,payload,is_published,sort_order").eq("id", id).maybeSingle();
  if (!data) notFound();
  const row = data as AdminRow;
  const query = await searchParams;

  return <main className="admin-page"><div className="admin-shell"><AdminHeader email={user.email || ""} /><div className="admin-heading"><div><span className="admin-command">$ cms --edit</span><h1>Edit konten<span>.</span></h1><p>{row.title}</p></div><a className="admin-button secondary" href="/admin">← Kembali ke daftar</a></div><Notice code={query.error} />{query.uploaded && <div className="admin-notice success"><strong>Gambar berhasil diunggah.</strong><br/>Salin URL ini ke kolom thumbnail atau gambar detail di formulir proyek:<code className="uploaded-url">{query.uploaded}</code></div>}<div className="admin-card upload-card"><div className="admin-card-heading"><h2>Unggah gambar proyek</h2><span>JPEG · PNG · WEBP · MAX 5 MB</span></div><form action={uploadProjectImageAction} className="upload-form"><input type="hidden" name="returnTo" value={`/admin/${row.id}`} /><label>File gambar<input type="file" name="image" accept="image/jpeg,image/png,image/webp" required /></label><button className="admin-button primary" type="submit">Unggah gambar <span>↑</span></button></form></div><section className="admin-card"><div className="admin-card-heading"><h2>Informasi konten</h2><span>{row.kind.toUpperCase()}</span></div><ContentForm row={row} /></section><AdminFooter /></div></main>;
}
