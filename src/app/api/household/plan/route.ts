import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePlan, ENGINE_VERSION, type Person, type Prefs } from "@/lib/engine";
import { NORMAL_PORTION } from "@/lib/answers";
import { adminClient } from "@/lib/supabase/server";
import { err, requireUser } from "@/lib/server/auth";

const body = z.object({ seed: z.number().int().min(0).max(2 ** 31), weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
/** Gera a semana do agregado: um prato para todos, porções por pessoa (metas de cada membro ou porção normal). */
export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return err("Sem sessão.", 401);
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return err("Pedido inválido.");
  const sb = adminClient();
  const { data: mem } = await sb.from("household_members").select("household_id").eq("user_id", u.id).maybeSingle();
  if (!mem) return err("Não pertences a nenhum agregado.", 403);
  const { data: h } = await sb.from("households").select("owner").eq("id", mem.household_id).single();
  const { data: members } = await sb.from("household_members").select("user_id,kcal,protein").eq("household_id", mem.household_id);
  const { data: prof } = await sb.from("profiles").select("prefs,kcal,protein").eq("user_id", h!.owner).maybeSingle();
  if (!prof?.prefs) return err("O criador do agregado ainda não gerou uma semana.", 409);
  const base = prof.prefs as Prefs;
  const ordered = [...(members ?? [])].sort((a, b) => (a.user_id === h!.owner ? -1 : b.user_id === h!.owner ? 1 : 0));
  const people: Person[] = ordered.map((m, i) => ({
    id: m.user_id, name: `Membro ${i + 1}`,
    kcal: m.kcal ?? (m.user_id === h!.owner ? prof.kcal ?? NORMAL_PORTION.kcal : NORMAL_PORTION.kcal),
    protein: m.protein ?? (m.user_id === h!.owner ? prof.protein ?? NORMAL_PORTION.protein : NORMAL_PORTION.protein),
  }));
  const guests = base.people.filter((x) => x.id !== "me").slice(0, Math.max(0, 8 - people.length));
  const plan = generatePlan({ ...base, people: [...people, ...guests] }, p.data.seed, p.data.weekStart);
  const { data: row } = await sb.from("plans").insert({ user_id: u.id, household_id: mem.household_id, week_start: p.data.weekStart, plan, seed: p.data.seed, engine_version: ENGINE_VERSION }).select("id").single();
  return NextResponse.json({ plan, rowId: row?.id, householdId: mem.household_id });
}
