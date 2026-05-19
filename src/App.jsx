import { useState, useCallback } from "react";

const CATEGORIES = ["Все","Снеки","Напитки","Молочка","Здоровье","Бытовая химия","Кондитерка","Готовая еда","Мороженое","Полуфабрикаты","Морепродукты","Мама и младенец","Колбасные изделия","Соусы","Овощи и фрукты","Хлебобулочные","Алкоголь","Высокобелковые"];
const COMPETITORS = ["Magnum","Small","Arbuz","Рамстор","Южный","Корзина","Оптима","Норма","Другой"];

const REGION_MAP = {
  "Азия":      { bg:"rgba(251,146,60,0.18)",  color:"#fb923c", icon:"🌏" },
  "Америка":   { bg:"rgba(59,130,246,0.18)",  color:"#60a5fa", icon:"🌎" },
  "Европа":    { bg:"rgba(34,197,94,0.18)",   color:"#4ade80", icon:"🌍" },
  "Глобальный":{ bg:"rgba(156,163,175,0.18)", color:"#9ca3af", icon:"🌐" },
};
const STATUS_MAP = {
  "🔥 Горячий":    { bg:"rgba(255,77,109,0.18)", color:"#ff4d6d" },
  "✨ Новинка":    { bg:"rgba(251,191,36,0.18)", color:"#fbbf24" },
  "📈 Растёт":     { bg:"rgba(34,197,94,0.18)",  color:"#22c55e" },
  "✅ Стабильный": { bg:"rgba(107,114,128,0.2)", color:"#9ca3af" },
};
const MARKET_COLOR = {
  "Активно продаётся":"#22c55e","Появляется":"#fbbf24",
  "Редко встречается":"#fb923c","Нет в продаже":"#ff4d6d",
};
const READY_CONFIG = {
  "🟢 Готов к закупке":  { color:"#22c55e", bg:"rgba(34,197,94,0.15)" },
  "🟡 Ищем поставщика":  { color:"#fbbf24", bg:"rgba(251,191,36,0.15)" },
  "🔴 Недоступно в КЗ":  { color:"#ff4d6d", bg:"rgba(255,77,109,0.15)" },
};
const KANBAN_COLS = [
  { id:"idea",   label:"💡 Идея",            color:"#6b7280" },
  { id:"search", label:"🔍 Ищем поставщика", color:"#fbbf24" },
  { id:"nego",   label:"🤝 Переговоры",      color:"#7c3aed" },
  { id:"test",   label:"🧪 Тест-партия",     color:"#fb923c" },
  { id:"done",   label:"✅ В ассортименте",  color:"#22c55e" },
];

const BASE = {
  procurement_ready:"🟡 Ищем поставщика",
  price_range:"—", competitors:[], kanban:"idea",
};

const FALLBACK = [
  {...BASE, name:"Корейская лапша Buldak", subname:"Samyang", category:"Готовая еда", status:"🔥 Горячий", heat:10, region:"Азия", instagram_idea:"Reaction-видео с самой острой лапшей — viral-контент!", russia_status:"Активно продаётся", russia_detail:"Wildberries, Ozon, азиатские маркеты", kz_status:"Активно продаётся", kz_detail:"Kaspi, Magnum, Small, азиатские маркеты Алматы", social1_platform:"TikTok", social1_desc:"#buldakchallenge — 2 млрд просмотров", social2_platform:"Instagram", social2_desc:"Reaction-видео казахстанских блогеров", procurement_ready:"🟢 Готов к закупке", price_range:"800–1 200 ₸", competitors:["Magnum","Small"] },
  {...BASE, name:"Матча (латте и порошок)", subname:"Ito En / Jade Leaf", category:"Напитки", status:"🔥 Горячий", heat:9, region:"Азия", instagram_idea:"Эстетичные фото матча-латте — японский тренд уже в Аяне!", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, Wildberries, кофейни", kz_status:"Появляется", kz_detail:"Кофейни Алматы и Астаны, Kaspi", social1_platform:"TikTok", social1_desc:"Матча-рецепты — миллиарды просмотров", social2_platform:"Instagram", social2_desc:"Эстетика кофейных напитков", procurement_ready:"🟡 Ищем поставщика", price_range:"1 500–3 500 ₸", competitors:["Arbuz"] },
  {...BASE, name:"Протеиновые батончики", subname:"Bite / KetoDiet / Quest", category:"Снеки", status:"🔥 Горячий", heat:9, region:"Америка", instagram_idea:"Утреннее меню ЗОЖника — батончик + смузи с БЖУ.", russia_status:"Активно продаётся", russia_detail:"Wildberries, Ozon, ВкусВилл", kz_status:"Появляется", kz_detail:"Kaspi, спортпит-магазины Астаны", social1_platform:"TikTok", social1_desc:"#протеин — 50M+ просмотров", social2_platform:"Instagram", social2_desc:"Фитнес-блогеры КЗ сравнивают бренды", procurement_ready:"🟢 Готов к закупке", price_range:"700–1 800 ₸", competitors:["Magnum"] },
  {...BASE, name:"Чипсы лимитированных вкусов", subname:"Lay's / Pringles", category:"Снеки", status:"✨ Новинка", heat:9, region:"Глобальный", instagram_idea:"Слепой тест вкусов с сотрудниками — вовлекающий Reels.", russia_status:"Активно продаётся", russia_detail:"Все сети, выходят каждые 2-3 месяца", kz_status:"Появляется", kz_detail:"Magnum, Small, Аян", social1_platform:"TikTok", social1_desc:"Дегустации необычных вкусов — сотни тысяч просмотров", social2_platform:"Instagram", social2_desc:"Unboxing лимитированных снеков", procurement_ready:"🟢 Готов к закупке", price_range:"400–700 ₸", competitors:["Magnum","Small","Рамстор"] },
  {...BASE, name:"Кокосовая вода", subname:"Vita Coco / местные", category:"Напитки", status:"📈 Растёт", heat:8, region:"Глобальный", instagram_idea:"Гидратация нового поколения — сравните с обычной водой.", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, Wildberries", kz_status:"Появляется", kz_detail:"Магазины здорового питания, Kaspi", social1_platform:"Instagram", social1_desc:"Фитнес-модели пьют кокосовую воду", social2_platform:"TikTok", social2_desc:"Taste test разных брендов", procurement_ready:"🟡 Ищем поставщика", price_range:"900–1 400 ₸", competitors:["Arbuz"] },
  {...BASE, name:"Напитки с коллагеном", subname:"Beauty Collagen / Evalar", category:"Здоровье", status:"✨ Новинка", heat:8, region:"Азия", instagram_idea:"«Пьём красоту» — before/after кожа + напиток. Женская аудитория.", russia_status:"Активно продаётся", russia_detail:"Аптеки, Wildberries", kz_status:"Появляется", kz_detail:"Аптеки, Kaspi, beauty-магазины", social1_platform:"TikTok", social1_desc:"#коллаген — обзоры beauty-блогеров КЗ", social2_platform:"Instagram", social2_desc:"Нутрициологи рекомендуют", procurement_ready:"🟡 Ищем поставщика", price_range:"1 200–2 500 ₸", competitors:[] },
  {...BASE, name:"RTD Кофе (готовый)", subname:"Cold Brew / латте в банке", category:"Напитки", status:"✨ Новинка", heat:8, region:"Америка", instagram_idea:"«Кофе без очереди» — утренний ритуал на ходу.", russia_status:"Появляется", russia_detail:"ВкусВилл, Ozon", kz_status:"Редко встречается", kz_detail:"Единичные позиции в Magnum Premium", social1_platform:"TikTok", social1_desc:"Утро без кофемашины — 200M+ просмотров", social2_platform:"Instagram", social2_desc:"Кофейные блогеры КЗ тестируют новинки", procurement_ready:"🔴 Недоступно в КЗ", price_range:"600–1 100 ₸", competitors:["Magnum"] },
  {...BASE, name:"Протеиновые чипсы", subname:"Quest / PopCorners Flex", category:"Снеки", status:"✨ Новинка", heat:8, region:"Америка", instagram_idea:"«Снеки без вины» — сравните БЖУ с обычными.", russia_status:"Появляется", russia_detail:"Wildberries, спортмагазины", kz_status:"Редко встречается", kz_detail:"Спортпит-магазины Алматы", social1_platform:"TikTok", social1_desc:"«Ем чипсы и не толстею»", social2_platform:"Instagram", social2_desc:"Фитнес-блогеры сравнивают БЖУ", procurement_ready:"🔴 Недоступно в КЗ", price_range:"1 000–2 000 ₸", competitors:[] },
  {...BASE, name:"Йогурт с пробиотиками", subname:"Активиа / местные", category:"Молочка", status:"📈 Растёт", heat:7, region:"Европа", instagram_idea:"«Здоровье изнутри» — гид по пользе пробиотиков.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети", kz_status:"Активно продаётся", kz_detail:"Magnum, Small, Аян", social1_platform:"Instagram", social1_desc:"Gut health тренд — 100K+ лайков", social2_platform:"YouTube", social2_desc:"Диетологи КЗ о пробиотиках", procurement_ready:"🟢 Готов к закупке", price_range:"350–600 ₸", competitors:["Magnum","Small","Рамстор"] },
  {...BASE, name:"Гранола и мюсли", subname:"Mornflake / Myllyn Paras", category:"Здоровье", status:"📈 Растёт", heat:7, region:"Европа", instagram_idea:"«Завтрак чемпиона» — красивые bowl flat lay.", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, все сети", kz_status:"Появляется", kz_detail:"Magnum, Small, Аян", social1_platform:"Instagram", social1_desc:"Гранольные bowls — топ формат", social2_platform:"TikTok", social2_desc:"Правильный завтрак за 5 минут", procurement_ready:"🟢 Готов к закупке", price_range:"900–2 200 ₸", competitors:["Magnum","Arbuz"] },
  {...BASE, name:"Морские водоросли (снек)", subname:"GimMe / Ocean's Halo", category:"Снеки", status:"📈 Растёт", heat:7, region:"Азия", instagram_idea:"«Снек будущего» — азиатский тренд уже в Аяне.", russia_status:"Появляется", russia_detail:"Wildberries, азиатские маркеты", kz_status:"Редко встречается", kz_detail:"Азиатские маркеты Алматы, Kaspi", social1_platform:"TikTok", social1_desc:"Корейские снеки challenge", social2_platform:"Instagram", social2_desc:"ЗОЖ-блогеры рекомендуют нори", procurement_ready:"🟡 Ищем поставщика", price_range:"400–900 ₸", competitors:[] },
  {...BASE, name:"Безлактозное молоко", subname:"Parmalat / Простоквашино", category:"Молочка", status:"✅ Стабильный", heat:6, region:"Европа", instagram_idea:"Инфографика «Кому нужно безлактозное молоко».", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети", kz_status:"Активно продаётся", kz_detail:"Magnum, Small, Аян", social1_platform:"Instagram", social1_desc:"Нутрициологи о непереносимости лактозы", social2_platform:"YouTube", social2_desc:"Сравнение состава молока", procurement_ready:"🟢 Готов к закупке", price_range:"500–900 ₸", competitors:["Magnum","Small","Рамстор"] },
  {...BASE, name:"Экологичная бытовая химия", subname:"Ecover / eco-бренды", category:"Бытовая химия", status:"✨ Новинка", heat:6, region:"Европа", instagram_idea:"«Чисто без вреда» — сравните состав эко vs обычного.", russia_status:"Появляется", russia_detail:"ВкусВилл, Ozon", kz_status:"Редко встречается", kz_detail:"Онлайн Kaspi, eco-магазины Алматы", social1_platform:"Instagram", social1_desc:"Eco-lifestyle блогеры КЗ", social2_platform:"TikTok", social2_desc:"#экохим — разборы состава средств", procurement_ready:"🟡 Ищем поставщика", price_range:"1 200–3 000 ₸", competitors:[] },
  {...BASE, name:"Мороженое моти", subname:"My/Mo Mochi / Mikawaya", category:"Мороженое", status:"🔥 Горячий", heat:9, region:"Азия", instagram_idea:"«Японское мороженое в Аяне» — разрез моти в Reels.", russia_status:"Появляется", russia_detail:"Wildberries, азиатские маркеты Москвы", kz_status:"Редко встречается", kz_detail:"Азиатские маркеты Алматы, Kaspi", social1_platform:"TikTok", social1_desc:"ASMR разрез моти — миллионы просмотров", social2_platform:"Instagram", social2_desc:"Фуд-блогеры КЗ снимают реакции", procurement_ready:"🟡 Ищем поставщика", price_range:"700–1 400 ₸", competitors:["Arbuz"] },
  {...BASE, name:"Мороженое необычных вкусов", subname:"Матча, солёная карамель, тирамису", category:"Мороженое", status:"✨ Новинка", heat:8, region:"Глобальный", instagram_idea:"Слепой тест вкусов — вовлекающий Reels.", russia_status:"Активно продаётся", russia_detail:"Локальные производители", kz_status:"Появляется", kz_detail:"Местные KZ производители", social1_platform:"TikTok", social1_desc:"Слепые тесты мороженого", social2_platform:"Instagram", social2_desc:"Фуд-блогеры тестируют вкусы", procurement_ready:"🟢 Готов к закупке", price_range:"400–900 ₸", competitors:["Magnum","Small"] },
  {...BASE, name:"Протеиновое мороженое", subname:"Halo Top / Enlightened", category:"Высокобелковые", status:"📈 Растёт", heat:7, region:"Америка", instagram_idea:"«Мороженое без вины» — БЖУ vs обычный пломбир.", russia_status:"Появляется", russia_detail:"Wildberries, спортпит-магазины", kz_status:"Редко встречается", kz_detail:"Пока почти отсутствует — шанс быть первыми!", social1_platform:"TikTok", social1_desc:"«Мороженое для похудения» — вирусный формат", social2_platform:"Instagram", social2_desc:"Фитнес-блогеры КЗ запрашивают", procurement_ready:"🔴 Недоступно в КЗ", price_range:"1 500–3 000 ₸", competitors:[] },
  // Высокобелковые
  {...BASE, name:"Экспонента (протеиновые продукты)", subname:"Exponenta / Bio-Max Sport", category:"Высокобелковые", status:"🔥 Горячий", heat:9, region:"Европа", instagram_idea:"«Белок для роста» — покажите утро спортсмена с Экспонентой. Сравните белок с обычным творогом.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети, ВкусВилл", kz_status:"Появляется", kz_detail:"Отдельные позиции в Magnum, Kaspi — растёт спрос", social1_platform:"TikTok", social1_desc:"#экспонента #протеиновыйтворог — сотни тысяч просмотров у спорт-блогеров", social2_platform:"Instagram", social2_desc:"Фитнес-блогеры КЗ делают обзоры протеиновых молочных продуктов", procurement_ready:"🟡 Ищем поставщика", price_range:"600–1 200 ₸", competitors:["Magnum"] },
  {...BASE, name:"Протеиновые коктейли RTD", subname:"Muscle Milk / FitKit / Prime", category:"Высокобелковые", status:"🔥 Горячий", heat:8, region:"Америка", instagram_idea:"«Белок в банке» — готовый протеин после тренировки без шейкера. Спортивный образ жизни.", russia_status:"Активно продаётся", russia_detail:"Wildberries, спортпит-магазины, Ozon", kz_status:"Появляется", kz_detail:"Спортпит-магазины Астаны и Алматы, Kaspi", social1_platform:"TikTok", social1_desc:"Post-workout routine — RTD протеин топ у фитнес-блогеров", social2_platform:"Instagram", social2_desc:"Спортивный контент КЗ: тренировка + протеиновый коктейль", procurement_ready:"🟡 Ищем поставщика", price_range:"900–1 800 ₸", competitors:[] },
  // Полуфабрикаты
  {...BASE, name:"Готовые маринованные мясные наборы", subname:"Шашлык / стейки маринованные", category:"Полуфабрикаты", status:"🔥 Горячий", heat:9, region:"Глобальный", instagram_idea:"«Шашлык за 30 минут» — покажите готовый набор от Аян. Идеально для майских праздников.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети, «Мираторг» доминирует", kz_status:"Активно продаётся", kz_detail:"Magnum, Small, Аян — локальные производители КЗ", social1_platform:"TikTok", social1_desc:"Рецепты шашлыка и BBQ — миллионы просмотров в СНГ весной/летом", social2_platform:"Instagram", social2_desc:"Казахстанские фуд-блогеры показывают домашние пикники", procurement_ready:"🟢 Готов к закупке", price_range:"2 500–6 000 ₸/кг", competitors:["Magnum","Small","Рамстор"] },
  {...BASE, name:"Пельмени / манты премиум", subname:"«Останкино» / «Сибирская коллекция»", category:"Полуфабрикаты", status:"📈 Растёт", heat:7, region:"Европа", instagram_idea:"«Ужин за 15 минут» — сравните состав обычных и премиум пельменей. Образовательный пост.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети, широкий ассортимент", kz_status:"Активно продаётся", kz_detail:"Magnum, Small, Аян — хорошая представленность", social1_platform:"TikTok", social1_desc:"«Быстрый ужин» форматы — пельмени в топе", social2_platform:"Instagram", social2_desc:"Лайфхаки быстрой готовки с полуфабрикатами", procurement_ready:"🟢 Готов к закупке", price_range:"1 200–2 800 ₸", competitors:["Magnum","Small","Рамстор"] },
  // Морепродукты (охлаждённые)
  {...BASE, name:"Охлаждённая красная рыба (лосось/форель)", subname:"«Русское море» / норвежский лосось", category:"Морепродукты", status:"🔥 Горячий", heat:9, region:"Европа", instagram_idea:"«Ресторан дома» — стейк лосося за 20 минут. Покажите сочный разрез — идеально для Reels.", russia_status:"Активно продаётся", russia_detail:"Все сети, «Магнит», «Перекрёсток»", kz_status:"Появляется", kz_detail:"Magnum Premium, Arbuz — дорогой сегмент растёт", social1_platform:"TikTok", social1_desc:"Рецепты с лососем — один из топ-форматов фуд-контента", social2_platform:"Instagram", social2_desc:"Казахстанские фуд-блогеры готовят ресторанные блюда дома", procurement_ready:"🟡 Ищем поставщика", price_range:"5 500–9 000 ₸/кг", competitors:["Magnum","Arbuz"] },
  {...BASE, name:"Очищенные охлаждённые креветки", subname:"Vannamei / тигровые креветки", category:"Морепродукты", status:"📈 Растёт", heat:7, region:"Азия", instagram_idea:"«Паста с креветками за 10 минут» — быстрый ресторанный рецепт дома. Видео-формат.", russia_status:"Активно продаётся", russia_detail:"Все федеральные сети", kz_status:"Появляется", kz_detail:"Magnum, Arbuz — охлаждённые редкость, в основном замороженные", social1_platform:"TikTok", social1_desc:"Быстрые рецепты с морепродуктами — тренд у казахстанских фуд-блогеров", social2_platform:"Instagram", social2_desc:"Эстетичная подача морепродуктов дома", procurement_ready:"🟡 Ищем поставщика", price_range:"3 500–6 000 ₸/кг", competitors:["Magnum","Arbuz"] },
  // Мама и младенец
  {...BASE, name:"Органическое детское питание (пюре)", subname:"HiPP / Gerber Organic / «Агуша»", category:"Мама и младенец", status:"🔥 Горячий", heat:9, region:"Европа", instagram_idea:"«Только лучшее для малыша» — сравните состав обычного и органического пюре. Мамский контент.", russia_status:"Активно продаётся", russia_detail:"Все аптеки, «Детский мир», федеральные сети", kz_status:"Появляется", kz_detail:"Аптеки, Kaspi, отдельные позиции в Magnum", social1_platform:"Instagram", social1_desc:"Мамские блогеры КЗ активно рекомендуют органическое питание", social2_platform:"TikTok", social2_desc:"«Что я даю своему ребёнку» — популярный формат у мам-блогеров", procurement_ready:"🟡 Ищем поставщика", price_range:"600–1 400 ₸/шт", competitors:["Magnum","Рамстор"] },
  {...BASE, name:"Снеки и печенье для малышей", subname:"«Heinz» / «Gerber» рисовые хлебцы", category:"Мама и младенец", status:"📈 Растёт", heat:7, region:"Европа", instagram_idea:"«Первые снеки малыша» — безопасные перекусы от 6 месяцев. Образовательный пост для мам.", russia_status:"Активно продаётся", russia_detail:"«Детский мир», аптеки, все сети", kz_status:"Появляется", kz_detail:"Аптеки, Kaspi — ограниченный ассортимент", social1_platform:"Instagram", social1_desc:"Мамские блогеры КЗ показывают прикорм — сотни тысяч просмотров", social2_platform:"TikTok", social2_desc:"«Что едят дети до года» — вирусный формат", procurement_ready:"🟡 Ищем поставщика", price_range:"500–1 200 ₸", competitors:["Рамстор"] },
  // Колбасные изделия
  {...BASE, name:"Колбаса без нитритов / «чистый состав»", subname:"«ВкусВилл» / Organic / «Мираторг» Premium", category:"Колбасные изделия", status:"✨ Новинка", heat:8, region:"Европа", instagram_idea:"«Колбаса без химии» — покажите состав обычной vs чистой. Шокирующий образовательный контент.", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, премиум-сети", kz_status:"Редко встречается", kz_detail:"Пока отсутствует — большая возможность для Аян", social1_platform:"TikTok", social1_desc:"«Читаем состав колбасы» — миллионы просмотров, люди в шоке", social2_platform:"Instagram", social2_desc:"ЗОЖ-блогеры КЗ требуют чистый состав в мясных изделиях", procurement_ready:"🟡 Ищем поставщика", price_range:"2 500–4 500 ₸/кг", competitors:[] },
  {...BASE, name:"Халяль-колбасные изделия премиум", subname:"Локальные KZ бренды / «Рамазан»", category:"Колбасные изделия", status:"🔥 Горячий", heat:9, region:"Глобальный", instagram_idea:"«Халяль и вкусно» — покажите ассортимент халяль-колбасы в Аян. Важно для Рамадана.", russia_status:"Появляется", russia_detail:"Мусульманские магазины, отдельные сети", kz_status:"Активно продаётся", kz_detail:"Все сети КЗ — огромный и растущий спрос", social1_platform:"Instagram", social1_desc:"Халяль-лайфстайл блогеры КЗ рекомендуют проверенные бренды", social2_platform:"TikTok", social2_desc:"Рецепты с халяль-мясными продуктами — топ в Казахстане", procurement_ready:"🟢 Готов к закупке", price_range:"2 000–4 000 ₸/кг", competitors:["Magnum","Small","Рамстор","Южный","Норма","Корзина"] },
  // Соусы
  {...BASE, name:"Корейские соусы (кочуджан, самджан)", subname:"CJ / Chungjungone / Bibigo", category:"Соусы", status:"🔥 Горячий", heat:9, region:"Азия", instagram_idea:"«Корейская кухня дома» — покажите как приготовить тток-покки или bibimbap с соусом из Аяна.", russia_status:"Активно продаётся", russia_detail:"Wildberries, азиатские маркеты, «Азбука вкуса»", kz_status:"Появляется", kz_detail:"Азиатские маркеты Алматы, Kaspi — растущий спрос", social1_platform:"TikTok", social1_desc:"K-food рецепты с корейскими соусами — миллиарды просмотров", social2_platform:"Instagram", social2_desc:"Казахстанские фуд-блогеры готовят корейские блюда", procurement_ready:"🟡 Ищем поставщика", price_range:"800–2 200 ₸", competitors:["Arbuz"] },
  {...BASE, name:"Трюфельные и премиум-масла/соусы", subname:"«Белый трюфель» / оливковые премиум", category:"Соусы", status:"✨ Новинка", heat:7, region:"Европа", instagram_idea:"«Ресторанный вкус дома» — капля трюфельного масла превращает пасту в деликатес. Эстетичный пост.", russia_status:"Появляется", russia_detail:"«Азбука вкуса», Ozon, премиум-сети", kz_status:"Редко встречается", kz_detail:"Arbuz, единичные позиции в Magnum Premium", social1_platform:"Instagram", social1_desc:"Лакшери-кухня дома — трюфельные продукты в тренде у lifestyle-блогеров", social2_platform:"TikTok", social2_desc:"«Дорогой ингредиент, который меняет всё» — вирусный формат", procurement_ready:"🟡 Ищем поставщика", price_range:"2 500–8 000 ₸", competitors:["Arbuz"] },
  // Овощи и фрукты
  {...BASE, name:"Готовые нарезки и микс-салаты (свежие)", subname:"Мытые/нарезанные овощи в упаковке", category:"Овощи и фрукты", status:"📈 Растёт", heat:8, region:"Европа", instagram_idea:"«Салат за 2 минуты» — открыл пакет, заправил, готово. Показываем быстрый ЗОЖ-перекус.", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, «Перекрёсток», «Магнит Свежесть»", kz_status:"Появляется", kz_detail:"Отдельные позиции в Magnum и Arbuz — ниша почти свободна", social1_platform:"TikTok", social1_desc:"«Ленивый ЗОЖ» — готовые нарезки экономят время, вирусный формат", social2_platform:"Instagram", social2_desc:"Быстрые здоровые перекусы для занятых казахстанцев", procurement_ready:"🟡 Ищем поставщика", price_range:"500–1 200 ₸", competitors:["Magnum","Arbuz"] },
  {...BASE, name:"Экзотические фрукты (мангостин, рамбутан, питахайя)", subname:"Тайланд / Вьетнам / Колумбия", category:"Овощи и фрукты", status:"✨ Новинка", heat:8, region:"Азия", instagram_idea:"«Фрукты которые ты не пробовал» — показываем как есть питахайю. Реакция — чистый вирал.", russia_status:"Активно продаётся", russia_detail:"«Азбука вкуса», рынки, импортёры", kz_status:"Редко встречается", kz_detail:"Рынки Алматы, редко в Magnum Premium — огромная ниша", social1_platform:"TikTok", social1_desc:"«Пробуем экзотические фрукты» — один из самых вирусных форматов", social2_platform:"Instagram", social2_desc:"Эстетичные фото экзотических фруктов — топ у lifestyle-блогеров КЗ", procurement_ready:"🟡 Ищем поставщика", price_range:"1 500–4 000 ₸/кг", competitors:["Arbuz"] },
  // Хлебобулочные
  {...BASE, name:"Безглютеновый хлеб и выпечка", subname:"«Glutano» / «Dr.Schär» / локальные", category:"Хлебобулочные", status:"📈 Растёт", heat:7, region:"Европа", instagram_idea:"«Хлеб без глютена — вкусно?» — слепой тест с покупателями. Образовательный + вовлекающий.", russia_status:"Появляется", russia_detail:"ВкусВилл, аптеки, специализированные магазины", kz_status:"Редко встречается", kz_detail:"Аптеки, Kaspi — почти нет в обычных сетях", social1_platform:"Instagram", social1_desc:"ЗОЖ-блогеры КЗ ищут безглютеновые альтернативы", social2_platform:"TikTok", social2_desc:"«Я 30 дней без глютена» — популярный челлендж формат", procurement_ready:"🟡 Ищем поставщика", price_range:"700–2 000 ₸", competitors:[] },
  {...BASE, name:"Ремесленный хлеб на закваске", subname:"Sourdough / «Бородинский» premium", category:"Хлебобулочные", status:"🔥 Горячий", heat:8, region:"Европа", instagram_idea:"«Хлеб как в пекарне» — покажите разрез ремесленного хлеба. ASMR-корочка = миллион просмотров.", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, пекарни, «Азбука вкуса»", kz_status:"Появляется", kz_detail:"Пекарни Алматы и Астаны — в супермаркетах почти нет", social1_platform:"TikTok", social1_desc:"ASMR разрезание хлеба на закваске — миллионы просмотров", social2_platform:"Instagram", social2_desc:"Эстетика домашней выпечки и ремесленного хлеба", procurement_ready:"🟡 Ищем поставщика", price_range:"800–1 800 ₸", competitors:["Arbuz"] },
  // Алкоголь
  {...BASE, name:"Крафтовое пиво (местное KZ)", subname:"Лакер / Арасан / локальные крафт-бренды", category:"Алкоголь", status:"🔥 Горячий", heat:8, region:"Глобальный", instagram_idea:"«Поддержи местных» — покажите казахстанский крафт. Патриотичный контент + дегустация.", russia_status:"Активно продаётся", russia_detail:"Крафт-бары, «ВкусВилл», специализированные магазины", kz_status:"Появляется", kz_detail:"Отдельные позиции в Magnum и Arbuz — ниша растёт", social1_platform:"TikTok", social1_desc:"«Крафт vs масс-маркет» — дегустации набирают аудиторию", social2_platform:"Instagram", social2_desc:"Казахстанские lifestyle-блогеры открывают местные крафтовые бренды", procurement_ready:"🟡 Ищем поставщика", price_range:"700–1 500 ₸", competitors:["Magnum","Arbuz"] },
  {...BASE, name:"Безалкогольные вина и шампанское", subname:"Leitz Eins Zwei Zero / Oddbird", category:"Алкоголь", status:"✨ Новинка", heat:8, region:"Европа", instagram_idea:"«Праздник без алкоголя» — идеально для Рамадана, беременных, водителей. Красивая подача.", russia_status:"Появляется", russia_detail:"«Азбука вкуса», Wildberries — быстрорастущий сегмент", kz_status:"Редко встречается", kz_detail:"Единичные позиции в Arbuz — огромная ниша для КЗ", social1_platform:"Instagram", social1_desc:"Халяль-лайфстайл блогеры КЗ показывают безалкогольные альтернативы", social2_platform:"TikTok", social2_desc:"«Как отмечать без алкоголя» — актуально для мусульманской аудитории", procurement_ready:"🟡 Ищем поставщика", price_range:"2 500–5 500 ₸", competitors:["Arbuz"] },
];

async function callAI(prompt) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{ "Content-Type":"application/json","anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true" },
    body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1800, messages:[{role:"user",content:prompt}] }),
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
  return <span style={{ display:"inline-block",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:5,textTransform:"uppercase",letterSpacing:"0.05em",background:bg,color }}>{children}</span>;
}

function HeatBar({ value }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:6 }}>
      <div style={{ width:70,height:4,background:"#2a2a3d",borderRadius:2 }}>
        <div style={{ width:`${(value||5)*10}%`,height:"100%",borderRadius:2,background:"linear-gradient(90deg,#7c3aed,#ff4d6d)" }}/>
      </div>
      <span style={{ fontSize:11,color:"#6b7280" }}>{value}/10</span>
    </div>
  );
}

function ReadyBadge({ value, onChange }) {
  const cfg = READY_CONFIG[value] || READY_CONFIG["🟡 Ищем поставщика"];
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{ background:cfg.bg,color:cfg.color,border:"1px solid "+cfg.color,borderRadius:6,padding:"4px 6px",fontSize:11,fontWeight:700,cursor:"pointer",outline:"none",minWidth:150 }}>
      {Object.keys(READY_CONFIG).map(k=><option key={k} value={k}>{k}</option>)}
    </select>
  );
}

function CompetitorCell({ competitors, onChange }) {
  const [adding, setAdding] = useState(false);
  const remove = c => onChange(competitors.filter(x => x !== c));
  const add = c => { onChange([...competitors, c]); setAdding(false); };
  const absent = COMPETITORS.filter(c => !competitors.includes(c));

  return (
    <div style={{ minWidth: 110 }}>
      {/* Present competitors — red chips */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:3, marginBottom: competitors.length ? 5 : 0 }}>
        {competitors.map(c => (
          <span key={c} onClick={() => remove(c)}
            style={{ fontSize:10, padding:"2px 7px", borderRadius:4, cursor:"pointer", fontWeight:600,
              background:"rgba(255,77,109,0.18)", color:"#ff4d6d", border:"1px solid #ff4d6d",
              display:"flex", alignItems:"center", gap:3, userSelect:"none" }}>
            {c} <span style={{ fontSize:9, opacity:0.7 }}>✕</span>
          </span>
        ))}
      </div>

      {/* Add button / dropdown */}
      {absent.length > 0 && (
        adding ? (
          <div style={{ display:"flex", flexWrap:"wrap", gap:3 }}>
            {absent.map(c => (
              <span key={c} onClick={() => add(c)}
                style={{ fontSize:10, padding:"2px 7px", borderRadius:4, cursor:"pointer", fontWeight:600,
                  background:"rgba(42,42,61,0.9)", color:"#9ca3af", border:"1px solid #3a3a4d",
                  userSelect:"none" }}>
                + {c}
              </span>
            ))}
            <span onClick={() => setAdding(false)}
              style={{ fontSize:10, padding:"2px 7px", borderRadius:4, cursor:"pointer", color:"#6b7280", border:"1px solid #2a2a3d" }}>✕</span>
          </div>
        ) : (
          <span onClick={() => setAdding(true)}
            style={{ fontSize:10, padding:"2px 8px", borderRadius:4, cursor:"pointer", color:"#6b7280",
              border:"1px dashed #3a3a4d", userSelect:"none" }}>
            + добавить
          </span>
        )
      )}
    </div>
  );
}

function KanbanBoard({ trends, onMove }) {
  const byCol = id => trends.filter(t=>(t.kanban||"idea")===id);
  return (
    <div style={{ display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginTop:4 }}>
      {KANBAN_COLS.map(col=>(
        <div key={col.id} style={{ background:"#12121a",border:"1px solid #2a2a3d",borderRadius:12,padding:12,minHeight:200 }}>
          <div style={{ fontSize:11,fontWeight:700,color:col.color,marginBottom:10,borderBottom:"2px solid "+col.color,paddingBottom:6 }}>
            {col.label} <span style={{ color:"#6b7280" }}>({byCol(col.id).length})</span>
          </div>
          {byCol(col.id).map((t,i)=>(
            <div key={i} style={{ background:"#1a1a26",border:"1px solid #2a2a3d",borderRadius:8,padding:8,marginBottom:8 }}>
              <div style={{ fontWeight:600,fontSize:11,marginBottom:3,color:"#f0f0f8" }}>{t.name}</div>
              <div style={{ fontSize:10,color:"#6b7280",marginBottom:5 }}>{t.category} · {t.price_range||"—"}</div>
              <div style={{ display:"flex",gap:3,flexWrap:"wrap" }}>
                {KANBAN_COLS.filter(c=>c.id!==col.id).map(c=>(
                  <span key={c.id} onClick={()=>onMove(t.name,c.id)}
                    style={{ fontSize:9,padding:"2px 5px",borderRadius:3,background:"rgba(124,58,237,0.15)",color:"#a78bfa",cursor:"pointer",border:"1px solid #7c3aed" }}>
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
  const [trends, setTrends] = useState(FALLBACK);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("Все");
  const [readyFilter, setReadyFilter] = useState("Все");
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");
  const [instaItem, setInstaItem] = useState(null);
  const [instaLoading, setInstaLoading] = useState(false);
  const [instaPosts, setInstaPosts] = useState(null);
  const [tab, setTab] = useState("table");

  const updateTrend = (name, patch) => setTrends(prev=>prev.map(t=>t.name===name?{...t,...patch}:t));
  const moveKanban = (name, col) => updateTrend(name, {kanban:col});

  const fetchTrends = async () => {
    setLoading(true); setError("");
    const batches = [
      "Снеки, Напитки, Готовая еда, Полуфабрикаты",
      "Молочка, Здоровье, Мороженое, Высокобелковые",
      "Бытовая химия, Кондитерка, Морепродукты, Мама и младенец",
      "Колбасные изделия, Соусы, Овощи и фрукты",
      "Хлебобулочные, Алкоголь",
    ];
    const all = [];
    try {
      for (let i=0;i<batches.length;i++) {
        setProgress(`Шаг ${i+1}/5 — ${batches[i]}`);
        const text = await callAI(`Ты FMCG-эксперт по Казахстану. Верни JSON массив из 5 объектов для категорий: ${batches[i]}.
Только JSON без markdown. Поля (все строки кроме heat):
name, subname, category (одно из: Снеки Напитки Молочка Здоровье Бытовая химия Кондитерка Готовая еда Мороженое Полуфабрикаты Морепродукты "Мама и младенец" "Колбасные изделия" Соусы "Овощи и фрукты" Хлебобулочные Алкоголь Высокобелковые), status ("🔥 Горячий"|"✨ Новинка"|"📈 Растёт"|"✅ Стабильный"), heat (число 1-10), region (Азия|Америка|Европа|Глобальный), instagram_idea, russia_status ("Активно продаётся"|"Появляется"|"Редко встречается"|"Нет в продаже"), russia_detail, kz_status, kz_detail, social1_platform, social1_desc, social2_platform, social2_desc, procurement_ready ("🟢 Готов к закупке"|"🟡 Ищем поставщика"|"🔴 Недоступно в КЗ"), price_range (строка вида "500–1200 ₸"), competitors_kz (строка через запятую из: Magnum Small Arbuz Рамстор — кто из них уже продаёт, или пустая строка).`);
        const parsed = parseJsonArray(text);
        if (parsed) all.push(...parsed.map(t=>({
          ...BASE, ...t,
          competitors: t.competitors_kz ? t.competitors_kz.split(",").map(s=>s.trim()).filter(Boolean) : [],
          kanban:"idea",
        })));
      }
      if (all.length===0) throw new Error("AI вернул пустой ответ");
      setTrends(all);
      setLastUpdate(new Date().toLocaleString("ru-KZ"));
    } catch(e) { setError(e.message); }
    setLoading(false); setProgress("");
  };

  const generatePost = async (item) => {
    setInstaItem(item); setInstaLoading(true); setInstaPosts(null);
    try {
      const text = await callAI(`Напиши 2 варианта Instagram-поста для супермаркета Аян о товаре: ${item.name}.
Верни JSON массив из 2 объектов без markdown:
[{"variant":"Вариант 1 — Информационный","caption":"80-120 слов с эмодзи","hashtags":"15 хэштегов для Казахстана"},{"variant":"Вариант 2 — Развлекательный","caption":"другой стиль","hashtags":"15 хэштегов"}]`);
      setInstaPosts(parseJsonArray(text)||[{variant:"Базовый",caption:item.instagram_idea,hashtags:"#Аян #Казахстан #FMCG"}]);
    } catch(_) {
      setInstaPosts([{variant:"Базовый",caption:`🛒 ${item.name} уже в Аяне! ${item.instagram_idea}`,hashtags:"#Аян #Казахстан #Супермаркет"}]);
    }
    setInstaLoading(false);
  };

  const exportCSV = () => {
    const h=["#","Товар","Бренд","Категория","Регион","Статус","Интерес","Цена","Готовность к закупке","Конкуренты","Идея Instagram","RU","RU детали","KZ","KZ детали","Соцсети 1","Соцсети 2","Канбан"];
    const rows=trends.map((t,i)=>[i+1,t.name,t.subname,t.category,t.region,(t.status||"").replace(/[🔥✨📈✅]/g,"").trim(),t.heat,t.price_range||"—",(t.procurement_ready||"").replace(/[🟢🟡🔴]/g,"").trim(),(t.competitors||[]).join("; "),`"${t.instagram_idea||""}"`,t.russia_status,`"${t.russia_detail||""}"`,t.kz_status,`"${t.kz_detail||""}"`,`"[${t.social1_platform}] ${t.social1_desc||""}"`,`"[${t.social2_platform}] ${t.social2_desc||""}"`,t.kanban||"idea"]);
    const csv=[h,...rows].map(r=>r.join(",")).join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"})); a.download=`Аян_FMCG_${new Date().toLocaleDateString("ru-KZ").replace(/\./g,"-")}.csv`; a.click();
  };

  const filtered = trends.filter(t=>{
    const catOk = filter==="Все"||t.category===filter;
    const readyOk = readyFilter==="Все"||(t.procurement_ready||"")===readyFilter;
    const q=search.toLowerCase();
    const searchOk=!q||(t.name||"").toLowerCase().includes(q)||(t.category||"").toLowerCase().includes(q);
    return catOk&&readyOk&&searchOk;
  });

  const B = (extra={}) => ({ background:"#1a1a26",color:"#f0f0f8",border:"1px solid #2a2a3d",borderRadius:8,padding:"9px 14px",fontWeight:600,fontSize:12,cursor:"pointer",...extra });
  const tabBtn = (t) => B({ background:tab===t?"#7c3aed":"#1a1a26", color:tab===t?"#fff":"#f0f0f8", border:"1px solid "+(tab===t?"#7c3aed":"#2a2a3d") });
  const fBtn = (a) => ({ background:a?"#7c3aed":"transparent",color:a?"#fff":"#6b7280",border:"1px solid "+(a?"#7c3aed":"#2a2a3d"),borderRadius:6,padding:"6px 12px",fontSize:11,cursor:"pointer" });
  const TH = { fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#6b7280",padding:"10px 12px",textAlign:"left",background:"#12121a",borderBottom:"1px solid #2a2a3d",whiteSpace:"nowrap" };
  const TD = { padding:"10px 12px",fontSize:12,verticalAlign:"top",borderBottom:"1px solid #1e1e2e" };

  return (
    <div style={{ minHeight:"100vh",background:"#0a0a0f",color:"#f0f0f8",fontFamily:"system-ui,sans-serif",padding:16 }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10 }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ background:"linear-gradient(135deg,#ff4d6d,#7c3aed)",color:"#fff",fontWeight:800,fontSize:13,padding:"6px 14px",borderRadius:6,letterSpacing:1 }}>АЯН</div>
          <span style={{ color:"#6b7280",fontSize:12 }}>FMCG Trend Intelligence v3.0</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#22c55e" }}>
          <div style={{ width:7,height:7,background:"#22c55e",borderRadius:"50%",animation:"pulse 2s infinite" }}/>
          AI-мониторинг {lastUpdate&&<span style={{ color:"#6b7280",marginLeft:6 }}>{lastUpdate}</span>}
        </div>
      </div>

      <div style={{ fontWeight:800,fontSize:22,background:"linear-gradient(135deg,#f0f0f8 40%,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:6 }}>
        Трендовые товары для Казахстана
      </div>
      <div style={{ color:"#6b7280",fontSize:13,marginBottom:20 }}>Светофор закупки · Конкуренты · Цены · Канбан воронка</div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20 }}>
        {[["Товаров",trends.length,"#22c55e"],["🔥 Горячих",trends.filter(t=>t.status?.includes("Горячий")).length,"#ff4d6d"],["🟢 К закупке",trends.filter(t=>t.procurement_ready==="🟢 Готов к закупке").length,"#22c55e"],["🔴 Недоступно",trends.filter(t=>t.procurement_ready==="🔴 Недоступно в КЗ").length,"#ff4d6d"],["✨ Новинок",trends.filter(t=>t.status?.includes("Новинка")).length,"#fbbf24"],["📦 В ассорт.",trends.filter(t=>t.kanban==="done").length,"#7c3aed"]].map(([l,v,c])=>(
          <div key={l} style={{ background:"#1a1a26",border:"1px solid #2a2a3d",borderRadius:10,padding:"12px 14px" }}>
            <div style={{ fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6 }}>{l}</div>
            <div style={{ fontWeight:800,fontSize:20,color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display:"flex",gap:10,flexWrap:"wrap",marginBottom:12,alignItems:"flex-start" }}>
        <div>
          <button style={{ background:"linear-gradient(135deg,#ff4d6d,#7c3aed)",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:12,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.05em",opacity:loading?0.6:1 }} disabled={loading} onClick={fetchTrends}>
            {loading?`⏳ ${progress}`:"⚡ Обновить тренды"}
          </button>
          {error&&<div style={{ fontSize:11,color:"#f87171",marginTop:4,maxWidth:360 }}>⚠️ {error}</div>}
        </div>
        <button style={B()} onClick={exportCSV}>⬇ Скачать CSV</button>
        <button style={tabBtn("table")} onClick={()=>setTab("table")}>📊 Таблица</button>
        <button style={tabBtn("kanban")} onClick={()=>setTab("kanban")}>📋 Канбан</button>
      </div>

      {/* Category filters */}
      <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:8 }}>
        {CATEGORIES.map(c=>{
          const icons = { "Мороженое":"🍦 ","Полуфабрикаты":"🥩 ","Морепродукты":"🦐 ","Мама и младенец":"👶 ","Колбасные изделия":"🌭 ","Соусы":"🫙 ","Овощи и фрукты":"🥦 ","Хлебобулочные":"🍞 ","Алкоголь":"🍺 ","Высокобелковые":"💪 " };
          return <button key={c} style={fBtn(filter===c)} onClick={()=>setFilter(c)}>{icons[c]||""}{c}</button>;
        })}
      </div>
      {/* Procurement filter */}
      <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:16 }}>
        {["Все","🟢 Готов к закупке","🟡 Ищем поставщика","🔴 Недоступно в КЗ"].map(r=>(
          <button key={r} style={fBtn(readyFilter===r)} onClick={()=>setReadyFilter(r)}>{r}</button>
        ))}
        <input placeholder="🔍 Поиск..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{ background:"#1a1a26",border:"1px solid #2a2a3d",borderRadius:8,padding:"6px 12px",color:"#f0f0f8",fontSize:12,width:160,outline:"none",marginLeft:"auto" }}/>
      </div>

      {tab==="kanban" ? <KanbanBoard trends={trends} onMove={moveKanban}/> : (
        <div style={{ background:"#12121a",border:"1px solid #2a2a3d",borderRadius:14,overflow:"hidden" }}>
          <div style={{ padding:"12px 16px",borderBottom:"1px solid #2a2a3d",fontWeight:700,fontSize:13 }}>
            📊 Таблица трендов — {filtered.length} позиций
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["#","Товар","Кат.","Регион","Статус","Интерес","💰 Цена ₸","🚦 Закупка","🏪 Конкуренты","Идея Instagram","🇷🇺 Россия","🇰🇿 Казахстан","📲 Соцсети","Действие"].map(h=>(
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={14} style={{ ...TD,textAlign:"center",color:"#6b7280",padding:40 }}>Ничего не найдено</td></tr>
                ) : filtered.map((t,i)=>{
                  const reg=REGION_MAP[t.region]||REGION_MAP["Глобальный"];
                  const st=STATUS_MAP[t.status]||STATUS_MAP["✅ Стабильный"];
                  return (
                    <tr key={i}>
                      <td style={{ ...TD,color:"#6b7280" }}>{i+1}</td>
                      <td style={TD}>
                        <div style={{ fontWeight:600,marginBottom:2 }}>{t.name}</div>
                        <div style={{ color:"#6b7280",fontSize:10 }}>{t.subname}</div>
                      </td>
                      <td style={TD}><Tag bg="rgba(124,58,237,0.2)" color="#a78bfa">{t.category}</Tag></td>
                      <td style={TD}><Tag bg={reg.bg} color={reg.color}>{reg.icon} {t.region}</Tag></td>
                      <td style={TD}><Tag bg={st.bg} color={st.color}>{t.status}</Tag></td>
                      <td style={TD}><HeatBar value={t.heat||5}/></td>
                      <td style={{ ...TD,whiteSpace:"nowrap",fontWeight:700,color:"#fbbf24" }}>{t.price_range||"—"}</td>
                      <td style={TD}>
                        <ReadyBadge value={t.procurement_ready||"🟡 Ищем поставщика"} onChange={v=>updateTrend(t.name,{procurement_ready:v})}/>
                      </td>
                      <td style={TD}>
                        <CompetitorCell competitors={t.competitors||[]} onChange={v=>updateTrend(t.name,{competitors:v})}/>
                      </td>
                      <td style={{ ...TD,maxWidth:180,color:"#c4b5fd",lineHeight:1.5 }}>{t.instagram_idea}</td>
                      <td style={TD}>
                        <div style={{ fontSize:11,fontWeight:600,color:MARKET_COLOR[t.russia_status]||"#9ca3af",marginBottom:3 }}>{t.russia_status}</div>
                        <div style={{ fontSize:11,color:"#6b7280",maxWidth:140 }}>{t.russia_detail}</div>
                      </td>
                      <td style={TD}>
                        <div style={{ fontSize:11,fontWeight:600,color:MARKET_COLOR[t.kz_status]||"#9ca3af",marginBottom:3 }}>{t.kz_status}</div>
                        <div style={{ fontSize:11,color:"#6b7280",maxWidth:140 }}>{t.kz_detail}</div>
                      </td>
                      <td style={{ ...TD,maxWidth:170 }}>
                        {t.social1_platform&&<div style={{ fontSize:11,marginBottom:4 }}><span style={{ color:"#7c3aed",fontWeight:600 }}>[{t.social1_platform}]</span> <span style={{ color:"#9ca3af" }}>{t.social1_desc}</span></div>}
                        {t.social2_platform&&<div style={{ fontSize:11 }}><span style={{ color:"#7c3aed",fontWeight:600 }}>[{t.social2_platform}]</span> <span style={{ color:"#9ca3af" }}>{t.social2_desc}</span></div>}
                      </td>
                      <td style={TD}>
                        <div style={{ display:"flex",flexDirection:"column",gap:5 }}>
                          <button style={{ ...B(),fontSize:11,padding:"4px 10px" }} onClick={()=>generatePost(t)}>📱 Пост</button>
                          <select value={t.kanban||"idea"} onChange={e=>moveKanban(t.name,e.target.value)}
                            style={{ background:"#0a0a0f",color:"#a78bfa",border:"1px solid #7c3aed",borderRadius:6,padding:"3px 6px",fontSize:10,cursor:"pointer",outline:"none" }}>
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

      {/* Instagram Panel */}
      {instaItem&&(
        <div style={{ background:"#12121a",border:"1px solid #2a2a3d",borderRadius:14,marginTop:16,padding:16 }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
            <span style={{ fontWeight:700,fontSize:13 }}>📱 Instagram посты — {instaItem.name}</span>
            <button style={B()} onClick={()=>{setInstaItem(null);setInstaPosts(null);}}>✕</button>
          </div>
          {instaLoading&&<div style={{ textAlign:"center",padding:30,color:"#6b7280" }}>
            <div style={{ width:28,height:28,border:"3px solid #2a2a3d",borderTopColor:"#ff4d6d",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 12px" }}/>
            Генерирую посты...
          </div>}
          {instaPosts&&instaPosts.map((p,i)=>(
            <div key={i} style={{ background:"#1a1a26",border:"1px solid #2a2a3d",borderRadius:10,padding:14,marginBottom:12 }}>
              <div style={{ fontWeight:700,color:"#ff4d6d",marginBottom:8,fontSize:13 }}>{p.variant}</div>
              <div style={{ fontSize:13,color:"#d1d5db",lineHeight:1.7,marginBottom:8 }}>{p.caption}</div>
              <div style={{ fontSize:12,color:"#7c3aed" }}>{p.hashtags}</div>
              <button style={{ background:"rgba(124,58,237,0.15)",color:"#a78bfa",border:"1px solid #7c3aed",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",marginTop:8 }}
                onClick={()=>navigator.clipboard.writeText((p.caption||"")+"\n"+(p.hashtags||""))}>📋 Скопировать</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop:24,borderTop:"1px solid #2a2a3d",paddingTop:16,fontSize:11,color:"#6b7280" }}>
        Аян Супермаркет · Астана · Караганда · Темиртау · FMCG Intelligence v3.0
      </div>
    </div>
  );
}
