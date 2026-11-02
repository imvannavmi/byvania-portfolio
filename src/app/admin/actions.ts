"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin?error=login");

  const { data: admin, error } = await supabase
    .from("portfolio_admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !admin) redirect("/admin?error=access");
  return supabase;
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  if (!email || !password || email.length > 254 || password.length > 1024) {
    redirect("/admin?error=credentials");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin?error=credentials");
  redirect("/admin");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  if (!email || email.length > 254) redirect("/admin/forgot-password?error=invalid");

  const origin = (await headers()).get("origin");
  if (!origin) redirect("/admin/forgot-password?error=reset");
  const redirectTo = new URL("/auth/callback?next=/admin/update-password", origin).toString();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) redirect("/admin/forgot-password?error=reset");
  redirect("/admin/forgot-password?sent=1");
}

export async function updatePasswordAction(formData: FormData) {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");
  if (password.length < 8 || password.length > 128 || password !== confirmPassword) {
    redirect("/admin/update-password?error=invalid");
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/forgot-password?error=expired");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/admin/update-password?error=invalid");
  redirect("/admin?reset=1");
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin");
}

export async function saveContentAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  const kind = String(formData.get("kind") || "");
  const locale = String(formData.get("locale") || "");
  const title = String(formData.get("title") || "").trim();
  const isPublished = formData.get("is_published") === "on";
  const sortOrder = Number(formData.get("sort_order") || 0);

  if (!title || title.length > 180 || !["project", "experience", "skill", "education", "section"].includes(kind) || !["id", "en"].includes(locale) || !Number.isInteger(sortOrder)) {
    redirect("/admin?error=invalid");
  }
  const value = (key: string) => String(formData.get(key) || "").trim();
  const list = (key: string) => value(key).split(/\r?\n/).map(item => item.trim()).filter(Boolean);
  const features = Array.from({ length: 50 }, (_, index) => String(formData.get(`feature_${index}`) || "").trim()).filter(Boolean);
  const images = Array.from({ length: 50 }, (_, index) => {
    const url = String(formData.get(`image_${index}`) || "").trim();
    const caption = String(formData.get(`image_caption_${index}`) || "").trim();
    return url ? { url, caption } : null;
  }).filter((image): image is { url: string; caption: string } => image !== null);
  let payload: Record<string, unknown>;
  if (kind === "project") {
    payload = {
      slug: value("slug"), category: value("category"), subtitle: value("subtitle"), description: value("description"), status: value("status"),
      technologies: list("technologies"), features: features.slice(0, 6), thumbnailUrl: value("thumbnailUrl"), images,
      challengesSolutions: value("challengesSolutions"), resultsLearnings: value("resultsLearnings"),
      repositoryUrl: value("repositoryUrl"), liveDemoUrl: value("liveDemoUrl"),
    };
  } else if (kind === "experience") {
    payload = { role: value("role"), period: value("period"), project: value("project"), stack: list("stack"), bullets: list("bullets") };
  } else if (kind === "skill") {
    payload = { level: value("level"), items: list("items") };
  } else if (kind === "education") {
    payload = { description: value("description") };
  } else {
    payload = { key: value("key"), value: value("value") };
  }
  if (JSON.stringify(payload).length > 50000) redirect("/admin?error=invalid");

  const record = { kind, locale, title, payload, is_published: isPublished, sort_order: sortOrder };
  const result = id
    ? await supabase.from("portfolio_content").update(record).eq("id", id)
    : await supabase.from("portfolio_content").insert(record);
  if (result.error) redirect("/admin?error=save");
  redirect("/admin?saved=1");
}

export async function deleteContentAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) redirect("/admin?error=invalid");
  const { error } = await supabase.from("portfolio_content").delete().eq("id", id);
  if (error) redirect("/admin?error=delete");
  redirect("/admin?deleted=1");
}

export async function uploadProjectImageAction(formData: FormData) {
  const supabase = await requireAdmin();
  const file = formData.get("image");
  if (!(file instanceof File) || file.size < 1 || file.size > 5 * 1024 * 1024) {
    redirect("/admin?error=image");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let contentType: "image/jpeg" | "image/png" | "image/webp";
  let extension: "jpg" | "png" | "webp";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    contentType = "image/jpeg"; extension = "jpg";
  } else if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    contentType = "image/png"; extension = "png";
  } else if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    contentType = "image/webp"; extension = "webp";
  } else {
    redirect("/admin?error=image");
  }

  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("project-images").upload(path, buffer, {
    contentType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) redirect("/admin?error=storage");
  const { data } = supabase.storage.from("project-images").getPublicUrl(path);
  const returnTo = String(formData.get("returnTo") || "");
  const destination = /^\/admin\/(new|[0-9a-f-]+)$/i.test(returnTo) ? returnTo : "/admin/new";
  redirect(`${destination}?uploaded=${encodeURIComponent(data.publicUrl)}`);
}
