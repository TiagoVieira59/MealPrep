import { NextResponse } from "next/server";
import { adminClient } from "@/lib/supabase/server";
import { err, requireUser } from "@/lib/server/auth";

/** Apaga os dados e o utilizador (as tabelas têm ON DELETE CASCADE). */
export async function DELETE() {
  const u = await requireUser(); if (!u) return err("Sem sessão.", 401);
  const { error } = await adminClient().auth.admin.deleteUser(u.id);
  if (error) return err("Não foi possível eliminar a conta.", 500);
  return NextResponse.json({ ok: true });
}
