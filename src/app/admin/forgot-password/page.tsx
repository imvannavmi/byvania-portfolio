import type { Metadata } from "next";
import Link from "next/link";
import { requestPasswordResetAction } from "../actions";

export const metadata: Metadata = { title: "Reset kata sandi · Admin by.vania", robots: { index: false, follow: false } };

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<{ sent?: string; error?: string }> }) {
  const query = await searchParams;
  return <main className="admin-page"><div className="admin-shell"><a className="admin-brand" href="/id">&lt;/&gt; by.vania <span>/ admin</span></a><section className="admin-card login-card"><span className="admin-command">$ auth --recover</span><h1>Atur ulang kata sandi<span>.</span></h1><p>Masukkan email akun admin. Kami akan mengirim tautan untuk membuat kata sandi baru.</p>{query.sent ? <p className="admin-notice success" role="status">Jika email tersebut terdaftar, tautan reset sudah dikirim. Periksa kotak masuk dan folder spam.</p> : <>
    {query.error === "invalid" && <p className="admin-notice error" role="alert">Masukkan alamat email yang valid.</p>}
    {query.error === "reset" && <p className="admin-notice error" role="alert">Tautan reset belum dapat dikirim. Pastikan URL callback diizinkan pada pengaturan Auth Supabase.</p>}
    {query.error === "expired" && <p className="admin-notice error" role="alert">Tautan reset tidak valid atau sudah kedaluwarsa. Minta tautan baru.</p>}
    <form action={requestPasswordResetAction} className="admin-login-form"><label>Email<input name="email" type="email" autoComplete="email" required /></label><button className="admin-button primary" type="submit">Kirim tautan reset</button></form>
  </>}<Link className="back-link" href="/admin">← Kembali ke login</Link></section></div></main>;
}
