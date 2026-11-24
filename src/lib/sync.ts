"use client";
import { DEFAULT_ANSWERS, type Answers } from "@/lib/answers";
import type { Plan, Prefs } from "@/lib/engine";
import { ENGINE_VERSION } from "@/lib/engine";
import { K, readLocal, removeLocal, writeLocal } from "@/lib/store";
import { ensureSession, supabase } from "@/lib/supabase/client";
import { mondayOf } from "@/lib/week";

export interface HouseholdLocal { id: string; code?: string }
let timer: ReturnType<typeof setTimeout> | undefined;

/** Guarda o plano editado: no agregado cria nova linha (todos leem a mais recente); a solo atualiza a própria. */
export function savePlan(plan: Plan) {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      const u = await ensureSession(), sb = supabase(), hh = readLocal<HouseholdLocal | null>(K.household, null), rowId = readLocal<string | null>(K.planRow, null);
      if (!hh && rowId) { await sb.from("plans").update({ plan }).eq("id", rowId); return; }
      const { data } = await sb.from("plans").insert({ user_id: u.id, household_id: hh?.id ?? null, week_start: plan.weekStart, plan, seed: plan.seed, engine_version: ENGINE_VERSION }).select("id").single();
      if (data) writeLocal(K.planRow, data.id);
    } catch { /* offline: fica no dispositivo */ }
  }, 1200);
}

/** Agregado: adota a semana mais recente partilhada. */
export async function pullHouseholdPlan(): Promise<void> {
  const hh = readLocal<HouseholdLocal | null>(K.household, null); if (!hh) return;
  const { data } = await supabase().from("plans").select("id,plan").eq("household_id", hh.id).lte("week_start", mondayOf()).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (data && data.id !== readLocal<string | null>(K.planRow, null)) { writeLocal(K.planRow, data.id); writeLocal(K.plan, data.plan as Plan); }
}

/** Noutro dispositivo: reconstrói respostas (sem medidas corporais) e a última semana a partir do servidor. */
export async function restoreFromServer(): Promise<boolean> {
  const sb = supabase(), u = await ensureSession();
  const { data: prof } = await sb.from("profiles").select("objective,kcal,protein,prefs").eq("user_id", u.id).maybeSingle();
  const { data: mem } = await sb.from("household_members").select("household_id").eq("user_id", u.id).maybeSingle();
  const { data: row } = await sb.from("plans").select("id,plan").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!prof?.prefs || !row) return false;
  const p = prof.prefs as Prefs;
  const a: Answers = { ...DEFAULT_ANSWERS, objective: (prof.objective as Answers["objective"]) ?? "nao-sei", diet: p.diet, allergens: p.allergens, excludedFoods: p.excludedFoods, excludedRecipes: p.excludedRecipes, likedFoods: p.likedFoods, likedRecipes: p.likedRecipes,
    equipment: p.equipment, cooksPerWeek: p.cooksPerWeek, maxMinutes: p.maxMinutes, repetition: p.repetition, lunch: p.lunch, store: p.store, budget: p.budget, peopleCount: p.people.length, kcal: prof.kcal ?? undefined, protein: prof.protein ?? undefined, done: true, step: 0 };
  writeLocal(K.answers, a); writeLocal(K.plan, row.plan as Plan); writeLocal(K.planRow, row.id);
  if (mem) { writeLocal(K.household, { id: mem.household_id }); writeLocal(K.me, u.id); }
  return true;
}
export function clearLocal() { Object.values(K).forEach((k) => removeLocal(k)); }
