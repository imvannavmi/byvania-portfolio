import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { updatePasswordAction } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kata sandi baru · Admin by.vania", robots: { index: false, follow: false } };

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/forgot-password?error=expired");

  return <main className="admin-page"><div className="admin-shell"><a className="admin-brand" href="/id">&lt;/&gt; by.vania <span>/ admin</span></a><section className="admin-card login-card"><span className="admin-command">$ auth --set-password</span><h1>Kata sandi baru<span>.</span></h1><p>Buat kata sandi baru untuk akun {user.email}.</p>{error === "invalid" && <p className="admin-notice error" role="alert">Kata sandi minimal 8 karakter dan kedua kolom harus sama.</p>}<form action={updatePasswordAction} className="admin-login-form"><label>Kata sandi baru<input name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label><label>Ulangi kata sandi<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={128} required /></label><button className="admin-button primary" type="submit">Simpan kata sandi</button></form></section></div></main>;
}
