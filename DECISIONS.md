# DECISIONS
- Next 16.4 (create-next-app): desligado cacheComponents/partialPrefetching para manter rotas simples e dinâmicas.
- URL de produção público: mealprep-silk.vercel.app (os URLs por deployment pedem login Vercel).
- Sem tabela plan_meal_overrides: trocas/fora/"eu trato" ficam no JSON do plano (plans.plan) — mais simples e atómico.
- Sugestões e candidaturas de criadores escrevem-se por route handlers (service role); RLS só permite leitura própria.
- Medidas corporais só em localStorage; o servidor recebe metas, objetivo e preferências.
- USDA_API_KEY no .env.local é a DEMO_KEY (10 pedidos/h, esgotada). Dados gerados a partir do CSV público SR Legacy (sem chave); só SR Legacy (sem Foundation). 131 alimentos em vez de ~170; 65 receitas (20 pequenos-almoços, 45 refeições).
- "Chouriço" usa o registo USDA de chorizo (Sausage, pork, chorizo); "Bacalhau" = bacalhau cru demolhado (Fish, cod, Atlantic, raw).
- Preços: €/kg base + fator por supermercado (estimativa), embalagens comuns; sem packs = a granel (arredonda a 100 g).
- Alimentos enlatados (grão, feijão, atum, sardinha) pesam-se como vendidos/escorridos.
