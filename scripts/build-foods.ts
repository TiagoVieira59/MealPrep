// Gera data/foods.json a partir da USDA FoodData Central (SR Legacy). Domínio público (CC0).
import fs from "node:fs";
// Uso: npx tsx scripts/build-foods.ts <pasta com food.csv e food_nutrient.csv do SR Legacy>
// (descarregado de https://fdc.nal.usda.gov/download-datasets.html — sem chave de API)
const DIR = process.argv[2];
if (!DIR) { console.error("indica a pasta do CSV"); process.exit(1); }

// id | nome PT-PT | descrição USDA (crua) | grupo | corredor | alergénios
const L = `
frango-peito|Peito de frango|Chicken, broiler or fryers, breast, skinless, boneless, meat only, raw|ave|Talho|
frango-coxa|Coxa de frango sem pele|Chicken, broilers or fryers, dark meat, drumstick, meat only, raw|ave|Talho|
peru-peito|Peito de peru|Turkey, whole, breast, meat only, raw|ave|Talho|
porco-lombo|Lombo de porco|Pork, fresh, loin, whole, separable lean only, raw|carne|Talho|
porco-picado|Carne de porco picada|Pork, ground, 84% lean / 16% fat, raw|carne|Talho|
vaca-picada|Carne de vaca picada|Beef, ground, 90% lean meat / 10% fat, raw|carne|Talho|
vaca-bife|Bife de vaca|Beef, top sirloin, steak, separable lean only, trimmed to 1/8 fat, all grades, raw|carne|Talho|
presunto|Presunto|Ham, sliced, regular (approximately 11% fat)|carne|Talho|
chourico|Chouriço|Sausage, pork, chorizo, link or ground, raw|carne|Talho|
salmao|Salmão|Fish, salmon, Atlantic, farmed, raw|peixe|Peixaria|peixe
bacalhau|Bacalhau (demolhado)|Fish, cod, Atlantic, raw|peixe|Peixaria|peixe
pescada|Pescada|Fish, whiting, mixed species, raw|peixe|Peixaria|peixe
robalo|Robalo|Fish, bass, striped, raw|peixe|Peixaria|peixe
cavala|Cavala|Fish, mackerel, Atlantic, raw|peixe|Peixaria|peixe
tilapia|Tilápia|Fish, tilapia, raw|peixe|Peixaria|peixe
atum-lata|Atum em conserva (ao natural)|Fish, tuna, light, canned in water, drained solids|peixe|Conservas|peixe
sardinha-lata|Sardinha em conserva (azeite)|Fish, sardine, Atlantic, canned in oil, drained solids with bone|peixe|Conservas|peixe
camarao|Camarão|Crustaceans, shrimp, mixed species, raw|marisco|Peixaria|crustaceos
polvo|Polvo|Mollusks, octopus, common, raw|marisco|Peixaria|moluscos
lulas|Lulas|Mollusks, squid, mixed species, raw|marisco|Peixaria|moluscos
mexilhao|Mexilhão|Mollusks, mussel, blue, raw|marisco|Peixaria|moluscos
ovo|Ovo|Egg, whole, raw, fresh|ovos|Laticínios e ovos|ovos
leite-meio-gordo|Leite meio-gordo|Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D|laticinios|Laticínios e ovos|leite
leite-magro|Leite magro|Milk, nonfat, fluid, with added vitamin A and vitamin D (fat free or skim)|laticinios|Laticínios e ovos|leite
iogurte-grego|Iogurte grego natural|Yogurt, Greek, plain, nonfat|laticinios|Laticínios e ovos|leite
iogurte-natural|Iogurte natural|Yogurt, plain, low fat|laticinios|Laticínios e ovos|leite
queijo-cottage|Queijo fresco batido (cottage)|Cheese, cottage, lowfat, 2% milkfat|laticinios|Laticínios e ovos|leite
requeijao|Requeijão|Cheese, ricotta, part skim milk|laticinios|Laticínios e ovos|leite
queijo-flamengo|Queijo flamengo|Cheese, gouda|laticinios|Laticínios e ovos|leite
mozzarella|Mozzarella|Cheese, mozzarella, part skim milk|laticinios|Laticínios e ovos|leite
parmesao|Queijo parmesão|Cheese, parmesan, hard|laticinios|Laticínios e ovos|leite
manteiga|Manteiga|Butter, salted|laticinios|Laticínios e ovos|leite
natas|Natas culinárias|Cream, fluid, light (coffee cream or table cream)|laticinios|Laticínios e ovos|leite
bebida-soja|Bebida de soja|Soymilk, original and vanilla, unfortified|plantas|Mercearia|soja
bebida-amendoa|Bebida de amêndoa|Beverages, almond milk, unsweetened, shelf stable|plantas|Mercearia|frutos_casca_rija
grao-seco|Grão-de-bico (seco)|Chickpeas (garbanzo beans, bengal gram), mature seeds, raw|plantas|Mercearia|
grao-lata|Grão-de-bico (cozido, lata)|Chickpeas (garbanzo beans, bengal gram), mature seeds, canned, drained solids|plantas|Conservas|
feijao-preto|Feijão preto (seco)|Beans, black, mature seeds, raw|plantas|Mercearia|
feijao-encarnado|Feijão encarnado (seco)|Beans, kidney, red, mature seeds, raw|plantas|Mercearia|
feijao-encarnado-lata|Feijão encarnado (cozido, lata)|Beans, kidney, red, mature seeds, canned, drained solids|plantas|Conservas|
feijao-frade|Feijão-frade (seco)|Cowpeas, common (blackeyes, crowder, southern), mature seeds, raw|plantas|Mercearia|
feijao-branco|Feijão branco (seco)|Beans, white, mature seeds, raw|plantas|Mercearia|
lentilhas|Lentilhas (secas)|Lentils, raw|plantas|Mercearia|
ervilhas-cong|Ervilhas congeladas|Peas, green, frozen, unprepared|plantas|Congelados|
favas|Favas|Broadbeans (fava beans), mature seeds, raw|plantas|Mercearia|
tofu|Tofu firme|Tofu, raw, firm, prepared with calcium sulfate|plantas|Laticínios e ovos|soja
tremocos|Tremoços|Lupins, mature seeds, raw|plantas|Conservas|tremoco
amendoim|Amendoim|Peanuts, all types, raw|plantas|Mercearia|amendoim
manteiga-amendoim|Manteiga de amendoim|Peanut butter, smooth style, with salt|plantas|Mercearia|amendoim
arroz|Arroz agulha|Rice, white, long-grain, regular, raw, enriched|plantas|Mercearia|
arroz-integral|Arroz integral|Rice, brown, long-grain, raw|plantas|Mercearia|
esparguete|Esparguete|Pasta, dry, enriched|plantas|Mercearia|gluten
massa-integral|Massa integral|Pasta, whole-wheat, dry|plantas|Mercearia|gluten
aveia|Flocos de aveia|Cereals, oats, regular and quick, not fortified, dry|plantas|Mercearia|gluten
pao-trigo|Pão de trigo|Bread, white, commercially prepared (includes soft bread crumbs)|plantas|Padaria|gluten
pao-integral|Pão integral|Bread, whole-wheat, commercially prepared|plantas|Padaria|gluten
pao-centeio|Pão de centeio|Bread, rye|plantas|Padaria|gluten
tortilha|Tortilha de trigo|Tortillas, ready-to-bake or -fry, flour, shelf stable|plantas|Padaria|gluten
cuscuz|Cuscuz|Couscous, dry|plantas|Mercearia|gluten
quinoa|Quinoa|Quinoa, uncooked|plantas|Mercearia|
farinha-trigo|Farinha de trigo|Wheat flour, white, all-purpose, enriched, bleached|plantas|Mercearia|gluten
fuba|Fubá de milho|Cornmeal, whole-grain, yellow|plantas|Mercearia|
batata|Batata|Potatoes, white, flesh and skin, raw|plantas|Frutas e legumes|
batata-doce|Batata-doce|Sweet potato, raw, unprepared|plantas|Frutas e legumes|
cebola|Cebola|Onions, raw|plantas|Frutas e legumes|
alho|Alho|Garlic, raw|plantas|Frutas e legumes|
tomate|Tomate|Tomatoes, red, ripe, raw, year round average|plantas|Frutas e legumes|
cenoura|Cenoura|Carrots, raw|plantas|Frutas e legumes|
courgette|Courgette|Squash, summer, zucchini, includes skin, raw|plantas|Frutas e legumes|
pimento-vermelho|Pimento vermelho|Peppers, sweet, red, raw|plantas|Frutas e legumes|
pimento-verde|Pimento verde|Peppers, sweet, green, raw|plantas|Frutas e legumes|
alface|Alface|Lettuce, green leaf, raw|plantas|Frutas e legumes|
espinafres|Espinafres|Spinach, raw|plantas|Frutas e legumes|
brocolos|Brócolos|Broccoli, raw|plantas|Frutas e legumes|
couve-flor|Couve-flor|Cauliflower, raw|plantas|Frutas e legumes|
couve-galega|Couve galega|Collards, raw|plantas|Frutas e legumes|
repolho|Repolho|Cabbage, raw|plantas|Frutas e legumes|
abobora|Abóbora|Pumpkin, raw|plantas|Frutas e legumes|
beringela|Beringela|Eggplant, raw|plantas|Frutas e legumes|
cogumelos|Cogumelos|Mushrooms, white, raw|plantas|Frutas e legumes|
pepino|Pepino|Cucumber, with peel, raw|plantas|Frutas e legumes|
alho-frances|Alho-francês|Leeks, (bulb and lower leaf-portion), raw|plantas|Frutas e legumes|
feijao-verde|Feijão-verde|Beans, snap, green, raw|plantas|Frutas e legumes|
grelos|Grelos|Turnip greens, raw|plantas|Frutas e legumes|
nabo|Nabo|Turnips, raw|plantas|Frutas e legumes|
beterraba|Beterraba|Beets, raw|plantas|Frutas e legumes|
aipo|Aipo|Celery, raw|plantas|Frutas e legumes|aipo
rucula|Rúcula|Arugula, raw|plantas|Frutas e legumes|
tomate-triturado|Tomate triturado|Tomatoes, crushed, canned|plantas|Conservas|
concentrado-tomate|Concentrado de tomate|Tomato products, canned, paste, without salt added|plantas|Conservas|
legumes-cong|Legumes mistos congelados|Vegetables, mixed, frozen, unprepared|plantas|Congelados|
espinafres-cong|Espinafres congelados|Spinach, frozen, chopped or leaf, unprepared|plantas|Congelados|
banana|Banana|Bananas, raw|plantas|Frutas e legumes|
maca|Maçã|Apples, raw, with skin|plantas|Frutas e legumes|
laranja|Laranja|Oranges, raw, all commercial varieties|plantas|Frutas e legumes|
pera|Pêra|Pears, raw|plantas|Frutas e legumes|
morangos|Morangos|Strawberries, raw|plantas|Frutas e legumes|
kiwi|Kiwi|Kiwifruit, green, raw|plantas|Frutas e legumes|
melao|Melão|Melons, cantaloupe, raw|plantas|Frutas e legumes|
ananas|Ananás|Pineapple, raw, all varieties|plantas|Frutas e legumes|
mirtilos|Mirtilos|Blueberries, raw|plantas|Frutas e legumes|
abacate|Abacate|Avocados, raw, all commercial varieties|plantas|Frutas e legumes|
tangerina|Tangerina|Tangerines, (mandarin oranges), raw|plantas|Frutas e legumes|
pessego|Pêssego|Peaches, yellow, raw|plantas|Frutas e legumes|
uvas-passas|Uvas passas|Raisins, dark, seedless|plantas|Mercearia|
limao|Sumo de limão|Lemon juice, raw|plantas|Frutas e legumes|
amendoas|Amêndoas|Nuts, almonds|plantas|Mercearia|frutos_casca_rija
nozes|Nozes|Nuts, walnuts, english|plantas|Mercearia|frutos_casca_rija
caju|Castanha de caju|Nuts, cashew nuts, raw|plantas|Mercearia|frutos_casca_rija
chia|Sementes de chia|Seeds, chia seeds, dried|plantas|Mercearia|
girassol|Sementes de girassol|Seeds, sunflower seed kernels, dried|plantas|Mercearia|
sesamo|Sementes de sésamo|Seeds, sesame seeds, whole, dried|plantas|Mercearia|sesamo
linhaca|Linhaça|Seeds, flaxseed|plantas|Mercearia|
pinhoes|Pinhões|Nuts, pine nuts, dried|plantas|Mercearia|frutos_casca_rija
azeite|Azeite|Oil, olive, salad or cooking|plantas|Óleos e temperos|
oleo-girassol|Óleo de girassol|Oil, sunflower, linoleic (less than 60%)|plantas|Óleos e temperos|
mel|Mel|Honey|mel|Mercearia|
acucar|Açúcar|Sugars, granulated|plantas|Mercearia|
mostarda|Mostarda|Mustard, prepared, yellow|plantas|Óleos e temperos|mostarda
salsa|Salsa|Parsley, fresh|plantas|Frutas e legumes|
coentros|Coentros|Coriander (cilantro) leaves, raw|plantas|Frutas e legumes|
manjericao|Manjericão|Basil, fresh|plantas|Frutas e legumes|
gengibre|Gengibre|Ginger root, raw|plantas|Frutas e legumes|
colorau|Colorau|Spices, paprika|plantas|Óleos e temperos|
oregaos|Oregãos|Spices, oregano, dried|plantas|Óleos e temperos|
canela|Canela|Spices, cinnamon, ground|plantas|Óleos e temperos|
molho-soja|Molho de soja|Soy sauce made from soy and wheat (shoyu)|plantas|Óleos e temperos|soja gluten
chocolate-negro|Chocolate negro (70-85%)|Chocolate, dark, 70-85% cacao solids|plantas|Mercearia|soja
cacau|Cacau em pó|Cocoa, dry powder, unsweetened|plantas|Mercearia|
leite-coco|Leite de coco|Nuts, coconut milk, canned (liquid expressed from grated meat and water)|plantas|Mercearia|
azeitonas|Azeitonas|Olives, ripe, canned (small-extra large)|plantas|Conservas|
`.trim().split("\n");

const NID = { kcal: [1008, 2047, 2048], protein: [1003], carbs: [1005], fat: [1004], fiber: [1079] } as const;
const norm = (d: string) => d.toLowerCase().replace(/\s*\(.*?\)/g, "").trim();
function csv(file: string, cb: (r: string[]) => void) {
  const lines = fs.readFileSync(`${DIR}/${file}`, "utf8").split("\n");
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i]; if (!l) continue;
    const r: string[] = []; let cur = "", q = false;
    for (const ch of l) { if (ch === '"') q = !q; else if (ch === "," && !q) { r.push(cur); cur = ""; } else cur += ch; }
    r.push(cur); cb(r);
  }
}

function main() {
  const byDesc = new Map<string, { fdcId: number; dataType: string; description: string }>();
  csv("food.csv", (r) => { const k = norm(r[2]); if (!byDesc.has(k)) byDesc.set(k, { fdcId: +r[0], dataType: r[1] === "sr_legacy_food" ? "SR Legacy" : r[1], description: r[2] }); });
  const want = new Map<number, Map<number, number>>();
  for (const l of L) { const h = byDesc.get(norm(l.split("|")[2])); if (h) want.set(h.fdcId, new Map()); }
  csv("food_nutrient.csv", (r) => { const m = want.get(+r[1]); if (m) m.set(+r[2], +r[3]); });

  const out: unknown[] = [], flags: string[] = [];
  for (const line of L) {
    const [id, pt, desc, group, aisle, al] = line.split("|");
    const hit = byDesc.get(norm(desc));
    if (!hit) { flags.push(`${id}: SEM RESULTADO para "${desc}"`); continue; }
    const m = want.get(hit.fdcId)!;
    const pick = (ids: readonly number[]) => { for (const n of ids) if (m.has(n)) return m.get(n)!; return null; };
    const v = { kcal: pick(NID.kcal), protein: pick(NID.protein), carbs: pick(NID.carbs), fat: pick(NID.fat), fiber: pick(NID.fiber) };
    if (v.kcal == null || v.protein == null || v.carbs == null || v.fat == null) flags.push(`${id}: nutrientes em falta ${JSON.stringify(v)}`);
    const r1 = (x: number | null) => Math.round((x ?? 0) * 10) / 10;
    const g100 = { kcal: Math.round(v.kcal ?? 0), protein: r1(v.protein), carbs: r1(v.carbs), fat: r1(v.fat), fiber: r1(v.fiber) };
    const meat = group === "carne" || group === "ave", fish = group === "peixe" || group === "marisco";
    const animal = meat || fish || group === "ovos" || group === "laticinios" || group === "mel";
    out.push({
      id, fdcId: hit.fdcId, dataType: hit.dataType, usda: hit.description, pt, group, aisle,
      allergens: al ? al.split(" ") : [], per100: g100,
      diets: { omnivora: true, vegetariana: !meat && !fish, vegana: !animal, pescetariana: !meat, lowcarb: g100.carbs <= 10 },
    });
  }
  fs.writeFileSync("data/foods.json", JSON.stringify(out));
  console.log(`${out.length} alimentos; ${flags.length} para rever`);
  flags.forEach((f) => console.log(f));
}
main();
