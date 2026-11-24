import "server-only";
import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/supabase/server";

export const err = (msg: string, status = 400) => NextResponse.json({ erro: msg }, { status });
export async function requireUser() { return currentUser(); }
export const hmac = (data: string) => createHmac("sha256", process.env.HOUSEHOLD_CODE_SECRET!).update(data).digest("hex");
export async function adminUser() {
  const u = await currentUser();
  const a = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return u && !u.is_anonymous && a && u.email?.toLowerCase() === a ? u : null;
}
export const today = () => new Date().toISOString().slice(0, 10);
