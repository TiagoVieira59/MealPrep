import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePlan, ENGINE_VERSION } from "@/lib/engine";
import { adminClient, currentUser } from "@/lib/supabase/server";
import { FOOD, RECIPE } from "@/lib/engine";

const person = z.object({ id: z.string().max(40), name: z.string().max(40).optional(), kcal: z.number().min(800).max(6000), protein: z.number().min(20).max(400) });
const body = z.object({
  seed: z.number().int().min(0).max(2 ** 31),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  householdId: z.string().uuid().optional(),
  prefs: z.object({
    diet: z.enum(["omnivora", "vegetariana", "vegana", "pescetariana", "lowcarb"]),
    allergens: z.array(z.string()).max(14), excludedFoods: z.array(z.string()).max(200), excludedRecipes: z.array(z.string()).max(200),
    likedFoods: z.array(z.string()).max(200), likedRecipes: z.array(z.string()).max(200),
    equipment: z.array(z.enum(["fogao", "forno", "microondas", "airfryer", "robo", "liquidificadora"])),
    cooksPerWeek: z.number().int().min(1).max(7), maxMinutes: z.number().min(10).max(180),
    repetition: z.enum(["pouca", "media", "muita"]), lunch: z.enum(["quente", "frio"]),
    store: z.enum(["continente", "pingo-doce", "lidl", "mercadona", "aldi", "intermarche"]),
    budget: z.number().min(5).max(2000), people: z.array(person).min(1).max(8),
  }),
  objective: z.string().optional(),
});

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ erro: "Pedido inválido." }, { status: 400 });
  const { prefs, seed, weekStart, objective } = parsed.data;
  prefs.excludedFoods = prefs.excludedFoods.filter((f) => FOOD.has(f)); prefs.excludedRecipes = prefs.excludedRecipes.filter((r) => RECIPE.has(r));
  const plan = generatePlan(prefs as Parameters<typeof generatePlan>[0], seed, weekStart);
  // Guarda no Supabase (sem medidas corporais: só metas, objetivo e preferências).
  const user = await currentUser();
  let rowId: string | null = null;
  if (user) {
    try {
      const sb = adminClient();
      await sb.from("profiles").upsert({ user_id: user.id, objective: objective ?? null, kcal: prefs.people[0].kcal, protein: prefs.people[0].protein, prefs });
      let hh: string | null = null;
      if (parsed.data.householdId) { const { data: m } = await sb.from("household_members").select("household_id").eq("user_id", user.id).eq("household_id", parsed.data.householdId).maybeSingle(); hh = m?.household_id ?? null; }
      const { data: row } = await sb.from("plans").insert({ user_id: user.id, household_id: hh, week_start: weekStart, plan, seed, engine_version: ENGINE_VERSION }).select("id").single();
      rowId = row?.id ?? null;
    } catch { /* offline do servidor: o plano continua a funcionar localmente */ }
  }
  return NextResponse.json({ plan, rowId });
}
