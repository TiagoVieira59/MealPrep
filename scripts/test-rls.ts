// Prova de RLS: dois utilizadores anónimos; um não lê os dados do outro.
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env";
loadEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const mk = () => createClient(url, anon, { auth: { persistSession: false } });
async function user() {
  const c = mk();
  const { data, error } = await c.auth.signInAnonymously();
  if (error || !data.user) throw new Error("signInAnonymously falhou: " + error?.message);
  return { c, id: data.user.id };
}
let fail = 0;
const check = (n: string, ok: boolean) => { console.log(`${ok ? "ok " : "FALHA"} ${n}`); if (!ok) fail++; };
async function main() {
const a = await user(), b = await user();
try {
  check("A cria perfil", !(await a.c.from("profiles").insert({ user_id: a.id, kcal: 2000, protein: 120 })).error);
  check("B não escreve perfil de A", !!(await b.c.from("profiles").insert({ user_id: a.id })).error);
  check("B não lê perfil de A", ((await b.c.from("profiles").select("*").eq("user_id", a.id)).data ?? []).length === 0);
  check("A cria plano", !(await a.c.from("plans").insert({ user_id: a.id, week_start: "2026-01-05", plan: {}, seed: 1, engine_version: 1 })).error);
  check("B não lê planos de A", ((await b.c.from("plans").select("id")).data ?? []).length === 0);
  check("A envia mensagem", !(await a.c.from("chat_messages").insert({ user_id: a.id, body: "olá" })).error);
  check("A não finge ser admin", !!(await a.c.from("chat_messages").insert({ user_id: a.id, body: "x", from_admin: true })).error);
  check("B não lê chat de A", ((await b.c.from("chat_messages").select("id")).data ?? []).length === 0);
  check("A cria sugestão (insert direto bloqueado)", !!(await a.c.from("suggestions").insert({ author: a.id, author_key: "k", title: "abc", description: "abc" })).error);
  check("B não lê creator_codes", ((await b.c.from("creator_codes").select("id")).data ?? []).length === 0);
  check("B não lê ai_usage", ((await b.c.from("ai_usage").select("key")).data ?? []).length === 0);
} finally {
  // limpeza com service role
  const s = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  await s.auth.admin.deleteUser(a.id); await s.auth.admin.deleteUser(b.id);
}
}
main().then(() => process.exit(fail ? 1 : 0), (e) => { console.error(e.message); process.exit(1); });
