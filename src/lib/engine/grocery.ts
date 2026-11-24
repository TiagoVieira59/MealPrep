import { FOOD, PRICES } from "./data";
import { mealLines } from "./nutrition";
import type { Plan, StoreId } from "./types";

export interface GroceryItem { food: string; name: string; aisle: string; needG: number; buyG: number; packs: { size: number; count: number }[]; needCost: number; buyCost: number; leftoverG: number }
export const AISLES = ["Frutas e legumes", "Padaria", "Talho", "Peixaria", "Laticínios e ovos", "Mercearia", "Conservas", "Congelados", "Óleos e temperos"];

/** Menor soma de embalagens ≥ necessidade (desempate: menos embalagens). */
export function choosePacks(need: number, sizes: number[]): { size: number; count: number }[] {
  if (!sizes.length) return [{ size: Math.ceil(need / 100) * 100, count: 1 }];
  const max = Math.max(...sizes), lim = Math.ceil(need) + max;
  const best = new Array<number>(lim + 1).fill(Infinity), from = new Array<number>(lim + 1).fill(0);
  best[0] = 0;
  for (let s = 1; s <= lim; s++) for (const z of sizes) if (s >= z && best[s - z] + 1 < best[s]) { best[s] = best[s - z] + 1; from[s] = z; }
  let t = Math.ceil(need); while (t <= lim && best[t] === Infinity) t++;
  const counts = new Map<number, number>();
  for (let s = t; s > 0; s -= from[s]) counts.set(from[s], (counts.get(from[s]) ?? 0) + 1);
  return [...counts].map(([size, count]) => ({ size, count })).sort((a, b) => b.size - a.size);
}

export function grocery(plan: Plan, store: StoreId = plan.store) {
  const need = new Map<string, number>();
  for (const d of plan.days) for (const m of d.meals) for (const person of plan.people) for (const l of mealLines(m, person.id)) need.set(l.food, (need.get(l.food) ?? 0) + l.g);
  const f = PRICES.stores[store].factor;
  const items: GroceryItem[] = [...need].map(([food, g]) => {
    const pr = PRICES.items[food], packs = choosePacks(g, pr.packs), buyG = packs.reduce((a, p) => a + p.size * p.count, 0), perG = (pr.perKg * f) / 1000;
    return { food, name: FOOD.get(food)!.pt, aisle: FOOD.get(food)!.aisle, needG: Math.round(g), buyG, packs: pr.packs.length ? packs : [], needCost: g * perG, buyCost: buyG * perG, leftoverG: Math.max(0, Math.round(buyG - g)) };
  }).sort((a, b) => a.name.localeCompare(b.name, "pt"));
  const byAisle = AISLES.map((aisle) => ({ aisle, items: items.filter((i) => i.aisle === aisle) })).filter((x) => x.items.length);
  const sum = (k: "needCost" | "buyCost") => Math.round(items.reduce((a, i) => a + i[k], 0) * 100) / 100;
  return { items, byAisle, eatCost: sum("needCost"), registerCost: sum("buyCost"), updated: PRICES.updated };
}
export function shareText(g: ReturnType<typeof grocery>): string {
  const lines = ["Lista de compras — MealPrep"];
  for (const a of g.byAisle) { lines.push("", a.aisle.toUpperCase()); for (const i of a.items) lines.push(`- ${i.name}: ${i.packs.length ? i.packs.map((p) => `${p.count}× ${p.size} g`).join(" + ") : `${i.buyG} g`}`); }
  lines.push("", `Preços estimados (atualizados em ${g.updated}): ~${g.registerCost.toFixed(2)} € na caixa.`);
  return lines.join("\n");
}
