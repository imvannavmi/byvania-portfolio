import { logoutAction } from "./actions";

export function AdminHeader({ email }: { email: string }) {
  return <header className="admin-header"><a className="admin-brand" href="/id">&lt;/&gt; by.vania <span>/ admin</span></a><form action={logoutAction}><span className="admin-user">{email}</span><button className="admin-button secondary" type="submit">Keluar</button></form></header>;
}

export function Notice({ code }: { code?: string }) {
  if (!code) return null;
  const messages: Record<string, string> = {
    credentials: "Email atau kata sandi belum cocok.",
    login: "Silakan masuk untuk melanjutkan.",
    access: "Akun ini belum diberi akses administrator.",
    invalid: "Periksa kembali isian. Pastikan semua isian tidak melebihi batas ukuran.",
    save: "Konten belum tersimpan. Pastikan skema database sudah diterapkan.",
    delete: "Konten tidak dapat dihapus.",
    image: "File harus berupa JPEG, PNG, atau WebP dan berukuran maksimal 5 MB.",
    storage: "Upload gagal. Pastikan bucket project-images dan kebijakan Storage sudah dibuat.",
    "password-updated": "Kata sandi berhasil diubah. Kamu sudah masuk sebagai administrator.",
  };
  return <p className={`admin-notice ${code === "saved" || code === "deleted" || code === "password-updated" ? "success" : "error"}`} role="status">{messages[code] || (code === "saved" ? "Perubahan berhasil disimpan." : code === "deleted" ? "Konten berhasil dihapus." : "Terjadi kesalahan.")}</p>;
}

export function AdminFooter() {
  return <footer className="admin-footer"><a href="/id">← Lihat portofolio</a><span>SESSION TERLINDUNGI · SUPABASE AUTH</span></footer>;
}
