import { RECIPE } from "./data";
import { allowedComplements, slotPool } from "./filter";
import { checkDay, dayTotal, mealCost, planCost } from "./nutrition";
import { resolveMeals } from "./resolve";
import { rng } from "./rng";
import type { Day, DayCheck, Plan, PlannedMeal, Prefs, Slot, Warning } from "./types";
import { ENGINE_VERSION } from "./types";

export interface SwapOption { recipeId: string; dProtein: number; dKcal: number; dCost: number; dayOk: boolean; after: DayCheck }

function mkDay(meals: PlannedMeal[], p: Prefs): Day {
  const day: Day = { meals, checks: {} };
  for (const person of p.people) day.checks[person.id] = checkDay(day, person);
  return day;
}
/** Recalcula custo, avisos e tempo de cozinha depois de uma alteração. */
export function refresh(plan: Plan, days: Day[]): Plan {
  const warnings: Warning[] = [];
  days.forEach((d, i) => plan.people.forEach((person) => { const c = d.checks[person.id]; if (!c.ok) warnings.push({ day: i, person: person.id, missingProtein: Math.max(0, Math.round((person.protein - c.protein) * 10) / 10), kcalDiff: c.kcal < c.kcalLow ? c.kcal - c.kcalLow : c.kcal > c.kcalHigh ? c.kcal - c.kcalHigh : 0 }); }));
  const seen = new Set<string>(); let mins = 0;
  for (const d of days) for (const m of d.meals) if (!seen.has(m.cookId)) { seen.add(m.cookId); mins += RECIPE.get(m.recipeId)!.minutes; }
  return { ...plan, version: ENGINE_VERSION, days, warnings, cost: Math.round(planCost(days, plan.people, plan.store) * 100) / 100, cookMinutes: mins };
}
const replaceMeal = (d: Day, slot: Slot, nm: PlannedMeal) => d.meals.map((m) => (m.slot === slot ? nm : m));

function withRecipe(plan: Plan, p: Prefs, dayIdx: number, slot: Slot, recipeId: string): Day {
  const d = plan.days[dayIdx], old = d.meals.find((m) => m.slot === slot)!;
  const nm: PlannedMeal = { ...old, recipeId, cookId: `${recipeId}#swap${dayIdx}${slot}`, status: "normal", own: undefined, scales: {}, extras: [] };
  return mkDay(resolveMeals(replaceMeal(d, slot, nm), p.people, allowedComplements(p)), p);
}

/** 3 alternativas válidas com o impacto, ANTES de aplicar. */
export function swapOptions(plan: Plan, p: Prefs, dayIdx: number, slot: Slot): SwapOption[] {
  const d = plan.days[dayIdx], cur = d.meals.find((m) => m.slot === slot)!;
  const used = new Set(plan.days.flatMap((x) => x.meals.map((m) => m.recipeId)));
  const other = d.meals.filter((m) => m.slot !== slot).map((m) => m.recipeId);
  const r = rng(plan.seed * 31 + dayIdx * 7 + slot.length);
  const pool = slotPool(p, slot).filter((x) => x.id !== cur.recipeId && !other.includes(x.id)).map((x) => ({ x, k: r() + (used.has(x.id) ? 1 : 0) })).sort((a, b) => a.k - b.k).slice(0, 14).map((o) => o.x);
  const before = dayTotal(d, p.people[0].id), costBefore = mealCost(cur, p.people, plan.store);
  const opts: SwapOption[] = pool.map((x) => {
    const nd = withRecipe(plan, p, dayIdx, slot, x.id), nm = nd.meals.find((m) => m.slot === slot)!, t = dayTotal(nd, p.people[0].id);
    return { recipeId: x.id, dProtein: Math.round((t.protein - before.protein) * 10) / 10, dKcal: Math.round(t.kcal - before.kcal), dCost: Math.round((mealCost(nm, p.people, plan.store) - costBefore) * 100) / 100, dayOk: p.people.every((q) => nd.checks[q.id].ok), after: nd.checks[p.people[0].id] };
  });
  return opts.sort((a, b) => Number(b.dayOk) - Number(a.dayOk) || a.dCost - b.dCost).slice(0, 3);
}
export function applySwap(plan: Plan, p: Prefs, dayIdx: number, slot: Slot, recipeId: string): Plan {
  const days = plan.days.map((d, i) => (i === dayIdx ? withRecipe(plan, p, dayIdx, slot, recipeId) : d));
  return refresh(plan, days);
}

/** "fora" (mantém o resto do dia), "eu-trato" (reajusta as outras refeições) ou "normal". */
export function setStatus(plan: Plan, p: Prefs, dayIdx: number, slot: Slot, status: PlannedMeal["status"], own?: PlannedMeal["own"]): Plan {
  const d = plan.days[dayIdx], old = d.meals.find((m) => m.slot === slot)!;
  const nm: PlannedMeal = { ...old, status, own: status === "eu-trato" ? own : undefined };
  let meals = replaceMeal(d, slot, nm);
  if (status !== "fora") meals = resolveMeals(meals, p.people, allowedComplements(p));
  return refresh(plan, plan.days.map((x, i) => (i === dayIdx ? mkDay(meals, p) : x)));
}
