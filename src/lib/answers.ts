import type { Allergen, Diet, Equipment, Objective, Person, Prefs, Repetition, StoreId } from "@/lib/engine";

export interface Answers {
  objective?: Objective; sex?: "m" | "f"; age?: number; heightCm?: number; weightKg?: number; activity?: number;
  cooksPerWeek: number; maxMinutes: number; repetition: Repetition; lunch: "quente" | "frio"; equipment: Equipment[];
  diet: Diet; allergens: Allergen[]; likedFoods: string[]; excludedFoods: string[]; likedRecipes: string[]; excludedRecipes: string[];
  store: StoreId; budget: number; peopleCount: number; kcal?: number; protein?: number; step: number; done: boolean;
}
export const DEFAULT_ANSWERS: Answers = {
  cooksPerWeek: 4, maxMinutes: 45, repetition: "media", lunch: "quente", equipment: ["fogao"], diet: "omnivora", allergens: [],
  likedFoods: [], excludedFoods: [], likedRecipes: [], excludedRecipes: [], store: "continente", budget: 60, peopleCount: 1, step: 0, done: false,
};
/** Porção normal: quem não define metas próprias come a porção base do prato (≈ 2000 kcal/dia). */
export const NORMAL_PORTION = { kcal: 2000, protein: 90 };

export function toPrefs(a: Answers, extraPeople: Person[] = []): Prefs {
  const me: Person = { id: "me", name: "Eu", kcal: a.kcal ?? 2000, protein: a.protein ?? 90 };
  const guests: Person[] = Array.from({ length: Math.max(0, a.peopleCount - 1) }, (_, i) => ({ id: `p${i + 1}`, name: `Pessoa ${i + 2}`, ...NORMAL_PORTION }));
  return {
    diet: a.diet, allergens: a.allergens, excludedFoods: a.excludedFoods, excludedRecipes: a.excludedRecipes, likedFoods: a.likedFoods, likedRecipes: a.likedRecipes,
    equipment: a.equipment, cooksPerWeek: a.cooksPerWeek, maxMinutes: a.maxMinutes, repetition: a.repetition, lunch: a.lunch, store: a.store, budget: a.budget,
    people: [me, ...guests, ...extraPeople],
  };
}
