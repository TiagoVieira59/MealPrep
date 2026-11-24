import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/server";
import { err, hmac, requireUser } from "@/lib/server/auth";

export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return err("Sem sessão.", 401);
  const b = (await req.json().catch(() => ({}))) as { code?: string; kcal?: number | null; protein?: number | null };
  const code = (b.code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 6) return err("O código tem 6 caracteres.");
  const sb = adminClient();
  const { data: ex } = await sb.from("household_members").select("household_id").eq("user_id", u.id).maybeSingle();
  if (ex) return err("Já pertences a um agregado. Sai primeiro do atual.", 409);
  const { data: h } = await sb.from("households").select("id").eq("code_hmac", hmac(code)).maybeSingle();
  if (!h) return err("Código inválido.", 404);
  const { count } = await sb.from("household_members").select("*", { count: "exact", head: true }).eq("household_id", h.id);
  if ((count ?? 0) >= 6) return err("O agregado está cheio.", 409);
  await sb.from("household_members").insert({ household_id: h.id, user_id: u.id, kcal: b.kcal ?? null, protein: b.protein ?? null });
  return NextResponse.json({ id: h.id });
}
