import type { Objective } from "./types";

export interface Body { sex: "m" | "f"; age: number; heightCm: number; weightKg: number; activity: number; objective: Objective }
export const ACTIVITY = { sedentario: 1.2, leve: 1.375, moderado: 1.55, intenso: 1.725 } as const;
export const OBJ_ADJUST: Record<Objective, number> = { perder: -0.2, manter: 0, ganhar: 0.1, "nao-sei": 0 };

/** Mifflin–St Jeor (kcal/dia). */
export const bmr = (b: Pick<Body, "sex" | "age" | "heightCm" | "weightKg">) => 10 * b.weightKg + 6.25 * b.heightCm - 5 * b.age + (b.sex === "m" ? 5 : -161);
/** Peso com IMC 25 para a altura. */
export const referenceWeight = (heightCm: number) => 25 * (heightCm / 100) ** 2;
export const PROTEIN_PER_KG = 2.2, PROTEIN_KCAL_CAP = 0.35;
export const band = (kcal: number) => ({ low: Math.round(kcal * 0.95), high: Math.round(kcal * 1.05) });

export function computeTargets(b: Body) {
  const tmb = bmr(b), get = tmb * b.activity, adj = OBJ_ADJUST[b.objective];
  const kcal = Math.round((get * (1 + adj)) / 10) * 10;
  const ref = referenceWeight(b.heightCm), raw = PROTEIN_PER_KG * ref, cap = (kcal * PROTEIN_KCAL_CAP) / 4;
  const protein = Math.round(Math.min(raw, cap));
  return { tmb: Math.round(tmb), get: Math.round(get), adjust: adj, kcal, refWeight: Math.round(ref * 10) / 10, proteinRaw: Math.round(raw), proteinCap: Math.round(cap), proteinCapped: raw > cap, protein, band: band(kcal) };
}
