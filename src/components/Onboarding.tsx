"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, Check, Minus, Plus, Search, ThumbsUp, Ban } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DEFAULT_ANSWERS, type Answers } from "@/lib/answers";
import { FOODS, RECIPES, type Allergen, type Equipment, type StoreId } from "@/lib/engine";
import { K, useLocal } from "@/lib/store";
import { Disclaimer, EASE } from "@/components/ui";
import { Metas } from "@/components/Metas";
import { EquipArt, StoreArt } from "@/components/art";

const ALLERGENS: [Allergen, string][] = [["gluten", "Glúten"], ["crustaceos", "Crustáceos"], ["ovos", "Ovos"], ["peixe", "Peixe"], ["amendoim", "Amendoim"], ["soja", "Soja"], ["leite", "Leite"], ["frutos_casca_rija", "Frutos de casca rija"], ["aipo", "Aipo"], ["mostarda", "Mostarda"], ["sesamo", "Sésamo"], ["sulfitos", "Sulfitos"], ["tremoco", "Tremoço"], ["moluscos", "Moluscos"]];
const EQUIP: [Equipment, string][] = [["fogao", "Fogão"], ["forno", "Forno"], ["microondas", "Micro-ondas"], ["airfryer", "Air fryer"], ["robo", "Robô de cozinha"], ["liquidificadora", "Liquidificadora"]];

const STORES: [StoreId, string][] = [["continente", "Continente"], ["pingo-doce", "Pingo Doce"], ["lidl", "Lidl"], ["mercadona", "Mercadona"], ["aldi", "Aldi"], ["intermarche", "Intermarché"]];
type Set = (p: Partial<Answers>) => void;
/** Grelha de cartões com ilustração e escolha múltipla. */
function PicGrid<T extends string>({ values, items, onChange }: { values: T[]; items: { v: T; t: string; art: React.ReactNode }[]; onChange: (v: T[]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3" role="group">
      {items.map(({ v, t, art }) => { const on = values.includes(v); return (
        <button key={v} aria-pressed={on} onClick={() => onChange(on ? values.filter((x) => x !== v) : [...values, v])}
          className={`card relative flex min-h-32 flex-col items-center justify-center gap-2 p-3 transition-[transform,background,border-color] duration-150 active:scale-[.97] ${on ? "!border-primary bg-tint ring-2 ring-primary" : ""}`}>
          <span className="transition-transform duration-200" style={{ transform: on ? "scale(1.08)" : undefined }}>{art}</span>
          <span className="text-sm font-semibold">{t}</span>
          {on && <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-on-primary"><Check size={14} /></span>}
        </button>); })}
    </div>
  );
}
const Choice = <T extends string | number>({ value, options, onPick, cols = 1 }: { value: T | undefined; options: { v: T; t: string; d?: string }[]; onPick: (v: T) => void; cols?: 1 | 2 }) => (
  <div role="radiogroup" className={`grid gap-3 ${cols === 2 ? "grid-cols-2" : ""}`}>
    {options.map((o) => (
      <button key={String(o.v)} role="radio" aria-checked={value === o.v} onClick={() => onPick(o.v)}
        className={`card min-h-14 w-full px-4 py-3 text-left transition-[transform,background,border-color] duration-150 active:scale-[.98] ${value === o.v ? "!border-primary bg-tint ring-2 ring-primary" : ""}`}>
        <span className="flex items-center justify-between gap-3"><span className="font-semibold">{o.t}</span>{value === o.v && <Check size={20} className="text-primary" />}</span>
        {o.d && <span className="block text-sm text-ink2">{o.d}</span>}
      </button>
    ))}
  </div>
);
const Chips = <T extends string>({ values, options, onChange }: { values: T[]; options: [T, string][]; onChange: (v: T[]) => void }) => (
  <div className="flex flex-wrap gap-2.5">
    {options.map(([v, t]) => { const on = values.includes(v); return <button key={v} className="chip" aria-pressed={on} onClick={() => onChange(on ? values.filter((x) => x !== v) : [...values, v])}>{t}</button>; })}
  </div>
);
function Num({ value, onChange, min, max, unit, step = 1 }: { value?: number; onChange: (n: number | undefined) => void; min: number; max: number; unit: string; step?: number }) {
  const bad = value != null && (value < min || value > max);
  return (
    <div>
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost !px-0 w-14" aria-label="Diminuir" onClick={() => onChange(Math.max(min, Math.round(((value ?? min) - step) * 10) / 10))}><Minus /></button>
        <label className="relative flex-1"><span className="sr-only">Valor em {unit}</span>
          <input className="field num h-16 text-center text-3xl font-semibold" inputMode="decimal" value={value ?? ""} aria-invalid={bad}
            onChange={(e) => { const t = e.target.value.replace(",", "."); onChange(t === "" ? undefined : Number.isNaN(+t) ? value : +t); }} />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink2">{unit}</span></label>
        <button className="btn btn-ghost !px-0 w-14" aria-label="Aumentar" onClick={() => onChange(Math.min(max, Math.round(((value ?? min) + step) * 10) / 10))}><Plus /></button>
      </div>
      {bad && <p className="mt-2 text-sm text-err" role="alert">Indica um valor entre {min} e {max} {unit}.</p>}
    </div>
  );
}

function Likes({ a, set }: { a: Answers; set: Set }) {
  const [q, setQ] = useState("");
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const items = [...FOODS.map((f) => ({ k: "f" as const, id: f.id, t: f.pt })), ...RECIPES.map((r) => ({ k: "r" as const, id: r.id, t: r.name }))];
  const res = q.trim().length < 2 ? [] : items.filter((i) => norm(i.t).includes(norm(q))).slice(0, 12);
  const lists = (k: "f" | "r") => (k === "f" ? { like: a.likedFoods, ex: a.excludedFoods, lk: "likedFoods", ek: "excludedFoods" } : { like: a.likedRecipes, ex: a.excludedRecipes, lk: "likedRecipes", ek: "excludedRecipes" }) as { like: string[]; ex: string[]; lk: keyof Answers; ek: keyof Answers };
  const toggle = (k: "f" | "r", id: string, kind: "like" | "ex") => {
    const l = lists(k), inLike = l.like.includes(id), inEx = l.ex.includes(id);
    const nl = l.like.filter((x) => x !== id), ne = l.ex.filter((x) => x !== id);
    if (kind === "like") set({ [l.lk]: inLike ? nl : [...nl, id], [l.ek]: ne } as Partial<Answers>); else set({ [l.ek]: inEx ? ne : [...ne, id], [l.lk]: nl } as Partial<Answers>);
  };
  const chosen = items.filter((i) => lists(i.k).like.includes(i.id) || lists(i.k).ex.includes(i.id));
  return (
    <div>
      <label className="relative block"><span className="sr-only">Pesquisar no catálogo</span><Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink2" />
        <input className="field !pl-10" placeholder="Pesquisar (ex.: salmão, bacalhau, tofu)" value={q} onChange={(e) => setQ(e.target.value)} /></label>
      <ul className="mt-3 space-y-2">
        {res.map((i) => { const l = lists(i.k); return (
          <li key={i.k + i.id} className="card flex items-center justify-between gap-2 px-3 py-2"><span className="min-w-0 flex-1 truncate">{i.t}<span className="ml-2 text-xs text-ink2">{i.k === "f" ? "ingrediente" : "prato"}</span></span>
            <button className="chip !min-h-11 gap-1.5" aria-pressed={l.like.includes(i.id)} onClick={() => toggle(i.k, i.id, "like")}><ThumbsUp size={16} />Gosto</button>
            <button className="chip !min-h-11 gap-1.5" aria-pressed={l.ex.includes(i.id)} onClick={() => toggle(i.k, i.id, "ex")}><Ban size={16} />Excluir</button></li>); })}
        {q.trim().length >= 2 && !res.length && <li className="text-ink2">Nada encontrado.</li>}
      </ul>
      {chosen.length > 0 && <div className="mt-5"><p className="mb-2 text-sm font-medium">As tuas escolhas</p><div className="flex flex-wrap gap-2">
        {chosen.map((i) => <button key={i.k + i.id} className="chip !min-h-10 text-sm" onClick={() => toggle(i.k, i.id, lists(i.k).like.includes(i.id) ? "like" : "ex")} aria-label={`Remover ${i.t}`}>{lists(i.k).like.includes(i.id) ? "👍" : "🚫"} {i.t} ✕</button>)}</div></div>}
    </div>
  );
}

interface StepDef { id: string; title: string; hint?: string; body: (a: Answers, s: Set) => React.ReactNode; valid: (a: Answers) => boolean }
const num = (n: number | undefined, lo: number, hi: number) => n != null && n >= lo && n <= hi;
const STEPS: StepDef[] = [
  { id: "objective", title: "Qual é o teu objetivo?", hint: "Podes mudá-lo depois: as alterações aplicam-se à semana seguinte.", valid: (a) => !!a.objective,
    body: (a, s) => <><Choice value={a.objective} onPick={(v) => s({ objective: v })} options={[{ v: "perder", t: "Perder gordura", d: "−20 % das calorias de manutenção" }, { v: "manter", t: "Manter o peso", d: "Calorias de manutenção" }, { v: "ganhar", t: "Ganhar massa", d: "+10 % das calorias de manutenção" }, { v: "nao-sei", t: "Ainda não sei", d: "Plano equilibrado, que podes mudar depois" }]} /><div className="mt-6"><Disclaimer /></div></> },
  { id: "sex", title: "Qual é o teu sexo?", hint: "Usado só na fórmula do metabolismo basal. Fica no teu telemóvel.", valid: (a) => !!a.sex,
    body: (a, s) => <Choice value={a.sex} onPick={(v) => s({ sex: v })} options={[{ v: "f", t: "Feminino" }, { v: "m", t: "Masculino" }]} /> },
  { id: "age", title: "Que idade tens?", hint: "A MealPrep é para maiores de 13 anos.", valid: (a) => num(a.age, 13, 100), body: (a, s) => <Num value={a.age} onChange={(age) => s({ age })} min={13} max={100} unit="anos" /> },
  { id: "height", title: "Qual é a tua altura?", valid: (a) => num(a.heightCm, 120, 230), body: (a, s) => <Num value={a.heightCm} onChange={(heightCm) => s({ heightCm })} min={120} max={230} unit="cm" /> },
  { id: "weight", title: "Quanto pesas?", hint: "Os teus dados corporais não saem do dispositivo.", valid: (a) => num(a.weightKg, 30, 250), body: (a, s) => <Num value={a.weightKg} onChange={(weightKg) => s({ weightKg })} min={30} max={250} unit="kg" step={0.5} /> },
  { id: "activity", title: "Quão ativo és no dia a dia?", valid: (a) => !!a.activity,
    body: (a, s) => <Choice value={a.activity} onPick={(v) => s({ activity: v })} options={[{ v: 1.2, t: "Sedentário", d: "Trabalho sentado, pouco exercício (×1,2)" }, { v: 1.375, t: "Leve", d: "Exercício 1–3 dias por semana (×1,375)" }, { v: 1.55, t: "Moderado", d: "Exercício 3–5 dias por semana (×1,55)" }, { v: 1.725, t: "Intenso", d: "Exercício 6–7 dias por semana (×1,725)" }]} /> },
  { id: "cook", title: "Quanto queres cozinhar?", valid: () => true,
    body: (a, s) => <div className="space-y-6"><div><p className="mb-2 font-medium">Vezes por semana em que cozinhas</p><div className="flex flex-wrap gap-2.5">{[1, 2, 3, 4, 5, 6, 7].map((n) => <button key={n} className="chip w-12 justify-center" aria-pressed={a.cooksPerWeek === n} onClick={() => s({ cooksPerWeek: n })}>{n}</button>)}</div></div>
      <div><p className="mb-2 font-medium">Tempo máximo por refeição</p><div className="flex flex-wrap gap-2.5">{[15, 30, 45, 60, 90].map((n) => <button key={n} className="chip" aria-pressed={a.maxMinutes === n} onClick={() => s({ maxMinutes: n })}>{n} min</button>)}</div></div></div> },
  { id: "repetition", title: "Podes repetir o mesmo prato?", hint: "Cozinhas uma vez e comes mais vezes, dentro dos dias que aguenta no frigorífico.", valid: () => true,
    body: (a, s) => <Choice value={a.repetition} onPick={(v) => s({ repetition: v })} options={[{ v: "pouca", t: "Pouca", d: "Quase todas as refeições são pratos novos" }, { v: "media", t: "Média", d: "Cada prato come-se até 2 vezes" }, { v: "muita", t: "Muita", d: "Cada prato come-se até 3 ou 4 vezes" }]} /> },
  { id: "lunch", title: "O almoço é quente ou frio?", hint: "Se levas marmita sem micro-ondas, escolhe frio.", valid: () => true,
    body: (a, s) => <Choice value={a.lunch} onPick={(v) => s({ lunch: v })} options={[{ v: "quente", t: "Quente" }, { v: "frio", t: "Frio", d: "Saladas, sanduíches e pratos que se comem frios" }]} /> },
  { id: "equipment", title: "Que equipamento tens?", hint: "Toca para escolher um ou vários.", valid: (a) => a.equipment.length > 0, body: (a, s) => <PicGrid values={a.equipment} onChange={(equipment) => s({ equipment })} items={EQUIP.map(([v, t]) => ({ v, t, art: <EquipArt id={v} size={64} /> }))} /> },
  { id: "diet", title: "Segues alguma dieta?", valid: () => true,
    body: (a, s) => <Choice value={a.diet} onPick={(v) => s({ diet: v })} cols={2} options={[{ v: "omnivora", t: "Omnívora" }, { v: "vegetariana", t: "Vegetariana" }, { v: "vegana", t: "Vegana" }, { v: "pescetariana", t: "Pescetariana" }, { v: "lowcarb", t: "Low-carb" }]} /> },
  { id: "allergens", title: "Tens alergias ou intolerâncias?", hint: "Os 14 alergénios da UE. Nunca aparecem nos teus pratos.", valid: () => true, body: (a, s) => <Chips values={a.allergens} options={ALLERGENS} onChange={(allergens) => s({ allergens })} /> },
  { id: "likes", title: "Há algo de que gostes muito ou queiras evitar?", hint: "Opcional. Pesquisa ingredientes ou pratos.", valid: () => true, body: (a, s) => <Likes a={a} set={s} /> },
  { id: "store", title: "Onde fazes as compras?", hint: "Podes escolher mais do que uma loja. Compramos cada coisa onde sai mais barato.", valid: (a) => (a.stores?.length ?? 0) > 0,
    body: (a, s) => <PicGrid values={a.stores ?? [a.store]} onChange={(stores) => s({ stores, store: stores[0] })} items={STORES.map(([v, t]) => ({ v, t, art: <StoreArt id={v} size={64} /> }))} /> },
  { id: "budget", title: "Qual é o orçamento semanal?", hint: "Para a comida da semana, para todo o agregado.", valid: (a) => num(a.budget, 10, 1000),
    body: (a, s) => <div className="space-y-4"><Num value={a.budget} onChange={(budget) => s({ budget })} min={10} max={1000} unit="€" step={5} /><div className="flex flex-wrap gap-2">{[30, 45, 60, 80, 100, 140].map((n) => <button key={n} className="chip" aria-pressed={a.budget === n} onClick={() => s({ budget: n })}>{n} €</button>)}</div></div> },
  { id: "people", title: "Quantas pessoas no agregado?", hint: "Contigo incluído. O prato é o mesmo; as porções escalam por pessoa.", valid: () => true, body: (a, s) => <Num value={a.peopleCount} onChange={(n) => s({ peopleCount: n ?? 1 })} min={1} max={6} unit="pessoas" /> },
];

export const stepIndex = (id: string) => STEPS.findIndex((x) => x.id === id);

export function Onboarding() {
  const router = useRouter(), reduce = useReducedMotion();
  const [a, setA] = useLocal<Answers>(K.answers, DEFAULT_ANSWERS);
  const [dir, setDir] = useState(1);
  const step = Math.min(a.step, STEPS.length);
  const go = (n: number) => { setDir(n >= step ? 1 : -1); setA((p) => ({ ...p, step: n })); };
  const set: Set = (p) => setA((x) => ({ ...x, ...p }));
  const s = STEPS[step];
  const pct = (step / STEPS.length) * 100;
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-40px)] max-w-md flex-col">
      <header className="flex items-center gap-3 pb-6">
        <button className="btn btn-ghost !px-0 w-12" aria-label="Voltar" disabled={step === 0 && false} onClick={() => (step === 0 ? router.push("/") : go(step - 1))}><ArrowLeft /></button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-tint" role="progressbar" aria-label="Progresso do questionário" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
          <motion.div className="h-full w-full origin-left rounded-full bg-primary" animate={{ scaleX: (pct + (step < STEPS.length ? 100 / STEPS.length : 0)) / 100 }} transition={{ duration: 0.28, ease: EASE }} /></div>
        <span className="num w-12 text-right text-sm text-ink2">{Math.min(step + 1, STEPS.length)}/{STEPS.length}</span>
      </header>
      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.section key={step} className="flex flex-1 flex-col" custom={dir} initial="in" animate="mid" exit="out" transition={{ duration: 0.26, ease: EASE }}
          variants={{ in: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: 36 * d }), mid: { opacity: 1, x: 0 }, out: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, x: -36 * d }) }}>
          {step < STEPS.length ? (
            <>
              <h1 className="text-[28px] leading-tight">{s.title}</h1>
              {s.hint && <p className="mt-2 text-ink2">{s.hint}</p>}
              <div className="mt-6 flex-1 pb-6">{s.body(a, set)}</div>
              <div className="sticky bottom-0 -mx-1 bg-bg/90 px-1 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur">
                <button className="btn btn-primary w-full" disabled={!s.valid(a)} onClick={() => go(step + 1)}>{step === STEPS.length - 1 ? "Ver as minhas metas" : "Continuar"}</button></div>
            </>
          ) : <Metas a={a} set={set} onBack={() => go(STEPS.length - 1)} />}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}
