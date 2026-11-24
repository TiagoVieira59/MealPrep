import "server-only";
import { generatePlan, ENGINE_VERSION, type Person, type Plan, type Prefs } from "@/lib/engine";
import { NORMAL_PORTION } from "@/lib/answers";
import { adminClient } from "@/lib/supabase/server";

/** Gera a semana do agregado para todos os membros e guarda-a como a mais recente. */
export async function buildHousehold(uid: string, seed: number, weekStart: string): Promise<{ plan: Plan; rowId?: string; householdId: string } | { error: string; status: number }> {
  const sb = adminClient();
  const { data: mem } = await sb.from("household_members").select("household_id").eq("user_id", uid).maybeSingle();
  if (!mem) return { error: "Não pertences a nenhum agregado.", status: 403 };
  const { data: h } = await sb.from("households").select("owner").eq("id", mem.household_id).single();
  const { data: members } = await sb.from("household_members").select("user_id,kcal,protein").eq("household_id", mem.household_id);
  const { data: prof } = await sb.from("profiles").select("prefs,kcal,protein").eq("user_id", h!.owner).maybeSingle();
  if (!prof?.prefs) return { error: "O criador do agregado ainda não gerou uma semana.", status: 409 };
  const base = prof.prefs as Prefs;
  const ordered = [...(members ?? [])].sort((a, b) => (a.user_id === h!.owner ? -1 : b.user_id === h!.owner ? 1 : 0));
  const people: Person[] = ordered.map((m, i) => ({
    id: m.user_id, name: `Membro ${i + 1}`,
    kcal: m.kcal ?? (m.user_id === h!.owner ? prof.kcal ?? NORMAL_PORTION.kcal : NORMAL_PORTION.kcal),
    protein: m.protein ?? (m.user_id === h!.owner ? prof.protein ?? NORMAL_PORTION.protein : NORMAL_PORTION.protein),
  }));
  const guests = base.people.filter((x) => x.id !== "me").slice(0, Math.max(0, 8 - people.length));
  const plan = generatePlan({ ...base, people: [...people, ...guests] }, seed, weekStart);
  const { data: row } = await sb.from("plans").insert({ user_id: uid, household_id: mem.household_id, week_start: weekStart, plan, seed: seed, engine_version: ENGINE_VERSION }).select("id").single();
  return { plan, rowId: row?.id, householdId: mem.household_id };
}
