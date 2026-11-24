"use client";
import { motion, useReducedMotion } from "motion/react";
import { Check, Share2 } from "lucide-react";
import { useState } from "react";
import { grocery, PRICES, shareText } from "@/lib/engine";
import { usePlan } from "@/lib/usePlan";
import { Skeleton } from "@/components/DayView";
import type { Ctx } from "@/components/MealParts";
import { Bar, Estimativa, Footer } from "@/components/ui";
import { useTicks } from "@/lib/useTicks";

const eur = (n: number) => n.toFixed(2).replace(".", ",") + " €";

export default function Lista() {
  const p = usePlan(), [msg, setMsg] = useState(""), reduce = useReducedMotion();
  const ctx = p as unknown as Ctx;
  const { ticked, toggle } = useTicks(ctx.plan);
  if (!p.ready) return <Skeleton />;
  const { plan } = ctx, g = grocery(plan), date = new Date(g.updated + "T00:00:00").toLocaleDateString("pt-PT");
  const share = async () => {
    const text = shareText(g);
    try { if (navigator.share) { await navigator.share({ title: "Lista de compras", text }); return; } await navigator.clipboard.writeText(text); setMsg("Lista copiada para a área de transferência."); } catch { setMsg("Não foi possível partilhar."); }
    setTimeout(() => setMsg(""), 3000);
  };
  const done = g.items.filter((i) => ticked.has(i.food)).length;
  return (
    <div>
      <div className="flex items-start justify-between gap-3"><div><h1 className="text-[28px] leading-none">Lista de compras</h1><p className="mt-1 text-ink2">{done}/{g.items.length} itens marcados</p></div>
        <button className="btn btn-ghost gap-2" onClick={share}><Share2 size={18} />Partilhar</button></div>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-ok">{msg}</p>
      <p className="mt-1"><Estimativa text={`Preços estimados (atualizados em ${date})`} /> <span className="text-xs text-ink2">Todos os valores em € são estimativas.</span></p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <section className="card space-y-3 p-4"><h2 className="text-lg">O que comes esta semana <Estimativa /></h2>
          <Bar label={eur(g.eatCost)} unit="€" value={g.eatCost} target={plan.budget} color={g.eatCost > plan.budget ? "var(--err)" : "var(--primary)"} />
          <p className="text-sm text-ink2">Orçamento: {eur(plan.budget)}. Custos estimados. {g.eatCost <= plan.budget ? `Dentro do orçamento (sobram ${eur(plan.budget - g.eatCost)}).` : `Acima do orçamento em ${eur(g.eatCost - plan.budget)}.`}</p></section>
        <section className="card space-y-1 p-4"><h2 className="text-lg">O que pagas na caixa <Estimativa /></h2>
          <p className="num text-3xl font-semibold">{eur(g.registerCost)}</p>
          <p className="text-sm text-ink2">Embalagens inteiras ({PRICES.stores[plan.store].name}). Sobram {eur(g.registerCost - g.eatCost)} em ingredientes para as semanas seguintes.</p></section>
      </div>
      <div className="mt-6 space-y-6 md:columns-2 md:gap-8 md:space-y-0">
        {g.byAisle.map((a) => (
          <section key={a.aisle} className="mb-6 break-inside-avoid"><h2 className="mb-2 text-xl">{a.aisle}</h2>
            <ul className="card divide-y divide-line">
              {a.items.map((i) => { const on = ticked.has(i.food); return (
                <li key={i.food}><button className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-left" role="checkbox" aria-checked={on} onClick={() => toggle(i.food)}>
                  <motion.span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 ${on ? "border-primary bg-primary text-on-primary" : "border-line"}`} animate={{ scale: on && !reduce ? [1, 1.18, 1] : 1 }} transition={{ duration: 0.22 }}>{on && <Check size={15} strokeWidth={3} />}</motion.span>
                  <span className={`min-w-0 flex-1 ${on ? "text-ink2 line-through" : ""}`}><span className="block">{i.name}</span>
                    <span className="num block text-sm text-ink2">{i.packs.length ? i.packs.map((q) => `${q.count} × ${q.size} g`).join(" + ") : `${i.buyG} g`} · precisas de {i.needG} g{i.leftoverG > 0 ? `, sobram ${i.leftoverG} g` : ""}</span></span>
                  <span className="num text-sm text-ink2">{eur(i.buyCost)}</span></button></li>); })}
            </ul></section>))}
      </div>
      <Footer />
    </div>
  );
}
