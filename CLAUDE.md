# MealPrep — notas para o Claude
PWA PT-PT: planeia a semana de refeições dentro de um orçamento, com proteína mínima e banda de kcal por dia. Contas à vista.

## Comandos
- `npm run dev` · `npm run build` · `npm start` (porta 3000) · `npm run lint`
- `npm test` = vitest (motor, dados) · `npx tsx scripts/test-rls.ts` = prova de RLS
- `npx tsx scripts/build-foods.ts` regenera data/foods.json (USDA)
- `npx supabase db push` aplica supabase/migrations
- `bash scripts/push-env.sh` envia .env.local para o Vercel (sem imprimir valores)
- `node scripts/check-env.mjs` mostra NOME=ok/em falta

## Estrutura
- `src/app` rotas (App Router) · `src/app/api` route handlers · `src/lib/engine` motor puro (seed)
- `src/lib/supabase` clientes · `src/components` UI · `data/*.json` dados · `scripts/` geradores
- PRODUCT.md, DESIGN.md (lê antes de UI) · DECISIONS.md · PROGRESS.md (retomar daqui)

## Regras essenciais
1. Nunca ler/imprimir .env.local; segredos só no servidor; nunca commit de .env*.
2. UI e commits em PT-PT (ecrã, telemóvel, guardar, utilizador).
3. Nutrição = aritmética sobre data/foods.json. IA só no Scan (etiqueta "estimativa da IA"). Preços = "estimativa".
4. Medidas corporais só em localStorage; servidor recebe metas e preferências.
5. Sem pagamentos, anúncios, analytics, Sign in with Apple.
6. Uma fase de cada vez: build+testes verdes → commit → push → PROGRESS.md.
7. Saídas curtas: `vitest --reporter=dot`, `| tail -n 30`. Não ler lockfiles/dados grandes.
8. Screenshots/inspeção só nos subagentes qa-visual e critico-design.
