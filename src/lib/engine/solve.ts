import type { Comp } from "./filter";
import { FOOD } from "./data";
import type { Slot } from "./types";

export interface FreeMeal { slot: Slot; kcal: number; protein: number }   // valores a escala 1
export interface ExtraPick { food: string; slotIdx: number; g: number }
export interface DaySol { scales: number[]; extras: ExtraPick[]; kcal: number; protein: number; ok: boolean; viol: number }
const SHARE: Record<Slot, number> = { "pequeno-almoco": 0.25, almoco: 0.375, jantar: 0.375 };
const U0 = 12, U1 = 40; // 0,60 … 2,00 em passos de 0,05

interface Cand { scales: number[]; cost: number; ok: boolean; viol: number; kcal: number; protein: number }
const LOGSQ = Array.from({ length: U1 + 1 }, (_, u) => (u > 0 ? Math.log(u / 20) ** 2 : 0));

function scalesFor(meals: FreeMeal[], T: number, P: number, fixed: { kcal: number; protein: number }, ex: { kcal: number; protein: number; slotIdx: number }[], m: number, step = 1): Cand | null {
  const lo = T * (0.95 + m), hi = T * (1.05 - m), n = meals.length; P = P + (m ? 1 : 0);
  const mk = meals.map((x) => x.kcal), mp = meals.map((x) => x.protein), sh = meals.map((x) => SHARE[x.slot]);
  let exK = 0, exP = 0; const exSlot = new Array<number>(n).fill(0);
  for (const e of ex) { exK += e.kcal; exP += e.protein; exSlot[e.slotIdx] += e.kcal; }
  const u = new Array<number>(n).fill(U0), bu = new Array<number>(n).fill(U0);
  let bCost = Infinity, bOk = false, bViol = Infinity, bK = 0, bP = 0, found = false;
  const evalFull = (): void => {
    let k = fixed.kcal + exK, p = fixed.protein + exP, cost = 0;
    for (let i = 0; i < n; i++) {
      const s = u[i] / 20; k += mk[i] * s; p += mp[i] * s; cost += LOGSQ[u[i]];
      const d = ((mk[i] * s + exSlot[i]) / T - sh[i]) / sh[i]; cost += 2 * d * d;
    }
    const viol = Math.max(0, P - p) / Math.max(P, 1) + Math.max(0, lo - k, k - hi) / T;
    const ok = viol < 1e-9;
    cost += (Math.abs(k - T) / T) * 3;
    if (!ok) cost += 1e6 * viol;
    if (!found || (ok && !bOk) || (ok === bOk && cost < bCost - 1e-12)) { found = true; bCost = cost; bOk = ok; bViol = viol; bK = k; bP = p; for (let i = 0; i < n; i++) bu[i] = u[i]; }
  };
  if (n === 0) { evalFull(); } else {
    const rec = (i: number, k: number, p: number): void => {
      if (i < n - 1) { for (let x = U0; x <= U1; x += step) { u[i] = x; rec(i + 1, k + (mk[i] * x) / 20, p + (mp[i] * x) / 20); } return; }
      const rest = fixed.kcal + exK + k, restP = fixed.protein + exP + p, kn = mk[i];
      if (kn <= 0) { for (let x = U0; x <= U1; x++) { u[i] = x; evalFull(); } return; }
      const a = Math.ceil(((lo - rest) / kn) * 20 - 1e-9), b = Math.floor(((hi - rest) / kn) * 20 + 1e-9);
      const need = mp[i] > 0 ? Math.ceil(((P - restP) / mp[i]) * 20 - 1e-9) : U0;
      const from = Math.max(U0, a, need), to = Math.min(U1, b);
      if (from <= to) { for (let x = from; x <= to; x++) { u[i] = x; evalFull(); } return; }
      for (const x of [Math.round(((T - rest) / kn) * 20), need, a, b, 20]) { u[i] = Math.min(U1, Math.max(U0, x)); evalFull(); }
    };
    rec(0, 0, 0);
  }
  return found ? { scales: bu.map((x) => x / 20), cost: bCost, ok: bOk, viol: bViol, kcal: bK, protein: bP } : null;
}

/**
 * Resolve um dia para uma pessoa: escalas 0,6–2,0 (passo 0,05) + até 2 complementos para cumprir
 * proteína mínima e banda de kcal. Determinístico.
 */
export function solveDay(meals: FreeMeal[], T: number, P: number, fixed: { kcal: number; protein: number }, comps: Comp[], margin = 0.003): DaySol {
  const refine = (b: DaySol): DaySol => { if (!b.extras.length) return b; const c = scalesFor(meals, T, P, fixed, b.extras.map(eff), margin, 1); return c && (c.ok || !b.ok) ? wrap(c, b.extras) : b; };
  const options: ExtraPick[] = [];
  for (const c of comps) for (let si = 0; si < meals.length; si++) if (c.slots.includes(meals[si].slot)) {
    for (let g = c.step; g <= c.max; g += c.step) options.push({ food: c.food, slotIdx: si, g });
  }
  const eff = (e: ExtraPick) => { const p = FOOD.get(e.food)!.per100; return { kcal: (p.kcal * e.g) / 100, protein: (p.protein * e.g) / 100, slotIdx: e.slotIdx }; };
  const wrap = (c: Cand, extras: ExtraPick[]): DaySol => ({ scales: c.scales, extras, kcal: c.kcal, protein: c.protein, ok: c.ok, viol: c.viol });
  let best: DaySol | null = null;
  const consider = (c: Cand | null, extras: ExtraPick[]) => {
    if (!c) return;
    const adj = { ...c, cost: c.cost + extras.length * 0.6 + extras.reduce((a, e) => a + e.g / 400, 0) };
    if (!best || (adj.ok && !best.ok) || (adj.ok === best.ok && (adj.ok ? adj.cost < costOf(best) : adj.viol < best.viol - 1e-9))) { best = wrap(adj, extras); costs.set(best, adj.cost); }
  };
  const costs = new Map<DaySol, number>(); const costOf = (s: DaySol) => costs.get(s) ?? Infinity;
  consider(scalesFor(meals, T, P, fixed, [], margin, 1), []);
  if (best && (best as unknown as DaySol).ok) return best;
  for (const o of options) consider(scalesFor(meals, T, P, fixed, [eff(o)], margin, 2), [o]);
  if (best && (best as unknown as DaySol).ok) return refine(best);
  // guloso: acrescenta o melhor complemento ao melhor conjunto até 3 complementos
  for (let level = 2; level <= 3; level++) {
    const seed = (best as unknown as DaySol).extras;
    for (const o of options) {
      if (seed.some((x) => x.food === o.food)) continue;
      const set = [...seed, o];
      consider(scalesFor(meals, T, P, fixed, set.map(eff), margin, 2), set);
    }
    if ((best as unknown as DaySol).ok) break;
  }
  return refine(best!);
}
