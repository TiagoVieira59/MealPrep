// Gera data/prices.pt.json. Valores APROXIMADOS (€ por kg ou L) e embalagens reais comuns. Sem packs = vendido a granel (arredonda a 100 g).
import fs from "node:fs";
const T = `
frango-peito 7 500,1000|frango-coxa 3.5 1000|peru-peito 9 500|porco-lombo 7 500,1000|porco-picado 6 500|vaca-picada 9.5 500|vaca-bife 16 400|presunto 17 100,200|chourico 11 200
salmao 16 400|bacalhau 12 500|pescada 9 800|robalo 13 500|cavala 7 500|tilapia 8 500|atum-lata 14 120|sardinha-lata 15 120|camarao 14 500|polvo 13 1000|lulas 10 500|mexilhao 6 1000
ovo 4.2 360,720|leite-meio-gordo 0.95 1000|leite-magro 0.95 1000|iogurte-grego 3.2 500|iogurte-natural 1.9 500|queijo-cottage 5.5 200|requeijao 6.5 200|queijo-flamengo 8.5 200|mozzarella 7.5 125,250|parmesao 20 100|manteiga 8 250|natas 2.6 200|bebida-soja 1.4 1000|bebida-amendoa 2 1000
grao-seco 2.2 500|grao-lata 2.6 265|feijao-preto 2.6 500|feijao-encarnado 2.5 500|feijao-encarnado-lata 2.6 250|feijao-frade 2.8 500|feijao-branco 2.5 500|lentilhas 2.6 500|ervilhas-cong 2.2 450,1000|favas 4 500|tofu 7 250|tremocos 3 500|amendoim 6 250|manteiga-amendoim 6.5 350
arroz 1.5 1000|arroz-integral 2.4 1000|esparguete 1.4 500|massa-integral 1.8 500|aveia 2.4 500|pao-trigo 3 400|pao-integral 3.8 400|pao-centeio 4.5 400|tortilha 5 320|cuscuz 2.3 500|quinoa 6 500|farinha-trigo 1.1 1000|fuba 1.6 500
batata 1.1 |batata-doce 2.2 |cebola 1.3 |alho 6 |tomate 2.6 |cenoura 1.2 |courgette 2.2 |pimento-vermelho 3.5 |pimento-verde 2.8 |alface 3 300|espinafres 5 250|brocolos 3.2 |couve-flor 2.5 |couve-galega 2 |repolho 1.2 |abobora 1.4 |beringela 2.6 |cogumelos 5.5 250|pepino 1.6 |alho-frances 2.4 |feijao-verde 4.5 |grelos 3.5 |nabo 1.5 |beterraba 1.8 |aipo 2 |rucula 8 100
tomate-triturado 1.6 400|concentrado-tomate 4 70|legumes-cong 2 1000|espinafres-cong 2.4 450
banana 1.6 |maca 2 |laranja 1.6 |pera 2.2 |morangos 5.5 250,500|kiwi 3.5 500|melao 1.5 |ananas 1.6 |mirtilos 14 125,250|abacate 6 |tangerina 2.2 |pessego 3 |uvas-passas 7 250|limao 2.5 500
amendoas 14 200|nozes 14 200|caju 16 200|chia 12 200|girassol 8 250|sesamo 8 200|linhaca 5 250|pinhoes 70 100
azeite 7.5 750,1000|oleo-girassol 1.9 1000|mel 9 500|acucar 1.2 1000|mostarda 4.5 250|salsa 15 50|coentros 15 50|manjericao 25 30|gengibre 6 200|colorau 25 80|oregaos 30 20|canela 40 40|molho-soja 5.5 250|chocolate-negro 14 100|cacau 14 200|leite-coco 3.5 400|azeitonas 5 350
`.trim().split(/\n|\|/);
const items: Record<string, { perKg: number; packs: number[] }> = {};
for (const e of T) { const [id, p, packs] = e.trim().split(" "); items[id] = { perKg: +p, packs: packs ? packs.split(",").map(Number) : [] }; }
const stores = { continente: ["Continente", 1], "pingo-doce": ["Pingo Doce", 0.99], lidl: ["Lidl", 0.9], mercadona: ["Mercadona", 0.92], aldi: ["Aldi", 0.9], intermarche: ["Intermarché", 0.97] } as const;
fs.writeFileSync("data/prices.pt.json", JSON.stringify({
  updated: "2026-11-24", note: "Valores aproximados, não são preços em tempo real. Preço por kg ou L; cada supermercado aplica um fator estimado.",
  stores: Object.fromEntries(Object.entries(stores).map(([k, [name, factor]]) => [k, { name, factor }])), items,
}));
console.log(Object.keys(items).length, "preços");
