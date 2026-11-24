import { NextResponse } from "next/server";
import { z } from "zod";
import { buildHousehold } from "@/lib/server/household";
import { err, requireUser } from "@/lib/server/auth";

const body = z.object({ seed: z.number().int().min(0).max(2 ** 31), weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });
export async function POST(req: Request) {
  const u = await requireUser(); if (!u) return err("Sem sessão.", 401);
  const p = body.safeParse(await req.json().catch(() => null)); if (!p.success) return err("Pedido inválido.");
  const r = await buildHousehold(u.id, p.data.seed, p.data.weekStart);
  if ("error" in r) return err(r.error, r.status);
  return NextResponse.json(r);
}
