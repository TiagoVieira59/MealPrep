// Gera data/recipes.json. Alergénios e dietas NÃO se escrevem aqui: o motor deriva-os dos ingredientes.
// id|nome|tipo(p=pequeno-almoço,r=refeição)|minutos|equipamento|q/f|dias frigorífico|categoria|alimento:g,...|passos separados por ;
import fs from "node:fs";
const R = `
omelete-queijo|Omelete de queijo com tosta|p|10|fogao|q|0|ovos|ovo:120,queijo-flamengo:20,tomate:80,pao-integral:60,azeite:5|Bate os ovos com o queijo ralado;Aquece o azeite e cozinha a omelete 3 minutos de cada lado;Serve com o tomate às rodelas e o pão
ovos-mexidos-tosta|Ovos mexidos com tosta|p|10|fogao|q|0|ovos|ovo:120,pao-integral:60,azeite:6,tomate:60|Bate os ovos;Mexe em lume brando com o azeite até ficarem cremosos;Serve sobre o pão torrado com tomate
iogurte-aveia-fruta|Iogurte grego com aveia e banana|p|5||f|0|iogurte|iogurte-grego:200,aveia:40,banana:100,nozes:10,mel:8|Põe o iogurte numa taça;Junta a aveia, a banana às rodelas e as nozes;Finaliza com o mel
papas-aveia|Papas de aveia com maçã e canela|p|10|fogao,microondas|q|0|aveia|aveia:50,leite-meio-gordo:250,maca:100,canela:2,uvas-passas:10|Aquece a aveia com o leite 5 minutos, a mexer;Junta a maçã ralada e a canela;Serve com as passas
tosta-queijo-fresco|Tosta de queijo fresco e tomate|p|5||f|0|tosta|pao-integral:70,queijo-cottage:120,tomate:80,azeite:5|Torra o pão;Barra com o queijo fresco;Junta o tomate e um fio de azeite
tosta-atum|Tosta de atum com tomate|p|5||f|0|tosta|pao-trigo:60,atum-lata:60,tomate:80,azeite:4|Escorre o atum;Põe sobre o pão com o tomate;Tempera com azeite
batido-banana-proteina|Batido de banana e iogurte|p|5|liquidificadora|f|0|batido|leite-magro:250,banana:120,iogurte-grego:150,aveia:30,manteiga-amendoim:15|Põe tudo na liquidificadora;Bate 40 segundos;Serve de imediato
tosta-abacate-ovo|Tosta de abacate com ovo|p|10|fogao|q|0|tosta|pao-integral:70,abacate:70,ovo:60,limao:5|Coze o ovo (estrelado ou escalfado);Esmaga o abacate com o limão;Monta sobre o pão torrado
requeijao-mel|Pão de centeio com requeijão e mel|p|5||f|0|tosta|pao-centeio:60,requeijao:100,mel:10,nozes:15|Barra o pão com o requeijão;Junta as nozes partidas;Regue com mel
panquecas-aveia|Panquecas de aveia e banana|p|15|fogao|q|0|aveia|aveia:60,ovo:100,banana:100,leite-meio-gordo:50,azeite:4|Tritura a aveia e mistura com o ovo, a banana e o leite;Cozinha porções numa frigideira antiaderente;Serve com fruta
bowl-iogurte-frutos|Taça de iogurte com mirtilos e amêndoas|p|5||f|0|iogurte|iogurte-natural:250,mirtilos:80,amendoas:20,chia:8|Põe o iogurte na taça;Junta os mirtilos;Termina com as amêndoas e a chia
tosta-presunto-queijo|Tosta mista de presunto|p|8|forno,microondas|q|0|tosta|pao-trigo:70,presunto:30,queijo-flamengo:25,tomate:60|Monta o pão com o presunto e o queijo;Aquece até o queijo derreter;Serve com tomate
omelete-espinafres|Omelete de espinafres e mozzarella|p|10|fogao|q|0|ovos|ovo:150,espinafres:80,mozzarella:30,azeite:5|Salteia os espinafres no azeite;Junta os ovos batidos;Coloca a mozzarella e dobra a omelete
pudim-chia|Pudim de chia com morangos|p|5||f|3|iogurte|chia:30,leite-meio-gordo:200,mel:8,morangos:100|Mistura a chia com o leite e o mel;Deixa no frigorífico de um dia para o outro;Serve com os morangos
tofu-mexido|Tofu mexido com tosta|p|12|fogao|q|0|ovos|tofu:150,pao-integral:70,tomate:80,azeite:8,colorau:1|Esfarela o tofu e salteia no azeite com colorau;Junta o tomate picado;Serve com o pão torrado
papas-aveia-soja|Papas de aveia com bebida de soja|p|10|fogao,microondas|q|0|aveia|aveia:50,bebida-soja:250,banana:100,amendoas:15|Aquece a aveia com a bebida de soja 5 minutos;Junta a banana às rodelas;Termina com as amêndoas
tosta-amendoim-banana|Tosta de manteiga de amendoim e banana|p|5||f|0|tosta|pao-integral:70,manteiga-amendoim:25,banana:100|Torra o pão;Barra com a manteiga de amendoim;Cobre com a banana às rodelas
wrap-ovo|Wrap de ovo e rúcula|p|10|fogao|q|0|wrap|tortilha:60,ovo:100,queijo-flamengo:20,rucula:20|Faz uma omelete fina;Coloca na tortilha com o queijo e a rúcula;Enrola e corta ao meio
iogurte-kiwi|Iogurte grego com kiwi e linhaça|p|5||f|0|iogurte|iogurte-grego:250,kiwi:100,aveia:25,linhaca:8|Põe o iogurte na taça;Junta o kiwi às rodelas;Polvilha a aveia e a linhaça
overnight-oats|Aveia de véspera com morangos|p|5||f|3|aveia|aveia:50,iogurte-natural:150,leite-meio-gordo:100,morangos:80,chia:8|Mistura tudo num frasco;Deixa no frigorífico de um dia para o outro;Come frio
ovos-abacate-fruta|Ovos com abacate e laranja|p|10|fogao|q|0|ovos|ovo:150,abacate:80,laranja:150,azeite:5|Cozinha os ovos (mexidos ou estrelados) no azeite;Serve com o abacate às fatias;Acompanha com a laranja
batido-fruta-amendoa|Batido de fruta com bebida de amêndoa|p|5|liquidificadora|f|0|batido|bebida-amendoa:250,banana:120,morangos:100,chia:15,amendoas:15|Põe tudo na liquidificadora;Bate 40 segundos;Serve de imediato
papas-quinoa|Papas de quinoa com maçã|p|15|fogao|q|2|aveia|quinoa:50,bebida-amendoa:200,maca:100,canela:2,nozes:15|Cozinha a quinoa na bebida de amêndoa 12 minutos;Junta a maçã ralada e a canela;Termina com as nozes
omelete-legumes-laranja|Omelete de cogumelos com laranja|p|12|fogao|q|0|ovos|ovo:150,cogumelos:80,pimento-vermelho:50,azeite:6,laranja:150|Salteia os cogumelos e o pimento;Junta os ovos batidos e cozinha;Serve com a laranja
frango-grelhado-arroz|Frango grelhado com arroz e brócolos|r|30|fogao|q|3|ave|frango-peito:150,arroz:70,brocolos:120,azeite:10,alho:5|Coze o arroz;Tempera o frango com alho e grelha 6 minutos de cada lado;Coze os brócolos a vapor e serve tudo com azeite
frango-forno-batata|Coxas de frango no forno com batata|r|55|forno|q|3|ave|frango-coxa:200,batata:200,cenoura:80,azeite:10,colorau:3|Tempera as coxas com colorau e azeite;Dispõe com a batata e a cenoura num tabuleiro;Assa 45 minutos a 200 °C
arroz-frango|Arroz de frango com ervilhas|r|40|fogao|q|3|arroz|frango-peito:120,arroz:70,cebola:50,tomate:80,azeite:10,ervilhas-cong:40|Refoga a cebola e o tomate no azeite;Junta o frango em cubos e dourá-lo;Adiciona o arroz, a água e as ervilhas e cozinha 15 minutos
frango-curry-coco|Curry de frango com leite de coco|r|35|fogao|q|3|ave|frango-peito:150,leite-coco:50,arroz:70,cebola:60,pimento-vermelho:60|Salteia a cebola e o pimento;Junta o frango em tiras e o leite de coco;Cozinha 12 minutos e serve com arroz
wrap-atum|Wrap de atum e alface|r|10||f|0|wrap|tortilha:80,atum-lata:80,alface:30,tomate:60,iogurte-grego:30|Mistura o atum com o iogurte;Coloca na tortilha com a alface e o tomate;Enrola e corta ao meio
peru-massa-legumes|Massa com peru e legumes salteados|r|25|fogao|q|3|massa|peru-peito:140,esparguete:70,courgette:100,pimento-vermelho:60,azeite:10|Coze a massa;Salteia o peru em tiras com os legumes;Mistura tudo com o azeite
airfryer-frango-batata-doce|Frango e batata-doce na air fryer|r|30|airfryer|q|3|ave|frango-peito:150,batata-doce:200,brocolos:100,azeite:8|Corta o frango e a batata-doce em pedaços;Tempera com azeite e sal;Air fryer 20 minutos a 190 °C com os brócolos nos últimos 8
bifana-pao|Bifanas no pão|r|20|fogao|q|1|carne|porco-lombo:140,pao-trigo:60,mostarda:5,azeite:8,alho:5|Marina o lombo em fatias com alho;Grelha 3 minutos de cada lado;Serve no pão com mostarda
esparguete-bolonhesa|Esparguete à bolonhesa|r|35|fogao|q|3|massa|vaca-picada:120,esparguete:80,tomate-triturado:150,cebola:50,cenoura:40,azeite:8|Refoga a cebola e a cenoura ralada;Junta a carne e depois o tomate, cozinha 20 minutos;Serve sobre o esparguete cozido
hamburguer-caseiro|Hambúrguer caseiro com salada|r|20|fogao|q|1|carne|vaca-picada:150,pao-trigo:60,alface:30,tomate:60,queijo-flamengo:20|Molda e grelha o hambúrguer 4 minutos de cada lado;Coloca o queijo no fim;Monta no pão com alface e tomate
almondegas-arroz|Almôndegas com arroz de tomate|r|40|fogao|q|3|carne|porco-picado:120,arroz:70,tomate-triturado:120,cebola:40,ovo:20,azeite:8|Mistura a carne com o ovo e molda;Refoga a cebola e junta o tomate;Cozinha as almôndegas no molho e serve com o arroz
feijoada-light|Feijoada leve à portuguesa|r|45|fogao|q|4|leguminosas|feijao-encarnado-lata:150,chourico:30,porco-lombo:80,cenoura:50,couve-galega:60,arroz:50|Refoga o chouriço e o lombo em cubos;Junta a cenoura, o feijão e água;Cozinha 25 minutos, acrescenta a couve e serve com arroz
massa-atum|Massa com atum e tomate|r|20|fogao|q|3|massa|esparguete:80,atum-lata:80,tomate-triturado:100,azeitonas:10,cebola:40|Coze a massa;Refoga a cebola e junta o tomate e o atum;Mistura com a massa e as azeitonas
tortilha-espanhola|Tortilha de batata|r|35|fogao|q|2|ovos|ovo:200,batata:200,cebola:60,azeite:15|Cozinha a batata e a cebola em fatias no azeite;Mistura com os ovos batidos;Cozinha dos dois lados em lume brando
bife-batata-salada|Bife com batata cozida e salada|r|25|fogao|q|1|carne|vaca-bife:150,batata:200,alface:40,tomate:80,azeite:10|Coze a batata;Grelha o bife ao ponto desejado;Serve com a salada temperada com azeite
salmao-forno|Salmão no forno com legumes|r|35|forno|q|2|peixe|salmao:150,batata:150,brocolos:100,azeite:8,limao:10|Tempera o salmão com limão;Dispõe com a batata e os brócolos;Assa 20 minutos a 200 °C
bacalhau-natas|Bacalhau com natas leve|r|45|forno|q|3|peixe|bacalhau:160,batata:200,cebola:60,natas:40,azeite:8|Cozinha a batata e desfaz o bacalhau;Refoga a cebola e mistura tudo com as natas;Gratina 15 minutos no forno
bacalhau-bras|Bacalhau à Brás|r|30|fogao|q|2|peixe|bacalhau:130,batata:150,ovo:60,cebola:60,azeite:12|Frita a batata em palitos finos;Refoga a cebola e o bacalhau desfiado;Junta a batata e os ovos batidos e mexe até cozer
pescada-cozida|Pescada cozida com legumes|r|30|fogao|q|2|peixe|pescada:180,batata:200,cenoura:80,grelos:80,azeite:12|Coze a batata e a cenoura;Junta a pescada e os grelos nos últimos 8 minutos;Serve com azeite
robalo-arroz|Robalo grelhado com arroz e courgette|r|30|fogao|q|2|peixe|robalo:170,arroz:70,courgette:100,azeite:10|Coze o arroz;Grelha o robalo 4 minutos de cada lado;Salteia a courgette e serve
salada-sardinha|Salada de sardinha e tomate|r|10||f|0|salada|sardinha-lata:80,pao-centeio:60,tomate:100,pimento-vermelho:60,cebola:20,azeite:8|Corta o tomate, o pimento e a cebola;Junta a sardinha escorrida;Tempera e serve com o pão
salada-atum-grao|Salada de atum e grão-de-bico|r|10||f|2|salada|atum-lata:80,grao-lata:120,tomate:100,pepino:60,cebola:20,azeite:10|Escorre o grão e o atum;Mistura com o tomate, o pepino e a cebola;Tempera com azeite
arroz-camarao|Arroz de tomate com camarão|r|30|fogao|q|2|marisco|camarao:150,arroz:70,tomate:100,cebola:50,azeite:8|Refoga a cebola e o tomate;Junta o arroz e a água, cozinha 12 minutos;Acrescenta o camarão nos últimos 4 minutos
polvo-lagareiro|Polvo à lagareiro com batata|r|45|forno|q|2|marisco|polvo:180,batata:200,azeite:15,alho:5|Cozinha o polvo previamente;Assa com a batata e o alho em azeite 25 minutos;Serve a escorrer o azeite
lulas-arroz|Lulas grelhadas com arroz de pimento|r|30|fogao|q|2|marisco|lulas:180,arroz:70,pimento-vermelho:60,tomate:80,azeite:10|Faz o arroz com o pimento e o tomate;Grelha as lulas 3 minutos de cada lado;Serve com limão
tilapia-quinoa|Tilápia no forno com quinoa|r|30|forno|q|2|peixe|tilapia:180,quinoa:60,courgette:100,limao:10,azeite:8|Coze a quinoa;Assa a tilápia com limão e a courgette 15 minutos;Serve com a quinoa
grao-espinafres|Grão com espinafres|r|20|fogao|q|3|leguminosas|grao-lata:200,espinafres:150,cebola:50,azeite:10,colorau:2|Refoga a cebola com colorau;Junta o grão e os espinafres;Cozinha 8 minutos
dal-lentilhas|Dal de lentilhas com arroz|r|35|fogao|q|4|leguminosas|lentilhas:80,leite-coco:40,cebola:60,tomate-triturado:100,arroz:50,gengibre:5,azeite:8|Refoga a cebola e o gengibre;Junta as lentilhas, o tomate e água, cozinha 20 minutos;Termina com o leite de coco e serve com arroz
feijao-preto-abobora|Feijão preto com abóbora e arroz|r|50|fogao|q|4|leguminosas|feijao-preto:80,abobora:150,arroz:60,cenoura:60,azeite:8|Demolha e coze o feijão;Junta a abóbora e a cenoura em cubos;Serve com o arroz
tofu-salteado|Tofu salteado com arroz|r|25|fogao|q|3|leguminosas|tofu:180,arroz:70,brocolos:100,cenoura:60,molho-soja:15,sesamo:5,oleo-girassol:8|Coze o arroz;Salteia o tofu e os legumes;Junta o molho de soja e o sésamo
salada-feijao-frade|Salada de feijão-frade com ovo|r|40|fogao|f|3|salada|feijao-frade:70,ovo:60,tomate:80,cebola:30,coentros:5,azeite:10|Coze o feijão-frade e o ovo;Mistura com o tomate, a cebola e os coentros;Tempera com azeite
massa-lentilhas|Massa com molho de tomate e lentilhas|r|30|fogao|q|3|massa|esparguete:70,lentilhas:40,tomate-triturado:150,cebola:40,azeite:8|Coze as lentilhas;Faz o molho com a cebola e o tomate;Junta as lentilhas e serve sobre a massa
curry-grao-batata-doce|Curry de grão e batata-doce|r|35|fogao|q|4|leguminosas|grao-lata:150,batata-doce:150,leite-coco:40,espinafres:50,arroz:50,azeite:6|Cozinha a batata-doce em cubos;Junta o grão, o leite de coco e os espinafres;Serve com arroz
favas-ovo|Favas guisadas com ovo|r|45|fogao|q|3|leguminosas|favas:90,ovo:60,chourico:20,cebola:50,azeite:8,coentros:5|Demolha e coze as favas;Refoga a cebola e o chouriço, junta as favas;Escalfa o ovo por cima e termina com coentros
caldo-verde-pao|Caldo verde com pão de centeio|r|35|fogao|q|3|sopa|batata:200,couve-galega:60,chourico:20,azeite:10,cebola:40,pao-centeio:60|Coze a batata com a cebola e tritura;Junta a couve em tiras finas e o chouriço;Serve com azeite e pão
sopa-feijao|Sopa de feijão com couve|r|40|fogao|q|4|sopa|feijao-encarnado-lata:100,repolho:100,cenoura:60,batata:100,azeite:8,esparguete:20|Coze a cenoura e a batata em água;Junta o feijão e o repolho;Acrescenta a massa e cozinha 8 minutos
sopa-abobora-lentilhas|Sopa de abóbora e lentilhas|r|35|fogao,robo|q|4|sopa|abobora:250,lentilhas:50,cebola:50,azeite:8,pao-integral:40|Coze a abóbora, a cebola e as lentilhas;Tritura até ficar cremoso;Serve com o pão torrado
pizza-tortilha|Pizza rápida em tortilha|r|20|forno|q|1|massa|tortilha:80,tomate-triturado:60,mozzarella:60,cogumelos:60,presunto:20|Unta a tortilha com o tomate;Cobre com cogumelos, presunto e mozzarella;Assa 10 minutos a 220 °C
hamburguer-grao|Hambúrguer de grão com salada|r|35|forno|q|3|leguminosas|grao-lata:150,aveia:30,ovo:40,cebola:30,pao-trigo:60,alface:20|Tritura o grão com a aveia, o ovo e a cebola;Molda e assa 20 minutos a 200 °C;Monta no pão com a alface
frango-wok|Frango salteado com legumes e arroz|r|25|fogao|q|3|ave|frango-peito:140,legumes-cong:150,arroz:60,molho-soja:12,oleo-girassol:8,gengibre:5|Coze o arroz;Salteia o frango em tiras com o gengibre;Junta os legumes e o molho de soja
salada-quinoa-grao|Salada de quinoa e grão-de-bico|r|20|fogao|f|3|salada|quinoa:60,grao-lata:100,pepino:60,tomate:80,amendoas:10,azeite:10,limao:10|Coze a quinoa e deixa arrefecer;Mistura com o grão, o pepino e o tomate;Tempera com azeite e limão e junta as amêndoas
salada-massa-frango|Salada fria de massa e frango|r|25|fogao|f|3|salada|esparguete:60,frango-peito:100,tomate:80,pepino:50,azeitonas:10,iogurte-grego:40|Coze a massa e o frango e deixa arrefecer;Corta o frango e os legumes;Mistura tudo com o iogurte
sanduiche-presunto-queijo|Sanduíche de presunto e queijo|r|5||f|0|tosta|pao-integral:90,presunto:40,queijo-flamengo:40,tomate:60,alface:20|Corta o pão;Monta com o presunto, o queijo, o tomate e a alface;Embrulha para levar
salada-lentilhas|Salada de lentilhas e cenoura|r|25|fogao|f|4|salada|lentilhas:70,cenoura:60,tomate:80,cebola:20,azeite:10,limao:10,coentros:5|Coze as lentilhas e escorre;Junta a cenoura ralada, o tomate e a cebola;Tempera com azeite, limão e coentros
bowl-arroz-atum|Taça de arroz, atum e ovo|r|25|fogao|f|3|arroz|arroz:70,atum-lata:80,ervilhas-cong:50,tomate:60,ovo:60,azeite:8|Coze o arroz, as ervilhas e o ovo e deixa arrefecer;Junta o atum e o tomate;Tempera com azeite
`.trim().split("\n");

const out = R.map((l) => {
  const [id, name, k, min, eq, t, fr, cat, ing, steps] = l.split("|");
  return {
    id, name, kind: k === "p" ? "pequeno-almoco" : "principal", minutes: +min,
    equipment: eq ? eq.split(",") : [], temp: t === "q" ? "quente" : "frio", fridgeDays: +fr, cat,
    ingredients: ing.split(",").map((x) => { const [food, g] = x.split(":"); return { food, g: +g }; }),
    steps: steps.split(";"),
  };
});
fs.writeFileSync("data/recipes.json", JSON.stringify(out));
console.log(out.length, "receitas;", out.filter((r) => r.kind === "pequeno-almoco").length, "pequenos-almoços");
