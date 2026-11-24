"use client";
import { motion, useReducedMotion } from "motion/react";
import { Check, Clock, Ellipsis, Repeat2, Soup, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { applySwap, FOOD, mealTotal, RECIPE, SLOT_LABEL, setStatus, swapOptions, type DayCheck, type Plan, type PlannedMeal, type Prefs, type Slot } from "@/lib/engine";
import { logKey, fmtDay, dateOf } from "@/lib/week";
import type { usePlan } from "@/lib/usePlan";
import { Dish, Sheet } from "@/components/ui";

export type Ctx = ReturnType<typeof usePlan> & { plan: Plan; prefs: Prefs };
export type SheetState = { day: number; slot: Slot; kind: "swap" | "more" } | null;

export function DayStatus({ check, big }: { check: DayCheck; big?: boolean }) {
  const reduce = useReducedMotion();
  if (check.ok) return (
    <span className={`inline-flex items-center gap-1.5 font-semibold text-ok ${big ? "text-base" : "text-sm"}`}>
      <motion.span className="grid h-6 w-6 place-items-center rounded-full bg-ok text-on-primary" initial={reduce ? false : { scale: 0.3 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 520, damping: 16 }}><Check size={15} strokeWidth={3} /></motion.span>Dia cumprido no plano
    </span>
  );
  const bits = [!check.proteinOk && "falta proteína", !check.kcalOk && (check.kcal < check.kcalLow ? "poucas kcal" : "kcal a mais")].filter(Boolean).join(" e ");
  return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-warn"><span className="grid h-6 w-6 place-items-center rounded-full bg-warn/15"><X size={14} strokeWidth={3} /></span>Não cumpre: {bits}</span>;
}

export const cookInfo = (plan: Plan, cookId: string) => {
  const uses: { d: number; slot: Slot }[] = [];
  plan.days.forEach((d, i) => d.meals.forEach((m) => m.cookId === cookId && uses.push({ d: i, slot: m.slot })));
  return uses;
};

export function MealCard({ ctx, day, meal, onSheet }: { ctx: Ctx; day: number; meal: PlannedMeal; onSheet: (s: SheetState) => void }) {
  const { plan, me, log, setLog } = ctx, r = RECIPE.get(meal.recipeId)!, key = logKey(plan.weekStart, day, meal.slot), st = log[key];
  const t = mealTotal(meal, me), uses = cookInfo(plan, meal.cookId), first = uses[0], isLeftover = first && (first.d !== day || first.slot !== meal.slot);
  const badge = meal.status === "fora" ? "Fora de casa" : meal.status === "eu-trato" ? "Eu trato desta" : st === "comida" ? "Comida" : st === "saltada" ? "Saltada" : null;
  return (
    <li className={`card overflow-hidden transition-opacity ${st === "saltada" ? "opacity-60" : ""}`}>
      <Link href={`/receita/${day}/${meal.slot}`} className="flex items-center gap-3.5 p-4 active:bg-tint">
        {meal.status === "normal" ? <Dish cat={r.cat} /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-tint text-ink2"><Soup size={24} /></span>}
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium uppercase tracking-wide text-ink2">{SLOT_LABEL[meal.slot]}{badge && <span className="ml-2 rounded-full bg-tint px-2 py-0.5 normal-case tracking-normal text-primary">{badge}</span>}</span>
          <span className="block font-display text-lg leading-snug">{meal.status === "fora" ? "A comer fora" : meal.status === "eu-trato" ? "Refeição própria" : r.name}</span>
          <span className="num mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-ink2">
            <span>{Math.round(t.kcal)} kcal · {Math.round(t.protein)} g prot.</span>
            {meal.status === "normal" && <span className="inline-flex items-center gap-1"><Clock size={13} />{r.minutes} min</span>}
          </span>
          {meal.status === "normal" && uses.length > 1 && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-primary"><Repeat2 size={13} />{isLeftover ? `Sobras de ${fmtDay(dateOf(plan.weekStart, first.d), { weekday: "long" })}` : `Cozinhas 1×, comes ${uses.length}×`}</span>
          )}
        </span>
      </Link>
      <div className="flex gap-2 border-t border-line p-2">
        <button className="btn btn-ghost !min-h-11 flex-1 text-sm" aria-pressed={st === "comida"} onClick={() => setLog((l) => { const n = { ...l }; if (n[key] === "comida") delete n[key]; else n[key] = "comida"; return n; })}>
          <Check size={16} />{st === "comida" ? "Comi ✓" : "Comi"}</button>
        <button className="btn btn-ghost !min-h-11 flex-1 text-sm" onClick={() => onSheet({ day, slot: meal.slot, kind: "swap" })}><Repeat2 size={16} />Trocar</button>
        <button className="btn btn-ghost !min-h-11 !px-3 text-sm" aria-label="Mais opções" onClick={() => onSheet({ day, slot: meal.slot, kind: "more" })}><Ellipsis size={18} /></button>
      </div>
    </li>
  );
}

const sign = (n: number, u: string, d = 0) => `${n > 0 ? "+" : n < 0 ? "−" : "±"}${Math.abs(n).toFixed(d).replace(".", ",")} ${u}`;
function Impact({ before, after }: { before: DayCheck; after: DayCheck }) {
  return (
    <p className="num text-sm text-ink2">Dia: <b className="text-ink">{after.kcal} kcal</b> ({sign(after.kcal - before.kcal, "kcal")}), <b className="text-ink">{String(after.protein).replace(".", ",")} g</b> de proteína ({sign(Math.round((after.protein - before.protein) * 10) / 10, "g", 1)}) · <span className={after.ok ? "font-medium text-ok" : "font-medium text-warn"}>{after.ok ? "continua a cumprir" : "deixa de cumprir"}</span></p>
  );
}

export function MealSheets({ ctx, sheet, onClose }: { ctx: Ctx; sheet: SheetState; onClose: () => void }) {
  const { plan, prefs, me, setPlan, setAnswers, setLog } = ctx;
  const [own, setOwn] = useState({ kcal: "500", protein: "25" });
  const [excl, setExcl] = useState(false);
  const day = sheet?.day ?? 0, slot = sheet?.slot ?? "almoco";
  const meal = plan.days[day]?.meals.find((m) => m.slot === slot);
  const opts = useMemo(() => (sheet?.kind === "swap" && meal ? swapOptions(plan, prefs, day, slot) : []), [sheet?.kind, plan, prefs, day, slot, meal]);
  const before = plan.days[day]?.checks[me];
  const fora = useMemo(() => (sheet?.kind === "more" && meal ? setStatus(plan, prefs, day, slot, "fora").days[day].checks[me] : null), [sheet?.kind, plan, prefs, day, slot, me, meal]);
  const ownN = { kcal: Math.max(0, Math.round(+own.kcal) || 0), protein: Math.max(0, Math.round(+own.protein) || 0) };
  const eu = useMemo(() => (sheet?.kind === "more" && meal ? setStatus(plan, prefs, day, slot, "eu-trato", { [me]: ownN }).days[day].checks[me] : null), [sheet?.kind, plan, prefs, day, slot, me, meal, ownN.kcal, ownN.protein]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!meal || !before) return null;
  const r = RECIPE.get(meal.recipeId)!, key = logKey(plan.weekStart, day, slot);
  const apply = (p: Plan) => { setPlan(p); onClose(); };
  return (
    <>
      <Sheet open={sheet?.kind === "swap"} onClose={onClose} title={`Trocar ${SLOT_LABEL[slot].toLowerCase()}`}>
        <p className="mb-3 text-sm text-ink2">Vê o impacto antes de aplicar. Nada muda até confirmares.</p>
        <ul className="space-y-3">
          {opts.map((o) => { const ro = RECIPE.get(o.recipeId)!; return (
            <li key={o.recipeId} className="card p-3.5"><div className="flex items-center gap-3"><Dish cat={ro.cat} size={44} /><div className="min-w-0 flex-1"><p className="font-display text-base leading-snug">{ro.name}</p><p className="text-xs text-ink2">{ro.minutes} min</p></div></div>
              <p className="num mt-2 text-sm">Proteína <b>{sign(o.dProtein, "g", 1)}</b> · Calorias <b>{sign(o.dKcal, "kcal")}</b> · Custo <b>{sign(o.dCost, "€", 2)}</b></p>
              <p className={`mt-0.5 text-sm font-medium ${o.dayOk ? "text-ok" : "text-warn"}`}>{o.dayOk ? "O dia continua a cumprir" : "O dia deixa de cumprir"}</p>
              <button className="btn btn-primary mt-3 w-full !min-h-11" onClick={() => apply(applySwap(plan, prefs, day, slot, o.recipeId))}>Aplicar esta troca</button></li>); })}
          {!opts.length && <li className="text-ink2">Não há alternativas compatíveis com as tuas regras.</li>}
        </ul>
      </Sheet>
      <Sheet open={sheet?.kind === "more"} onClose={() => { setExcl(false); onClose(); }} title={excl ? "Não é para mim" : SLOT_LABEL[slot]}>
        {excl ? (
          <div className="space-y-3">
            <p className="text-sm text-ink2">Aplica-se às semanas seguintes. A semana atual não muda.</p>
            <button className="btn btn-ghost w-full" onClick={() => { setAnswers((a) => ({ ...a, excludedRecipes: [...new Set([...a.excludedRecipes, r.id])] })); setExcl(false); onClose(); }}>Excluir o prato «{r.name}»</button>
            <p className="pt-2 text-sm font-medium">Ou excluir um ingrediente:</p>
            <div className="flex flex-wrap gap-2">{r.ingredients.map((i) => <button key={i.food} className="chip" onClick={() => { setAnswers((a) => ({ ...a, excludedFoods: [...new Set([...a.excludedFoods, i.food])] })); setExcl(false); onClose(); }}>{FOOD.get(i.food)!.pt}</button>)}</div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-2">
              <button className="btn btn-ghost" onClick={() => { setLog((l) => ({ ...l, [key]: "saltada" })); onClose(); }}>Saltei esta refeição</button>
              <button className="btn btn-ghost" onClick={() => setExcl(true)}>Não é para mim</button>
              {meal.status !== "normal" && <button className="btn btn-primary" onClick={() => apply(setStatus(plan, prefs, day, slot, "normal"))}>Voltar ao prato do plano</button>}
            </div>
            <div className="card space-y-2 p-4"><h3 className="text-lg">Comer fora</h3>
              <p className="text-sm text-ink2">A refeição fica marcada como fora; o resto do dia mantém-se.</p>
              {fora && <Impact before={before} after={fora} />}
              <button className="btn btn-primary w-full" onClick={() => apply(setStatus(plan, prefs, day, slot, "fora"))}>Marcar como fora</button></div>
            <div className="card space-y-3 p-4"><h3 className="text-lg">Eu trato desta</h3>
              <p className="text-sm text-ink2">Indica a tua refeição: as outras do dia reajustam-se.</p>
              <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">kcal<input className="field num mt-1" inputMode="numeric" value={own.kcal} onChange={(e) => setOwn({ ...own, kcal: e.target.value })} /></label>
                <label className="text-sm font-medium">Proteína (g)<input className="field num mt-1" inputMode="numeric" value={own.protein} onChange={(e) => setOwn({ ...own, protein: e.target.value })} /></label></div>
              {eu && <Impact before={before} after={eu} />}
              <button className="btn btn-primary w-full" onClick={() => apply(setStatus(plan, prefs, day, slot, "eu-trato", { [me]: ownN }))}>Aplicar</button></div>
          </div>
        )}
      </Sheet>
    </>
  );
}
