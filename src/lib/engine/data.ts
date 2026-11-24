import foodsJson from "../../../data/foods.json";
import recipesJson from "../../../data/recipes.json";
import pricesJson from "../../../data/prices.pt.json";
import type { Food, Prices, Recipe } from "./types";

export const FOODS = foodsJson as unknown as Food[];
export const RECIPES = recipesJson as unknown as Recipe[];
export const PRICES = pricesJson as unknown as Prices;
export const FOOD = new Map(FOODS.map((f) => [f.id, f]));
export const RECIPE = new Map(RECIPES.map((r) => [r.id, r]));
