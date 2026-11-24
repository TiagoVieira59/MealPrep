import { FOOD, RECIPE } from "./data";
import type { Day, DayCheck, Macros, Person, PlannedMeal, Plan } from "./types";
import { band } from "./targets";

export interface Line { food: string; g: number; macros: Macros; extra?: boolean }
const Z = (): Macros => ({ kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
export const add = (a: Macros, b: Macros): Macros => ({ kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat, fiber: a.fiber + b.fiber });
/** Contribuição = gramas × valor por 100 g / 100 (única fonte de verdade). */
export function lineMacros(foodId: string, g: number): Macros {
  const p = FOOD.get(foodId)!.per100, k = g / 100;
  return { kcal: p.kcal * k, protein: p.protein * k, carbs: p.carbs * k, fat: p.fat * k, fiber: p.fiber * k };
}
export const gramsFor = (base: number, scale: number) => Math.round(base * scale);

/** Linhas de ingredientes (e complementos) de uma refeição para uma pessoa. Vazio se for "fora" ou "eu trato". */
export function mealLines(m: PlannedMeal, person: string): Line[] {
  if (m.status !== "normal") return [];
  const s = m.scales[person] ?? 1;
  const lines: Line[] = RECIPE.get(m.recipeId)!.ingredients.map((i) => { const g = gramsFor(i.g, s); return { food: i.food, g, macros: lineMacros(i.food, g) }; });
  for (const e of m.extras) { const g = e.g[person] ?? 0; if (g > 0) lines.push({ food: e.food, g, macros: lineMacros(e.food, g), extra: true }); }
  return lines;
}
export function mealTotal(m: PlannedMeal, person: string): Macros {
  if (m.status === "eu-trato") { const o = m.own?.[person]; return { ...Z(), kcal: o?.kcal ?? 0, protein: o?.protein ?? 0 }; }
  return mealLines(m, person).reduce((a, l) => add(a, l.macros), Z());
}
export const dayTotal = (d: { meals: PlannedMeal[] }, person: string): Macros => d.meals.reduce((a, m) => add(a, mealTotal(m, person)), Z());

export function checkDay(d: { meals: PlannedMeal[] }, p: Person): DayCheck {
  const t = dayTotal(d, p.id), b = band(p.kcal);
  const kcal = Math.round(t.kcal), protein = Math.round(t.protein * 10) / 10;
  const proteinOk = t.protein >= p.protein - 1e-9, kcalOk = t.kcal >= b.low && t.kcal <= b.high;
  return { kcal, protein, proteinOk, kcalOk, ok: proteinOk && kcalOk, kcalLow: b.low, kcalHigh: b.high };
}

import { PRICES } from "./data";
export const priceOf = (foodId: string, g: number, store: keyof typeof PRICES.stores) => (g / 1000) * PRICES.items[foodId].perKg * PRICES.stores[store].factor;
export const mealCost = (m: PlannedMeal, people: Person[], store: keyof typeof PRICES.stores) =>
  m.status !== "normal" ? 0 : people.reduce((c, p) => c + mealLines(m, p.id).reduce((a, l) => a + priceOf(l.food, l.g, store), 0), 0);
export const planCost = (days: Day[], people: Person[], store: keyof typeof PRICES.stores) => days.reduce((c, d) => c + d.meals.reduce((a, m) => a + mealCost(m, people, store), 0), 0);
export const planOk = (p: Plan) => p.days.every((d) => Object.values(d.checks).every((c) => c.ok));
