export type Diet = "omnivora" | "vegetariana" | "vegana" | "pescetariana" | "lowcarb";
export type Equipment = "fogao" | "forno" | "microondas" | "airfryer" | "robo" | "liquidificadora";
export type Slot = "pequeno-almoco" | "almoco" | "jantar";
export type Objective = "perder" | "manter" | "ganhar" | "nao-sei";
export type Repetition = "pouca" | "media" | "muita";
export type StoreId = "continente" | "pingo-doce" | "lidl" | "mercadona" | "aldi" | "intermarche";
export type Allergen = "gluten" | "crustaceos" | "ovos" | "peixe" | "amendoim" | "soja" | "leite" | "frutos_casca_rija" | "aipo" | "mostarda" | "sesamo" | "sulfitos" | "tremoco" | "moluscos";

export interface Macros { kcal: number; protein: number; carbs: number; fat: number; fiber: number }
export interface Food {
  id: string; fdcId: number; dataType: string; usda: string; pt: string; group: string; aisle: string;
  allergens: Allergen[]; per100: Macros; diets: Record<Diet, boolean>;
}
export interface Recipe {
  id: string; name: string; kind: "pequeno-almoco" | "principal"; minutes: number; equipment: Equipment[];
  temp: "quente" | "frio"; fridgeDays: number; cat: string; ingredients: { food: string; g: number }[]; steps: string[];
}
export interface Prices { updated: string; note: string; stores: Record<StoreId, { name: string; factor: number }>; items: Record<string, { perKg: number; packs: number[] }> }

export interface Person { id: string; name?: string; kcal: number; protein: number }
export interface Prefs {
  diet: Diet; allergens: Allergen[]; excludedFoods: string[]; excludedRecipes: string[];
  likedFoods: string[]; likedRecipes: string[]; equipment: Equipment[];
  cooksPerWeek: number; maxMinutes: number; repetition: Repetition; lunch: "quente" | "frio";
  store: StoreId; budget: number; people: Person[];
}

export interface Extra { food: string; g: Record<string, number> }
export interface PlannedMeal {
  slot: Slot; recipeId: string; cookId: string; scales: Record<string, number>; extras: Extra[];
  status: "normal" | "fora" | "eu-trato"; own?: Record<string, { kcal: number; protein: number }>; ownSrc?: "ia" | "manual";
}
export interface DayCheck { kcal: number; protein: number; ok: boolean; proteinOk: boolean; kcalOk: boolean; kcalLow: number; kcalHigh: number }
export interface Day { meals: PlannedMeal[]; checks: Record<string, DayCheck> }
export interface Warning { day: number; person: string; missingProtein: number; kcalDiff: number }
export interface Plan {
  version: number; seed: number; weekStart: string; days: Day[]; cost: number; budget: number; store: StoreId;
  warnings: Warning[]; suggestions: string[]; cookMinutes: number; people: Person[];
}
export const ENGINE_VERSION = 1;
export const SLOTS: Slot[] = ["pequeno-almoco", "almoco", "jantar"];
export const SLOT_LABEL: Record<Slot, string> = { "pequeno-almoco": "Pequeno-almoço", almoco: "Almoço", jantar: "Jantar" };
