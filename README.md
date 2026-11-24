# MealPrep

Produção: **https://mealprep-silk.vercel.app**

PWA em PT-PT que planeia uma semana de refeições reais dentro de um orçamento, com proteína mínima e banda de calorias por dia. Os números são aritmética sobre dados públicos da USDA (SR Legacy, CC0), mostrados linha a linha em «Como calculamos isto». Sem pagamentos, anúncios ou analytics.

## O que faz
Questionário (16 perguntas) → metas com a conta à vista (Mifflin–St Jeor) → semana validada dia a dia (Hoje, Semana, Receita, Lista), trocas com pré-visualização do impacto, comer fora, «eu trato desta», agregado com código, Scan the Plate (Gemini, «estimativa da IA»), chat de apoio, sugestões, criadores e /admin. As medidas corporais ficam só no dispositivo.

## Instalar a PWA
- **Android (Chrome):** menu ⋮ → «Instalar aplicação».
- **iOS (Safari):** Partilhar → «Adicionar ao ecrã principal».
A última semana abre sem rede.

## Admin
Em Tu → Conta, acrescenta o email igual a `ADMIN_EMAIL` (e uma palavra-passe) e entra; aparece «Administração» em Tu (/admin).

## Login com Google
Preparado mas desligado: `NEXT_PUBLIC_GOOGLE_LOGIN=1` mostra o botão; exige configurar o fornecedor Google no Supabase.

## Limites dos planos gratuitos
- Vercel Hobby: só uso pessoal e não comercial.
- Supabase gratuito: o projeto pausa após 1 semana sem atividade; reativa-se no dashboard. Com «Confirm email» ligado, o email da conta só fica ativo após confirmação.
- Gemini gratuito: quota diária; a app limita a 5 scans por utilizador/dia e 200 globais (tabela `ai_usage`) e oferece sempre a alternativa manual.

## Desenvolver
`npm i` · `.env.local` com os nomes de `.env.example` · `npm run dev` · `npm test` · `npx tsx scripts/test-rls.ts` · `npx supabase db push --remote` · `bash scripts/push-env.sh`. Dados: `scripts/build-foods.ts` (CSV SR Legacy), `build-recipes.ts`, `build-prices.ts`. Ver CLAUDE.md, DECISIONS.md e PROGRESS.md.
