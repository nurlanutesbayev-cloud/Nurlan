import { useState, useEffect } from "react";

// Supabase connection
const SUPABASE_URL = "https://acvbjpjtohtkulmbpng.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdmJqcGp0b2h0a3VsbWJicG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjg4NzgsImV4cCI6MjA5NDgwNDg3OH0.mLrrZahUIC4Eko56L-PJFfkEVE6e0iDTK_Ipuf4KKVM";

const sb = {
  async getAll() {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/trends?select=*&order=created_at.asc`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      }
    });
    if (!r.ok) { console.error("getAll failed:", r.status, await r.text()); return []; }
    return r.json();
  },
  async upsertAll(trends) {
    const rows = trends.map(t => ({
      name: t.name, subname: t.subname || "", category: t.category,
      status: t.status, heat: t.heat, region: t.region,
      instagram_idea: t.instagram_idea || "",
      russia_status: t.russia_status || "", russia_detail: t.russia_detail || "",
      kz_status: t.kz_status || "", kz_detail: t.kz_detail || "",
      social1_platform: t.social1_platform || "", social1_desc: t.social1_desc || "",
      social2_platform: t.social2_platform || "", social2_desc: t.social2_desc || "",
      procurement_ready: t.procurement_ready || "🟡 Ищем поставщика",
      price_range: t.price_range || "—",
      competitors: t.competitors || [],
      kanban: t.kanban || "idea",
      request_num: t.request_num || "",
      request_status: t.request_status || "—",
    }));
    // Clear table first
    await fetch(`${SUPABASE_URL}/rest/v1/trends?id=gte.00000000-0000-0000-0000-000000000000`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    // Insert all
    const r = await fetch(`${SUPABASE_URL}/rest/v1/trends`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(rows)
    });
    if (!r.ok) { const e = await r.text(); console.error("upsertAll failed:", r.status, e); return null; }
    return r.json();
  },
  async updateOne(id, patch) {
    if (!id) return;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/trends?id=eq.${id}`, {
      method: "PATCH",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(patch)
    });
    if (!r.ok) console.error("updateOne failed:", r.status, await r.text());
  },
};

const CATEGORIES = ["Все","Снеки","Напитки","Молочка","Здоровое питание","Бытовая химия","Кондитерка","Готовая еда","Мороженое","Полуфабрикаты","Морепродукты","Мама и младенец","Колбасные изделия","Соусы","Овощи и фрукты","Хлебобулочные","Алкоголь","Высокобелковые","Консервация"];
const COMPETITORS = ["Magnum","Small","Arbuz","Рамстор","Южный","Корзина","Оптима","Норма","Другой"];
const CAT_ICONS = {"Мороженое":"🍦","Полуфабрикаты":"🥩","Морепродукты":"🦐","Мама и младенец":"👶","Колбасные изделия":"🌭","Соусы":"🫙","Овощи и фрукты":"🥦","Хлебобулочные":"🍞","Алкоголь":"🍺","Высокобелковые":"💪","Здоровое питание":"🌿","Консервация":"🥫"};

const CAT_DESCRIPTIONS = {
  "Снеки":"Чипсы, сухари, орешки, нори, попкорн, злаковые батончики. Без протеиновых продуктов.",
  "Напитки":"Вода, соки, газировка, энергетики, RTD кофе, матча, чай, функциональные напитки.",
  "Молочка":"Молоко, йогурт, творог, сыр, масло, сметана. Без протеиновых спортивных продуктов.",
  "Здоровое питание":"Без сахара: конфеты, батончики, шарики для завтрака, стевия, заменители сахара, суперфуды.",
  "Бытовая химия":"Моющие средства, стиральные порошки, eco-химия, концентраты.",
  "Кондитерка":"Шоколад, конфеты, печенье, торты, десерты — сладости со всего мира.",
  "Готовая еда":"Минимальный нагрев или без него: лапша быстрого приготовления, супы, пюре, готовые блюда.",
  "Мороженое":"Детское, азиатское (фрукты/ягоды), моти, шарики, необычные вкусы. Без протеинового.",
  "Полуфабрикаты":"Минимальное приготовление: пельмени, манты, котлеты, блины, тесто, замороженная пицца.",
  "Морепродукты":"Охлаждённые и замороженные: рыба, креветки, кальмары, мидии, осьминог.",
  "Мама и младенец":"Детское питание, снеки для малышей, смеси + гигиена: подгузники, салфетки, средства для бутылочек.",
  "Колбасные изделия":"Сосиски, колбаса, ветчина. Халяль, чистый состав, разные варианты фасовки.",
  "Соусы":"Азиатские (кочуджан, терияки), трюфельные масла, песто, уксусы — тематические к блюдам.",
  "Овощи и фрукты":"Свежие, нарезанные, экзотические. Разные форматы фасовки и готовые миксы.",
  "Хлебобулочные":"Булочки для бургеров, лепёшки для Нутеллы, лаваш, закваска, безглютеновый хлеб.",
  "Алкоголь":"Пиво, вино, крепкий алкоголь, безалкогольные версии. Азиатские и американские тренды.",
  "Высокобелковые":"Спортивная аудитория: протеиновые батончики, RTD коктейли, Экспонента, высокобелковые йогурты/сыры/творог, яичный белок.",
  "Консервация":"Мясные, рыбные, овощные, фруктовые консервы — глубокая категория.",
};

const REQUEST_STATUSES = [
  {value:"—",            color:"#6b7280", bg:"rgba(107,114,128,0.15)"},
  {value:"Создана",      color:"#60a5fa", bg:"rgba(59,130,246,0.15)"},
  {value:"На согласовании", color:"#fbbf24", bg:"rgba(251,191,36,0.15)"},
  {value:"Одобрена",     color:"#22c55e", bg:"rgba(34,197,94,0.15)"},
  {value:"Отклонена",    color:"#ff4d6d", bg:"rgba(255,77,109,0.15)"},
];

const REGION_MAP = {
  "Азия":       {bg:"rgba(251,146,60,0.18)", color:"#fb923c", icon:"🌏"},
  "Америка":    {bg:"rgba(59,130,246,0.18)", color:"#60a5fa", icon:"🌎"},
  "Европа":     {bg:"rgba(34,197,94,0.18)",  color:"#4ade80", icon:"🌍"},
  "Глобальный": {bg:"rgba(156,163,175,0.18)",color:"#9ca3af", icon:"🌐"},
};
const STATUS_MAP = {
  "🔥 Горячий":    {bg:"rgba(255,77,109,0.18)", color:"#ff4d6d"},
  "✨ Новинка":    {bg:"rgba(251,191,36,0.18)", color:"#fbbf24"},
  "📈 Растёт":     {bg:"rgba(34,197,94,0.18)",  color:"#22c55e"},
  "✅ Стабильный": {bg:"rgba(107,114,128,0.2)", color:"#9ca3af"},
};
const MARKET_COLOR = {"Активно продаётся":"#22c55e","Появляется":"#fbbf24","Редко встречается":"#fb923c","Нет в продаже":"#ff4d6d"};
const READY_CONFIG = {
  "🟢 Готов к закупке": {color:"#22c55e", bg:"rgba(34,197,94,0.15)"},
  "🟡 Ищем поставщика": {color:"#fbbf24", bg:"rgba(251,191,36,0.15)"},
  "🔴 Недоступно в КЗ": {color:"#ff4d6d", bg:"rgba(255,77,109,0.15)"},
};
const KANBAN_COLS = [
  {id:"idea",   label:"💡 Идея",             color:"#6b7280"},
  {id:"search", label:"🔍 Ищем поставщика",  color:"#fbbf24"},
  {id:"nego",   label:"🤝 Переговоры",       color:"#7c3aed"},
  {id:"test",   label:"🧪 Тест-партия",      color:"#fb923c"},
  {id:"done",   label:"✅ В ассортименте",   color:"#22c55e"},
];
const BASE = {procurement_ready:"🟡 Ищем поставщика", price_range:"—", competitors:[], kanban:"idea", request_num:"", request_status:"—"};

const FALLBACK = [
  {...BASE, name:"Корейская лапша Buldak", subname:"Samyang", category:"Готовая еда", status:"🔥 Горячий", heat:10, region:"Азия", instagram_idea:"Reaction-видео с самой острой лапшей — viral-контент!", russia_status:"Активно продаётся", russia_detail:"Wildberries, Ozon, азиатские маркеты", kz_status:"Активно продаётся", kz_detail:"Kaspi, Magnum, Small, азиатские маркеты Алматы", social1_platform:"TikTok", social1_desc:"#buldakchallenge — 2 млрд просмотров", social2_platform:"Instagram", social2_desc:"Reaction-видео казахстанских блогеров", procurement_ready:"🟢 Готов к закупке", price_range:"800–1 200 ₸", competitors:["Magnum","Small"]},
  {...BASE, name:"Матча (латте и порошок)", subname:"Ito En / Jade Leaf", category:"Напитки", status:"🔥 Горячий", heat:9, region:"Азия", instagram_idea:"Эстетичные фото матча-латте — японский тренд уже в Аяне!", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, Wildberries, кофейни", kz_status:"Появляется", kz_detail:"Кофейни Алматы и Астаны, Kaspi", social1_platform:"TikTok", social1_desc:"Матча-рецепты — миллиарды просмотров", social2_platform:"Instagram", social2_desc:"Эстетика кофейных напитков", procurement_ready:"🟡 Ищем поставщика", price_range:"1 500–3 500 ₸", competitors:["Arbuz"]},
  {...BASE, name:"Протеиновые батончики", subname:"Bite / KetoDiet / Quest", category:"Снеки", status:"🔥 Горячий", heat:9, region:"Америка", instagram_idea:"Утреннее меню ЗОЖника — батончик + смузи с БЖУ.", russia_status:"Активно продаётся", russia_detail:"Wildberries, Ozon, ВкусВилл", kz_status:"Появляется", kz_detail:"Kaspi, спортпит-магазины Астаны", social1_platform:"TikTok", social1_desc:"#протеин — 50M+ просмотров", social2_platform:"Instagram", social2_desc:"Фитнес-блогеры КЗ сравнивают бренды", procurement_ready:"🟢 Готов к закупке", price_range:"700–1 800 ₸", competitors:["Magnum"]},
  {...BASE, name:"Чипсы лимитированных вкусов", subname:"Lay's / Pringles", category:"Снеки", status:"✨ Новинка", heat:9, region:"Глобальный", instagram_idea:"Слепой тест вкусов с сотрудниками — вовлекающий Reels.", russia_status:"Активно продаётся", russia_detail:"Все сети, выходят каждые 2-3 месяца", kz_status:"Появляется", kz_detail:"Magnum, Small, Аян", social1_platform:"TikTok", social1_desc:"Дегустации необычных вкусов — сотни тысяч просмотров", social2_platform:"Instagram", social2_desc:"Unboxing лимитированных снеков", procurement_ready:"🟢 Готов к закупке", price_range:"400–700 ₸", competitors:["Magnum","Small","Рамстор"]},
  {...BASE, name:"Кокосовая вода", subname:"Vita Coco / местные", category:"Напитки", status:"📈 Растёт", heat:8, region:"Глобальный", instagram_idea:"Гидратация нового поколения — сравните с обычной водой.", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, Wildberries", kz_status:"Появляется", kz_detail:"Магазины здорового питания, Kaspi", social1_platform:"Instagram", social1_desc:"Фитнес-модели пьют кокосовую воду", social2_platform:"TikTok", social2_desc:"Taste test разных брендов", procurement_ready:"🟡 Ищем поставщика", price_range:"900–1 400 ₸", competitors:["Arbuz"]},
  {...BASE, name:"Напитки с коллагеном", subname:"Beauty Collagen / Evalar", category:"Здоровье", status:"✨ Новинка", heat:8, region:"Азия", instagram_idea:"«Пьём красоту» — before/after кожа + напиток. Женская аудитория.", russia_status:"Активно продаётся", russia_detail:"Аптеки, Wildberries", kz_status:"Появляется", kz_detail:"Аптеки, Kaspi, beauty-магазины", social1_platform:"TikTok", social1_desc:"#коллаген — обзоры beauty-блогеров КЗ", social2_platform:"Instagram", social2_desc:"Нутрициологи рекомендуют", procurement_ready:"🟡 Ищем поставщика", price_range:"1 200–2 500 ₸", competitors:[]},
  {...BASE, name:"RTD Кофе (готовый)", subname:"Cold Brew / латте в банке", category:"Напитки", status:"✨ Новинка", heat:8, region:"Америка", instagram_idea:"«Кофе без очереди» — утренний ритуал на ходу.", russia_status:"Появляется", russia_detail:"ВкусВилл, Ozon", kz_status:"Редко встречается", kz_detail:"Единичные позиции в Magnum Premium", social1_platform:"TikTok", social1_desc:"Утро без кофемашины — 200M+ просмотров", social2_platform:"Instagram", social2_desc:"Кофейные блогеры КЗ тестируют новинки", procurement_ready:"🔴 Недоступно в КЗ", price_range:"600–1 100 ₸", competitors:["Magnum"]},
  {...BASE, name:"Протеиновые чипсы", subname:"Quest / PopCorners Flex", category:"Снеки", status:"✨ Новинка", heat:8, region:"Америка", instagram_idea:"«Снеки без вины» — сравните БЖУ с обычными.", russia_status:"Появляется", russia_detail:"Wildberries, спортмагазины", kz_status:"Редко встречается", kz_detail:"Спортпит-магазины Алматы", social1_platform:"TikTok", social1_desc:"«Ем чипсы и не толстею»", social2_platform:"Instagram", social2_desc:"Фитнес-блогеры сравнивают БЖУ", procurement_ready:"🔴 Недоступно в КЗ", price_range:"1 000–2 000 ₸", competitors:[]},
  {...BASE, name:"Йогурт с пробиотиками", subname:"Активиа / местные", category:"Молочка", status:"📈 Растёт", heat:7, region:"Европа", instagram_idea:"«Здоровье изнутри» — гид по пользе пробиотиков.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети", kz_status:"Активно продаётся", kz_detail:"Magnum, Small, Аян", social1_platform:"Instagram", social1_desc:"Gut health тренд — 100K+ лайков", social2_platform:"YouTube", social2_desc:"Диетологи КЗ о пробиотиках", procurement_ready:"🟢 Готов к закупке", price_range:"350–600 ₸", competitors:["Magnum","Small","Рамстор"]},
  {...BASE, name:"Гранола и мюсли", subname:"Mornflake / Myllyn Paras", category:"Здоровье", status:"📈 Растёт", heat:7, region:"Европа", instagram_idea:"«Завтрак чемпиона» — красивые bowl flat lay.", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, все сети", kz_status:"Появляется", kz_detail:"Magnum, Small, Аян", social1_platform:"Instagram", social1_desc:"Гранольные bowls — топ формат", social2_platform:"TikTok", social2_desc:"Правильный завтрак за 5 минут", procurement_ready:"🟢 Готов к закупке", price_range:"900–2 200 ₸", competitors:["Magnum","Arbuz"]},
  {...BASE, name:"Морские водоросли (снек)", subname:"GimMe / Ocean's Halo", category:"Снеки", status:"📈 Растёт", heat:7, region:"Азия", instagram_idea:"«Снек будущего» — азиатский тренд уже в Аяне.", russia_status:"Появляется", russia_detail:"Wildberries, азиатские маркеты", kz_status:"Редко встречается", kz_detail:"Азиатские маркеты Алматы, Kaspi", social1_platform:"TikTok", social1_desc:"Корейские снеки challenge", social2_platform:"Instagram", social2_desc:"ЗОЖ-блогеры рекомендуют нори", procurement_ready:"🟡 Ищем поставщика", price_range:"400–900 ₸", competitors:[]},
  {...BASE, name:"Безлактозное молоко", subname:"Parmalat / Простоквашино", category:"Молочка", status:"✅ Стабильный", heat:6, region:"Европа", instagram_idea:"Инфографика «Кому нужно безлактозное молоко».", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети", kz_status:"Активно продаётся", kz_detail:"Magnum, Small, Аян", social1_platform:"Instagram", social1_desc:"Нутрициологи о непереносимости лактозы", social2_platform:"YouTube", social2_desc:"Сравнение состава молока", procurement_ready:"🟢 Готов к закупке", price_range:"500–900 ₸", competitors:["Magnum","Small","Рамстор"]},
  {...BASE, name:"Экологичная бытовая химия", subname:"Ecover / eco-бренды", category:"Бытовая химия", status:"✨ Новинка", heat:6, region:"Европа", instagram_idea:"«Чисто без вреда» — сравните состав эко vs обычного.", russia_status:"Появляется", russia_detail:"ВкусВилл, Ozon", kz_status:"Редко встречается", kz_detail:"Онлайн Kaspi, eco-магазины Алматы", social1_platform:"Instagram", social1_desc:"Eco-lifestyle блогеры КЗ", social2_platform:"TikTok", social2_desc:"#экохим — разборы состава средств", procurement_ready:"🟡 Ищем поставщика", price_range:"1 200–3 000 ₸", competitors:[]},
  {...BASE, name:"Мороженое моти", subname:"My/Mo Mochi / Mikawaya", category:"Мороженое", status:"🔥 Горячий", heat:9, region:"Азия", instagram_idea:"«Японское мороженое в Аяне» — разрез моти в Reels.", russia_status:"Появляется", russia_detail:"Wildberries, азиатские маркеты Москвы", kz_status:"Редко встречается", kz_detail:"Азиатские маркеты Алматы, Kaspi", social1_platform:"TikTok", social1_desc:"ASMR разрез моти — миллионы просмотров", social2_platform:"Instagram", social2_desc:"Фуд-блогеры КЗ снимают реакции", procurement_ready:"🟡 Ищем поставщика", price_range:"700–1 400 ₸", competitors:["Arbuz"]},
  {...BASE, name:"Мороженое необычных вкусов", subname:"Матча, солёная карамель, тирамису", category:"Мороженое", status:"✨ Новинка", heat:8, region:"Глобальный", instagram_idea:"Слепой тест вкусов — вовлекающий Reels.", russia_status:"Активно продаётся", russia_detail:"Локальные производители", kz_status:"Появляется", kz_detail:"Местные KZ производители", social1_platform:"TikTok", social1_desc:"Слепые тесты мороженого", social2_platform:"Instagram", social2_desc:"Фуд-блогеры тестируют вкусы", procurement_ready:"🟢 Готов к закупке", price_range:"400–900 ₸", competitors:["Magnum","Small"]},
  {...BASE, name:"Протеиновое мороженое", subname:"Halo Top / Enlightened", category:"Высокобелковые", status:"📈 Растёт", heat:7, region:"Америка", instagram_idea:"«Мороженое без вины» — БЖУ vs обычный пломбир.", russia_status:"Появляется", russia_detail:"Wildberries, спортпит-магазины", kz_status:"Редко встречается", kz_detail:"Пока почти отсутствует — шанс быть первыми!", social1_platform:"TikTok", social1_desc:"«Мороженое для похудения» — вирусный формат", social2_platform:"Instagram", social2_desc:"Фитнес-блогеры КЗ запрашивают", procurement_ready:"🔴 Недоступно в КЗ", price_range:"1 500–3 000 ₸", competitors:[]},
  {...BASE, name:"Экспонента (протеиновые продукты)", subname:"Exponenta / Bio-Max Sport", category:"Высокобелковые", status:"🔥 Горячий", heat:9, region:"Европа", instagram_idea:"«Белок для роста» — утро спортсмена с Экспонентой. Сравните белок с обычным творогом.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети, ВкусВилл", kz_status:"Появляется", kz_detail:"Отдельные позиции в Magnum, Kaspi", social1_platform:"TikTok", social1_desc:"#экспонента — сотни тысяч просмотров у спорт-блогеров", social2_platform:"Instagram", social2_desc:"Фитнес-блогеры КЗ делают обзоры протеиновых продуктов", procurement_ready:"🟡 Ищем поставщика", price_range:"600–1 200 ₸", competitors:["Magnum"]},
  {...BASE, name:"Протеиновые коктейли RTD", subname:"Muscle Milk / FitKit / Prime", category:"Высокобелковые", status:"🔥 Горячий", heat:8, region:"Америка", instagram_idea:"«Белок в банке» — готовый протеин после тренировки без шейкера.", russia_status:"Активно продаётся", russia_detail:"Wildberries, спортпит-магазины, Ozon", kz_status:"Появляется", kz_detail:"Спортпит-магазины Астаны и Алматы, Kaspi", social1_platform:"TikTok", social1_desc:"Post-workout routine — RTD протеин топ у фитнес-блогеров", social2_platform:"Instagram", social2_desc:"Спортивный контент КЗ: тренировка + протеиновый коктейль", procurement_ready:"🟡 Ищем поставщика", price_range:"900–1 800 ₸", competitors:[]},
  {...BASE, name:"Bibigo Гёдза / Gyoza", subname:"CJ Foods / Bibigo", category:"Полуфабрикаты", status:"🔥 Горячий", heat:10, region:"Азия", instagram_idea:"«Готовим гёдзу как в корейском ресторане» — ASMR обжарка на сковороде, хрустящая корочка. Формат Reels 15 сек.", russia_status:"Активно продаётся", russia_detail:"Wildberries, азиатские маркеты, «Азбука вкуса»", kz_status:"Появляется", kz_detail:"Азиатские маркеты Алматы, Kaspi — в обычных сетях почти нет", social1_platform:"TikTok", social1_desc:"#gyoza #гёдза — 11M+ постов, один из топ фуд-трендов 2025", social2_platform:"Instagram", social2_desc:"Казахстанские фуд-блогеры готовят корейские пельмени дома", procurement_ready:"🟡 Ищем поставщика", price_range:"1 200–2 500 ₸", competitors:["Arbuz"]},
  {...BASE, name:"Замороженная пицца премиум", subname:"Dr. Oetker Ristorante / Casa Rinaldi", category:"Полуфабрикаты", status:"🔥 Горячий", heat:9, region:"Европа", instagram_idea:"«Ресторанная пицца из морозилки» — разрез пиццы с тянущимся сыром. До и после духовки. Вирусный формат.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети, Dr. Oetker широко представлен", kz_status:"Появляется", kz_detail:"Magnum, Arbuz — ограниченный ассортимент, спрос растёт", social1_platform:"TikTok", social1_desc:"Замороженная пицца — самая быстрорастущая категория полуфабрикатов в КЗ 2025", social2_platform:"Instagram", social2_desc:"«Пятничный вечер дома» — пицца + фильм, lifestyle-формат", procurement_ready:"🟢 Готов к закупке", price_range:"2 500–4 500 ₸", competitors:["Magnum","Arbuz","Рамстор"]},
  {...BASE, name:"Корейские тток-покки замороженные", subname:"Samyang / CJ Haechandle", category:"Полуфабрикаты", status:"🔥 Горячий", heat:9, region:"Азия", instagram_idea:"«Острые рисовые клёцки за 5 минут» — готовим тток-покки из пакета. K-food тренд прямо из Аяна.", russia_status:"Активно продаётся", russia_detail:"Wildberries, азиатские маркеты Москвы и Питера", kz_status:"Редко встречается", kz_detail:"Азиатские маркеты Алматы — в обычных сетях отсутствует", social1_platform:"TikTok", social1_desc:"#тткпокки #kfood — миллионы просмотров, K-drama подогрел интерес", social2_platform:"Instagram", social2_desc:"Казахстанские K-pop фанаты активно ищут тток-покки", procurement_ready:"🟡 Ищем поставщика", price_range:"800–1 800 ₸", competitors:[]},
  {...BASE, name:"Маринованный шашлык вакуумный (премиум)", subname:"Мираторг / локальные KZ бренды", category:"Полуфабрикаты", status:"🔥 Горячий", heat:9, region:"Глобальный", instagram_idea:"«Шашлык без хлопот» — вакуумная упаковка, уже замаринован, осталось только пожарить. Покажите разницу с обычным.", russia_status:"Активно продаётся", russia_detail:"Мираторг доминирует, все федеральные сети", kz_status:"Активно продаётся", kz_detail:"Magnum, Small, Аян — локальные производители КЗ сильны", social1_platform:"TikTok", social1_desc:"BBQ и шашлык контент — топ в КЗ весной/летом, миллионы просмотров", social2_platform:"Instagram", social2_desc:"Пикник-эстетика с готовым шашлыком — популярный формат", procurement_ready:"🟢 Готов к закупке", price_range:"3 500–7 000 ₸/кг", competitors:["Magnum","Small","Рамстор","Южный","Корзина"]},
  {...BASE, name:"Котлеты ручной формовки премиум", subname:"Мираторг / «Сочная» / локальные", category:"Полуфабрикаты", status:"📈 Растёт", heat:8, region:"Глобальный", instagram_idea:"«Бургер как в ресторане дома» — покажите как пожарить идеальную котлету. До/после + разрез сочной котлеты.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети, Мираторг лидирует", kz_status:"Активно продаётся", kz_detail:"Magnum, Small, Аян — но премиум сегмент слабо представлен", social1_platform:"TikTok", social1_desc:"Домашние бургеры — один из топ кулинарных форматов в СНГ", social2_platform:"Instagram", social2_desc:"«Идеальный бургер дома» — вовлекающий рецептный контент", procurement_ready:"🟢 Готов к закупке", price_range:"2 000–4 000 ₸/кг", competitors:["Magnum","Small","Рамстор"]},
  {...BASE, name:"Замороженные буррито / такос", subname:"El Sabor / Don Enrique / локальные", category:"Полуфабрикаты", status:"✨ Новинка", heat:7, region:"Америка", instagram_idea:"«Мексика дома за 3 минуты» — замороженное буррито в микроволновке. Сравните с домашним. Развлекательный Reels.", russia_status:"Появляется", russia_detail:"ВкусВилл, Wildberries — нишевый продукт растёт", kz_status:"Редко встречается", kz_detail:"Единичные позиции в Arbuz — почти нет в рознице", social1_platform:"TikTok", social1_desc:"Frozen burritos trend — миллиарды просмотров в США, заходит в СНГ", social2_platform:"Instagram", social2_desc:"Мексиканская кухня дома — растущий тренд у молодёжи КЗ", procurement_ready:"🟡 Ищем поставщика", price_range:"600–1 400 ₸", competitors:["Arbuz"]},
  {...BASE, name:"Манты с нестандартными начинками", subname:"Тыква+мясо / шпинат / сыр-зелень", category:"Полуфабрикаты", status:"✨ Новинка", heat:8, region:"Глобальный", instagram_idea:"«Манты которых ты ещё не пробовал» — тыквенные, шпинатные, с сыром. Слепой тест — угадай начинку!", russia_status:"Появляется", russia_detail:"Локальные производители экспериментируют с вкусами", kz_status:"Появляется", kz_detail:"Локальные KZ производители начинают выпускать — ниша почти свободна", social1_platform:"TikTok", social1_desc:"Необычные манты — вирусный формат у казахстанских фуд-блогеров", social2_platform:"Instagram", social2_desc:"«Наши манты, но другие» — патриотичный + инновационный контент", procurement_ready:"🟡 Ищем поставщика", price_range:"1 500–3 000 ₸", competitors:["Magnum"]},
  {...BASE, name:"Блины с начинкой готовые", subname:"«Сытый дворянин» / «Моё меню» / локальные", category:"Полуфабрикаты", status:"📈 Растёт", heat:7, region:"Европа", instagram_idea:"«Завтрак за 2 минуты» — готовые блины с сыром и ветчиной из морозилки. Лайфхак для занятых.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети, широкий ассортимент", kz_status:"Появляется", kz_detail:"Magnum, Small — ограниченный выбор, спрос есть", social1_platform:"TikTok", social1_desc:"«Быстрый завтрак» форматы — готовые блины в топе ленивой кухни", social2_platform:"Instagram", social2_desc:"Лайфхаки быстрого завтрака — активная аудитория мам и студентов КЗ", procurement_ready:"🟢 Готов к закупке", price_range:"700–1 500 ₸", competitors:["Magnum","Small"]},
  {...BASE, name:"Лосось охлаждённый стейки/филе", subname:"Норвегия / «Русское море» / SalMar", category:"Морепродукты", status:"🔥 Горячий", heat:10, region:"Европа", instagram_idea:"«Ресторанный лосось дома» — сочный стейк на сковороде за 10 минут. Покажите разрез — золотистая корочка и розовая середина.", russia_status:"Активно продаётся", russia_detail:"Все сети, «Перекрёсток», «Магнит» — норвежский лосось доминирует", kz_status:"Появляется", kz_detail:"Magnum Premium, Arbuz — охлаждённый редкость, в основном замороженный", social1_platform:"TikTok", social1_desc:"Рецепты с лососем — один из топ фуд-форматов глобально, миллиарды просмотров", social2_platform:"Instagram", social2_desc:"Poke bowl и стейки лосося — эстетичный контент казахстанских фуд-блогеров", procurement_ready:"🟡 Ищем поставщика", price_range:"5 500–9 000 ₸/кг", competitors:["Magnum","Arbuz"]},
  {...BASE, name:"Poke-кит (лосось + соус + топпинги)", subname:"Готовый набор для poke bowl", category:"Морепродукты", status:"🔥 Горячий", heat:9, region:"Америка", instagram_idea:"«Гавайский боул за 5 минут» — покажите сборку poke bowl из готового набора. Эстетика японской кухни дома.", russia_status:"Появляется", russia_detail:"ВкусВилл, Ozon — нишевый продукт активно растёт", kz_status:"Редко встречается", kz_detail:"Пока почти отсутствует — огромная ниша для Аяна быть первыми", social1_platform:"TikTok", social1_desc:"#pokebowl — миллиарды просмотров, один из самых вирусных фуд-трендов 2025", social2_platform:"Instagram", social2_desc:"Эстетичные poke bowls — топ контент у казахстанских lifestyle-блогеров", procurement_ready:"🔴 Недоступно в КЗ", price_range:"3 500–6 000 ₸/набор", competitors:[]},
  {...BASE, name:"Креветки очищенные IQF (Vannamei)", subname:"Vannamei / тигровые / King Size", category:"Морепродукты", status:"🔥 Горячий", heat:9, region:"Азия", instagram_idea:"«Паста с креветками за 10 минут» — быстрый ресторанный рецепт дома. До/после — сырые и готовые.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети — широкий ассортимент размеров", kz_status:"Появляется", kz_detail:"Magnum, Small, Аян — замороженные есть, охлаждённые редкость", social1_platform:"TikTok", social1_desc:"Рецепты с креветками — топ-3 морепродуктового контента в СНГ", social2_platform:"Instagram", social2_desc:"Быстрые рецепты с креветками — активная аудитория КЗ", procurement_ready:"🟢 Готов к закупке", price_range:"2 500–5 000 ₸/кг", competitors:["Magnum","Small","Рамстор"]},
  {...BASE, name:"Мидии варёно-мороженые", subname:"Чили / Испания / «Санта-Бремор»", category:"Морепродукты", status:"📈 Растёт", heat:8, region:"Европа", instagram_idea:"«Мидии в сливочном соусе» — французский ресторан дома. Покажите как открываются раковины — ASMR формат.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети, широкий ассортимент", kz_status:"Появляется", kz_detail:"Magnum, Arbuz — ограниченный выбор, спрос растёт", social1_platform:"TikTok", social1_desc:"Мидии в вине/сливках — вирусный ресторанный формат дома", social2_platform:"Instagram", social2_desc:"«Доступный премиум» морепродукты — тренд у казахстанских фуд-блогеров", procurement_ready:"🟢 Готов к закупке", price_range:"1 800–3 500 ₸/кг", competitors:["Magnum","Arbuz"]},
  {...BASE, name:"Морской гребешок (дикий)", subname:"Северо-Курильская зона / Дальний Восток", category:"Морепродукты", status:"✨ Новинка", heat:8, region:"Азия", instagram_idea:"«Ресторанный гребешок дома» — обжарка на сливочном масле 2 минуты. Золотистая корочка = 100% вирал.", russia_status:"Появляется", russia_detail:"Wildberries, рыбные магазины, Ozon — премиум сегмент", kz_status:"Редко встречается", kz_detail:"Единичные позиции в Arbuz — почти отсутствует в рознице", social1_platform:"TikTok", social1_desc:"Гребешок на сковороде — один из самых красивых кулинарных видео форматов", social2_platform:"Instagram", social2_desc:"«Лакшери дома» — гребешок как в ресторане, lifestyle контент", procurement_ready:"🟡 Ищем поставщика", price_range:"4 000–8 000 ₸/кг", competitors:["Arbuz"]},
  {...BASE, name:"Кальмар тушки очищенные", subname:"Перу / Вьетнам / «Санта-Бремор»", category:"Морепродукты", status:"📈 Растёт", heat:7, region:"Азия", instagram_idea:"«Кальмары фри за 5 минут» — хрустящие кольца кальмара из морозилки. Простой рецепт — вирусный формат.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети — доступная цена", kz_status:"Активно продаётся", kz_detail:"Magnum, Small, Аян — хорошая представленность", social1_platform:"TikTok", social1_desc:"Кальмары фри — один из самых доступных морепродуктовых рецептов в СНГ", social2_platform:"Instagram", social2_desc:"Быстрые снеки из морепродуктов — популярный формат у молодёжи КЗ", procurement_ready:"🟢 Готов к закупке", price_range:"1 200–2 500 ₸/кг", competitors:["Magnum","Small","Рамстор","Южный"]},
  {...BASE, name:"Премиум консервы (осьминог/лосось в масле)", subname:"Rügen Fisch / Jose Gourmet / Ortiz", category:"Морепродукты", status:"✨ Новинка", heat:8, region:"Европа", instagram_idea:"«Seacuterie board» — морская доска вместо мясной. Красиво раскладываем консервы, сыр, крекеры. Вирусный тренд 2026!", russia_status:"Появляется", russia_detail:"«Азбука вкуса», Wildberries — премиум консервы активно растут", kz_status:"Редко встречается", kz_detail:"Единичные позиции в Arbuz — огромная ниша для Аяна", social1_platform:"TikTok", social1_desc:"#seacuterieboard #тиннедфиш — вирусный тренд 2026, миллионы просмотров", social2_platform:"Instagram", social2_desc:"Эстетичные морские доски — топ контент у foodie-блогеров мира", procurement_ready:"🟡 Ищем поставщика", price_range:"1 500–4 500 ₸/банка", competitors:["Arbuz"]},
  {...BASE, name:"Крабовые палочки премиум Vici", subname:"Viciunai Group / Vici / «Меридиан»", category:"Морепродукты", status:"✅ Стабильный", heat:7, region:"Европа", instagram_idea:"«Крабовый салат нового уровня» — покажите разницу между обычными и премиум крабовыми палочками. Состав и вкус.", russia_status:"Активно продаётся", russia_detail:"Vici — лидер рынка КЗ и РФ, все сети", kz_status:"Активно продаётся", kz_detail:"Magnum, Small, Аян, Рамстор — широко представлены, но премиум сегмент слабее", social1_platform:"TikTok", social1_desc:"Крабовые салаты и рецепты — стабильный контент в СНГ", social2_platform:"Instagram", social2_desc:"«Лучший крабовый салат» — вечный формат для праздничного контента", procurement_ready:"🟢 Готов к закупке", price_range:"800–2 000 ₸", competitors:["Magnum","Small","Рамстор","Южный","Корзина","Норма"]},
  {...BASE, name:"Органическое детское питание (пюре)", subname:"HiPP / Gerber Organic / «Агуша»", category:"Мама и младенец", status:"🔥 Горячий", heat:9, region:"Европа", instagram_idea:"«Только лучшее для малыша» — сравните состав обычного и органического пюре.", russia_status:"Активно продаётся", russia_detail:"Все аптеки, «Детский мир», федеральные сети", kz_status:"Появляется", kz_detail:"Аптеки, Kaspi, отдельные позиции в Magnum", social1_platform:"Instagram", social1_desc:"Мамские блогеры КЗ активно рекомендуют органическое питание", social2_platform:"TikTok", social2_desc:"«Что я даю своему ребёнку» — популярный формат у мам-блогеров", procurement_ready:"🟡 Ищем поставщика", price_range:"600–1 400 ₸/шт", competitors:["Magnum","Рамстор"]},
  {...BASE, name:"Снеки и печенье для малышей", subname:"Heinz / Gerber рисовые хлебцы", category:"Мама и младенец", status:"📈 Растёт", heat:7, region:"Европа", instagram_idea:"«Первые снеки малыша» — безопасные перекусы от 6 месяцев. Образовательный пост для мам.", russia_status:"Активно продаётся", russia_detail:"«Детский мир», аптеки, все сети", kz_status:"Появляется", kz_detail:"Аптеки, Kaspi — ограниченный ассортимент", social1_platform:"Instagram", social1_desc:"Мамские блогеры КЗ показывают прикорм", social2_platform:"TikTok", social2_desc:"«Что едят дети до года» — вирусный формат", procurement_ready:"🟡 Ищем поставщика", price_range:"500–1 200 ₸", competitors:["Рамстор"]},
  {...BASE, name:"Колбаса без нитритов (чистый состав)", subname:"ВкусВилл / Organic / Мираторг Premium", category:"Колбасные изделия", status:"✨ Новинка", heat:8, region:"Европа", instagram_idea:"«Колбаса без химии» — покажите состав обычной vs чистой. Шокирующий образовательный контент.", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, премиум-сети", kz_status:"Редко встречается", kz_detail:"Пока отсутствует — большая возможность для Аян", social1_platform:"TikTok", social1_desc:"«Читаем состав колбасы» — миллионы просмотров, люди в шоке", social2_platform:"Instagram", social2_desc:"ЗОЖ-блогеры КЗ требуют чистый состав", procurement_ready:"🟡 Ищем поставщика", price_range:"2 500–4 500 ₸/кг", competitors:[]},
  {...BASE, name:"Халяль-колбасные изделия премиум", subname:"Локальные KZ бренды / «Рамазан»", category:"Колбасные изделия", status:"🔥 Горячий", heat:9, region:"Глобальный", instagram_idea:"«Халяль и вкусно» — ассортимент халяль-колбасы в Аян. Важно для Рамадана.", russia_status:"Появляется", russia_detail:"Мусульманские магазины, отдельные сети", kz_status:"Активно продаётся", kz_detail:"Все сети КЗ — огромный и растущий спрос", social1_platform:"Instagram", social1_desc:"Халяль-лайфстайл блогеры КЗ рекомендуют проверенные бренды", social2_platform:"TikTok", social2_desc:"Рецепты с халяль-мясными продуктами — топ в Казахстане", procurement_ready:"🟢 Готов к закупке", price_range:"2 000–4 000 ₸/кг", competitors:["Magnum","Small","Рамстор","Южный","Норма","Корзина"]},
  {...BASE, name:"Корейские соусы (кочуджан, самджан)", subname:"CJ / Chungjungone / Bibigo", category:"Соусы", status:"🔥 Горячий", heat:9, region:"Азия", instagram_idea:"«Корейская кухня дома» — покажите как приготовить тток-покки с соусом из Аяна.", russia_status:"Активно продаётся", russia_detail:"Wildberries, азиатские маркеты, «Азбука вкуса»", kz_status:"Появляется", kz_detail:"Азиатские маркеты Алматы, Kaspi — растущий спрос", social1_platform:"TikTok", social1_desc:"K-food рецепты с корейскими соусами — миллиарды просмотров", social2_platform:"Instagram", social2_desc:"Казахстанские фуд-блогеры готовят корейские блюда", procurement_ready:"🟡 Ищем поставщика", price_range:"800–2 200 ₸", competitors:["Arbuz"]},
  {...BASE, name:"Трюфельные масла и премиум-соусы", subname:"Белый трюфель / оливковые премиум", category:"Соусы", status:"✨ Новинка", heat:7, region:"Европа", instagram_idea:"«Ресторанный вкус дома» — капля трюфельного масла превращает пасту в деликатес.", russia_status:"Появляется", russia_detail:"«Азбука вкуса», Ozon, премиум-сети", kz_status:"Редко встречается", kz_detail:"Arbuz, единичные позиции в Magnum Premium", social1_platform:"Instagram", social1_desc:"Лакшери-кухня дома — трюфельные продукты в тренде у lifestyle-блогеров", social2_platform:"TikTok", social2_desc:"«Дорогой ингредиент который меняет всё» — вирусный формат", procurement_ready:"🟡 Ищем поставщика", price_range:"2 500–8 000 ₸", competitors:["Arbuz"]},
  {...BASE, name:"Готовые нарезки и микс-салаты", subname:"Мытые/нарезанные овощи в упаковке", category:"Овощи и фрукты", status:"📈 Растёт", heat:8, region:"Европа", instagram_idea:"«Салат за 2 минуты» — открыл пакет, заправил, готово. Быстрый ЗОЖ-перекус.", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, «Перекрёсток», «Магнит Свежесть»", kz_status:"Появляется", kz_detail:"Отдельные позиции в Magnum и Arbuz — ниша почти свободна", social1_platform:"TikTok", social1_desc:"«Ленивый ЗОЖ» — готовые нарезки экономят время", social2_platform:"Instagram", social2_desc:"Быстрые здоровые перекусы для занятых казахстанцев", procurement_ready:"🟡 Ищем поставщика", price_range:"500–1 200 ₸", competitors:["Magnum","Arbuz"]},
  {...BASE, name:"Экзотические фрукты (питахайя, мангостин)", subname:"Тайланд / Вьетнам / Колумбия", category:"Овощи и фрукты", status:"✨ Новинка", heat:8, region:"Азия", instagram_idea:"«Фрукты которые ты не пробовал» — показываем как есть питахайю. Реакция — чистый вирал.", russia_status:"Активно продаётся", russia_detail:"«Азбука вкуса», рынки, импортёры", kz_status:"Редко встречается", kz_detail:"Рынки Алматы, редко в Magnum Premium — огромная ниша", social1_platform:"TikTok", social1_desc:"«Пробуем экзотические фрукты» — один из самых вирусных форматов", social2_platform:"Instagram", social2_desc:"Эстетичные фото экзотических фруктов — топ у lifestyle-блогеров КЗ", procurement_ready:"🟡 Ищем поставщика", price_range:"1 500–4 000 ₸/кг", competitors:["Arbuz"]},
  {...BASE, name:"Безглютеновый хлеб и выпечка", subname:"Glutano / Dr.Schär / локальные", category:"Хлебобулочные", status:"📈 Растёт", heat:7, region:"Европа", instagram_idea:"«Хлеб без глютена — вкусно?» — слепой тест с покупателями.", russia_status:"Появляется", russia_detail:"ВкусВилл, аптеки, специализированные магазины", kz_status:"Редко встречается", kz_detail:"Аптеки, Kaspi — почти нет в обычных сетях", social1_platform:"Instagram", social1_desc:"ЗОЖ-блогеры КЗ ищут безглютеновые альтернативы", social2_platform:"TikTok", social2_desc:"«Я 30 дней без глютена» — популярный челлендж", procurement_ready:"🟡 Ищем поставщика", price_range:"700–2 000 ₸", competitors:[]},
  {...BASE, name:"Ремесленный хлеб на закваске", subname:"Sourdough / «Бородинский» premium", category:"Хлебобулочные", status:"🔥 Горячий", heat:8, region:"Европа", instagram_idea:"«Хлеб как в пекарне» — покажите разрез ремесленного хлеба. ASMR-корочка = миллион просмотров.", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, пекарни, «Азбука вкуса»", kz_status:"Появляется", kz_detail:"Пекарни Алматы и Астаны — в супермаркетах почти нет", social1_platform:"TikTok", social1_desc:"ASMR разрезание хлеба на закваске — миллионы просмотров", social2_platform:"Instagram", social2_desc:"Эстетика домашней выпечки и ремесленного хлеба", procurement_ready:"🟡 Ищем поставщика", price_range:"800–1 800 ₸", competitors:["Arbuz"]},
  {...BASE, name:"Jinro Soju (соджу)", subname:"HiteJinro / Chum Churum", category:"Алкоголь", status:"🔥 Горячий", heat:9, region:"Азия", instagram_idea:"«Корейский алкоголь в Аяне» — покажите как пить соджу по-корейски. Viral-тренд через K-drama.", russia_status:"Активно продаётся", russia_detail:"Wildberries, азиатские маркеты, «Азбука вкуса»", kz_status:"Появляется", kz_detail:"Азиатские маркеты Алматы, Kaspi — спрос быстро растёт", social1_platform:"TikTok", social1_desc:"#soju — миллиарды просмотров через K-drama и корейские челленджи", social2_platform:"Instagram", social2_desc:"Казахстанские lifestyle-блогеры пробуют корейский алкоголь", procurement_ready:"🟡 Ищем поставщика", price_range:"1 800–3 500 ₸", competitors:["Arbuz"]},
  {...BASE, name:"Сидр Somersby / Strongbow", subname:"Somersby Apple / Strongbow Gold", category:"Алкоголь", status:"🔥 Горячий", heat:8, region:"Европа", instagram_idea:"«Лёгкий летний напиток» — сидр как альтернатива пиву. Фото у барбекю на природе.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети", kz_status:"Появляется", kz_detail:"Magnum, Small — ограниченный ассортимент, спрос растёт", social1_platform:"TikTok", social1_desc:"Сидр-челленджи и летние напитки — растущий тренд в СНГ", social2_platform:"Instagram", social2_desc:"Пикник-эстетика с сидром — популярный lifestyle-контент", procurement_ready:"🟢 Готов к закупке", price_range:"700–1 200 ₸", competitors:["Magnum","Small","Рамстор"]},
  {...BASE, name:"Просекко / Кава (игристое вино)", subname:"Zonin Prosecco / Freixenet Cava", category:"Алкоголь", status:"📈 Растёт", heat:8, region:"Европа", instagram_idea:"«Праздник каждый день» — бокал просекко вместо шампанского. Доступная роскошь.", russia_status:"Активно продаётся", russia_detail:"«Азбука вкуса», Wildberries, все премиум-сети", kz_status:"Появляется", kz_detail:"Arbuz, Magnum Premium — растущий спрос среди 25-35 лет", social1_platform:"Instagram", social1_desc:"Бранч-культура с просекко — топ lifestyle-формат КЗ", social2_platform:"TikTok", social2_desc:"«Девичник / день рождения» форматы с игристым вином", procurement_ready:"🟡 Ищем поставщика", price_range:"3 500–7 000 ₸", competitors:["Arbuz","Рамстор"]},
  {...BASE, name:"Джин Hendrick's / Tanqueray", subname:"Hendrick's Gin / Tanqueray / Bombay", category:"Алкоголь", status:"✨ Новинка", heat:7, region:"Европа", instagram_idea:"«Джин-тоник дома» — покажите как приготовить идеальный G&T. Рецепты коктейлей в Reels.", russia_status:"Активно продаётся", russia_detail:"«Азбука вкуса», бары, Wildberries", kz_status:"Появляется", kz_detail:"Arbuz, рестораны Алматы и Астаны — в рознице пока мало", social1_platform:"TikTok", social1_desc:"Домашние коктейли с джином — вирусный формат у барменов", social2_platform:"Instagram", social2_desc:"Эстетика gin & tonic с огурцом и цветами", procurement_ready:"🟡 Ищем поставщика", price_range:"12 000–25 000 ₸", competitors:["Arbuz"]},
  {...BASE, name:"Пиво с необычными вкусами (Flavored)", subname:"Carlsberg Unfiltered / Efes Brew House", category:"Алкоголь", status:"📈 Растёт", heat:8, region:"Европа", instagram_idea:"«Пиво которое удивит» — слепой тест вкусов с сотрудниками. Какой вкус угадают?", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети — быстрорастущий сегмент", kz_status:"Активно продаётся", kz_detail:"Magnum, Small, Аян — Carlsberg и Efes широко представлены", social1_platform:"TikTok", social1_desc:"Дегустации необычного пива — популярный формат у фуд-блогеров", social2_platform:"Instagram", social2_desc:"Обзоры новинок пива от казахстанских lifestyle-блогеров", procurement_ready:"🟢 Готов к закупке", price_range:"500–900 ₸", competitors:["Magnum","Small","Рамстор","Южный","Норма"]},
  {...BASE, name:"Безалкогольное вино Leitz / Oddbird", subname:"Leitz Eins Zwei Zero / Oddbird Sparkling", category:"Алкоголь", status:"✨ Новинка", heat:8, region:"Европа", instagram_idea:"«Праздник без алкоголя» — идеально для Рамадана, беременных, водителей.", russia_status:"Появляется", russia_detail:"«Азбука вкуса», Wildberries — быстрорастущий сегмент", kz_status:"Редко встречается", kz_detail:"Единичные позиции в Arbuz — огромная ниша для КЗ", social1_platform:"Instagram", social1_desc:"Халяль-лайфстайл блогеры КЗ показывают безалкогольные альтернативы", social2_platform:"TikTok", social2_desc:"«Как отмечать без алкоголя» — актуально для мусульманской аудитории", procurement_ready:"🟡 Ищем поставщика", price_range:"2 500–5 500 ₸", competitors:["Arbuz"]},
  {...BASE, name:"Виски Jack Daniel's Honey / Tennessee", subname:"Jack Daniel's / Jim Beam Honey", category:"Алкоголь", status:"📈 Растёт", heat:7, region:"Америка", instagram_idea:"«Американский виски в Аяне» — как правильно пить виски. Образовательный контент для мужской аудитории.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети, широкая дистрибуция", kz_status:"Появляется", kz_detail:"Magnum Premium, Arbuz, рестораны — розница ограничена", social1_platform:"TikTok", social1_desc:"«Виски для начинающих» — образовательный формат набирает популярность", social2_platform:"Instagram", social2_desc:"Мужской lifestyle контент с виски у казахстанских блогеров", procurement_ready:"🟡 Ищем поставщика", price_range:"8 500–15 000 ₸", competitors:["Arbuz","Рамстор"]},
];

async function callAI(prompt) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
    body:JSON.stringify({model:"claude-sonnet-4-20250514", max_tokens:1800, messages:[{role:"user",content:prompt}]}),
  });
  if (!resp.ok) { const t=await resp.text().catch(()=>""); throw new Error(`HTTP ${resp.status}: ${t.slice(0,150)}`); }
  const data = await resp.json();
  return (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n").replace(/```json|```/gi,"").trim();
}

function parseJsonArray(text) {
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch(_){}
  try { return JSON.parse(m[0].replace(/,?\s*\{[^}]*$/,"")+"]"); } catch(_){ return null; }
}

function Tag({ children, bg, color }) {
  return <span style={{display:"inline-block",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:5,textTransform:"uppercase",letterSpacing:"0.05em",background:bg,color}}>{children}</span>;
}

function HeatBar({ value }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:70,height:4,background:"#2a2a3d",borderRadius:2}}>
        <div style={{width:`${(value||5)*10}%`,height:"100%",borderRadius:2,background:"linear-gradient(90deg,#7c3aed,#ff4d6d)"}}/>
      </div>
      <span style={{fontSize:11,color:"#6b7280"}}>{value}/10</span>
    </div>
  );
}

function ReadyBadge({ value, onChange }) {
  const cfg = READY_CONFIG[value] || READY_CONFIG["🟡 Ищем поставщика"];
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{background:cfg.bg,color:cfg.color,border:"1px solid "+cfg.color,borderRadius:6,padding:"4px 6px",fontSize:11,fontWeight:700,cursor:"pointer",outline:"none",minWidth:150}}>
      {Object.keys(READY_CONFIG).map(k=><option key={k} value={k}>{k}</option>)}
    </select>
  );
}

function CompetitorCell({ competitors, onChange }) {
  const [adding, setAdding] = useState(false);
  const remove = c => onChange(competitors.filter(x=>x!==c));
  const add = c => { onChange([...competitors,c]); setAdding(false); };
  const absent = COMPETITORS.filter(c=>!competitors.includes(c));
  return (
    <div style={{minWidth:110}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:competitors.length?5:0}}>
        {competitors.map(c=>(
          <span key={c} onClick={()=>remove(c)} style={{fontSize:10,padding:"2px 7px",borderRadius:4,cursor:"pointer",fontWeight:600,background:"rgba(255,77,109,0.18)",color:"#ff4d6d",border:"1px solid #ff4d6d",display:"flex",alignItems:"center",gap:3,userSelect:"none"}}>
            {c} <span style={{fontSize:9,opacity:0.7}}>✕</span>
          </span>
        ))}
      </div>
      {absent.length>0 && (adding ? (
        <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
          {absent.map(c=>(
            <span key={c} onClick={()=>add(c)} style={{fontSize:10,padding:"2px 7px",borderRadius:4,cursor:"pointer",fontWeight:600,background:"rgba(42,42,61,0.9)",color:"#9ca3af",border:"1px solid #3a3a4d",userSelect:"none"}}>+ {c}</span>
          ))}
          <span onClick={()=>setAdding(false)} style={{fontSize:10,padding:"2px 7px",borderRadius:4,cursor:"pointer",color:"#6b7280",border:"1px solid #2a2a3d"}}>✕</span>
        </div>
      ) : (
        <span onClick={()=>setAdding(true)} style={{fontSize:10,padding:"2px 8px",borderRadius:4,cursor:"pointer",color:"#6b7280",border:"1px dashed #3a3a4d",userSelect:"none"}}>+ добавить</span>
      ))}
    </div>
  );
}

function ProcurementTooltip() {
  const [show, setShow] = useState(false);
  return (
    <div style={{position:"relative",display:"inline-flex",alignItems:"center",gap:4}} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      🚦 Закупка
      <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:15,height:15,background:"#7c3aed",color:"#fff",borderRadius:"50%",fontSize:9,fontWeight:800,cursor:"help"}}>?</span>
      {show && (
        <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,zIndex:999,background:"#1a1a26",border:"1px solid #7c3aed",borderRadius:10,padding:"12px 14px",minWidth:280,boxShadow:"0 8px 32px rgba(0,0,0,0.6)",pointerEvents:"none"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#a78bfa",marginBottom:10}}>🚦 Статусы закупки</div>
          {[
            {icon:"🟢",label:"Готов к закупке",desc:"Поставщик найден, можно заказывать прямо сейчас",color:"#22c55e"},
            {icon:"🟡",label:"Ищем поставщика",desc:"Товар трендовый, но поставщик под Аян ещё не найден — байер прорабатывает",color:"#fbbf24"},
            {icon:"🔴",label:"Недоступно в КЗ",desc:"Товар пока не завозится в Казахстан, мониторим на будущее",color:"#ff4d6d"},
          ].map(s=>(
            <div key={s.label} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
              <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{s.icon}</span>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:s.color,marginBottom:2}}>{s.label}</div>
                <div style={{fontSize:11,color:"#9ca3af",lineHeight:1.4}}>{s.desc}</div>
              </div>
            </div>
          ))}
          <div style={{marginTop:10,paddingTop:8,borderTop:"1px solid #2a2a3d",fontSize:11,color:"#6b7280"}}>
            💡 Фильтруйте по 🟢 чтобы видеть что можно заказать сегодня
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryFilterBtn({ cat, active, onClick }) {
  const [show, setShow] = useState(false);
  const icon = CAT_ICONS[cat] || "";
  const desc = CAT_DESCRIPTIONS[cat];
  return (
    <div style={{position:"relative",display:"inline-block"}}
      onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      <button onClick={onClick} style={{background:active?"#7c3aed":"transparent",color:active?"#fff":"#6b7280",border:"1px solid "+(active?"#7c3aed":"#2a2a3d"),borderRadius:6,padding:"6px 12px",fontSize:11,cursor:"pointer"}}>
        {icon?icon+" ":""}{cat}
      </button>
      {show && desc && (
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:999,background:"#1a1a26",border:"1px solid #2a2a3d",borderRadius:8,padding:"10px 12px",minWidth:220,maxWidth:280,boxShadow:"0 8px 24px rgba(0,0,0,0.5)",pointerEvents:"none",fontSize:11,color:"#9ca3af",lineHeight:1.5}}>
          <div style={{fontWeight:700,color:"#f0f0f8",marginBottom:4}}>{icon} {cat}</div>
          {desc}
        </div>
      )}
    </div>
  );
}

function RequestCell({ requestNum, requestStatus, onNumChange, onStatusChange }) {
  const statusCfg = REQUEST_STATUSES.find(s=>s.value===requestStatus) || REQUEST_STATUSES[0];
  return (
    <div style={{minWidth:140,display:"flex",flexDirection:"column",gap:5}}>
      <input
        value={requestNum}
        onChange={e=>onNumChange(e.target.value)}
        placeholder="№ заявки"
        style={{background:"#0a0a0f",border:"1px solid #2a2a3d",borderRadius:6,padding:"4px 8px",color:"#f0f0f8",fontSize:11,outline:"none",width:"100%"}}
      />
      <select value={requestStatus} onChange={e=>onStatusChange(e.target.value)}
        style={{background:statusCfg.bg,color:statusCfg.color,border:"1px solid "+statusCfg.color,borderRadius:6,padding:"3px 6px",fontSize:10,fontWeight:700,cursor:"pointer",outline:"none"}}>
        {REQUEST_STATUSES.map(s=><option key={s.value} value={s.value}>{s.value}</option>)}
      </select>
    </div>
  );
}

function KanbanBoard({ trends, onMove }) {
  const byCol = id => trends.filter(t=>(t.kanban||"idea")===id);
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginTop:4}}>
      {KANBAN_COLS.map(col=>(
        <div key={col.id} style={{background:"#12121a",border:"1px solid #2a2a3d",borderRadius:12,padding:12,minHeight:200}}>
          <div style={{fontSize:11,fontWeight:700,color:col.color,marginBottom:10,borderBottom:"2px solid "+col.color,paddingBottom:6}}>
            {col.label} <span style={{color:"#6b7280"}}>({byCol(col.id).length})</span>
          </div>
          {byCol(col.id).map((t,i)=>(
            <div key={i} style={{background:"#1a1a26",border:"1px solid #2a2a3d",borderRadius:8,padding:8,marginBottom:8}}>
              <div style={{fontWeight:600,fontSize:11,marginBottom:3,color:"#f0f0f8"}}>{t.name}</div>
              <div style={{fontSize:10,color:"#6b7280",marginBottom:5}}>{t.category} · {t.price_range||"—"}</div>
              <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                {KANBAN_COLS.filter(c=>c.id!==col.id).map(c=>(
                  <span key={c.id} onClick={()=>onMove(t.name,c.id)} style={{fontSize:9,padding:"2px 5px",borderRadius:3,background:"rgba(124,58,237,0.15)",color:"#a78bfa",cursor:"pointer",border:"1px solid #7c3aed"}}>
                    →{c.label.split(" ")[0]}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [trends, setTrends] = useState([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Все");
  const [readyFilter, setReadyFilter] = useState("Все");
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [lastUpdateTs, setLastUpdateTs] = useState(null);
  const [instaItem, setInstaItem] = useState(null);
  const [instaLoading, setInstaLoading] = useState(false);
  const [instaPosts, setInstaPosts] = useState(null);
  const [tab, setTab] = useState("table");

  const updateTrend = (name, patch) => {
    setTrends(prev => prev.map(t => {
      if (t.name !== name) return t;
      const updated = {...t, ...patch};
      if (t.id) sb.updateOne(t.id, patch);
      return updated;
    }));
  };
  const moveKanban = (name, col) => updateTrend(name,{kanban:col});

  // Load from Supabase on mount
  useEffect(() => {
    sb.getAll().then(data => {
      if (data && data.length > 0) {
        setTrends(data.map(t => ({...BASE, ...t, competitors: t.competitors || []})));
        setDbLoaded(true);
      } else {
        // First time — load fallback and save to DB
        setTrends(FALLBACK);
        sb.upsertAll(FALLBACK).then(() => {
          // Reload from DB to get IDs
          sb.getAll().then(fresh => {
            if (fresh && fresh.length > 0) {
              setTrends(fresh.map(t => ({...BASE, ...t, competitors: t.competitors || []})));
            }
            setDbLoaded(true);
          });
        });
      }
    }).catch((e) => {
      console.error("DB load error:", e);
      setTrends(FALLBACK);
      setDbLoaded(false);
    });
  }, []);

  const fetchTrends = async () => {
    setLoading(true); setError("");
    const batches = ["Снеки, Напитки, Готовая еда, Полуфабрикаты","Молочка, Здоровье, Мороженое, Высокобелковые","Бытовая химия, Кондитерка, Морепродукты, Мама и младенец","Колбасные изделия, Соусы, Овощи и фрукты","Хлебобулочные, Алкоголь"];
    const all = [];
    try {
      for (let i=0;i<batches.length;i++) {
        setProgress(`Шаг ${i+1}/5 — ${batches[i]}`);
        const text = await callAI(`Ты FMCG-эксперт по Казахстану. Верни JSON массив из 5 объектов для категорий: ${batches[i]}.
Только JSON без markdown. Поля (все строки кроме heat):
name, subname, category, status ("🔥 Горячий"|"✨ Новинка"|"📈 Растёт"|"✅ Стабильный"), heat (число 1-10), region (Азия|Америка|Европа|Глобальный), instagram_idea, russia_status ("Активно продаётся"|"Появляется"|"Редко встречается"|"Нет в продаже"), russia_detail, kz_status, kz_detail, social1_platform, social1_desc, social2_platform, social2_desc, procurement_ready ("🟢 Готов к закупке"|"🟡 Ищем поставщика"|"🔴 Недоступно в КЗ"), price_range (строка вида "500–1200 ₸"), competitors_kz (строка через запятую из: Magnum Small Arbuz Рамстор Южный Корзина Оптима Норма — кто из них уже продаёт, или пустая строка).`);
        const parsed = parseJsonArray(text);
        if (parsed) all.push(...parsed.map(t=>({...BASE,...t,competitors:t.competitors_kz?t.competitors_kz.split(",").map(s=>s.trim()).filter(Boolean):[],kanban:"idea"})));
      }
      if (all.length===0) throw new Error("AI вернул пустой ответ");
      setTrends(all);
      await sb.upsertAll(all);
      setDbLoaded(true);
      const now = new Date();
      setLastUpdate(now.toLocaleString("ru-KZ"));
      setLastUpdateTs(now.getTime());
    } catch(e) { setError(e.message); }
    setLoading(false); setProgress("");
  };

  const generatePost = async (item) => {
    setInstaItem(item); setInstaLoading(true); setInstaPosts(null);
    try {
      const text = await callAI(`Ты SMM-менеджер супермаркета Аян (Казахстан). Создай контент-пакет для товара: ${item.name} (${item.subname||""}).
Верни JSON массив из 3 объектов без markdown:
[
  {"variant":"📝 Instagram пост","caption":"80-120 слов с эмодзи для ленты","hashtags":"15 хэштегов для Казахстана"},
  {"variant":"🎬 Идея для Reels","caption":"Сценарий короткого видео 15-30 сек: что снимать, текст на экране, музыка","hashtags":"10 хэштегов"},
  {"variant":"📲 Stories (серия)","caption":"3 слайда Stories: слайд 1, слайд 2, слайд 3 — с призывом к действию","hashtags":"5 хэштегов"}
]`);
      setInstaPosts(parseJsonArray(text)||[{variant:"Базовый пост",caption:item.instagram_idea,hashtags:"#Аян #Казахстан #FMCG"}]);
    } catch(_) {
      setInstaPosts([{variant:"Базовый пост",caption:`🛒 ${item.name} уже в Аяне! ${item.instagram_idea}`,hashtags:"#Аян #Казахстан #Супермаркет"}]);
    }
    setInstaLoading(false);
  };

  const exportCSV = () => {
    const h=["#","Товар","Бренд","Категория","Регион","Статус","Интерес","Цена","Готовность к закупке","Конкуренты","Идея для контента","RU","RU детали","KZ","KZ детали","Соцсети 1","Соцсети 2","№ Заявки","Статус заявки","Канбан"];
    const rows=trends.map((t,i)=>[i+1,t.name,t.subname,t.category,t.region,(t.status||"").replace(/[🔥✨📈✅]/g,"").trim(),t.heat,t.price_range||"—",(t.procurement_ready||"").replace(/[🟢🟡🔴]/g,"").trim(),(t.competitors||[]).join("; "),`"${t.instagram_idea||""}"`,t.russia_status,`"${t.russia_detail||""}"`,t.kz_status,`"${t.kz_detail||""}"`,`"[${t.social1_platform}] ${t.social1_desc||""}"`,`"[${t.social2_platform}] ${t.social2_desc||""}"`,t.request_num||"—",t.request_status||"—",t.kanban||"idea"]);
    const csv=[h,...rows].map(r=>r.join(",")).join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"})); a.download=`Аян_FMCG_${new Date().toLocaleDateString("ru-KZ").replace(/\./g,"-")}.csv`; a.click();
  };

  const filtered = trends.filter(t=>{
    const catOk=filter==="Все"||t.category===filter;
    const readyOk=readyFilter==="Все"||(t.procurement_ready||"")===readyFilter;
    const q=search.toLowerCase();
    const searchOk=!q||(t.name||"").toLowerCase().includes(q)||(t.category||"").toLowerCase().includes(q);
    return catOk&&readyOk&&searchOk;
  });

  const B=(x={})=>({background:"#1a1a26",color:"#f0f0f8",border:"1px solid #2a2a3d",borderRadius:8,padding:"9px 14px",fontWeight:600,fontSize:12,cursor:"pointer",...x});
  const tabBtn=t=>B({background:tab===t?"#7c3aed":"#1a1a26",color:tab===t?"#fff":"#f0f0f8",border:"1px solid "+(tab===t?"#7c3aed":"#2a2a3d")});
  const fBtn=a=>({background:a?"#7c3aed":"transparent",color:a?"#fff":"#6b7280",border:"1px solid "+(a?"#7c3aed":"#2a2a3d"),borderRadius:6,padding:"6px 12px",fontSize:11,cursor:"pointer"});
  const TH={fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#6b7280",padding:"10px 12px",textAlign:"left",background:"#12121a",borderBottom:"1px solid #2a2a3d",whiteSpace:"nowrap"};
  const TD={padding:"10px 12px",fontSize:12,verticalAlign:"top",borderBottom:"1px solid #1e1e2e"};

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"#f0f0f8",fontFamily:"system-ui,sans-serif",padding:16}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:"linear-gradient(135deg,#ff4d6d,#7c3aed)",color:"#fff",fontWeight:800,fontSize:13,padding:"6px 14px",borderRadius:6,letterSpacing:1}}>АЯН</div>
          <span style={{color:"#6b7280",fontSize:12}}>FMCG Trend Intelligence v3.0</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#22c55e"}}>
          <div style={{width:7,height:7,background:"#22c55e",borderRadius:"50%",animation:"pulse 2s infinite"}}/>
          AI-мониторинг
          {lastUpdate && (() => {
            const days = lastUpdateTs ? Math.floor((Date.now() - lastUpdateTs) / 86400000) : 0;
            const isStale = days >= 7;
            return (
              <span style={{marginLeft:6,display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:"#6b7280"}}>{lastUpdate}</span>
                <span style={{
                  background: isStale ? "rgba(255,77,109,0.15)" : "rgba(34,197,94,0.15)",
                  color: isStale ? "#ff4d6d" : "#22c55e",
                  border: "1px solid " + (isStale ? "#ff4d6d" : "#22c55e"),
                  borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700
                }}>
                  {days === 0 ? "сегодня" : days === 1 ? "1 день назад" : `${days} дн. назад`}
                  {isStale ? " ⚠️ пора обновить" : ""}
                </span>
              </span>
            );
          })()}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:dbLoaded?"#22c55e":"#fbbf24"}}/>
          <span style={{color:dbLoaded?"#22c55e":"#fbbf24",fontWeight:600}}>{dbLoaded?"🗄️ БД подключена":"⚡ Локальный режим"}</span>
        </div>
      </div>

      <div style={{fontWeight:800,fontSize:22,background:"linear-gradient(135deg,#f0f0f8 40%,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:6}}>Трендовые товары для Казахстана</div>
      <div style={{color:"#6b7280",fontSize:13,marginBottom:20}}>Светофор закупки · Конкуренты · Цены · Канбан воронка</div>

      {trends.length === 0 && (
        <div style={{textAlign:"center",padding:60,color:"#6b7280"}}>
          <div style={{width:32,height:32,border:"3px solid #2a2a3d",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 16px"}}/>
          <div style={{fontSize:14}}>Загружаем данные из базы...</div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        {[["Товаров",trends.length,"#22c55e"],["🔥 Горячих",trends.filter(t=>t.status?.includes("Горячий")).length,"#ff4d6d"],["🟢 К закупке",trends.filter(t=>t.procurement_ready==="🟢 Готов к закупке").length,"#22c55e"],["🔴 Недоступно",trends.filter(t=>t.procurement_ready==="🔴 Недоступно в КЗ").length,"#ff4d6d"],["✨ Новинок",trends.filter(t=>t.status?.includes("Новинка")).length,"#fbbf24"],["📦 В ассорт.",trends.filter(t=>t.kanban==="done").length,"#7c3aed"]].map(([l,v,c])=>(
          <div key={l} style={{background:"#1a1a26",border:"1px solid #2a2a3d",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{l}</div>
            <div style={{fontWeight:800,fontSize:20,color:c}}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12,alignItems:"flex-start"}}>
        <div>
          <button style={{background:"linear-gradient(135deg,#ff4d6d,#7c3aed)",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:12,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.05em",opacity:loading?0.6:1}} disabled={loading} onClick={fetchTrends}>
            {loading?`⏳ ${progress}`:"⚡ Обновить тренды"}
          </button>
          {error&&<div style={{fontSize:11,color:"#f87171",marginTop:4,maxWidth:360}}>⚠️ {error}</div>}
        </div>
        <button style={B()} onClick={exportCSV}>⬇ Скачать CSV</button>
        <button style={tabBtn("table")} onClick={()=>setTab("table")}>📊 Таблица</button>
        <button style={tabBtn("kanban")} onClick={()=>setTab("kanban")}>📋 Канбан</button>
      </div>

      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
        {CATEGORIES.map(c=><CategoryFilterBtn key={c} cat={c} active={filter===c} onClick={()=>setFilter(c)}/>)}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
        {["Все","🟢 Готов к закупке","🟡 Ищем поставщика","🔴 Недоступно в КЗ"].map(r=>(
          <button key={r} style={fBtn(readyFilter===r)} onClick={()=>setReadyFilter(r)}>{r}</button>
        ))}
        <input placeholder="🔍 Поиск..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{background:"#1a1a26",border:"1px solid #2a2a3d",borderRadius:8,padding:"6px 12px",color:"#f0f0f8",fontSize:12,width:160,outline:"none",marginLeft:"auto"}}/>
      </div>

      {tab==="kanban" ? <KanbanBoard trends={trends} onMove={moveKanban}/> : (
        <div style={{background:"#12121a",border:"1px solid #2a2a3d",borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #2a2a3d",fontWeight:700,fontSize:13}}>
            📊 Таблица трендов — {filtered.length} позиций
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr>
                  {["#","Товар","Кат.","Регион","Статус","Интерес","💰 Цена ₸","ЗАКУПКА","🏪 Конкуренты","Идея для контента","🇷🇺 Россия","🇰🇿 Казахстан","📲 Соцсети","📋 Заявка","Действие"].map(h=>(
                    <th key={h} style={TH}>
                      {h==="ЗАКУПКА" ? <ProcurementTooltip/> : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={15} style={{...TD,textAlign:"center",color:"#6b7280",padding:40}}>Ничего не найдено</td></tr>
                ) : filtered.map((t,i)=>{
                  const reg=REGION_MAP[t.region]||REGION_MAP["Глобальный"];
                  const st=STATUS_MAP[t.status]||STATUS_MAP["✅ Стабильный"];
                  return (
                    <tr key={i}>
                      <td style={{...TD,color:"#6b7280"}}>{i+1}</td>
                      <td style={TD}>
                        <div style={{fontWeight:600,marginBottom:2}}>{t.name}</div>
                        <div style={{color:"#6b7280",fontSize:10}}>{t.subname}</div>
                      </td>
                      <td style={TD}><Tag bg="rgba(124,58,237,0.2)" color="#a78bfa">{t.category}</Tag></td>
                      <td style={TD}><Tag bg={reg.bg} color={reg.color}>{reg.icon} {t.region}</Tag></td>
                      <td style={TD}><Tag bg={st.bg} color={st.color}>{t.status}</Tag></td>
                      <td style={TD}><HeatBar value={t.heat||5}/></td>
                      <td style={{...TD,whiteSpace:"nowrap",fontWeight:700,color:"#fbbf24"}}>{t.price_range||"—"}</td>
                      <td style={TD}><ReadyBadge value={t.procurement_ready||"🟡 Ищем поставщика"} onChange={v=>updateTrend(t.name,{procurement_ready:v})}/></td>
                      <td style={TD}><CompetitorCell competitors={t.competitors||[]} onChange={v=>updateTrend(t.name,{competitors:v})}/></td>
                      <td style={{...TD,maxWidth:180,color:"#c4b5fd",lineHeight:1.5}}>{t.instagram_idea}</td>
                      <td style={TD}>
                        <div style={{fontSize:11,fontWeight:600,color:MARKET_COLOR[t.russia_status]||"#9ca3af",marginBottom:3}}>{t.russia_status}</div>
                        <div style={{fontSize:11,color:"#6b7280",maxWidth:140}}>{t.russia_detail}</div>
                      </td>
                      <td style={TD}>
                        <div style={{fontSize:11,fontWeight:600,color:MARKET_COLOR[t.kz_status]||"#9ca3af",marginBottom:3}}>{t.kz_status}</div>
                        <div style={{fontSize:11,color:"#6b7280",maxWidth:140}}>{t.kz_detail}</div>
                      </td>
                      <td style={{...TD,maxWidth:170}}>
                        {t.social1_platform&&<div style={{fontSize:11,marginBottom:4}}><span style={{color:"#7c3aed",fontWeight:600}}>[{t.social1_platform}]</span> <span style={{color:"#9ca3af"}}>{t.social1_desc}</span></div>}
                        {t.social2_platform&&<div style={{fontSize:11}}><span style={{color:"#7c3aed",fontWeight:600}}>[{t.social2_platform}]</span> <span style={{color:"#9ca3af"}}>{t.social2_desc}</span></div>}
                      </td>
                      <td style={TD}>
                        <RequestCell
                          requestNum={t.request_num||""}
                          requestStatus={t.request_status||"—"}
                          onNumChange={v=>updateTrend(t.name,{request_num:v})}
                          onStatusChange={v=>updateTrend(t.name,{request_status:v})}
                        />
                      </td>
                      <td style={TD}>
                        <div style={{display:"flex",flexDirection:"column",gap:5}}>
                          <button style={{...B(),fontSize:11,padding:"4px 10px",background:"linear-gradient(135deg,rgba(255,77,109,0.2),rgba(124,58,237,0.2))",border:"1px solid #7c3aed",color:"#c4b5fd"}} onClick={()=>generatePost(t)}>📱 Контент</button>
                          <select value={t.kanban||"idea"} onChange={e=>moveKanban(t.name,e.target.value)}
                            style={{background:"#0a0a0f",color:"#a78bfa",border:"1px solid #7c3aed",borderRadius:6,padding:"3px 6px",fontSize:10,cursor:"pointer",outline:"none"}}>
                            {KANBAN_COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {instaItem&&(
        <div style={{background:"#12121a",border:"1px solid #2a2a3d",borderRadius:14,marginTop:16,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <span style={{fontWeight:700,fontSize:13}}>📱 Контент-пакет — {instaItem.name}</span>
            <button style={B()} onClick={()=>{setInstaItem(null);setInstaPosts(null);}}>✕</button>
          </div>
          {instaLoading&&<div style={{textAlign:"center",padding:30,color:"#6b7280"}}>
            <div style={{width:28,height:28,border:"3px solid #2a2a3d",borderTopColor:"#ff4d6d",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 12px"}}/>
            Генерирую посты...
          </div>}
          {instaPosts&&instaPosts.map((p,i)=>(
            <div key={i} style={{background:"#1a1a26",border:"1px solid #2a2a3d",borderRadius:10,padding:14,marginBottom:12}}>
              <div style={{fontWeight:700,color:"#ff4d6d",marginBottom:8,fontSize:13}}>{p.variant}</div>
              <div style={{fontSize:13,color:"#d1d5db",lineHeight:1.7,marginBottom:8}}>{p.caption}</div>
              <div style={{fontSize:12,color:"#7c3aed"}}>{p.hashtags}</div>
              <button style={{background:"rgba(124,58,237,0.15)",color:"#a78bfa",border:"1px solid #7c3aed",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",marginTop:8}}
                onClick={()=>navigator.clipboard.writeText((p.caption||"")+"\n"+(p.hashtags||""))}>📋 Скопировать</button>
            </div>
          ))}
        </div>
      )}

      <div style={{marginTop:24,borderTop:"1px solid #2a2a3d",paddingTop:16,fontSize:11,color:"#6b7280"}}>
        Аян Супермаркет · Астана · Караганда · Темиртау · FMCG Intelligence v3.0
      </div>
    </div>
  );
}
