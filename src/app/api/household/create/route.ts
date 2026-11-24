import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { adminClient } from "@/lib/supabase/server";
import { err, hmac, requireUser } from "@/lib/server/auth";

const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return err("Sem sessão.", 401);
  const { kcal, protein } = (await req.json().catch(() => ({}))) as { kcal?: number | null; protein?: number | null };
  const sb = adminClient();
  const { data: ex } = await sb.from("household_members").select("household_id").eq("user_id", u.id).maybeSingle();
  if (ex) return err("Já pertences a um agregado.", 409);
  const code = Array.from({ length: 6 }, () => ALPHA[randomInt(ALPHA.length)]).join("");
  const { data: h, error } = await sb.from("households").insert({ code_hmac: hmac(code), owner: u.id }).select("id").single();
  if (error || !h) return err("Não foi possível criar o agregado.", 500);
  await sb.from("household_members").insert({ household_id: h.id, user_id: u.id, kcal: kcal ?? null, protein: protein ?? null });
  return NextResponse.json({ id: h.id, code }); // o código só é mostrado agora; no servidor fica apenas o HMAC
}
