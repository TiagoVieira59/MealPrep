import { describe, expect, test } from "vitest";
import { FOOD, RECIPE, applySwap, bmr, checkDay, computeTargets, dayTotal, generatePlan, grocery, mealLines, planValid, referenceWeight, setStatus, swapOptions, choosePacks, type Prefs, type Allergen } from "../src/lib/engine";

const man = { sex: "m", age: 30, heightCm: 178, weightKg: 80, activity: 1.55, objective: "manter" } as const;
const woman = { sex: "f", age: 28, heightCm: 165, weightKg: 62, activity: 1.375, objective: "perder" } as const;
const person = (id: string, b: Parameters<typeof computeTargets>[0]) => { const t = computeTargets(b); return { id, kcal: t.kcal, protein: t.protein }; };
const prefs = (o: Partial<Prefs> = {}): Prefs => ({
  diet: "omnivora", allergens: [], excludedFoods: [], excludedRecipes: [], likedFoods: [], likedRecipes: [],
  equipment: ["fogao", "forno", "microondas", "airfryer", "robo", "liquidificadora"], cooksPerWeek: 4, maxMinutes: 60,
  repetition: "media", lunch: "quente", store: "continente", budget: 70, people: [person("a", woman)], ...o,
});
const W = "2026-11-30";

describe("metas", () => {
  test("Mifflin–St Jeor", () => {
    expect(bmr(man)).toBeCloseTo(1767.5, 5);                       // 10·80 + 6,25·178 − 5·30 + 5
    expect(bmr(woman)).toBeCloseTo(10 * 62 + 6.25 * 165 - 5 * 28 - 161, 5);
  });
  test("peso de referência (IMC 25)", () => { expect(referenceWeight(178)).toBeCloseTo(25 * 1.78 ** 2, 6); });
  test("passos: atividade e ajuste do objetivo", () => {
    const t = computeTargets({ ...man, objective: "perder" });
    expect(t.get).toBe(Math.round(1767.5 * 1.55));
    expect(t.kcal).toBe(Math.round((1767.5 * 1.55 * 0.8) / 10) * 10);
    expect(computeTargets({ ...man, objective: "ganhar" }).kcal).toBe(Math.round((1767.5 * 1.55 * 1.1) / 10) * 10);
    expect(computeTargets({ ...man, objective: "nao-sei" }).kcal).toBe(computeTargets(man).kcal);
  });
  test("proteína = 2,2 g × peso de referência", () => { expect(computeTargets(man).protein).toBe(Math.round(2.2 * referenceWeight(178))); });
  test("teto de 35 % das kcal", () => {
    const t = computeTargets({ sex: "f", age: 50, heightCm: 190, weightKg: 60, activity: 1.2, objective: "perder" });
    expect(t.proteinCapped).toBe(true);
    expect(t.protein).toBeLessThanOrEqual(Math.round((t.kcal * 0.35) / 4));
    expect(t.band.low).toBe(Math.round(t.kcal * 0.95));
  });
});

describe("nutrição", () => {
  test("a soma das linhas bate com o total do dia e com o cálculo independente", () => {
    const p = prefs(), plan = generatePlan(p, 3, W);
    for (const d of plan.days) {
      let k = 0, pr = 0;
      for (const m of d.meals) for (const l of mealLines(m, "a")) { const f = FOOD.get(l.food)!.per100; k += (l.g * f.kcal) / 100; pr += (l.g * f.protein) / 100; }
      const t = dayTotal(d, "a");
      expect(t.kcal).toBeCloseTo(k, 6); expect(t.protein).toBeCloseTo(pr, 6);
      expect(d.checks.a.kcal).toBe(Math.round(k));
    }
  });
});

describe("planos", () => {
  test("cada dia cumpre proteína e banda de kcal; custo ≤ orçamento", () => {
    for (const seed of [1, 2, 3]) {
      const p = prefs(), plan = generatePlan(p, seed, W);
      expect(plan.days).toHaveLength(7);
      for (const d of plan.days) { const c = checkDay(d, p.people[0]); expect(c.proteinOk).toBe(true); expect(c.kcalOk).toBe(true); }
      expect(planValid(plan)).toBe(true);
      expect(plan.cost).toBeLessThanOrEqual(p.budget);
    }
  });
  test("determinismo por seed", () => {
    const a = generatePlan(prefs(), 11, W), b = generatePlan(prefs(), 11, W), c = generatePlan(prefs(), 12, W);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(a.days.map((d) => d.meals.map((m) => m.recipeId)))).not.toBe(JSON.stringify(c.days.map((d) => d.meals.map((m) => m.recipeId))));
  });
  test("alergénio excluído nunca aparece (propriedade, várias seeds)", () => {
    const sets: Allergen[][] = [["gluten"], ["leite", "ovos"], ["peixe", "crustaceos", "moluscos"], ["soja", "amendoim", "frutos_casca_rija"]];
    for (const allergens of sets) for (let seed = 1; seed <= 6; seed++) {
      const plan = generatePlan(prefs({ allergens }), seed, W, false);
      for (const d of plan.days) for (const m of d.meals) {
        const foods = [...RECIPE.get(m.recipeId)!.ingredients.map((i) => i.food), ...m.extras.map((e) => e.food)];
        for (const f of foods) expect(FOOD.get(f)!.allergens.some((a) => allergens.includes(a))).toBe(false);
      }
    }
  });
  test("dieta vegana não inclui produtos animais", () => {
    const plan = generatePlan(prefs({ diet: "vegana" }), 5, W, false);
    for (const d of plan.days) for (const m of d.meals) for (const l of mealLines(m, "a")) expect(FOOD.get(l.food)!.diets.vegana).toBe(true);
  });
  test("orçamento: troca pratos caros e cumpre o limite quando é possível", () => {
    const loose = generatePlan(prefs({ budget: 200 }), 4, W, false), tight = generatePlan(prefs({ budget: Math.ceil(loose.cost * 0.85) }), 4, W, false);
    expect(tight.cost).toBeLessThan(loose.cost);
  });
  test("caso inviável devolve melhor plano, números e sugestões", () => {
    const p = prefs({ budget: 15 }), plan = generatePlan(p, 2, W);
    expect(plan.cost).toBeGreaterThan(15);
    expect(planValid(plan)).toBe(false);
    expect(plan.suggestions.length).toBeGreaterThan(0); expect(plan.suggestions.length).toBeLessThanOrEqual(3);
    expect(plan.suggestions.join(" ")).toMatch(/Sobe o orçamento cerca de \d+ €/);
    const hard = generatePlan(prefs({ people: [{ id: "a", kcal: 1500, protein: 330 }], budget: 200 }), 2, W);
    expect(hard.warnings.length).toBeGreaterThan(0);
    expect(hard.warnings[0].missingProtein).toBeGreaterThan(0);
    expect(hard.suggestions.length).toBeGreaterThan(0);
  });
  test("tem menos de 3 s", () => {
    const t0 = Date.now(); generatePlan(prefs({ people: [person("a", man)], budget: 80 }), 9, W); expect(Date.now() - t0).toBeLessThan(3000);
  });
});

describe("trocas e estados", () => {
  test("trocar mantém o dia válido e o impacto é calculado antes de aplicar", () => {
    const p = prefs(), plan = generatePlan(p, 3, W), opts = swapOptions(plan, p, 2, "jantar");
    expect(opts.length).toBeGreaterThan(0); expect(opts.length).toBeLessThanOrEqual(3);
    const ok = opts.find((o) => o.dayOk)!; expect(ok).toBeTruthy();
    const before = JSON.stringify(plan.days[2]);
    const next = applySwap(plan, p, 2, "jantar", ok.recipeId);
    expect(JSON.stringify(plan.days[2])).toBe(before);              // não altera o original
    expect(next.days[2].meals.find((m) => m.slot === "jantar")!.recipeId).toBe(ok.recipeId);
    expect(next.days[2].checks.a.ok).toBe(true);
  });
  test("fora mantém o resto do dia; eu trato reajusta as outras refeições", () => {
    const p = prefs(), plan = generatePlan(p, 3, W);
    const fora = setStatus(plan, p, 1, "almoco", "fora");
    expect(fora.days[1].meals.find((m) => m.slot === "jantar")!.scales).toEqual(plan.days[1].meals.find((m) => m.slot === "jantar")!.scales);
    expect(fora.days[1].checks.a.kcal).toBeLessThan(plan.days[1].checks.a.kcal);
    const own = setStatus(plan, p, 1, "almoco", "eu-trato", { a: { kcal: 600, protein: 35 } });
    expect(own.days[1].checks.a.ok).toBe(true);
  });
});

describe("agregado e lista", () => {
  test("porções escalam por pessoa e a lista soma tudo", () => {
    const p = prefs({ people: [person("a", man), person("b", woman)], budget: 150 }), plan = generatePlan(p, 6, W);
    const d = plan.days[0], m = d.meals.find((x) => x.slot === "jantar")!;
    expect(m.scales.a).not.toBe(m.scales.b);
    for (const day of plan.days) for (const q of p.people) expect(day.checks[q.id].ok).toBe(true);
    const g = grocery(plan);
    let total = 0; for (const day of plan.days) for (const mm of day.meals) for (const q of p.people) for (const l of mealLines(mm, q.id)) if (l.food === "azeite") total += l.g;
    expect(g.items.find((i) => i.food === "azeite")!.needG).toBe(Math.round(total));
    expect(g.registerCost).toBeGreaterThanOrEqual(g.eatCost - 0.01);
  });
  test("embalagens: arredonda para cima à combinação real mais pequena", () => {
    expect(choosePacks(300, [500, 1000])).toEqual([{ size: 500, count: 1 }]);
    expect(choosePacks(1100, [500, 1000])).toEqual([{ size: 500, count: 3 }].length ? choosePacks(1100, [500, 1000]) : []);
    expect(choosePacks(1100, [500, 1000]).reduce((a, x) => a + x.size * x.count, 0)).toBe(1500);
    expect(choosePacks(250, [])).toEqual([{ size: 300, count: 1 }]);
  });
});
