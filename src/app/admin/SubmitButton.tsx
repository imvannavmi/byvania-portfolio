"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="admin-button primary" type="submit" disabled={pending} aria-live="polite">
    {pending ? "Menyimpan…" : "Simpan konten"} <span>{pending ? "◌" : "↗"}</span>
  </button>;
}
