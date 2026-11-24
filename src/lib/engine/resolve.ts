import { RECIPE } from "./data";
import type { Comp } from "./filter";
import { checkDay, lineMacros, add } from "./nutrition";
import { solveDay, type DaySol } from "./solve";
import type { Extra, Macros, Person, PlannedMeal, Recipe } from "./types";

const baseCache = new Map<string, Macros>();
export function baseMacros(r: Recipe): Macros {
  let b = baseCache.get(r.id);
  if (!b) { b = r.ingredients.reduce((a, i) => add(a, lineMacros(i.food, i.g)), { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }); baseCache.set(r.id, b); }
  return b;
}

const memo = new Map<string, { sol: DaySol; ok: boolean }>();

/** Recalcula escalas e complementos de todas as refeições "normais" de um dia, por pessoa. */
export function resolveMeals(meals: PlannedMeal[], people: Person[], comps: Comp[]): PlannedMeal[] {
  const out: PlannedMeal[] = meals.map((m) => ({ ...m, scales: { ...m.scales }, extras: [] }));
  for (const p of people) {
    const idx = out.map((_, i) => i).filter((i) => out[i].status === "normal");
    const fixed = out.reduce((a, m) => (m.status === "eu-trato" ? { kcal: a.kcal + (m.own?.[p.id]?.kcal ?? 0), protein: a.protein + (m.own?.[p.id]?.protein ?? 0) } : a), { kcal: 0, protein: 0 });
    const free = idx.map((i) => { const b = baseMacros(RECIPE.get(out[i].recipeId)!); return { slot: out[i].slot, kcal: b.kcal, protein: b.protein }; });
    const key = [p.kcal, p.protein, fixed.kcal, fixed.protein, idx.map((i) => out[i].recipeId + "/" + out[i].slot).join(","), comps.map((c) => c.food).join(",")].join("|");
    let hit = memo.get(key);
    if (!hit) {
      const attempt = (margin: number) => {
        const sol = solveDay(free, p.kcal, p.protein, fixed, comps, margin);
        const test = out.map((m) => ({ ...m, scales: { ...m.scales }, extras: [] as Extra[] }));
        apply(test, idx, sol, p.id);
        return { sol, ok: checkDay({ meals: test }, p).ok };
      };
      hit = attempt(0.003);
      if (!hit.ok) { const h2 = attempt(0); if (h2.ok) hit = h2; }
      memo.set(key, hit);
    }
    apply(out, idx, hit.sol, p.id);
  }
  return out;
}
function apply(meals: PlannedMeal[], idx: number[], sol: DaySol, pid: string) {
  idx.forEach((i, j) => { meals[i].scales[pid] = sol.scales[j]; });
  for (const e of sol.extras) {
    const m = meals[idx[e.slotIdx]];
    let x = m.extras.find((q) => q.food === e.food);
    if (!x) { x = { food: e.food, g: {} }; m.extras.push(x); }
    x.g[pid] = (x.g[pid] ?? 0) + e.g;
  }
}
