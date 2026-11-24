import { FOOD, RECIPES } from "./data";
import type { Allergen, Diet, Food, Prefs, Recipe, Slot } from "./types";

export const recipeAllergens = (r: Recipe): Allergen[] => [...new Set(r.ingredients.flatMap((i) => FOOD.get(i.food)!.allergens))];
/** Dieta derivada dos ingredientes (nunca escrita à mão). Low-carb: hidratos líquidos ≤ 25 % das kcal. */
export function recipeFitsDiet(r: Recipe, diet: Diet): boolean {
  if (diet === "omnivora") return true;
  if (diet === "lowcarb") {
    let k = 0, c = 0;
    for (const i of r.ingredients) { const p = FOOD.get(i.food)!.per100; k += (p.kcal * i.g) / 100; c += (Math.max(0, p.carbs - p.fiber) * i.g) / 100; }
    return (c * 4) / k <= 0.25;
  }
  return r.ingredients.every((i) => FOOD.get(i.food)!.diets[diet]);
}
export function foodAllowed(f: Food, p: Prefs): boolean {
  if (p.excludedFoods.includes(f.id) || f.allergens.some((a) => p.allergens.includes(a))) return false;
  return p.diet === "omnivora" || f.diets[p.diet];
}
export function allowedRecipes(p: Prefs): Recipe[] {
  return RECIPES.filter((r) =>
    !p.excludedRecipes.includes(r.id) &&
    r.minutes <= p.maxMinutes &&
    r.equipment.every((e) => p.equipment.includes(e)) &&
    recipeFitsDiet(r, p.diet) &&
    r.ingredients.every((i) => { const f = FOOD.get(i.food)!; return !p.excludedFoods.includes(f.id) && !f.allergens.some((a) => p.allergens.includes(a)); }));
}
export function slotPool(p: Prefs, slot: Slot): Recipe[] {
  const all = allowedRecipes(p);
  if (slot === "pequeno-almoco") return all.filter((r) => r.kind === "pequeno-almoco");
  const mains = all.filter((r) => r.kind === "principal");
  return slot === "almoco" && p.lunch === "frio" ? mains.filter((r) => r.temp === "frio") : mains;
}

/** Complementos de ajuste do catálogo (respeitam sempre os filtros). */
export interface Comp { food: string; slots: Slot[]; step: number; max: number }
export const COMPLEMENTS: Comp[] = [
  { food: "iogurte-grego", slots: ["pequeno-almoco"], step: 25, max: 250 },
  { food: "ovo", slots: ["pequeno-almoco"], step: 60, max: 180 },
  { food: "leite-meio-gordo", slots: ["pequeno-almoco"], step: 50, max: 300 },
  { food: "queijo-cottage", slots: ["pequeno-almoco"], step: 50, max: 200 },
  { food: "bebida-soja", slots: ["pequeno-almoco"], step: 50, max: 300 },
  { food: "pao-integral", slots: ["almoco", "jantar"], step: 30, max: 120 },
  { food: "arroz", slots: ["almoco", "jantar"], step: 20, max: 100 },
  { food: "grao-lata", slots: ["almoco", "jantar"], step: 50, max: 200 },
  { food: "tofu", slots: ["almoco", "jantar"], step: 50, max: 200 },
  { food: "atum-lata", slots: ["almoco", "jantar"], step: 40, max: 120 },
  { food: "azeite", slots: ["almoco", "jantar"], step: 5, max: 20 },
  { food: "banana", slots: ["almoco", "jantar"], step: 100, max: 200 },
  { food: "amendoas", slots: ["pequeno-almoco"], step: 10, max: 40 },
];
export const allowedComplements = (p: Prefs) => COMPLEMENTS.filter((c) => foodAllowed(FOOD.get(c.food)!, p) && (p.diet !== "lowcarb" || FOOD.get(c.food)!.diets.lowcarb));
