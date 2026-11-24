# MealPrep — design
Identidade própria: papel quente, verde-pinheiro, toques de paprika. Mobile-first; ecrãs largos têm layout próprio (Semana em grelha, Receita em 2 colunas, nav lateral).

## Tipografia
Títulos: Fraunces (serifa suave, 600). Corpo/UI: Figtree. Números: `tabular-nums`. Escala: 12/14/16/20/28/40. Corpo ≥16px (evita zoom iOS em inputs).

## Cor (tokens CSS)
Claro: fundo #FAF6EE · superfície #FFFFFF · tinta #1E2923 · tinta-2 #55615A · linha #E6DFD1 · primária (pinheiro) #1F6A55 · primária-texto #FFFFFF · proteína (paprika) #C2501F · kcal (açafrão) #B07A10 · ok #1F6A55 · aviso #A65A00 · erro #B3261E.
Escuro: fundo #121714 · superfície #1B221E · tinta #EEF1EC · tinta-2 #A3AEA6 · linha #2C3630 · primária #5CC2A0 · proteína #F08A5B · kcal #E3B04B.
Contraste AA verificado em texto e controlos.

## Espaçamento e forma
Grelha de 4px; páginas com padding 20px. Raios: 12 (controlos), 20 (cartões), 999 (pílulas). Sombras mínimas; separar por linha e superfície.

## Componentes
Botão primário (pinheiro, 48px alto), secundário (contorno), pílula de escolha (≥44px), cartão de refeição, barra de progresso (kcal/proteína, com marca da banda), folha inferior (trocar), nav inferior de 4 itens (ícone+rótulo, 56px), etiqueta "estimativa". Ícones: lucide-react, traço 1.75.

## Ilustrações
Sem imagens de IA. Cada receita tem uma categoria visual (ovos, sopa, peixe, carne, massa/arroz, leguminosas, salada, iogurte/fruta, pão, tosta…) → disco com cor própria + ícone lucide grande + 2 formas SVG decorativas. Mesmo estilo em todas.

## Movimento (Motion)
Curvas: ease-out `cubic-bezier(.22,1,.36,1)`. Duração: toques 120–180ms; transições de ecrã 280ms; barras a encher 600ms. Onboarding: deslize horizontal entre perguntas (direção segue frente/trás). Geração: etapas em sequência com visto. Dia cumprido: visto com pequena escala (spring). Folha de troca: sobe de baixo, fundo esmaece. Botões: `scale(.97)` no :active. Só `transform`/`opacity`. `prefers-reduced-motion`: sem deslocamentos, só fades curtos.

## Mobile
Safe areas (`env(safe-area-inset-*)`), `100dvh`, alvos ≥44px, `-webkit-tap-highlight-color: transparent`, hover só em `@media (hover:hover)`, inputs 16px, `touch-action: manipulation`.
