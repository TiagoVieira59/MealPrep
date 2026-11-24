// Imprime só NOME=ok ou NOME=em falta; nunca valores.
import fs from "node:fs";
const names = ["NEXT_PUBLIC_SUPABASE_URL","NEXT_PUBLIC_SUPABASE_ANON_KEY","SUPABASE_SERVICE_ROLE_KEY","GEMINI_API_KEY","HOUSEHOLD_CODE_SECRET","ADMIN_EMAIL","USDA_API_KEY"];
const env = {};
try { for (const l of fs.readFileSync(".env.local","utf8").split("\n")) { const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g,""); } } catch { console.log(".env.local=em falta"); }
for (const n of names) console.log(`${n}=${env[n] ? "ok" : "em falta"}`);
