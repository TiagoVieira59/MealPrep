import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/server";
import { err, requireUser, today } from "@/lib/server/auth";

const USER_DAILY = 5, GLOBAL_DAILY = 200;
const result = z.object({ prato: z.string().min(1).max(120), kcal: z.number().min(0).max(5000), proteina_g: z.number().min(0).max(300), confianca: z.number().min(0).max(1) });
const schema = { type: "OBJECT", properties: { prato: { type: "STRING" }, kcal: { type: "NUMBER" }, proteina_g: { type: "NUMBER" }, confianca: { type: "NUMBER" } }, required: ["prato", "kcal", "proteina_g", "confianca"] };

export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return err("Sem sessão.", 401);
  const b = z.object({ image: z.string().min(100).max(2_000_000), mime: z.enum(["image/jpeg", "image/png", "image/webp"]) }).safeParse(await req.json().catch(() => null));
  if (!b.success) return err("Imagem inválida.");
  const sb = adminClient(), day = today();
  const u1 = await sb.rpc("bump_usage", { k: `u:${u.id}`, d: day, lim: USER_DAILY });
  if (!u1.data) return NextResponse.json({ erro: "limite", detalhe: "user" }, { status: 429 });
  const g1 = await sb.rpc("bump_usage", { k: "global", d: day, lim: GLOBAL_DAILY });
  if (!g1.data) return NextResponse.json({ erro: "limite", detalhe: "global" }, { status: 429 });
  const log = async (ok: boolean) => { await sb.from("scan_logs").insert({ user_id: u.id, ok }); await sb.from("scan_logs").delete().lt("created_at", new Date(Date.now() - 30 * 864e5).toISOString()); };
  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  try {
    // Só a imagem e o pedido seguem para a Google: nunca ID da conta, nome, email ou dispositivo.
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Identifica a refeição na fotografia. Devolve o nome do prato em português de Portugal, uma estimativa das calorias totais (kcal) e da proteína (g) da porção visível, e a tua confiança de 0 a 1. Responde apenas em JSON." }, { inline_data: { mime_type: b.data.mime, data: b.data.image } }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!r.ok) throw new Error("gemini " + r.status);
    const j = await r.json();
    const parsed = result.parse(JSON.parse(j.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"));
    await log(true);
    return NextResponse.json({ ...parsed, kcal: Math.round(parsed.kcal), proteina_g: Math.round(parsed.proteina_g), estimativa: "estimativa da IA" });
  } catch {
    await log(false);
    return NextResponse.json({ erro: "ia" }, { status: 502 });
  }
}
