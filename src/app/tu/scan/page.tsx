"use client";
import { Camera, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { setStatus, SLOTS, SLOT_LABEL, type Slot } from "@/lib/engine";
import { usePlan } from "@/lib/usePlan";
import { api } from "@/lib/useSession";
import { todayIndex } from "@/lib/week";
import { Skeleton } from "@/components/DayView";
import type { Ctx } from "@/components/MealParts";
import { Msg, Sub } from "@/components/Sub";
import { Estimativa } from "@/components/ui";

async function shrink(file: File, max = 768): Promise<string> {
  const bmp = await createImageBitmap(file), k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.72).split(",")[1];
}
export default function Scan() {
  const p = usePlan(), input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle"), [msg, setMsg] = useState(""), [src, setSrc] = useState<"ia" | "manual">("manual");
  const [dish, setDish] = useState(""), [kcal, setKcal] = useState("500"), [prot, setProt] = useState("25"), [slot, setSlot] = useState<Slot>("almoco"), [applied, setApplied] = useState(false);
  const ctx = p as unknown as Ctx;
  const day = p.ready ? Math.max(0, todayIndex(ctx.plan)) : 0;
  const own = { kcal: Math.max(0, Math.round(+kcal) || 0), protein: Math.max(0, Math.round(+prot) || 0) };
  const preview = useMemo(() => (p.ready && ctx.plan.days[day].meals.some((m) => m.slot === slot) ? setStatus(ctx.plan, ctx.prefs, day, slot, "eu-trato", { [ctx.me]: own }, src).days[day].checks[ctx.me] : null), [p.ready, ctx.plan, ctx.prefs, day, slot, ctx.me, own.kcal, own.protein, src]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!p.ready) return <Skeleton />;
  const scan = async (f: File) => {
    setState("busy"); setMsg("");
    const r = await api<{ prato: string; kcal: number; proteina_g: number; confianca: number; detalhe?: string }>("/api/scan", { image: await shrink(f), mime: "image/jpeg" });
    if (r.ok) { setDish(r.data.prato); setKcal(String(r.data.kcal)); setProt(String(r.data.proteina_g)); setSrc("ia"); setState("done"); return; }
    setState("idle");
    setMsg(r.status === 429 ? (r.data.detalhe === "global" ? "A quota diária gratuita da IA esgotou-se para todos. Introduz os valores à mão abaixo." : "Atingiste o limite de 5 fotos por dia. Introduz os valores à mão abaixo.") : "A IA não respondeu. Introduz os valores à mão abaixo.");
  };
  const check = preview;
  return (
    <Sub title="Scan the Plate (fotografar o prato)" hint="Tira uma foto ao prato: a IA estima as calorias e a proteína. A foto não é guardada.">
      <input ref={input} type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Escolher foto" onChange={(e) => e.target.files?.[0] && scan(e.target.files[0])} />
      <button className="btn btn-primary w-full gap-2" disabled={state === "busy"} onClick={() => input.current?.click()}><Camera size={20} />{state === "busy" ? "A analisar…" : "Tirar ou escolher uma foto"}</button>
      <Msg text={msg} />
      <section className="card space-y-3 p-4">
        <div className="flex items-center justify-between"><h2 className="text-lg">{state === "done" ? dish : "Valores da refeição"}</h2>{src === "ia" ? <Estimativa text="estimativa da IA" /> : <span className="tag-est">introduzido por ti</span>}</div>
        {state === "done" && <p className="flex items-center gap-1.5 text-sm text-ink2"><Sparkles size={15} />A IA pode enganar-se: confirma e ajusta os valores.</p>}
        <div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">kcal<input className="field num mt-1" inputMode="numeric" value={kcal} onChange={(e) => { setKcal(e.target.value); setSrc("manual"); }} /></label>
          <label className="text-sm font-medium">Proteína (g)<input className="field num mt-1" inputMode="numeric" value={prot} onChange={(e) => { setProt(e.target.value); setSrc("manual"); }} /></label></div>
        <label className="block text-sm font-medium">Substituir a refeição de hoje
          <select className="field mt-1" value={slot} onChange={(e) => setSlot(e.target.value as Slot)}>{SLOTS.filter((s) => ctx.plan.days[day].meals.some((m) => m.slot === s)).map((s) => <option key={s} value={s}>{SLOT_LABEL[s]}</option>)}</select></label>
        {check && <p className="num text-sm text-ink2">Impacto no dia: <b className="text-ink">{check.kcal} kcal, {String(check.protein).replace(".", ",")} g</b> de proteína · <span className={check.ok ? "font-medium text-ok" : "font-medium text-warn"}>{check.ok ? "o dia continua a cumprir" : "o dia deixa de cumprir"}</span></p>}
        <button className="btn btn-primary w-full" disabled={!check} onClick={() => { ctx.setPlan(setStatus(ctx.plan, ctx.prefs, day, slot, "eu-trato", { [ctx.me]: own }, src)); setApplied(true); }}>Substituir a refeição</button>
        <Msg ok text={applied ? "Refeição substituída. Vê em Hoje." : ""} />
      </section>
    </Sub>
  );
}
