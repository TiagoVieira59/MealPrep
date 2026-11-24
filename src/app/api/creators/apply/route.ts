import { NextResponse } from "next/server";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/server";
import { err } from "@/lib/server/auth";

const b = z.object({
  name: z.string().trim().min(2).max(80), email: z.string().trim().email().max(120), country: z.string().trim().min(2).max(60),
  tiktok: z.string().trim().min(2).max(60), links: z.string().trim().max(500).optional(),
  availability: z.enum(["agora", "1-2 semanas", "mais de 3 semanas"]), website: z.string().max(0).optional(), // armadilha anti-spam
});
export async function POST(req: Request) {
  const p = b.safeParse(await req.json().catch(() => null)); if (!p.success) return err("Verifica os campos do formulário.");
  const sb = adminClient(), { website: _w, ...row } = p.data; void _w;
  const { count } = await sb.from("creator_applications").select("*", { count: "exact", head: true }).eq("email", row.email).eq("status", "pending");
  if ((count ?? 0) === 0) await sb.from("creator_applications").insert(row);
  return NextResponse.json({ ok: true });
}
