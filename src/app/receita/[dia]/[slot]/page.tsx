"use client";
import { ArrowLeft, Check, Clock, ExternalLink, Flame, Repeat2, Ban } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { band, dayTotal, FOOD, mealLines, mealTotal, RECIPE, SLOT_LABEL, type Slot } from "@/lib/engine";
import { logKey, dateOf, fmtDay } from "@/lib/week";
import { usePlan } from "@/lib/usePlan";
import { Skeleton } from "@/components/DayView";
import { MealSheets, cookInfo, type Ctx, type SheetState } from "@/components/MealParts";
import { Dish, Footer } from "@/components/ui";

const n1 = (n: number) => (Math.round(n * 10) / 10).toString().replace(".", ",");
const EQ: Record<string, string> = { fogao: "fogão", forno: "forno", microondas: "micro-ondas", airfryer: "air fryer", robo: "robô de cozinha", liquidificadora: "liquidificadora" };

export default function Receita() {
  const { dia, slot } = useParams<{ dia: string; slot: string }>();
  const p = usePlan(), [sheet, setSheet] = useState<SheetState>(null), [who, setWho] = useState<string | null>(null);
  if (!p.ready) return <Skeleton />;
  const ctx = p as unknown as Ctx, { plan, log, setLog } = ctx, d = Math.min(6, Math.max(0, +dia || 0)), day = plan.days[d];
  const meal = day.meals.find((m) => m.slot === slot);
  if (!meal) return <p>Refeição não encontrada. <Link className="underline" href="/semana">Ver a semana</Link></p>;
  const r = RECIPE.get(meal.recipeId)!, pid = who ?? ctx.me, person = plan.people.find((x) => x.id === pid)!, uses = cookInfo(plan, meal.cookId);
  const lines = mealLines(meal, pid), mt = mealTotal(meal, pid), dt = dayTotal(day, pid), chk = day.checks[pid], b = band(person.kcal);
  const key = logKey(plan.weekStart, d, meal.slot), eaten = log[key] === "comida";
  const foods = [...r.ingredients.map((i) => i.food), ...meal.extras.map((e) => e.food)].filter((f, i, a) => a.indexOf(f) === i);
  const gramsOf = (food: string, person: string) => mealLines(meal, person).filter((l) => l.food === food).reduce((a, l) => a + l.g, 0);
  return (
    <div>
      <Link href={`/dia/${d}`} className="btn btn-ghost mb-4 !min-h-11 w-fit gap-2 text-sm"><ArrowLeft size={16} />{fmtDay(dateOf(plan.weekStart, d), { weekday: "long" })}</Link>
      <div className="md:grid md:grid-cols-2 md:gap-10">
        <div>
          <div className="flex items-center gap-4"><Dish cat={r.cat} size={72} /><div><p className="text-xs font-medium uppercase tracking-wide text-ink2">{SLOT_LABEL[slot as Slot]}</p><h1 className="text-[28px] leading-tight">{r.name}</h1></div></div>
          <p className="num mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink2"><span className="inline-flex items-center gap-1"><Clock size={15} />{r.minutes} min</span><span className="inline-flex items-center gap-1"><Flame size={15} />{r.temp}</span>
            {r.equipment.length > 0 && <span>Equipamento: {r.equipment.map((e) => EQ[e]).join(", ")}</span>}
            {uses.length > 1 && <span className="inline-flex items-center gap-1 text-primary"><Repeat2 size={15} />Cozinhas 1×, comes {uses.length}× (aguenta {r.fridgeDays} dias no frigorífico)</span>}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn btn-primary !min-h-11 gap-1.5 text-sm" aria-pressed={eaten} onClick={() => setLog((l) => { const n = { ...l }; if (n[key] === "comida") delete n[key]; else n[key] = "comida"; return n; })}><Check size={16} />{eaten ? "Comida ✓" : "Marcar como comida"}</button>
            <button className="btn btn-ghost !min-h-11 gap-1.5 text-sm" onClick={() => setSheet({ day: d, slot: meal.slot, kind: "swap" })}><Repeat2 size={16} />Trocar</button>
            <button className="btn btn-ghost !min-h-11 gap-1.5 text-sm" onClick={() => setSheet({ day: d, slot: meal.slot, kind: "more" })}><Ban size={16} />Mais opções</button></div>
          {meal.status !== "normal" ? <p className="card mt-6 p-4 text-ink2">{meal.status === "fora" ? "Marcaste esta refeição como fora de casa." : "Esta é uma refeição própria: indicaste as calorias e a proteína."}</p> : <>
            <h2 className="mt-8 text-2xl">Ingredientes</h2>
            <div className="card mt-3 overflow-x-auto"><table className="num w-full text-sm"><thead><tr className="border-b border-line text-left text-ink2"><th className="p-3 font-medium">Ingrediente</th>{plan.people.map((q) => <th key={q.id} className="p-3 text-right font-medium">{plan.people.length > 1 ? q.name ?? q.id : "Porção"}</th>)}</tr></thead>
              <tbody>{foods.map((f) => <tr key={f} className="border-b border-line last:border-0"><td className="p-3">{FOOD.get(f)!.pt}{meal.extras.some((e) => e.food === f) && !r.ingredients.some((i) => i.food === f) && <span className="ml-2 rounded-full bg-tint px-2 py-0.5 text-xs text-primary">complemento</span>}</td>{plan.people.map((q) => <td key={q.id} className="p-3 text-right">{gramsOf(f, q.id)} g</td>)}</tr>)}</tbody></table></div>
            <h2 className="mt-8 text-2xl">Preparação</h2>
            <ol className="mt-3 space-y-3">{r.steps.map((s, i) => <li key={i} className="flex gap-3"><span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-tint text-sm font-semibold">{i + 1}</span><span>{s}.</span></li>)}</ol></>}
        </div>
        <section className="mt-8 md:mt-0" aria-labelledby="calc">
          <h2 id="calc" className="text-2xl">Como calculamos isto</h2>
          <p className="mt-1 text-sm text-ink2">Gramas × valor por 100 g ÷ 100. Nenhum número vem de IA.</p>
          {plan.people.length > 1 && <div className="mt-3 flex flex-wrap gap-2">{plan.people.map((q) => <button key={q.id} className="chip !min-h-11" aria-pressed={q.id === pid} onClick={() => setWho(q.id)}>{q.name ?? q.id}</button>)}</div>}
          {lines.length > 0 && <ul className="card num mt-3 divide-y divide-line text-sm">
            {lines.map((l, i) => { const f = FOOD.get(l.food)!; return (
              <li key={i} className="p-3"><p className="font-medium">{f.pt}{l.extra && <span className="ml-2 text-xs text-primary">complemento</span>}</p>
                <p className="text-ink2">{l.g} g × {f.per100.kcal} kcal/100 g = <b className="text-ink">{n1(l.macros.kcal)} kcal</b></p>
                <p className="text-ink2">{l.g} g × {n1(f.per100.protein)} g/100 g = <b className="text-ink">{n1(l.macros.protein)} g proteína</b></p>
                <a className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary underline" target="_blank" rel="noreferrer" href={`https://fdc.nal.usda.gov/food-details/${f.fdcId}/nutrients`}>USDA fdcId {f.fdcId}<ExternalLink size={11} /></a></li>); })}</ul>}
          <dl className="card num mt-3 space-y-2 p-4 text-sm">
            <div className="flex justify-between"><dt>Total desta refeição</dt><dd className="font-semibold">{n1(mt.kcal)} kcal · {n1(mt.protein)} g</dd></div>
            <div className="flex justify-between"><dt>Total do dia ({person.name ?? "Eu"})</dt><dd className="font-semibold">{n1(dt.kcal)} kcal · {n1(dt.protein)} g</dd></div>
            <div className="flex justify-between text-ink2"><dt>Meta</dt><dd>{b.low}–{b.high} kcal · mín. {person.protein} g</dd></div>
            <div className={`flex justify-between font-medium ${chk.ok ? "text-ok" : "text-warn"}`}><dt>Comparação</dt><dd>{chk.kcalOk ? "kcal na banda" : "kcal fora da banda"} · {chk.proteinOk ? "proteína cumprida" : `faltam ${n1(person.protein - chk.protein)} g`}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-ink2">Fonte: USDA FoodData Central (SR Legacy), domínio público. Quantidades em peso cru, tal como vêm da fonte.</p>
        </section>
      </div>
      <MealSheets ctx={ctx} sheet={sheet} onClose={() => setSheet(null)} />
      <Footer />
    </div>
  );
}
