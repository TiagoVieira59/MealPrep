import { FOOD, PRICES, RECIPE } from "./data";
import { allowedComplements, slotPool } from "./filter";
import { checkDay, planCost } from "./nutrition";
import { baseMacros, resolveMeals } from "./resolve";
import { pickWeighted, rng } from "./rng";
import { ENGINE_VERSION, SLOTS, type Day, type Plan, type PlannedMeal, type Prefs, type Recipe, type Slot, type Warning } from "./types";

type Cell = { recipe: string; cook: string };
type Tracks = Record<Slot, Cell[]>;
const BASE_REP = { pouca: 1, media: 2, muita: 3 } as const;
export const runLength = (p: Prefs) => Math.min(4, Math.max(BASE_REP[p.repetition], Math.ceil(7 / Math.max(1, p.cooksPerWeek))));

const liked = (r: Recipe, p: Prefs) => p.likedRecipes.includes(r.id) || r.ingredients.some((i) => p.likedFoods.includes(i.food));
function baseCostOf(r: Recipe, p: Prefs) { return r.ingredients.reduce((a, i) => a + (i.g / 1000) * costKg(i.food, p), 0); }
const costKg = (food: string, p: Prefs) => PRICES.items[food].perKg * PRICES.stores[p.store].factor;

function conflicts(t: Tracks, slot: Slot, start: number, len: number, rid: string): boolean {
  for (let d = start; d < start + len; d++) {
    const other = slot === "almoco" ? t.jantar[d] : slot === "jantar" ? t.almoco[d] : undefined;
    if (other && other.recipe === rid) return true;
  }
  const prev = t[slot][start - 1], next = t[slot][start + len];
  return prev?.recipe === rid || next?.recipe === rid;
}

function buildTrack(slot: Slot, pool: Recipe[], p: Prefs, r: () => number, t: Tracks): Cell[] {
  const L = slot === "pequeno-almoco" ? 1 : runLength(p);
  const cells: Cell[] = [];
  const used = new Map<string, number>();
  let d = 0;
  while (d < 7 && pool.length) {
    const tryIds = (strict: boolean) => pool.filter((x) => !(strict && (used.get(x.id) ?? 0) > 0) && !conflicts({ ...t, [slot]: cells } as Tracks, slot, d, 1, x.id));
    let c = tryIds(true); if (!c.length) c = tryIds(false); if (!c.length) c = pool;
    const rec = pickWeighted(c, (x) => (liked(x, p) ? 4 : 1) * (0.7 + 0.6 * r()), r);
    const len = Math.max(1, Math.min(L, rec.fridgeDays + 1, 7 - d));
    for (let k = 0; k < len; k++) cells.push({ recipe: rec.id, cook: `${rec.id}#${d}` });
    used.set(rec.id, (used.get(rec.id) ?? 0) + 1);
    d += len;
  }
  return cells;
}

export function buildDays(t: Tracks, p: Prefs): Day[] {
  const comps = allowedComplements(p);
  return Array.from({ length: 7 }, (_, d) => {
    const meals: PlannedMeal[] = SLOTS.filter((s) => t[s][d]).map((s) => ({ slot: s, recipeId: t[s][d].recipe, cookId: t[s][d].cook, scales: {}, extras: [], status: "normal" }));
    const solved = resolveMeals(meals, p.people, comps);
    const day: Day = { meals: solved, checks: {} };
    for (const person of p.people) day.checks[person.id] = checkDay(day, person);
    return day;
  });
}
export const invalidCount = (days: Day[]) => days.reduce((a, d) => a + Object.values(d.checks).filter((c) => !c.ok).length, 0);
const cookMinutes = (days: Day[]) => { const seen = new Set<string>(); let m = 0; for (const d of days) for (const x of d.meals) if (!seen.has(x.cookId)) { seen.add(x.cookId); m += RECIPE.get(x.recipeId)!.minutes; } return m; };

function score(days: Day[], p: Prefs) {
  const cost = planCost(days, p.people, p.store), inv = invalidCount(days), over = Math.max(0, cost - p.budget);
  return { cost, inv, over, total: inv * 100 + over * 1000 + cost * 0.001 };
}

function localSearch(t: Tracks, p: Prefs, r: () => number, pools: Record<Slot, Recipe[]>): { t: Tracks; days: Day[] } {
  let days = buildDays(t, p), cur = score(days, p), evals = 0;
  for (let it = 0; it < 14 && (cur.inv > 0 || cur.over > 0) && evals < 160; it++) {
    // execuções (runs) candidatas
    const runs: { slot: Slot; start: number; len: number }[] = [];
    for (const s of SLOTS) for (let d = 0; d < t[s].length; ) { let e = d; while (e + 1 < t[s].length && t[s][e + 1].cook === t[s][d].cook) e++; runs.push({ slot: s, start: d, len: e - d + 1 }); d = e + 1; }
    const bad = runs.filter((x) => { for (let d = x.start; d < x.start + x.len; d++) if (Object.values(days[d].checks).some((c) => !c.ok)) return true; return false; });
    const runCost = (x: { slot: Slot; start: number; len: number }) => { let c = 0; for (let d = x.start; d < x.start + x.len; d++) { const m = days[d].meals.find((q) => q.slot === x.slot); if (m) c += planCost([{ meals: [m], checks: {} }], p.people, p.store); } return c; };
    const exp = cur.over > 0 ? [...runs].sort((a, b) => runCost(b) - runCost(a)).slice(0, 4) : [];
    const targets = [...new Set([...bad.slice(0, 5), ...exp])];
    let best: { t: Tracks; days: Day[]; s: ReturnType<typeof score> } | null = null;
    for (const run of targets) {
      const curRec = t[run.slot][run.start].recipe;
      const alts = pools[run.slot].filter((x) => x.id !== curRec && x.fridgeDays + 1 >= run.len);
      const byCost = [...alts].sort((a, b) => baseCostOf(a, p) / baseMacros(a).kcal - baseCostOf(b, p) / baseMacros(b).kcal).slice(0, 2);
      const byProt = [...alts].sort((a, b) => baseMacros(b).protein / baseMacros(b).kcal - baseMacros(a).protein / baseMacros(a).kcal).slice(0, 2);
      const rand = Array.from({ length: 3 }, () => alts[Math.floor(r() * alts.length)]).filter(Boolean);
      for (const alt of new Set([...byCost, ...byProt, ...rand])) {
        const nt: Tracks = { ...t, [run.slot]: t[run.slot].map((c, d) => (d >= run.start && d < run.start + run.len ? { recipe: alt.id, cook: `${alt.id}#${run.start}` } : c)) } as Tracks;
        const other = run.slot === "almoco" ? "jantar" : run.slot === "jantar" ? "almoco" : null;
        if (other && nt[run.slot].some((c, d) => nt[other][d] && c.recipe === nt[other][d].recipe)) continue;
        evals++;
        const nd = buildDays(nt, p), s = score(nd, p);
        if (!best || s.total < best.s.total) best = { t: nt, days: nd, s };
      }
    }
    if (!best || best.s.total >= cur.total - 1e-9) break;
    t = best.t; days = best.days; cur = best.s;
  }
  return { t, days };
}

function finalize(days: Day[], p: Prefs, seed: number, weekStart: string): Plan {
  const warnings: Warning[] = [];
  days.forEach((d, i) => { for (const person of p.people) { const c = d.checks[person.id]; if (!c.ok) warnings.push({ day: i, person: person.id, missingProtein: Math.max(0, Math.round((person.protein - c.protein) * 10) / 10), kcalDiff: c.kcal < c.kcalLow ? c.kcal - c.kcalLow : c.kcal > c.kcalHigh ? c.kcal - c.kcalHigh : 0 }); } });
  return { version: ENGINE_VERSION, seed, weekStart, days, cost: Math.round(planCost(days, p.people, p.store) * 100) / 100, budget: p.budget, store: p.store, warnings, suggestions: [], cookMinutes: cookMinutes(days), people: p.people };
}

export function generatePlan(p: Prefs, seed: number, weekStart: string, withSuggestions = true): Plan {
  const r = rng(seed);
  const pools = Object.fromEntries(SLOTS.map((s) => [s, slotPool(p, s)])) as Record<Slot, Recipe[]>;
  const t: Tracks = { "pequeno-almoco": [], almoco: [], jantar: [] };
  for (const s of ["almoco", "jantar", "pequeno-almoco"] as Slot[]) t[s] = buildTrack(s, pools[s], p, r, t);
  const { days } = localSearch(t, p, r, pools);
  const plan = finalize(days, p, seed, weekStart);
  if (withSuggestions) plan.suggestions = suggest(plan, p, seed, weekStart, pools);
  return plan;
}

function suggest(plan: Plan, p: Prefs, seed: number, weekStart: string, pools: Record<Slot, Recipe[]>): string[] {
  const out: string[] = [];
  const over = plan.cost - p.budget;
  if (SLOTS.some((s) => !pools[s].length)) out.push("Com estas escolhas não há pratos compatíveis para todas as refeições: retira uma exclusão, uma restrição ou algum equipamento em falta.");
  if (over > 0) out.push(`Sobe o orçamento cerca de ${Math.ceil(over)} € (o plano custa ${plan.cost.toFixed(2)} € para ${p.budget} €).`);
  if (plan.warnings.length) {
    if (p.repetition !== "muita" || p.cooksPerWeek < 7) out.push("Permite mais repetição de pratos ou cozinha mais vezes por semana: dá mais margem para acertar a proteína.");
    const tries = [...p.excludedFoods.map((f) => ({ k: "f", id: f })), ...p.excludedRecipes.map((id) => ({ k: "r", id }))].slice(0, 3);
    for (const x of tries) {
      const q = { ...p, excludedFoods: p.excludedFoods.filter((f) => x.k !== "f" || f !== x.id), excludedRecipes: p.excludedRecipes.filter((f) => x.k !== "r" || f !== x.id) };
      const alt = generatePlan(q, seed, weekStart, false);
      if (!alt.warnings.length && alt.cost <= p.budget) out.push(`Retira «${x.k === "f" ? FOOD.get(x.id)?.pt : RECIPE.get(x.id)?.name}» das exclusões e a semana passa a cumprir tudo.`);
    }
  }
  return out.slice(0, 3);
}
export const planValid = (p: Plan) => p.warnings.length === 0 && p.cost <= p.budget + 1e-9;
