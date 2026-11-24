import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { z } from "zod";
import { adminClient } from "@/lib/supabase/server";
import { adminUser, err, today } from "@/lib/server/auth";

const op = z.discriminatedUnion("op", [
  z.object({ op: z.literal("overview") }),
  z.object({ op: z.literal("chat.list") }),
  z.object({ op: z.literal("chat.thread"), user: z.string().uuid() }),
  z.object({ op: z.literal("chat.reply"), user: z.string().uuid(), body: z.string().trim().min(1).max(2000) }),
  z.object({ op: z.literal("sug.list") }),
  z.object({ op: z.literal("sug.set"), id: z.string().uuid(), action: z.enum(["approve", "reject", "unhide", "hide"]) }),
  z.object({ op: z.literal("cre.list") }),
  z.object({ op: z.literal("cre.approve"), id: z.string().uuid() }),
  z.object({ op: z.literal("cre.reject"), id: z.string().uuid() }),
  z.object({ op: z.literal("cre.code"), id: z.string().uuid(), active: z.boolean() }),
]);
const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export async function POST(req: Request) {
  if (!(await adminUser())) return err("Sem acesso.", 403);
  const p = op.safeParse(await req.json().catch(() => null)); if (!p.success) return err("Pedido inválido.");
  const sb = adminClient(), d = p.data;
  switch (d.op) {
    case "overview": {
      const cnt = async (t: string) => (await sb.from(t).select("*", { count: "exact", head: true })).count ?? 0;
      const g = await sb.from("ai_usage").select("count").eq("key", "global").eq("day", today()).maybeSingle();
      const users = await sb.auth.admin.listUsers({ page: 1, perPage: 1 });
      return NextResponse.json({ contas: (users.data as unknown as { total?: number })?.total ?? (await cnt("profiles")), semanas: await cnt("plans"), scansHoje: g.data?.count ?? 0 });
    }
    case "chat.list": {
      const { data } = await sb.from("chat_messages").select("user_id,from_admin,body,read,created_at").order("created_at", { ascending: false }).limit(500);
      const by = new Map<string, { user: string; last: string; at: string; fromAdmin: boolean; unread: number }>();
      for (const m of data ?? []) { const x = by.get(m.user_id) ?? { user: m.user_id, last: m.body, at: m.created_at, fromAdmin: m.from_admin, unread: 0 }; if (!m.from_admin && !m.read) x.unread++; by.set(m.user_id, x); }
      return NextResponse.json({ items: [...by.values()] });
    }
    case "chat.thread": {
      const { data } = await sb.from("chat_messages").select("id,from_admin,body,created_at").eq("user_id", d.user).order("created_at");
      await sb.from("chat_messages").update({ read: true }).eq("user_id", d.user).eq("from_admin", false);
      return NextResponse.json({ items: data ?? [] });
    }
    case "chat.reply": await sb.from("chat_messages").insert({ user_id: d.user, from_admin: true, body: d.body }); return NextResponse.json({ ok: true });
    case "sug.list": {
      const [{ data: s }, { data: r }] = await Promise.all([sb.from("suggestions").select("id,title,description,status,hidden,created_at").order("created_at", { ascending: false }).limit(200), sb.from("suggestion_reports").select("suggestion_id")]);
      return NextResponse.json({ items: (s ?? []).map((x) => ({ ...x, reports: (r ?? []).filter((q) => q.suggestion_id === x.id).length })) });
    }
    case "sug.set": {
      const patch = d.action === "approve" ? { status: "approved", hidden: false } : d.action === "reject" ? { status: "rejected" } : d.action === "unhide" ? { hidden: false } : { hidden: true };
      if (d.action === "unhide") await sb.from("suggestion_reports").delete().eq("suggestion_id", d.id);
      await sb.from("suggestions").update(patch).eq("id", d.id); return NextResponse.json({ ok: true });
    }
    case "cre.list": {
      const [{ data: a }, { data: c }, { data: r }] = await Promise.all([sb.from("creator_applications").select("*").order("created_at", { ascending: false }).limit(200), sb.from("creator_codes").select("*").order("created_at", { ascending: false }), sb.from("creator_redemptions").select("code_id")]);
      return NextResponse.json({ applications: a ?? [], codes: (c ?? []).map((x) => ({ ...x, uses: (r ?? []).filter((q) => q.code_id === x.id).length })) });
    }
    case "cre.approve": {
      const { data: a } = await sb.from("creator_applications").select("id,tiktok,name").eq("id", d.id).maybeSingle(); if (!a) return err("Não encontrada.", 404);
      const base = (a.tiktok || a.name).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 8) || "CRIADOR";
      const code = `${base}${Array.from({ length: 3 }, () => ALPHA[randomInt(ALPHA.length)]).join("")}`;
      await sb.from("creator_applications").update({ status: "approved" }).eq("id", d.id);
      await sb.from("creator_codes").insert({ code, application_id: d.id });
      return NextResponse.json({ code });
    }
    case "cre.reject": await sb.from("creator_applications").update({ status: "rejected" }).eq("id", d.id); return NextResponse.json({ ok: true });
    case "cre.code": await sb.from("creator_codes").update({ active: d.active }).eq("id", d.id); return NextResponse.json({ ok: true });
  }
}
