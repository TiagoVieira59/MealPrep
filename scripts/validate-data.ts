// Valida data/*.json. Devolve a lista de erros (vazia = ok).
import fs from "node:fs";
const rd = (f: string) => JSON.parse(fs.readFileSync(`data/${f}`, "utf8"));
const EQ = ["fogao", "forno", "microondas", "airfryer", "robo", "liquidificadora"];
export function validateData(): string[] {
  const foods = rd("foods.json"), recipes = rd("recipes.json"), prices = rd("prices.pt.json");
  const err: string[] = [];
  const ids = new Set<string>();
  for (const f of foods) {
    if (ids.has(f.id)) err.push(`alimento duplicado ${f.id}`);
    ids.add(f.id);
    const p = f.per100;
    if (!f.fdcId || !f.pt) err.push(`${f.id}: falta fdcId/nome`);
    if (p.kcal < 0 || p.kcal > 900 || p.protein < 0 || p.protein > 100 || p.carbs < 0 || p.fat < 0 || p.fat > 100) err.push(`${f.id}: valores impossíveis`);
    if (p.protein + p.carbs + p.fat > 105) err.push(`${f.id}: macros somam >100 g`);
    if (!(p.kcal > 0) && f.id !== "mostarda") err.push(`${f.id}: kcal 0`);
    const atw = 4 * p.protein + 4 * p.carbs + 9 * p.fat;
    if (p.kcal > 50 && p.fiber < 20 && Math.abs(atw - p.kcal) / p.kcal > 0.35) err.push(`${f.id}: kcal (${p.kcal}) incoerente com macros (${Math.round(atw)})`);
  }
  for (const r of recipes) {
    if (r.steps.length < 2) err.push(`${r.id}: poucos passos`);
    r.equipment.forEach((e: string) => { if (!EQ.includes(e)) err.push(`${r.id}: equipamento ${e}`); });
    let kcal = 0, prot = 0;
    for (const i of r.ingredients) {
      const f = foods.find((x: { id: string }) => x.id === i.food);
      if (!f) { err.push(`${r.id}: foodId inexistente ${i.food}`); continue; }
      if (!(i.g > 0 && i.g <= 600)) err.push(`${r.id}: gramas inválidas ${i.food}`);
      if (!prices.items[i.food]) err.push(`${r.id}: sem preço para ${i.food}`);
      kcal += (i.g * f.per100.kcal) / 100; prot += (i.g * f.per100.protein) / 100;
    }
    const lo = r.kind === "pequeno-almoco" ? 180 : 250;
    if (kcal < lo || kcal > 1100) err.push(`${r.id}: ${Math.round(kcal)} kcal fora do razoável`);
    if (prot < 8) err.push(`${r.id}: proteína ${Math.round(prot)} g demasiado baixa`);
  }
  for (const f of foods) if (!prices.items[f.id]) err.push(`${f.id}: sem preço`);
  for (const s of ["continente", "pingo-doce", "lidl", "mercadona", "aldi", "intermarche"]) if (!prices.stores[s]) err.push(`falta supermercado ${s}`);
  return err;
}
if (process.argv[1]?.endsWith("validate-data.ts")) { const e = validateData(); console.log(e.length ? e.join("\n") : "dados ok"); process.exit(e.length ? 1 : 0); }
