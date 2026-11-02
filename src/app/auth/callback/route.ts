import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/admin/update-password";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/admin/update-password";

  if (!code) return NextResponse.redirect(new URL("/admin/forgot-password?error=expired", request.url));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(new URL("/admin/forgot-password?error=expired", request.url));

  return NextResponse.redirect(new URL(safeNext, request.url));
}
