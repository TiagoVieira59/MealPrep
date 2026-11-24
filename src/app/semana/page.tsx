"use client";
import { Clock, Repeat2, Wallet } from "lucide-react";
import Link from "next/link";
import { RECIPE, SLOTS, SLOT_LABEL, type Plan } from "@/lib/engine";
import { usePlan } from "@/lib/usePlan";
import { dateOf, fmtDay, todayIndex } from "@/lib/week";
import { Skeleton } from "@/components/DayView";
import { DayStatus, cookInfo, type Ctx } from "@/components/MealParts";
import { Dish, Footer } from "@/components/ui";

const hm = (m: number) => `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
const eur = (n: number) => n.toFixed(2).replace(".", ",") + " €";

function Warnings({ plan }: { plan: Plan }) {
  const over = plan.cost > plan.budget;
  if (!plan.warnings.length && !over && !plan.suggestions.length) return null;
  const names = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  return (
    <section className="mt-5 rounded-2xl border border-warn/40 bg-warn/10 p-4" role="alert">
      <h2 className="text-lg">Esta semana não cumpre tudo</h2>
      <ul className="num mt-2 space-y-1 text-sm">
        {over && <li>O custo é {eur(plan.cost)} para um orçamento de {eur(plan.budget)} (+{eur(plan.cost - plan.budget)}).</li>}
        {plan.warnings.map((w, i) => <li key={i}><b>{names[w.day]}{plan.people.length > 1 ? ` (${plan.people.find((p) => p.id === w.person)?.name ?? w.person})` : ""}:</b> {[w.missingProtein > 0 && `faltam ${w.missingProtein} g de proteína`, w.kcalDiff < 0 && `${Math.abs(w.kcalDiff)} kcal abaixo da banda`, w.kcalDiff > 0 && `${w.kcalDiff} kcal acima da banda`].filter(Boolean).join("; ")}</li>)}
      </ul>
      {plan.suggestions.length > 0 && <><p className="mt-3 text-sm font-medium">O que podes fazer:</p><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{plan.suggestions.map((s) => <li key={s}>{s}</li>)}</ul></>}
    </section>
  );
}

export default function Semana() {
  const p = usePlan();
  if (!p.ready) return <Skeleton />;
  const { plan, next, me } = p as unknown as Ctx, ti = todayIndex(plan), ok = plan.days.filter((d) => d.checks[me]?.ok).length;
  return (
    <div>
      <h1 className="text-[34px] leading-none">A tua semana</h1>
      <p className="mt-1 text-ink2">{fmtDay(dateOf(plan.weekStart, 0), { day: "numeric", month: "long" })} – {fmtDay(dateOf(plan.weekStart, 6), { day: "numeric", month: "long" })}</p>
      <div className="num mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="card p-3"><Clock size={18} className="mx-auto text-ink2" /><p className="mt-1 font-semibold">{hm(plan.cookMinutes)}</p><p className="text-xs text-ink2">a cozinhar</p></div>
        <div className="card p-3"><Wallet size={18} className="mx-auto text-ink2" /><p className="mt-1 font-semibold">{eur(plan.cost)}</p><p className="text-xs text-ink2">de {eur(plan.budget)} <span className="tag-est">estimativa</span></p></div>
        <div className="card p-3"><p className="text-xl font-semibold leading-7 text-ok">{ok}/7</p><p className="text-xs text-ink2">dias cumpridos</p></div>
      </div>
      <Warnings plan={plan} />
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {plan.days.map((d, i) => {
          const c = d.checks[me];
          return (
            <li key={i} className={`card flex flex-col ${i === ti ? "ring-2 ring-primary" : ""}`}>
              <Link href={`/dia/${i}`} className="flex flex-1 flex-col p-4 active:bg-tint">
                <span className="flex items-baseline justify-between"><span className="font-display text-xl">{fmtDay(dateOf(plan.weekStart, i), { weekday: "long" })}</span><span className="text-sm text-ink2">{fmtDay(dateOf(plan.weekStart, i), { day: "numeric", month: "short" })}</span></span>
                <span className="mt-1"><DayStatus check={c} /></span>
                <ul className="mt-3 flex-1 space-y-2">
                  {SLOTS.map((s) => d.meals.find((m) => m.slot === s)).filter(Boolean).map((m) => {
                    const r = RECIPE.get(m!.recipeId)!, uses = cookInfo(plan, m!.cookId);
                    return (
                      <li key={m!.slot} className="flex items-center gap-2.5"><Dish cat={r.cat} size={32} /><span className="min-w-0 text-sm leading-tight"><span className="block truncate">{m!.status === "fora" ? "A comer fora" : m!.status === "eu-trato" ? "Refeição própria" : r.name}</span>
                        <span className="text-xs text-ink2">{SLOT_LABEL[m!.slot]}{uses.length > 1 && m!.status === "normal" && uses[0].d === i && uses[0].slot === m!.slot && <span className="ml-1.5 inline-flex items-center gap-0.5 text-primary"><Repeat2 size={11} />cozinhas 1×, comes {uses.length}×</span>}{uses.length > 1 && uses[0].d !== i && <span className="ml-1.5 text-primary">· sobras</span>}</span></span></li>);
                  })}
                </ul>
                <span className="num mt-3 border-t border-line pt-2 text-sm text-ink2">{c.kcal} kcal · {String(c.protein).replace(".", ",")} g prot.</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-lg">Semana seguinte</h2><p className="text-sm text-ink2">{next ? `Já preparada: começa a ${fmtDay(dateOf(next.weekStart, 0), { day: "numeric", month: "long" })}. Gerar de novo usa as respostas atuais.` : "Usa as tuas respostas atuais. Mudanças às respostas aplicam-se aqui."}</p></div>
        <Link href="/gerar" className="btn btn-primary">{next ? "Gerar de novo" : "Gerar próxima semana"}</Link>
      </div>
      <Footer />
    </div>
  );
}
