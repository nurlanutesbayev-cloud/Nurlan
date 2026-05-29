import { useState, useEffect } from "react";

// Supabase connection
const SUPABASE_URL = "https://acvbjpjtohtkulmbbpng.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdmJqcGp0b2h0a3VsbWJicG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMjg4NzgsImV4cCI6MjA5NDgwNDg3OH0.mLrrZahUIC4Eko56L-PJFfkEVE6e0iDTK_Ipuf4KKVM";

const EDGE_URL = "https://acvbjpjtohtkulmbbpng.supabase.co/functions/v1/get-trends";
const EDGE_UPDATE_URL = "https://acvbjpjtohtkulmbbpng.supabase.co/functions/v1/smooth-task";
const EDGE_AI_URL = "https://acvbjpjtohtkulmbbpng.supabase.co/functions/v1/generate-content";

const sb = {
  async getAll() {
    try {
      const r = await fetch(EDGE_URL, {
        method: "GET",
        headers: { "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" }
      });
      if (!r.ok) { console.error("Edge error:", await r.text()); return []; }
      const json = await r.json();
      return json.data || [];
    } catch(e) {
      try {
        const r2 = await fetch(`${SUPABASE_URL}/rest/v1/trends?select=*&order=created_at.asc`, {
          headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
        });
        if (r2.ok) return r2.json();
      } catch(_) {}
      return [];
    }
  },
  async upsertAll(trends) {
    const rows = trends.map(t => ({
      name: t.name, subname: t.subname || "", category: t.category,
      status: t.status, heat: t.heat, region: t.region,
      product_type: t.product_type || "",
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
    await fetch(`${SUPABASE_URL}/rest/v1/trends?id=gte.00000000-0000-0000-0000-000000000000`, {
      method: "DELETE",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    const r = await fetch(`${SUPABASE_URL}/rest/v1/trends`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json", "Prefer": "return=representation"
      },
      body: JSON.stringify(rows)
    });
    if (!r.ok) { console.error("upsertAll failed:", r.status, await r.text()); return null; }
    return r.json();
  },
  async getLastUpdated() {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/trends?select=created_at&order=created_at.desc&limit=1`, {
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` }
      });
      if (!r.ok) return null;
      const data = await r.json();
      if (data && data.length > 0 && data[0].created_at) return new Date(data[0].created_at);
      return null;
    } catch(_) { return null; }
  },
  async updateOne(id, patch) {
    if (!id) return;
    try {
      const r = await fetch(EDGE_UPDATE_URL, {
        method: "POST",
        headers: { "Authorization": `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id, patch })
      });
      if (!r.ok) console.error("updateOne failed:", await r.text());
    } catch(e) { console.error("updateOne error:", e.message); }
  },

  // ── История генераций ──────────────────────────────────────────────────────
  async saveHistory(category, prompt, items) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/generation_history`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json", "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          category: category || "Все",
          buyer_prompt: prompt || null,
          items_count: items.length,
          items: items
        })
      });
      if (!r.ok) console.error("saveHistory failed:", await r.text());
    } catch(e) { console.error("saveHistory error:", e.message); }
  },
  async getHistory(category) {
    try {
      const base = `${SUPABASE_URL}/rest/v1/generation_history`;
      const params = category && category !== "Все"
        ? `?category=eq.${encodeURIComponent(category)}&order=generated_at.desc&limit=30&select=id,category,generated_at,buyer_prompt,items_count`
        : `?order=generated_at.desc&limit=50&select=id,category,generated_at,buyer_prompt,items_count`;
      const r = await fetch(base + params, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      if (!r.ok) return [];
      return r.json();
    } catch(e) { return []; }
  },
  async getHistoryEntry(id) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/generation_history?id=eq.${id}&select=*`, {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
      if (!r.ok) return null;
      const data = await r.json();
      return data[0] || null;
    } catch(e) { return null; }
  },
  async deleteHistory(id) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/generation_history?id=eq.${id}`, {
        method: "DELETE",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
      });
    } catch(e) { console.error("deleteHistory error:", e.message); }
  }
};

const CATEGORIES = ["Все","Снеки","Напитки","Молочка","Здоровое питание","Бытовая химия","Кондитерка","Готовая еда","Мороженое","Полуфабрикаты","Морепродукты","Детское питание","Мама и младенец","Колбасные изделия","Соусы","Овощи и фрукты","Хлебобулочные","Алкоголь","Высокобелковые","Консервация"];
const COMPETITORS = ["Magnum","Small","Galmart","Fix Price","Южный","Корзина","Optima","Светофор","Norman","Корейские маркеты","Spar","My Mart","Apero","Анвар","Вкусмарт","Гастроном/Металлург","Arbuz.kz (онлайн)","Другой"];
const CAT_ICONS = {"Мороженое":"🍦","Полуфабрикаты":"🥩","Морепродукты":"🦐","Детское питание":"🍼","Мама и младенец":"👶","Колбасные изделия":"🌭","Соусы":"🫙","Овощи и фрукты":"🥦","Хлебобулочные":"🍞","Алкоголь":"🍺","Высокобелковые":"💪","Здоровое питание":"🌿","Консервация":"🥫"};

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
  "Детское питание":"Только еда для детей: пюре, каши, смеси, снеки для малышей, печенье, соки, детская вода. Органик, без сахара и консервантов.",
  "Мама и младенец":"Гигиена и уход за ребёнком: подгузники, салфетки, шампуни, кремы. Детская посуда: бутылочки, ниблеры. Одежда, слинги, текстиль и бытовые товары для детей.",
  "Колбасные изделия":"Сосиски, колбаса, ветчина. Халяль, чистый состав, разные варианты фасовки.",
  "Соусы":"Азиатские (кочуджан, терияки), трюфельные масла, песто, уксусы — тематические к блюдам.",
  "Овощи и фрукты":"Свежие, нарезанные, экзотические. Разные форматы фасовки и готовые миксы.",
  "Хлебобулочные":"Булочки для бургеров, лепёшки для Нутеллы, лаваш, закваска, безглютеновый хлеб.",
  "Алкоголь":"Пиво, вино, крепкий алкоголь, безалкогольные версии. Азиатские и американские тренды.",
  "Высокобелковые":"Спортивная аудитория: протеиновые батончики, RTD коктейли, Экспонента, высокобелковые йогурты/сыры/творог, яичный белок.",
  "Консервация":"Мясные, рыбные, овощные, фруктовые консервы — глубокая категория.",
};

const REQUEST_STATUSES = [
  {value:"—",            color:"#64748b", bg:"rgba(107,114,128,0.15)"},
  {value:"Создана",      color:"#60a5fa", bg:"rgba(59,130,246,0.15)"},
  {value:"На согласовании", color:"#fbbf24", bg:"rgba(251,191,36,0.15)"},
  {value:"Одобрена",     color:"#22c55e", bg:"rgba(34,197,94,0.15)"},
  {value:"Отклонена",    color:"#ff4d6d", bg:"rgba(255,77,109,0.15)"},
];

const REGION_MAP = {
  "Азия":       {bg:"rgba(251,146,60,0.18)", color:"#fb923c", icon:"🌏"},
  "Америка":    {bg:"rgba(59,130,246,0.18)", color:"#60a5fa", icon:"🌎"},
  "Европа":     {bg:"rgba(34,197,94,0.18)",  color:"#4ade80", icon:"🌍"},
  "Глобальный": {bg:"rgba(156,163,175,0.18)",color:"#64748b", icon:"🌐"},
};
const STATUS_MAP = {
  "🔥 Горячий":    {bg:"rgba(255,77,109,0.18)", color:"#ff4d6d"},
  "✨ Новинка":    {bg:"rgba(251,191,36,0.18)", color:"#fbbf24"},
  "📈 Растёт":     {bg:"rgba(34,197,94,0.18)",  color:"#22c55e"},
  "✅ Стабильный": {bg:"rgba(107,114,128,0.2)", color:"#64748b"},
};
const MARKET_COLOR = {"Активно продаётся":"#22c55e","Появляется":"#fbbf24","Редко встречается":"#fb923c","Нет в продаже":"#ff4d6d"};
const READY_CONFIG = {
  "🟢 Готов к закупке": {color:"#22c55e", bg:"rgba(34,197,94,0.15)"},
  "🟡 Ищем поставщика": {color:"#fbbf24", bg:"rgba(251,191,36,0.15)"},
  "🔴 Недоступно в КЗ": {color:"#ff4d6d", bg:"rgba(255,77,109,0.15)"},
};
const KANBAN_COLS = [
  {id:"idea",        label:"💡 Идея",                    color:"#64748b"},
  {id:"commercial",  label:"🏢 В работе у ком. отдела", color:"#60a5fa"},
  {id:"done",        label:"✅ В ассортименте",          color:"#22c55e"},
  {id:"nosupplier",  label:"🔍 Поставщик не найден",    color:"#fbbf24"},
  {id:"nodeal",      label:"🚫 Не договорились",        color:"#ff4d6d"},
];
const BASE = {product_type:"", procurement_ready:"🟡 Ищем поставщика", price_range:"—", competitors:[], kanban:"idea", request_num:"", request_status:"—"};

const FALLBACK = [
  {...BASE, name:"Корейская лапша Buldak", subname:"Samyang", category:"Готовая еда", status:"🔥 Горячий", heat:10, region:"Азия", instagram_idea:"Reaction-видео с самой острой лапшей — viral-контент!", russia_status:"Активно продаётся", russia_detail:"Wildberries, Ozon, азиатские маркеты", kz_status:"Активно продаётся", kz_detail:"Kaspi, Magnum, Small, азиатские маркеты Алматы", social1_platform:"TikTok", social1_desc:"#buldakchallenge — 2 млрд просмотров", social2_platform:"Instagram", social2_desc:"Reaction-видео казахстанских блогеров", procurement_ready:"🟢 Готов к закупке", price_range:"800–1 200 ₸", competitors:["Magnum","Small"]},
  {...BASE, name:"Матча (латте и порошок)", subname:"Ito En / Jade Leaf", category:"Напитки", status:"🔥 Горячий", heat:9, region:"Азия", instagram_idea:"Эстетичные фото матча-латте — японский тренд уже в Аяне!", russia_status:"Активно продаётся", russia_detail:"ВкусВилл, Wildberries, кофейни", kz_status:"Появляется", kz_detail:"Кофейни Алматы и Астаны, Kaspi", social1_platform:"TikTok", social1_desc:"Матча-рецепты — миллиарды просмотров", social2_platform:"Instagram", social2_desc:"Эстетика кофейных напитков", procurement_ready:"🟡 Ищем поставщика", price_range:"1 500–3 500 ₸", competitors:["Arbuz"]},
  {...BASE, name:"Bibigo Гёдза / Gyoza", subname:"CJ Foods / Bibigo", category:"Полуфабрикаты", status:"🔥 Горячий", heat:10, region:"Азия", instagram_idea:"«Готовим гёдзу как в корейском ресторане» — ASMR обжарка на сковороде.", russia_status:"Активно продаётся", russia_detail:"Wildberries, азиатские маркеты", kz_status:"Появляется", kz_detail:"Азиатские маркеты Алматы, Kaspi", social1_platform:"TikTok", social1_desc:"#gyoza — 11M+ постов", social2_platform:"Instagram", social2_desc:"Казахстанские фуд-блогеры", procurement_ready:"🟡 Ищем поставщика", price_range:"1 200–2 500 ₸", competitors:["Arbuz"]},
];

async function callAI(prompt) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_KEY;
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({ model: "claude-opus-4-5", max_tokens: 8000, messages: [{ role: "user", content: prompt }] }),
  });
  if (!resp.ok) { const t = await resp.text().catch(() => ""); throw new Error(`HTTP ${resp.status}: ${t.slice(0, 150)}`); }
  const data = await resp.json();
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").replace(/```json|```/gi, "").trim();
}

// Вызов AI с веб-поиском для верификации конкурентов
async function callAISearch(prompt) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_KEY;
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data = await resp.json();
  return (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n").replace(/```json|```/gi, "").trim();
}

// Верификация конкурентов через реальный поиск по сайтам
async function verifyCompetitors(items) {
  if (!items || items.length === 0) return items;
  try {
    const productList = items.map((t, i) => `${i + 1}. ${t.name} (${t.subname || ""})`).join("\n");
    const text = await callAISearch(`Ты верификатор данных для казахстанского ретейлера.

Для каждого товара из списка найди через поиск — реально ли он продаётся на сайтах конкурентов.
Ищи через: site:arbuz.kz "бренд", site:korzinavdom.kz "бренд", site:fix-price.kz "бренд", site:kaspi.kz "бренд" Magnum.

Товары:
${productList}

ПРАВИЛО: включай конкурента ТОЛЬКО если реально нашёл страницу с этим товаром или брендом на его сайте. Если не нашёл — не включай. Лучше пустой список чем ложь.

Конкуренты для проверки: Arbuz.kz, Корзина, Fix Price, Magnum

Верни ТОЛЬКО JSON массив без markdown, ровно ${items.length} объектов в том же порядке:
[{"name":"точное название товара","competitors":["Arbuz.kz"]}]`);

    const verified = parseJsonArray(text);
    if (!verified || verified.length === 0) return items;

    return items.map((item, i) => {
      const v = verified.find(r =>
        r.name === item.name ||
        item.name.toLowerCase().includes((r.name || "").toLowerCase().split(" ")[0]) ||
        (r.name || "").toLowerCase().includes(item.name.toLowerCase().split(" ")[0])
      ) || verified[i];
      if (v && Array.isArray(v.competitors)) {
        return { ...item, competitors: v.competitors };
      }
      return { ...item, competitors: [] };
    });
  } catch(e) {
    console.error("verifyCompetitors failed:", e.message);
    return items.map(t => ({ ...t, competitors: [] }));
  }
}

function parseJsonArray(text) {
  if (!text) return null;
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch(e){}
  try {
    const cleaned = m[0].replace(/,?\s*\{[^}]*$/,"") + "]";
    return JSON.parse(cleaned);
  } catch(e){}
  try {
    const objects = [];
    const objRegex = /\{[^{}]*(\{[^{}]*\}[^{}]*)*\}/g;
    let match;
    while ((match = objRegex.exec(m[0])) !== null) {
      try { const obj = JSON.parse(match[0]); if (obj.name) objects.push(obj); } catch(_){}
    }
    if (objects.length > 0) return objects;
  } catch(e){}
  return null;
}

function Tag({ children, bg, color }) {
  return <span style={{display:"inline-block",fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:5,textTransform:"uppercase",letterSpacing:"0.05em",background:bg,color}}>{children}</span>;
}

function HeatBar({ value }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{width:70,height:4,background:"#e2e8f0",borderRadius:2}}>
        <div style={{width:`${(value||5)*10}%`,height:"100%",borderRadius:2,background:"linear-gradient(90deg,#7c3aed,#ff4d6d)"}}/>
      </div>
      <span style={{fontSize:11,color:"#64748b"}}>{value}/10</span>
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
            <span key={c} onClick={()=>add(c)} style={{fontSize:10,padding:"2px 7px",borderRadius:4,cursor:"pointer",fontWeight:600,background:"rgba(42,42,61,0.9)",color:"#64748b",border:"1px solid #3a3a4d",userSelect:"none"}}>+ {c}</span>
          ))}
          <span onClick={()=>setAdding(false)} style={{fontSize:10,padding:"2px 7px",borderRadius:4,cursor:"pointer",color:"#64748b",border:"1px solid #2a2a3d"}}>✕</span>
        </div>
      ) : (
        <span onClick={()=>setAdding(true)} style={{fontSize:10,padding:"2px 8px",borderRadius:4,cursor:"pointer",color:"#64748b",border:"1px dashed #3a3a4d",userSelect:"none"}}>+ добавить</span>
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
        <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,zIndex:999,background:"#f1f5f9",border:"1px solid #7c3aed",borderRadius:10,padding:"12px 14px",minWidth:280,boxShadow:"0 8px 32px rgba(0,0,0,0.12)",pointerEvents:"none"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#a78bfa",marginBottom:10}}>🚦 Статусы закупки</div>
          {[
            {icon:"🟢",label:"Готов к закупке",desc:"Поставщик найден, можно заказывать прямо сейчас",color:"#22c55e"},
            {icon:"🟡",label:"Ищем поставщика",desc:"Товар трендовый, но поставщик под Аян ещё не найден",color:"#fbbf24"},
            {icon:"🔴",label:"Недоступно в КЗ",desc:"Товар пока не завозится в Казахстан",color:"#ff4d6d"},
          ].map(s=>(
            <div key={s.label} style={{display:"flex",gap:8,marginBottom:8,alignItems:"flex-start"}}>
              <span style={{fontSize:14,flexShrink:0,marginTop:1}}>{s.icon}</span>
              <div>
                <div style={{fontSize:11,fontWeight:700,color:s.color,marginBottom:2}}>{s.label}</div>
                <div style={{fontSize:11,color:"#64748b",lineHeight:1.4}}>{s.desc}</div>
              </div>
            </div>
          ))}
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
    <div style={{position:"relative",display:"inline-block"}} onMouseEnter={()=>setShow(true)} onMouseLeave={()=>setShow(false)}>
      <button onClick={onClick} style={{background:active?"#7c3aed":"transparent",color:active?"#fff":"#64748b",border:"1px solid "+(active?"#7c3aed":"#e2e8f0"),borderRadius:6,padding:"6px 12px",fontSize:11,cursor:"pointer"}}>
        {icon?icon+" ":""}{cat}
      </button>
      {show && desc && (
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,zIndex:999,background:"#f1f5f9",border:"1px solid #2a2a3d",borderRadius:8,padding:"10px 12px",minWidth:220,maxWidth:280,boxShadow:"0 8px 24px rgba(0,0,0,0.10)",pointerEvents:"none",fontSize:11,color:"#64748b",lineHeight:1.5}}>
          <div style={{fontWeight:700,color:"#0f172a",marginBottom:4}}>{icon} {cat}</div>
          {desc}
        </div>
      )}
    </div>
  );
}

function RequestCell({ requestNum, onNumChange }) {
  return (
    <div style={{minWidth:110}}>
      <input value={requestNum} onChange={e=>onNumChange(e.target.value)} placeholder="№ заявки"
        style={{background:"#f8fafc",border:"1px solid #2a2a3d",borderRadius:6,padding:"4px 8px",color:"#0f172a",fontSize:11,outline:"none",width:"100%"}}/>
    </div>
  );
}

function SocialCell({ social1_platform, social1_desc, social2_platform, social2_desc }) {
  const items = [];
  if (social1_platform) items.push({platform: social1_platform, desc: social1_desc});
  if (social2_platform) items.push({platform: social2_platform, desc: social2_desc});
  const PLATFORM_COLORS = {
    TikTok:    {color:"#f0abfc",bg:"rgba(240,171,252,0.15)",border:"rgba(240,171,252,0.4)"},
    Instagram: {color:"#fb923c",bg:"rgba(251,146,60,0.15)", border:"rgba(251,146,60,0.4)"},
    YouTube:   {color:"#f87171",bg:"rgba(248,113,113,0.15)",border:"rgba(248,113,113,0.4)"},
    Telegram:  {color:"#60a5fa",bg:"rgba(96,165,250,0.15)", border:"rgba(96,165,250,0.4)"},
  };
  if (!items.length) return <span style={{color:"#64748b",fontSize:11}}>—</span>;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:5,maxWidth:170}}>
      {items.map((it,i)=>{
        const cfg = PLATFORM_COLORS[it.platform] || {color:"#64748b",bg:"rgba(156,163,175,0.15)",border:"rgba(156,163,175,0.4)"};
        return (
          <div key={i} style={{background:cfg.bg,border:"1px solid "+cfg.border,borderRadius:7,padding:"4px 7px"}}>
            <div style={{fontSize:10,fontWeight:700,color:cfg.color,marginBottom:2}}>{it.platform}</div>
            <div style={{fontSize:11,color:"#334155",lineHeight:1.4}}>{it.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanBoard({ trends, onMove, filter }) {
  const [catDrill, setCatDrill] = useState(null);
  const filtered = trends.filter(t => {
    const catOk = filter==="Все" || t.category===filter;
    const drillOk = !catDrill || t.category===catDrill;
    return catOk && drillOk;
  });
  const byCol = id => filtered.filter(t=>(t.kanban||"idea")===id);
  const cats = [...new Set(filtered.map(t=>t.category))].filter(Boolean).sort();
  return (
    <div>
      {filter==="Все" && (
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,alignItems:"center"}}>
          <span style={{fontSize:11,color:"#64748b",marginRight:4}}>Категория:</span>
          <button onClick={()=>setCatDrill(null)} style={{background:!catDrill?"#7c3aed":"transparent",color:!catDrill?"#fff":"#64748b",border:"1px solid "+(!catDrill?"#7c3aed":"#e2e8f0"),borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>Все</button>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCatDrill(catDrill===c?null:c)}
              style={{background:catDrill===c?"#7c3aed":"transparent",color:catDrill===c?"#fff":"#64748b",border:"1px solid "+(catDrill===c?"#7c3aed":"#e2e8f0"),borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer"}}>
              {CAT_ICONS[c]||""} {c}
            </button>
          ))}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginTop:4}}>
        {KANBAN_COLS.map(col=>(
          <div key={col.id} style={{background:"#ffffff",border:"1px solid #2a2a3d",borderRadius:12,padding:12,minHeight:200}}>
            <div style={{fontSize:11,fontWeight:700,color:col.color,marginBottom:10,borderBottom:"2px solid "+col.color,paddingBottom:6}}>
              {col.label} <span style={{color:"#64748b"}}>({byCol(col.id).length})</span>
            </div>
            {byCol(col.id).map((t,i)=>(
              <div key={i} style={{background:"#f1f5f9",border:"1px solid #2a2a3d",borderRadius:8,padding:8,marginBottom:8}}>
                <div style={{fontWeight:600,fontSize:11,marginBottom:2,color:"#0f172a"}}>{t.name}</div>
                <div style={{fontSize:10,color:"#64748b",marginBottom:2}}>{t.category}</div>
                <div style={{fontSize:10,color:"#fbbf24",marginBottom:5}}>{t.price_range||"—"}</div>
                <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                  {KANBAN_COLS.filter(c=>c.id!==col.id).map(c=>(
                    <span key={c.id} onClick={()=>onMove(t.name,c.id)} style={{fontSize:9,padding:"2px 5px",borderRadius:3,background:"rgba(124,58,237,0.15)",color:"#a78bfa",cursor:"pointer",border:"1px solid #7c3aed"}}>
                      →{c.label.split(" ")[1]||c.label.split(" ")[0]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── История генераций — компонент ──────────────────────────────────────────────
function HistoryModal({ filter, currentTrends, onRestore, onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [selectedItems, setSelectedItems] = useState(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    sb.getHistory(filter).then(data => {
      setEntries(data || []);
      setLoading(false);
    });
  }, [filter]);

  const openEntry = async (entry) => {
    setSelected(entry);
    setSelectedItems(null);
    setLoadingItems(true);
    const full = await sb.getHistoryEntry(entry.id);
    setSelectedItems(full ? (full.items || []) : []);
    setLoadingItems(false);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Удалить эту генерацию из истории?")) return;
    setDeletingId(id);
    await sb.deleteHistory(id);
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selected && selected.id === id) { setSelected(null); setSelectedItems(null); }
    setDeletingId(null);
  };

  const handleRestore = async () => {
    if (!selected || !selectedItems) return;
    const cat = selected.category;
    const msg = `Восстановить генерацию от ${formatDate(selected.generated_at)}?\n\nТекущие данные по категории «${cat}» будут заменены ${selectedItems.length} позициями из истории.`;
    if (!window.confirm(msg)) return;
    setRestoring(true);
    await onRestore(cat, selectedItems);
    setRestoring(false);
    onClose();
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString("ru-KZ", { day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
  };

  const daysDiff = (iso) => {
    const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (d === 0) return "сегодня";
    if (d === 1) return "вчера";
    return `${d} дн. назад`;
  };

  const isFirst = (entry) => entries.length > 0 && entries[0].id === entry.id;

  // Группируем по категориям если смотрим "Все"
  const grouped = filter === "Все"
    ? entries.reduce((acc, e) => { (acc[e.category] = acc[e.category] || []).push(e); return acc; }, {})
    : { [filter]: entries };

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(15,23,42,0.55)",zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"32px 16px",overflowY:"auto"}}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:16,width:"100%",maxWidth:960,boxShadow:"0 24px 64px rgba(15,23,42,0.14)",overflow:"hidden"}}>

        {/* Шапка */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderBottom:"1px solid #e2e8f0",background:"#f8fafc"}}>
          <div>
            <div style={{fontSize:11,color:"#a78bfa",fontWeight:700,marginBottom:2,letterSpacing:"0.06em"}}>📚 ИСТОРИЯ ГЕНЕРАЦИЙ</div>
            <div style={{fontSize:16,fontWeight:700,color:"#0f172a"}}>
              {filter === "Все" ? "Все категории" : `${CAT_ICONS[filter]||""} ${filter}`}
            </div>
          </div>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:"#64748b",fontSize:13,fontWeight:700}}>✕ Закрыть</button>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"300px 1fr",minHeight:500}}>

          {/* Левая колонка — список генераций */}
          <div style={{borderRight:"1px solid #e2e8f0",overflowY:"auto",maxHeight:"70vh"}}>
            {loading && (
              <div style={{textAlign:"center",padding:40,color:"#64748b"}}>
                <div style={{width:24,height:24,border:"2px solid #e2e8f0",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 10px"}}/>
                <div style={{fontSize:12}}>Загружаю историю...</div>
              </div>
            )}
            {!loading && entries.length === 0 && (
              <div style={{padding:24,textAlign:"center",color:"#94a3b8"}}>
                <div style={{fontSize:28,marginBottom:8}}>📭</div>
                <div style={{fontSize:12,lineHeight:1.5}}>История пуста.<br/>Генерации появятся здесь после обновления трендов.</div>
              </div>
            )}
            {!loading && Object.entries(grouped).map(([cat, catEntries]) => (
              <div key={cat}>
                {filter === "Все" && (
                  <div style={{padding:"8px 14px 4px",fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:"0.08em",background:"#f8fafc",borderBottom:"0.5px solid #e2e8f0"}}>
                    {CAT_ICONS[cat]||""} {cat} · {catEntries.length}
                  </div>
                )}
                {catEntries.map((entry, idx) => {
                  const isCurrent = isFirst(entry) && filter !== "Все";
                  const isActive = selected && selected.id === entry.id;
                  return (
                    <div key={entry.id} onClick={() => openEntry(entry)}
                      style={{padding:"11px 14px",borderBottom:"0.5px solid #f0f0f0",cursor:"pointer",background:isActive?"#f0ebff":isCurrent?"#f0fff4":"#ffffff",transition:"background 0.12s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:isCurrent?"#22c55e":"#cbd5e1",flexShrink:0}}/>
                        <div style={{flex:1,fontSize:12,fontWeight:600,color:isActive?"#7c3aed":"#0f172a"}}>
                          {idx === 0 && filter !== "Все" ? "Текущая" : `Генерация #${catEntries.length - idx}`}
                        </div>
                        {isCurrent && <span style={{fontSize:10,fontWeight:700,padding:"1px 7px",borderRadius:20,background:"rgba(34,197,94,0.15)",color:"#22c55e"}}>текущая</span>}
                        <button
                          onClick={(e) => handleDelete(entry.id, e)}
                          disabled={deletingId === entry.id}
                          title="Удалить из истории"
                          style={{background:"none",border:"none",cursor:"pointer",color:"#cbd5e1",fontSize:13,padding:"0 2px",lineHeight:1}}
                        >🗑</button>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,paddingLeft:16}}>
                        <div style={{fontSize:11,color:"#64748b"}}>{formatDate(entry.generated_at)}</div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,paddingLeft:16,marginTop:3}}>
                        <span style={{fontSize:11,fontWeight:600,color:"#7c3aed"}}>{entry.items_count} позиций</span>
                        <span style={{fontSize:10,color:"#94a3b8"}}>·</span>
                        <span style={{fontSize:10,color:"#94a3b8"}}>{daysDiff(entry.generated_at)}</span>
                      </div>
                      {entry.buyer_prompt && (
                        <div style={{marginTop:4,paddingLeft:16,fontSize:10,color:"#94a3b8",fontStyle:"italic",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:240}}>
                          "{entry.buyer_prompt}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Правая колонка — детали выбранной генерации */}
          <div style={{padding:20,overflowY:"auto",maxHeight:"70vh"}}>
            {!selected && (
              <div style={{textAlign:"center",padding:"60px 20px",color:"#94a3b8"}}>
                <div style={{fontSize:32,marginBottom:12}}>👈</div>
                <div style={{fontSize:13}}>Выберите генерацию слева<br/>чтобы просмотреть детали</div>
              </div>
            )}
            {selected && (
              <div>
                {/* Заголовок */}
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16,paddingBottom:14,borderBottom:"1px solid #f0f0f0"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:"#0f172a",marginBottom:2}}>
                      {selected.category} · {formatDate(selected.generated_at)}
                    </div>
                    <div style={{fontSize:12,color:"#64748b"}}>{daysDiff(selected.generated_at)}</div>
                  </div>
                  <button
                    onClick={handleRestore}
                    disabled={restoring || loadingItems || !selectedItems}
                    style={{background:restoring||loadingItems?"#f1f5f9":"linear-gradient(135deg,#7c3aed,#a855f7)",color:restoring||loadingItems?"#64748b":"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:restoring||loadingItems?"not-allowed":"pointer",opacity:restoring||loadingItems?0.6:1}}>
                    {restoring ? "⏳ Восстанавливаю..." : "↩ Восстановить эту генерацию"}
                  </button>
                </div>

                {/* Статистика */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
                  {[
                    ["Позиций", selected.items_count, "#7c3aed"],
                    ["Дата", new Date(selected.generated_at).toLocaleDateString("ru-KZ"), "#64748b"],
                    ["Время", new Date(selected.generated_at).toLocaleTimeString("ru-KZ",{hour:"2-digit",minute:"2-digit"}), "#64748b"],
                  ].map(([l,v,c])=>(
                    <div key={l} style={{background:"#f8fafc",borderRadius:8,padding:"10px 12px",border:"1px solid #f0f0f0"}}>
                      <div style={{fontSize:10,color:"#94a3b8",marginBottom:3,textTransform:"uppercase",letterSpacing:"0.06em"}}>{l}</div>
                      <div style={{fontSize:15,fontWeight:700,color:c}}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Запрос байера */}
                {selected.buyer_prompt && (
                  <div style={{background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:8,padding:"10px 12px",marginBottom:16}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#a78bfa",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.06em"}}>Запрос байера</div>
                    <div style={{fontSize:12,color:"#4c1d95",lineHeight:1.5}}>"{selected.buyer_prompt}"</div>
                  </div>
                )}

                {/* Список позиций */}
                <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Сгенерированные позиции</div>
                {loadingItems && (
                  <div style={{textAlign:"center",padding:24,color:"#64748b"}}>
                    <div style={{width:20,height:20,border:"2px solid #e2e8f0",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 8px"}}/>
                    <div style={{fontSize:11}}>Загружаю позиции...</div>
                  </div>
                )}
                {!loadingItems && selectedItems && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {selectedItems.map((item, i) => {
                      const inCurrent = currentTrends.some(t => t.name === item.name && t.category === item.category);
                      return (
                        <div key={i} style={{
                          fontSize:11,padding:"5px 10px",borderRadius:20,
                          background: inCurrent ? "rgba(34,197,94,0.12)" : "rgba(124,58,237,0.08)",
                          border: inCurrent ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(124,58,237,0.25)",
                          color: inCurrent ? "#16a34a" : "#64748b",
                          display:"flex",alignItems:"center",gap:5
                        }}>
                          {inCurrent && <span style={{fontSize:9,color:"#22c55e"}}>✓</span>}
                          <span style={{fontWeight:inCurrent?600:400}}>{item.name}</span>
                          {item.price_range && <span style={{fontSize:10,color:"#94a3b8"}}>· {item.price_range}</span>}
                        </div>
                      );
                    })}
                  </div>
                )}
                {!loadingItems && selectedItems && selectedItems.length > 0 && (
                  <div style={{marginTop:12,fontSize:11,color:"#94a3b8"}}>
                    <span style={{color:"#22c55e",fontWeight:600}}>✓ зелёный</span> — уже есть в текущих трендах &nbsp;·&nbsp;
                    <span style={{color:"#a78bfa",fontWeight:600}}>серый</span> — отсутствует
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
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
  const [requestFilter, setRequestFilter] = useState("Все");
  const [regionFilter, setRegionFilter] = useState("Все");
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState(() => localStorage.getItem("ayan_last_update") || "");
  const [lastUpdateTs, setLastUpdateTs] = useState(() => Number(localStorage.getItem("ayan_last_update_ts")) || null);
  const [instaItem, setInstaItem] = useState(null);
  const [instaLoading, setInstaLoading] = useState(false);
  const [instaPosts, setInstaPosts] = useState(null);
  const [contentModal, setContentModal] = useState(false);
  const [tab, setTab] = useState("table");
  const [analysisItem, setAnalysisItem] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisModal, setAnalysisModal] = useState(false);

  // ── История генераций ──────────────────────────────────────────────────────
  const [historyModal, setHistoryModal] = useState(false);
  const [kmModal, setKmModal]           = useState(false);
  const [kmDecisions, setKmDecisions]   = useState({});

  const [authed, setAuthed] = useState(() => {
    const ts = Number(localStorage.getItem("ayan_authed_ts"));
    if (!ts) return false;
    const HOURS_8 = 8 * 60 * 60 * 1000;
    if (Date.now() - ts > HOURS_8) { localStorage.removeItem("ayan_authed_ts"); return false; }
    return true;
  });
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState("");
  const [catUpdates, setCatUpdates] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ayan_cat_updates") || "{}"); } catch { return {}; }
  });
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [showUpdateTooltip, setShowUpdateTooltip] = useState(false);
  const [catPrefs, setCatPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ayan_cat_prefs") || "{}"); } catch { return {}; }
  });
  const [rejectedBrands, setRejectedBrands] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ayan_rejected_brands") || "{}"); } catch { return {}; }
  });

  const CAT_CONTEXTS = {
    "Снеки": "Тренды 2026: протеиновые снеки (Quest, KetoDiet), азиатские чипсы (Calbee, Koikeya), Takis Fuego, попкорн премиум (SkinnyPop), веганские снеки.",
    "Напитки": "Тренды 2026: энергетики нового поколения (Prime Hydration, Celsius, Gorilla), kombucha, адаптогенные напитки, функциональная вода.",
    "Молочка": "Тренды 2026: растительное молоко (Oatly, Alpro), йогурт с высоким белком (Skyr — Arla), творог в тюбике, сыры крафтовые.",
    "Здоровое питание": "Тренды 2026: суперфуды (чиа, киноа, спирулина), функциональное питание, ЗОЖ-перекусы без сахара, органические продукты.",
    "Бытовая химия": "Тренды 2026: экологичная химия (концентраты, таблетки), корейская химия (CJ Lion), капсулы для стирки (Tide Pods).",
    "Кондитерка": "Тренды 2026: Dubai Chocolate, азиатские конфеты (Meiji, Lotte), protein bars (Quest, Kind), моти-конфеты.",
    "Готовая еда": "Тренды 2026: корейские комплекты, японские onigiri, здоровые боулы, veganready-to-eat.",
    "Мороженое": "Тренды 2026: Little Moons (моти), Halo Top (высокобелковое), Magnum Bon Bons (мини-шарики), My/Mochi, Movenpick.",
    "Полуфабрикаты": "Тренды 2026: Bibigo (CJ Foods), Samyang заморозка, Dr. Oetker Ristorante пицца, Miraторг Black Angus sous-vide.",
    "Морепродукты": "Тренды 2026: Poke Kit готовый, seacuterie trend (Jose Gourmet, Ortiz), охлаждённый лосось порционный (Mowi, SalMar).",
    "Детское питание": "Только еда для детей — без гигиены и бытовых товаров. Тренды 2026: органическое пюре (HiPP Organic, Gerber Organic, Lebenswert), снеки от 6 мес (Plum Organics, Heinz Organics, Happy Baby), козьи смеси (Kabrita, Nanny), каши без сахара, детская вода и соки. Фокус: органик, чистый состав, без сахара/соли/консервантов. Слабые ниши в КЗ: западные органик-бренды.",
    "Мама и младенец": "Гигиена и уход — БЕЗ продуктов питания. Тренды 2026: эко-подгузники (Muumi, Eco by Naty, Huggies Elite Soft), влажные салфетки (WaterWipes 99.9% вода), детская косметика (Mustela, Weleda Baby, CeraVe Baby), посуда и кормление (Dr. Brown's, Munchkin, Philips Avent), эрго-рюкзаки и слинги (Ergobaby, Manduca), детский текстиль и одежда. Фокус: гипоаллергенность, экологичность, сертификаты безопасности. Слабые ниши в КЗ: эко-подгузники, западная детская косметика.",
    "Колбасные изделия": "Тренды 2026: нитрат-free колбасы, крафтовые деликатесы, растительные колбасы (Beyond Meat).",
    "Соусы": "Тренды 2026: корейские соусы (Gochujang, CJ Beksul), трюфельные соусы, Rao's Homemade.",
    "Овощи и фрукты": "Тренды 2026: экзотические фрукты (питайя, рамбутан), мини-овощи, органическая зелень, грибы (шиитаке).",
    "Хлебобулочные": "Тренды 2026: соурдоу крафтовый, безглютеновый хлеб, croissant-гибриды (крофль, краффин).",
    "Алкоголь": "Тренды 2026: RTD коктейли (Aperol Spritz в банке, Hard Seltzer — White Claw), вино в банках, крафтовое пиво.",
    "Высокобелковые": "Тренды 2026: протеиновые йогурты (Siggi's, Chobani), творог с высоким белком, готовые белковые блюда.",
    "Консервация": "Тренды 2026: премиум консервы (Ortiz тунец, José Gourmet), веганские консервы, паштеты в стекле."
  };

  const updateTrend = (name, patch) => {
    setTrends(prev => prev.map(t => {
      if (t.name !== name) return t;
      const updated = {...t, ...patch};
      if (t.id) sb.updateOne(t.id, patch);
      return updated;
    }));
  };
  const moveKanban = (name, col) => updateTrend(name,{kanban:col});

  useEffect(() => {
    sb.getLastUpdated().then(date => {
      if (date) {
        const str = date.toLocaleString("ru-KZ");
        setLastUpdate(str); setLastUpdateTs(date.getTime());
        localStorage.setItem("ayan_last_update", str);
        localStorage.setItem("ayan_last_update_ts", String(date.getTime()));
      }
    });
    sb.getAll().then(data => {
      if (data && data.length > 0) {
        setTrends(data.map(t => ({...BASE, ...t, competitors: t.competitors || []})));
        setDbLoaded(true);
      } else {
        setTrends(FALLBACK); setDbLoaded(false);
      }
    }).catch(() => { setTrends(FALLBACK); setDbLoaded(false); });
  }, []);

  const fetchTrends = async (customFeedback = null) => {
    setLoading(true); setError("");
    const targetCat = filter === "Все" ? null : filter;
    const batches = targetCat
      ? [targetCat]
      : ["Снеки, Напитки, Готовая еда, Полуфабрикаты, Мороженое",
         "Молочка, Высокобелковые, Бытовая химия, Кондитерка, Здоровое питание",
         "Морепродукты, Детское питание, Мама и младенец, Колбасные изделия, Соусы, Овощи и фрукты, Хлебобулочные, Алкоголь, Консервация"];
    const all = [];
    try {
      for (let i=0;i<batches.length;i++) {
        setProgress(targetCat ? `Генерирую: ${targetCat}...` : `Шаг ${i+1}/${batches.length} — ${batches[i]}`);
        let text = null;
        for (let attempt=0; attempt<2; attempt++) {
          try {
            const today = new Date().toLocaleDateString("ru-RU", {day:"numeric", month:"long", year:"numeric"});
            const catContext = targetCat && CAT_CONTEXTS[targetCat] ? `\nКОНТЕКСТ КАТЕГОРИИ «${targetCat}»: ${CAT_CONTEXTS[targetCat]}` : "";
            const savedPrefs = targetCat && catPrefs[targetCat] ? `\nПРЕДПОЧТЕНИЯ БАЙЕРА: ${catPrefs[targetCat]}` : "";
            const rejected = targetCat && rejectedBrands[targetCat] && rejectedBrands[targetCat].length > 0 ? `\nОТКЛОНЁНЫЕ БРЕНДЫ (не предлагать): ${rejectedBrands[targetCat].join(", ")}` : "";
            const feedback = customFeedback ? `\nОБРАТНАЯ СВЯЗЬ БАЙЕРА (учти при генерации): ${customFeedback}` : "";
            text = await callAI(`Ты FMCG-эксперт по Казахстану. ВАЖНО: верни ТОЛЬКО валидный JSON массив, без markdown, без комментариев. Начни ответ с символа [ и закончи символом ].

Верни массив из ${targetCat ? "10" : "5"} объектов для ${targetCat ? `категории: ${batches[i]}` : `категорий: ${batches[i]}`}.

СЕГОДНЯШНЯЯ ДАТА: ${today}. СЕТЬ АЯН: Астана, Караганда, Темиртау. НЕ Алматы.

Фокус: конкретные бренды которых ещё нет или только заходят в Казахстан.${catContext}${savedPrefs}${rejected}${feedback}

Структура объекта:
{
  "name": "Бренд + название позиции",
  "product_type": "Тип продукта на русском языке, 2-4 слова. ТОЛЬКО РУССКИЙ. Примеры: Исландский йогурт скир, Протеиновый батончик шоколад, Корейские рисовые клёцки, Влажные салфетки для новорождённых, Замороженная пицца премиум, Охлаждённый лосось стейк, Энергетический напиток, Чипсы из нори, Эко-подгузники, Веганская колбаса",
  "subname": "Производитель + страна",
  "category": "${targetCat || "категория из списка"}",
  "status": "🔥 Горячий" | "✨ Новинка" | "📈 Растёт" | "✅ Стабильный",
  "heat": число 1-10,
  "region": "Азия" | "Америка" | "Европа" | "Глобальный",
  "instagram_idea": "идея поста",
  "russia_status": "Активно продаётся" | "Появляется" | "Редко встречается" | "Нет в продаже",
  "russia_detail": "детали",
  "kz_status": "Активно продаётся" | "Появляется" | "Редко встречается" | "Нет в продаже",
  "kz_detail": "детали по Астане/Караганде/Темиртау",
  "social1_platform": "TikTok",
  "social1_desc": "описание",
  "social2_platform": "Instagram",
  "social2_desc": "описание",
  "procurement_ready": "🟢 Готов к закупке" | "🟡 Ищем поставщика" | "🔴 Недоступно в КЗ",
  "price_range": "500–1200 ₸",
  "competitors_kz": "оставь пустую строку — конкуренты проверяются отдельно через поиск",
  "supply_source": "🇰🇿 Локальный KZ" | "🇷🇺 Россия прямая" | "🇪🇺 Европа через РФ" | "🇦🇪 ОАЭ/Дубай" | "🌏 Азия прямая" | "🌐 Прямой импорт"
}

Только JSON массив. Начни с [ закончи ].`);
            if (text && text.length > 10) break;
          } catch(e) { console.error("Attempt failed:", e.message); }
        }
        const parsed = parseJsonArray(text);
        if (parsed && parsed.length > 0) {
          const batchItems = parsed.map(t => ({...BASE,...t,supply_source:t.supply_source||"",competitors:[],kanban:"idea"}));
          setProgress(`🔍 Проверяю конкурентов для батча ${i+1}...`);
          const verifiedItems = await verifyCompetitors(batchItems);
          all.push(...verifiedItems);
        }
      }
      if (all.length===0) throw new Error("AI вернул пустой ответ");

      let finalTrends;
      if (targetCat) {
        const kept = trends.filter(t => t.category !== targetCat);
        finalTrends = [...kept, ...all];
        setTrends(finalTrends);
      } else {
        finalTrends = all;
        setTrends(all);
      }
      await sb.upsertAll(finalTrends);

      // ── Сохраняем в историю генераций ─────────────────────────────────────
      setProgress(targetCat ? `Сохраняю в историю...` : `Сохраняю в историю...`);
      await sb.saveHistory(targetCat || "Все", customFeedback, all);

      setDbLoaded(true);
      const now = new Date();
      const nowStr = now.toLocaleString("ru-KZ");
      setLastUpdate(nowStr); setLastUpdateTs(now.getTime());
      localStorage.setItem("ayan_last_update", nowStr);
      localStorage.setItem("ayan_last_update_ts", String(now.getTime()));
      if (targetCat) {
        const updated = {...catUpdates, [targetCat]: {time: nowStr, ts: now.getTime()}};
        setCatUpdates(updated);
        localStorage.setItem("ayan_cat_updates", JSON.stringify(updated));
      }
    } catch(e) { setError(e.message); }
    setLoading(false); setProgress("");
  };

  // ── Восстановление генерации из истории ───────────────────────────────────
  const restoreHistoryEntry = async (cat, items) => {
    const restoredItems = items.map(t => ({...BASE, ...t}));
    const kept = trends.filter(t => t.category !== cat);
    const merged = [...kept, ...restoredItems];
    setTrends(merged);
    await sb.upsertAll(merged);
    // Фиксируем в catUpdates
    const now = new Date();
    const nowStr = now.toLocaleString("ru-KZ");
    const updated = {...catUpdates, [cat]: {time: nowStr, ts: now.getTime()}};
    setCatUpdates(updated);
    localStorage.setItem("ayan_cat_updates", JSON.stringify(updated));
  };

  const generatePost = async (item) => {
    setInstaItem(item); setInstaLoading(true); setInstaPosts(null); setContentModal(true);
    try {
      const today = new Date().toLocaleDateString("ru-RU", {day:"numeric", month:"long", year:"numeric"});
      const text = await callAI(`Ты SMM-менеджер супермаркета Аян (Казахстан: Астана, Караганда, Темиртау). СЕГОДНЯШНЯЯ ДАТА: ${today}. Товар: ${item.name} (${item.subname||""}), категория: ${item.category}.
Верни JSON массив из 6 объектов без markdown:
[
  {"variant":"📝 Instagram — пост в ленту","caption":"90-120 слов с эмодзи","hashtags":"15 хэштегов для Казахстана","tip":"совет по оформлению"},
  {"variant":"🎬 TikTok / Reels — сценарий","caption":"Детальный сценарий: хук, что снимать, текст на экране, призыв. 15-30 сек.","hashtags":"10 хэштегов","tip":"идея для музыки"},
  {"variant":"📲 Instagram Stories — серия","caption":"3 слайда с интерактивом (опрос/слайдер/вопрос)","hashtags":"5 хэштегов","tip":"совет по стикерам"},
  {"variant":"📢 Telegram — анонс","caption":"Короткий текст 40-60 слов","hashtags":"3 хэштега","tip":"когда публиковать"},
  {"variant":"🏪 Промо офлайн — акция","caption":"Идея промо в торговом зале: механика, что подготовить, как оформить","hashtags":"","tip":"период и аудитория"},
  {"variant":"🎁 Промо офлайн — спецпредложение","caption":"Идея бандл-предложения: что объединить, ценовая механика, POS-материалы","hashtags":"","tip":"потенциальный прирост"}
]`);
      setInstaPosts(parseJsonArray(text)||[{variant:"Базовый пост",caption:item.instagram_idea,hashtags:"#Аян #Казахстан",tip:""}]);
    } catch(_) {
      setInstaPosts([{variant:"Базовый пост",caption:`🛒 ${item.name} уже в Аяне! ${item.instagram_idea}`,hashtags:"#Аян #Казахстан",tip:""}]);
    }
    setInstaLoading(false);
  };

  const generateAnalysis = async (item) => {
    setAnalysisItem(item); setAnalysisLoading(true); setAnalysisData(null); setAnalysisModal(true);
    try {
      const todayStr = new Date().toLocaleDateString("ru-RU", {day:"numeric", month:"long", year:"numeric"});
      const text = await callAI(`Ты FMCG-эксперт по Казахстану. Проведи глубокий анализ позиции для байера супермаркета Аян.

СЕГОДНЯШНЯЯ ДАТА: ${todayStr}. Все сроки от этой даты в будущее.

ВАЖНО О СЕТИ АЯН:
- Аян работает в 3 городах: Караганда, Темиртау, Астана. НЕТ в Алматы — никогда не упоминай Алматы.
- Реальные магазины (33 точки):
  Караганда (20): 45 квартал, Азат, Аян-Город, Берёзка, Восток, Огонёк, Океан, Рыскулова, Алиханова, Мечта, Степной 2, Степной 4, Сырдарья, Айгерим, Ануар, Умай, ТБЦ, Аманжолова 17, Аманжолова 35, Верный Пришахтинск
  Темиртау (8): Верный 1, Женіс, Комсомолец, Пассаж, Аян-7, Шолпан, 7мкр 1а, Нура
  Астана (5): Евромол, Жайлы, Кажимукана, Караван, Пригородный

КАРТА КОНКУРЕНТОВ:
КАРАГАНДА: Fix Price 25 точек, Южный 13, Magnum 5, Optima 5, Корзина 4, Светофор 4. Small — НЕТ.
АСТАНА: Magnum 78 точек (лидер), Fix Price 67, Small 63, My Mart 41, Galmart 8.
ТЕМИРТАУ: Fix Price 13 точек (главный конкурент), Magnum — НЕТ, Small — НЕТ.

Товар: ${item.name} (${item.subname||""}), категория: ${item.category}, регион: ${item.region}.

Верни JSON объект без markdown:
{
  "trend_type": "Тип тренда с пояснением",
  "trend_reason": "Почему тренд сейчас, цифры, культурный контекст",
  "viral_formats": ["3-4 конкретных формата контента"],
  "skus": [{"name":"SKU с весом","pack":"упаковка","price_rf":"цена в рублях","price_kz":"прогноз в тенге"}],
  "supply_chain": {"manufacturer":"производитель и страна","distributor":"контакт или путь поставки","route":"маршрут","difficulty":"🟢/🟡/🔴","min_order":"минимальная партия"},
  "kz_competitors": [{"name":"магазин/сеть","status":"что есть","gap":"окно возможностей"}],
  "ayan_strategy": {"priority":"🔴/🟡/🟢","test_quantity":"тестовая партия","launch_channel":"конкретные магазины из списка","positioning":"как подать товар"}
}`);
      const cleaned = text.replace(/^[^{]*/, "").replace(/[^}]*$/, "");
      setAnalysisData(JSON.parse(cleaned));
    } catch(e) {
      setAnalysisData({error: "Не удалось сгенерировать анализ: " + e.message});
    }
    setAnalysisLoading(false);
  };

  const exportExcel = async () => {
    if (!window.ExcelJS) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.bare.min.js";
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }
    const wb = new window.ExcelJS.Workbook();
    wb.creator = "Аян FMCG Trend Intelligence";
    wb.created = new Date();

    const COLS = [
      { header: "#",                 width: 4  },
      { header: "Товар",             width: 28 },
      { header: "Производитель",     width: 22 },
      { header: "Категория",         width: 16 },
      { header: "Регион",            width: 10 },
      { header: "Статус",            width: 13 },
      { header: "Интерес",           width: 8  },
      { header: "Цена ₸",           width: 14 },
      { header: "Готовность",        width: 20 },
      { header: "Источник поставки", width: 18 },
      { header: "Конкуренты в КЗ",   width: 24 },
      { header: "Статус в России",   width: 16 },
      { header: "Детали Россия",     width: 28 },
      { header: "Статус в КЗ",       width: 16 },
      { header: "Детали КЗ",         width: 28 },
      { header: "Идея контента",     width: 36 },
      { header: "Канбан",            width: 20 },
      { header: "№ Заявки",          width: 12 },
    ];
    const NC = COLS.length;

    const STATUS_STYLE = {
      "Горячий":    { font:"FFFF4D6D", fill:"FFFFF0F4" },
      "Новинка":    { font:"FFB45309", fill:"FFFEF3C7" },
      "Растёт":     { font:"FF16A34A", fill:"FFF0FDF4" },
      "Стабильный": { font:"FF475569", fill:"FFF8FAFC" },
    };
    const READY_STYLE = {
      "Готов к закупке": { font:"FF15803D", fill:"FFF0FDF4" },
      "Ищем поставщика": { font:"FF92400E", fill:"FFFEF3C7" },
      "Недоступно в КЗ": { font:"FF991B1B", fill:"FFFFF0F4" },
    };

    const buildSheet = (name, data) => {
      const ws = wb.addWorksheet(name, {
        views: [{ state:"frozen", xSplit:0, ySplit:4 }],
      });
      ws.columns = COLS.map(c => ({ width: c.width }));

      // Строка 1 — большой заголовок
      const r1 = ws.addRow([`АЯН · FMCG Тренды — ${name}`]);
      ws.mergeCells(1,1,1,NC);
      r1.height = 38;
      r1.getCell(1).style = {
        font: { name:"Calibri", size:22, bold:true, color:{argb:"FFFFFFFF"} },
        fill: { type:"pattern", pattern:"solid", fgColor:{argb:"FF1E1B4B"} },
        alignment: { vertical:"middle", horizontal:"left", indent:1 },
      };

      // Строка 2 — инфо об экспорте
      const now = new Date().toLocaleString("ru-KZ");
      const r2 = ws.addRow([`Экспортировано: ${now} (UTC+5)  |  Аян Супермаркет · Астана · Караганда · Темиртау  |  FMCG Trend Intelligence v3.1`]);
      ws.mergeCells(2,1,2,NC);
      r2.height = 18;
      r2.getCell(1).style = {
        font: { name:"Calibri", size:9, italic:true, color:{argb:"FFCFCFE8"} },
        fill: { type:"pattern", pattern:"solid", fgColor:{argb:"FF2D2A5E"} },
        alignment: { vertical:"middle", horizontal:"left", indent:1 },
      };

      // Строка 3 — тонкая полоска-разделитель
      const r3 = ws.addRow([]);
      r3.height = 5;
      for (let c=1;c<=NC;c++) r3.getCell(c).style = { fill:{type:"pattern",pattern:"solid",fgColor:{argb:"FF7C3AED"}} };

      // Строка 4 — шапка колонок с фильтрами
      const r4 = ws.addRow(COLS.map(c=>c.header));
      r4.height = 30;
      r4.eachCell(cell => {
        cell.style = {
          font: { name:"Calibri", size:10, bold:true, color:{argb:"FFFFFFFF"} },
          fill: { type:"pattern", pattern:"solid", fgColor:{argb:"FF7C3AED"} },
          alignment: { vertical:"middle", horizontal:"center", wrapText:true },
          border: { bottom:{style:"medium", color:{argb:"FF5B21B6"}} },
        };
      });
      ws.autoFilter = { from:{row:4,column:1}, to:{row:4,column:NC} };

      // Строки данных
      data.forEach((t, idx) => {
        const statusClean = (t.status||"").replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}]/gu,"").replace(/[🔥✨📈✅]/g,"").trim();
        const readyClean  = (t.procurement_ready||"").replace(/[🟢🟡🔴]/g,"").trim();
        const supplyClean = (t.supply_source||"").replace(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1F9FF}]/gu,"").trim();
        const kanbanLabel = KANBAN_COLS.find(c=>c.id===(t.kanban||"idea"))?.label.replace(/[💡🏢✅🔍🚫]/g,"").trim()||"";
        const rowBg = idx%2===0 ? "FFFFFFFF" : "FFF8F7FF";

        const dr = ws.addRow([
          idx+1, t.name||"", t.subname||"", t.category||"", t.region||"",
          statusClean, t.heat||"", t.price_range||"—", readyClean, supplyClean,
          (t.competitors||[]).join(", "),
          t.russia_status||"", t.russia_detail||"",
          t.kz_status||"", t.kz_detail||"",
          t.instagram_idea||"", kanbanLabel, t.request_num||"",
        ]);
        dr.height = 40;

        dr.eachCell({includeEmpty:true}, (cell, cn) => {
          cell.style = {
            font: { name:"Calibri", size:10 },
            fill: { type:"pattern", pattern:"solid", fgColor:{argb:rowBg} },
            alignment: { vertical:"middle", wrapText:true, horizontal:cn===1?"center":"left" },
            border: { bottom:{style:"thin", color:{argb:"FFE2E8F0"}} },
          };
        });

        // Цветной статус (колонка 6)
        const sc = Object.entries(STATUS_STYLE).find(([k])=>statusClean.includes(k));
        if (sc) {
          const cell = dr.getCell(6);
          cell.style = { ...cell.style,
            font: { ...cell.style.font, color:{argb:sc[1].font}, bold:true },
            fill: { type:"pattern", pattern:"solid", fgColor:{argb:sc[1].fill} },
          };
        }

        // Цветная готовность (колонка 9)
        const rc = Object.entries(READY_STYLE).find(([k])=>readyClean.includes(k));
        if (rc) {
          const cell = dr.getCell(9);
          cell.style = { ...cell.style,
            font: { ...cell.style.font, color:{argb:rc[1].font}, bold:true },
            fill: { type:"pattern", pattern:"solid", fgColor:{argb:rc[1].fill} },
          };
        }

        // Разделитель между товарами
        const sep = ws.addRow([]);
        sep.height = 5;
        for (let c=1;c<=NC;c++) sep.getCell(c).style = { fill:{type:"pattern",pattern:"solid",fgColor:{argb:"FFF1F0FB"}} };
      });
    };

    buildSheet("Все тренды", trends);
    const cats = [...new Set(trends.map(t=>t.category).filter(Boolean))].sort();
    cats.forEach(cat => {
      const d = trends.filter(t=>t.category===cat);
      if (d.length>0) buildSheet(cat.slice(0,31), d);
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Аян_FMCG_${new Date().toLocaleDateString("ru-KZ").replace(/\./g,"-")}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Выгрузка для категорийного менеджера ──────────────────────────────────
  const exportKM = async () => {
    if (!window.ExcelJS) {
      await new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.bare.min.js";
        s.onload = resolve; s.onerror = reject;
        document.head.appendChild(s);
      });
    }

    const catName = filter === "Все" ? "Все категории" : filter;
    const catData = filter === "Все" ? trends : trends.filter(t => t.category === filter);
    if (catData.length === 0) { alert("Нет данных для выгрузки"); return; }

    // Топ-3 по heat для резюме
    const top3 = [...catData].sort((a,b) => (b.heat||0)-(a.heat||0)).slice(0,3);
    const readyNow = catData.filter(t => t.procurement_ready === "🟢 Готов к закупке");
    const hot = catData.filter(t => t.status?.includes("Горячий"));

    const wb = new window.ExcelJS.Workbook();
    wb.creator = "Аян FMCG Trend Intelligence";
    wb.created = new Date();
    const now = new Date();
    const dateStr = now.toLocaleDateString("ru-KZ");
    const monthStr = now.toLocaleString("ru-KZ", {month:"long", year:"numeric"});

    const PURPLE  = "FF7C3AED";
    const DPURPLE = "FF1E1B4B";
    const MPURPLE = "FF2D2A5E";
    const WHITE   = "FFFFFFFF";
    const LGRAY   = "FFF8F7FF";
    const BORDER_COLOR = "FFE2E8F0";

    const cellStyle = (opts = {}) => ({
      font:      { name:"Calibri", size:10, ...opts.font },
      fill:      opts.fill ? { type:"pattern", pattern:"solid", fgColor:{argb:opts.fill} } : undefined,
      alignment: { vertical:"middle", wrapText:true, ...opts.align },
      border:    opts.border !== false ? { bottom:{style:"thin",color:{argb:BORDER_COLOR}} } : undefined,
    });

    // ── Лист 1: РЕЗЮМЕ ─────────────────────────────────────────────────────
    const wsR = wb.addWorksheet("📋 Резюме", { views:[{showGridLines:false}] });
    wsR.columns = [{width:3},{width:22},{width:32},{width:18},{width:18},{width:22},{width:20}];
    const NC = 7;

    // Большой заголовок
    const r1 = wsR.addRow([`АЯН · FMCG Тренды — ${catName}`]);
    wsR.mergeCells(1,1,1,NC); r1.height = 42;
    r1.getCell(1).style = { font:{name:"Calibri",size:24,bold:true,color:{argb:WHITE}}, fill:{type:"pattern",pattern:"solid",fgColor:{argb:DPURPLE}}, alignment:{vertical:"middle",horizontal:"left",indent:1} };

    // Подзаголовок
    const r2 = wsR.addRow([`Подготовлено: Маркетинг Аян  |  ${dateStr}  |  FMCG Trend Intelligence v3.1`]);
    wsR.mergeCells(2,1,2,NC); r2.height = 18;
    r2.getCell(1).style = { font:{name:"Calibri",size:9,italic:true,color:{argb:"FFCFCFE8"}}, fill:{type:"pattern",pattern:"solid",fgColor:{argb:MPURPLE}}, alignment:{vertical:"middle",horizontal:"left",indent:1} };

    // Фиолетовая полоска
    const r3 = wsR.addRow([]); r3.height = 6;
    for(let c=1;c<=NC;c++) r3.getCell(c).style = {fill:{type:"pattern",pattern:"solid",fgColor:{argb:PURPLE}}};

    wsR.addRow([]); // отступ

    // KPI-блок
    const r5 = wsR.addRow(["", "Всего позиций", "", "Горячих", "", "Готовы к закупке", ""]);
    wsR.mergeCells(r5.number,2,r5.number,3); wsR.mergeCells(r5.number,4,r5.number,5); wsR.mergeCells(r5.number,6,r5.number,7);
    r5.height = 20;
    ["B","D","F"].forEach(col => {
      r5.getCell(col).style = { font:{name:"Calibri",size:10,bold:true,color:{argb:"FF64748B"}}, fill:{type:"pattern",pattern:"solid",fgColor:{argb:LGRAY}}, alignment:{vertical:"middle",horizontal:"center"} };
    });

    const r6 = wsR.addRow(["", catData.length, "", hot.length, "", readyNow.length, ""]);
    wsR.mergeCells(r6.number,2,r6.number,3); wsR.mergeCells(r6.number,4,r6.number,5); wsR.mergeCells(r6.number,6,r6.number,7);
    r6.height = 36;
    r6.getCell("B").style = { font:{name:"Calibri",size:28,bold:true,color:{argb:"FF7C3AED"}}, fill:{type:"pattern",pattern:"solid",fgColor:{argb:LGRAY}}, alignment:{vertical:"middle",horizontal:"center"} };
    r6.getCell("D").style = { font:{name:"Calibri",size:28,bold:true,color:{argb:"FFFF4D6D"}}, fill:{type:"pattern",pattern:"solid",fgColor:{argb:"FFFFF0F4"}}, alignment:{vertical:"middle",horizontal:"center"} };
    r6.getCell("F").style = { font:{name:"Calibri",size:28,bold:true,color:{argb:"FF15803D"}}, fill:{type:"pattern",pattern:"solid",fgColor:{argb:"FFF0FDF4"}}, alignment:{vertical:"middle",horizontal:"center"} };

    wsR.addRow([]); // отступ

    // Как это работает — процесс от тренда до полки
    const rProc = wsR.addRow(["", "КАК ЭТО РАБОТАЕТ — ОТ ТРЕНДА ДО ПОЛКИ", "", "", "", "", ""]);
    wsR.mergeCells(rProc.number,2,rProc.number,NC); rProc.height = 28;
    rProc.getCell("B").style = { font:{name:"Calibri",size:13,bold:true,color:{argb:WHITE}}, fill:{type:"pattern",pattern:"solid",fgColor:{argb:PURPLE}}, alignment:{vertical:"middle",horizontal:"left",indent:1} };

    const steps = [
      ["1.", "Маркетинг анализирует тренды",   "AI-система мониторит мировые тренды в FMCG, отбирает позиции актуальные для Казахстана и передаёт категорийным менеджерам"],
      ["2.", "КМ принимает решение",            "Категорийный менеджер изучает список, выбирает позиции для ввода и ставит отметку в колонке «Решение КМ» на листе Позиции"],
      ["3.", "Байер находит поставщика",        "По одобренным позициям ищем поставщика, договариваемся об условиях, завозим первую тестовую партию"],
      ["4.", "Выкладка на тестовый торец",      "Товар размещается на торце стеллажа рядом с основной категорией: Формат 3 — 20-25 SKU, Формат 2 — 10-15 SKU, Формат 1 — 5-8 SKU"],
      ["5.", "8 недель теста",                  "Замеряем продажи. Хорошие результаты — переводим в постоянный ассортимент. Слабые — убираем и фиксируем причину"],
      ["6.", "Ротация зоны",                    "Раз в месяц 2-3 новые тренды заходят на торец, 1-2 выпускника переезжают в основную категорию или выводятся"],
    ];
    steps.forEach((step, i) => {
      const sr = wsR.addRow(["", step[0] + "  " + step[1], step[2], "", "", "", ""]);
      sr.height = 36;
      wsR.mergeCells(sr.number,3,sr.number,NC);
      sr.getCell("B").style = { font:{name:"Calibri",size:11,bold:true,color:{argb:PURPLE}}, fill:{type:"pattern",pattern:"solid",fgColor:{argb:i%2===0?LGRAY:WHITE}}, alignment:{vertical:"middle",horizontal:"left",indent:1} };
      sr.getCell("C").style = { font:{name:"Calibri",size:10,color:{argb:"FF334155"}}, fill:{type:"pattern",pattern:"solid",fgColor:{argb:i%2===0?LGRAY:WHITE}}, alignment:{vertical:"middle",wrapText:true,horizontal:"left",indent:1} };
    });

    // Подпись
    wsR.addRow([]);
    const lastR = wsR.addRow(["", `Документ подготовлен: Маркетинг Аян · ${dateStr} · FMCG Trend Intelligence v3.1`, "", "", "", "", ""]);
    wsR.mergeCells(lastR.number,2,lastR.number,NC);
    lastR.getCell("B").style = { font:{name:"Calibri",size:9,italic:true,color:{argb:"FF94A3B8"}}, alignment:{vertical:"middle"} };

    // ── Лист 2: ПОЗИЦИИ ────────────────────────────────────────────────────
    const wsP = wb.addWorksheet("📦 Позиции", { views:[{state:"frozen",xSplit:0,ySplit:4}] });
    const PCOLS = [
      {header:"#",           width:4},
      {header:"Товар",       width:36},
      {header:"Категория",   width:16},
      {header:"Почему тренд",width:38},
      {header:"Цена ₸",     width:14},
      {header:"Конкуренты",  width:22},
      {header:"Рос. рынок",  width:16},
      {header:"КЗ рынок",    width:16},
      {header:"Поставка",    width:18},
      {header:"Решение КМ",  width:20},
    ];
    wsP.columns = PCOLS.map(c=>({width:c.width}));

    const rP1 = wsP.addRow([`АЯН · Тренды для КМ — ${catName} · ${monthStr}`]);
    wsP.mergeCells(1,1,1,PCOLS.length); rP1.height = 36;
    rP1.getCell(1).style = { font:{name:"Calibri",size:20,bold:true,color:{argb:WHITE}}, fill:{type:"pattern",pattern:"solid",fgColor:{argb:DPURPLE}}, alignment:{vertical:"middle",horizontal:"left",indent:1} };

    const rP2 = wsP.addRow([`Подготовлено: Маркетинг Аян  |  ${dateStr}  |  Передать ответ до: ${new Date(now.getTime()+7*24*60*60*1000).toLocaleDateString("ru-KZ")}`]);
    wsP.mergeCells(2,1,2,PCOLS.length); rP2.height = 18;
    rP2.getCell(1).style = { font:{name:"Calibri",size:9,italic:true,color:{argb:"FFCFCFE8"}}, fill:{type:"pattern",pattern:"solid",fgColor:{argb:MPURPLE}}, alignment:{vertical:"middle",horizontal:"left",indent:1} };

    const rP3 = wsP.addRow([]); rP3.height = 5;
    for(let c=1;c<=PCOLS.length;c++) rP3.getCell(c).style = {fill:{type:"pattern",pattern:"solid",fgColor:{argb:PURPLE}}};

    const rP4 = wsP.addRow(PCOLS.map(c=>c.header));
    rP4.height = 30;
    rP4.eachCell(cell => {
      cell.style = { font:{name:"Calibri",size:10,bold:true,color:{argb:WHITE}}, fill:{type:"pattern",pattern:"solid",fgColor:{argb:PURPLE}}, alignment:{vertical:"middle",horizontal:"center",wrapText:true}, border:{bottom:{style:"medium",color:{argb:"FF5B21B6"}}} };
    });
    wsP.autoFilter = {from:{row:4,column:1},to:{row:4,column:PCOLS.length}};

    const READY_STYLE = {
      "Готов к закупке": {font:"FF15803D", fill:"FFF0FDF4"},
      "Ищем поставщика": {font:"FF92400E", fill:"FFFEF3C7"},
      "Недоступно в КЗ": {font:"FF991B1B", fill:"FFFFF0F4"},
    };
    const STATUS_COLORS = {
      "Горячий":    "FFFF4D6D",
      "Новинка":    "FFB45309",
      "Растёт":     "FF16A34A",
      "Стабильный": "FF475569",
    };

    // Сортируем по heat desc
    const sorted = [...catData].sort((a,b)=>(b.heat||0)-(a.heat||0));
    sorted.forEach((t, idx) => {
      const statusClean = (t.status||"").replace(/[🔥✨📈✅]/g,"").trim();
      const supplyClean = (t.supply_source||"").replace(/[\u{1F1E6}-\u{1F1FF}]/gu,"").trim();
      const rowBg = idx%2===0 ? WHITE : LGRAY;
      const isTop = idx < 3;
      const sc = Object.entries(STATUS_COLORS).find(([k])=>statusClean.includes(k));
      const nameColor = sc ? sc[1] : "FF0F172A";

      const dr = wsP.addRow([
        idx+1,
        "", // колонка Товар — заполним richText ниже
        t.category||"—",
        t.instagram_idea || t.social1_desc || "—",
        t.price_range||"—",
        (t.competitors||[]).join(", ") || "—",
        t.russia_status||"—",
        t.kz_status||"—",
        supplyClean||"—",
        "← Ваше решение",
      ]);
      dr.height = 56;

      // Базовый стиль всех ячеек
      for (let cn = 1; cn <= 10; cn++) {
        const cell = dr.getCell(cn);
        cell.style = {
          font:      { name:"Calibri", size:10 },
          fill:      { type:"pattern", pattern:"solid", fgColor:{argb: isTop ? "FFFFF8FF" : rowBg} },
          alignment: { vertical:"middle", wrapText:true, horizontal: cn===1 ? "center" : "left" },
          border:    { bottom:{style:"thin",color:{argb:BORDER_COLOR}} },
        };
      }

      // Колонка 2 — richText: Название / Тип продукта / Бренд
      const nameCell = dr.getCell(2);
      nameCell.style = { ...nameCell.style, border:{...nameCell.style.border, left: isTop ? {style:"medium",color:{argb:PURPLE}} : undefined} };
      nameCell.value = {
        richText: [
          { text: (t.name||"") + "\n",
            font: {name:"Calibri", size:10, bold:true, color:{argb:nameColor}} },
          ...(t.product_type ? [{ text: t.product_type + "\n",
            font: {name:"Calibri", size:9, italic:true, color:{argb:"FF7C3AED"}} }] : []),
          { text: t.subname||"",
            font: {name:"Calibri", size:9, color:{argb:"FF64748B"}} },
        ]
      };

      // Колонка 10 — Решение КМ
      const dc = dr.getCell(10);
      dc.style = {
        font:      { name:"Calibri", size:10, italic:true, color:{argb:"FFCB8A00"} },
        fill:      { type:"pattern", pattern:"solid", fgColor:{argb:"FFFFFBEB"} },
        alignment: { vertical:"middle", horizontal:"center" },
        border:    { bottom:{style:"thin",color:{argb:BORDER_COLOR}}, left:{style:"medium",color:{argb:"FFFBBF24"}}, right:{style:"medium",color:{argb:"FFFBBF24"}} },
      };
    });

    // 3й лист убран — содержимое перенесено в Резюме

    // Скачиваем
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Аян_КМ_${catName}_${dateStr.replace(/\./g,"-")}.xlsx`;
    a.click(); URL.revokeObjectURL(url);
  };

  const filtered = trends.filter(t=>{
    const catOk=filter==="Все"||t.category===filter;
    const readyOk=readyFilter==="Все"||(t.procurement_ready||"")===readyFilter;
    const statusOk=requestFilter==="Все"||(t.kanban||"idea")===requestFilter;
    const regionOk=regionFilter==="Все"||(t.region||"")=== regionFilter;
    const q=search.toLowerCase();
    const searchOk=!q||(t.name||"").toLowerCase().includes(q)||(t.category||"").toLowerCase().includes(q);
    return catOk&&readyOk&&statusOk&&regionOk&&searchOk;
  });

  const B=(x={})=>({background:"#f1f5f9",color:"#0f172a",border:"1px solid #2a2a3d",borderRadius:8,padding:"9px 14px",fontWeight:600,fontSize:12,cursor:"pointer",...x});
  const tabBtn=t=>B({background:tab===t?"#7c3aed":"#f1f5f9",color:tab===t?"#fff":"#0f172a",border:"1px solid "+(tab===t?"#7c3aed":"#e2e8f0")});
  const fBtn=a=>({background:a?"#7c3aed":"transparent",color:a?"#fff":"#64748b",border:"1px solid "+(a?"#7c3aed":"#e2e8f0"),borderRadius:6,padding:"6px 12px",fontSize:11,cursor:"pointer"});
  const TH={fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#64748b",padding:"10px 12px",textAlign:"left",background:"#ffffff",borderBottom:"1px solid #2a2a3d",whiteSpace:"nowrap"};
  const TD={padding:"10px 12px",fontSize:12,verticalAlign:"top",borderBottom:"1px solid #1e1e2e"};

  if (!authed) {
    const correctPw = import.meta.env.VITE_ACCESS_PASSWORD;
    const tryLogin = () => {
      if (pwInput === correctPw && correctPw) {
        setAuthed(true); localStorage.setItem("ayan_authed_ts", String(Date.now())); setPwError("");
      } else { setPwError("Неверный пароль"); setPwInput(""); }
    };
    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#f1f5f9,#e0e7ff)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:16}}>
        <div style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:16,padding:36,maxWidth:420,width:"100%",boxShadow:"0 20px 60px rgba(15,23,42,0.12)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:24}}>
            <div style={{background:"linear-gradient(135deg,#ff4d6d,#7c3aed)",color:"#fff",fontWeight:800,fontSize:14,padding:"8px 16px",borderRadius:8,letterSpacing:1}}>АЯН</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#0f172a"}}>FMCG Trend Intelligence</div>
              <div style={{fontSize:11,color:"#64748b"}}>v3.1 · Коммерческая тайна</div>
            </div>
          </div>
          <div style={{fontSize:13,color:"#475569",marginBottom:18,lineHeight:1.5}}>🔐 Доступ только для сотрудников коммерческого отдела Аян.</div>
          <input type="password" value={pwInput} onChange={e=>{setPwInput(e.target.value); setPwError("");}} onKeyDown={e=>e.key==="Enter"&&tryLogin()} placeholder="Пароль" autoFocus
            style={{width:"100%",padding:"12px 14px",fontSize:14,border:"1px solid "+(pwError?"#ff4d6d":"#cbd5e1"),borderRadius:8,outline:"none",marginBottom:12,boxSizing:"border-box"}}/>
          {pwError && <div style={{fontSize:12,color:"#ff4d6d",marginBottom:12}}>⚠️ {pwError}</div>}
          <button onClick={tryLogin} disabled={!pwInput}
            style={{width:"100%",background:"linear-gradient(135deg,#ff4d6d,#7c3aed)",color:"#fff",border:"none",borderRadius:8,padding:"12px",fontWeight:700,fontSize:13,cursor:pwInput?"pointer":"not-allowed",opacity:pwInput?1:0.5,textTransform:"uppercase",letterSpacing:"0.05em"}}>
            Войти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",color:"#0f172a",fontFamily:"system-ui,sans-serif",padding:16}}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Шапка */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:"linear-gradient(135deg,#ff4d6d,#7c3aed)",color:"#fff",fontWeight:800,fontSize:13,padding:"6px 14px",borderRadius:6,letterSpacing:1}}>АЯН</div>
          <span style={{color:"#64748b",fontSize:12}}>FMCG Trend Intelligence v3.1</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#22c55e"}}>
          <div style={{width:7,height:7,background:"#22c55e",borderRadius:"50%",animation:"pulse 2s infinite"}}/>AI-мониторинг
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:dbLoaded?"#22c55e":"#fbbf24"}}/>
          <span style={{color:dbLoaded?"#22c55e":"#fbbf24",fontWeight:600}}>{dbLoaded?"🗄️ БД подключена":"⚡ Локальный режим"}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 10px"}}>
          <span style={{color:"#64748b"}}>📅 Сегодня:</span>
          <span style={{color:"#0f172a",fontWeight:700}}>{new Date().toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}</span>
        </div>
        <button onClick={()=>{localStorage.removeItem("ayan_authed_ts"); setAuthed(false); setPwInput("");}}
          style={{background:"transparent",border:"1px solid #cbd5e1",borderRadius:6,padding:"4px 10px",fontSize:11,color:"#64748b",cursor:"pointer"}}>🔓 Выйти</button>
      </div>

      <div style={{fontWeight:800,fontSize:22,background:"linear-gradient(135deg,#0f172a 40%,#7c3aed)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:6}}>Трендовые товары для Казахстана</div>
      <div style={{color:"#64748b",fontSize:13,marginBottom:20}}>Светофор закупки · Конкуренты · Цены · Канбан воронка · История генераций</div>

      {trends.length === 0 && (
        <div style={{textAlign:"center",padding:60,color:"#64748b"}}>
          <div style={{width:32,height:32,border:"3px solid #2a2a3d",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 16px"}}/>
          <div style={{fontSize:14}}>Загружаем данные из базы...</div>
        </div>
      )}

      {/* KPI-карточки */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
        {[["Товаров",filtered.length,"#22c55e"],["Горячих",filtered.filter(t=>t.status?.includes("Горячий")).length,"#ff4d6d"],["🟢 К закупке",filtered.filter(t=>t.procurement_ready==="🟢 Готов к закупке").length,"#22c55e"],["🔴 Недоступно",filtered.filter(t=>t.procurement_ready==="🔴 Недоступно в КЗ").length,"#ff4d6d"],["✨ Новинок",filtered.filter(t=>t.status?.includes("Новинка")).length,"#fbbf24"],["📦 В ассорт.",filtered.filter(t=>t.kanban==="done").length,"#7c3aed"]].map(([l,v,c])=>(
          <div key={l} style={{background:"#f1f5f9",border:"1px solid #2a2a3d",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{l}</div>
            <div style={{fontWeight:800,fontSize:20,color:c}}>{v}</div>
          </div>
        ))}
      </div>

      {/* Панель инструментов */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12,alignItems:"flex-start"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <button style={{background:"linear-gradient(135deg,#ff4d6d,#7c3aed)",color:"#fff",border:"none",borderRadius:8,padding:"10px 18px",fontWeight:700,fontSize:12,cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.05em",opacity:loading?0.6:1}} disabled={loading} onClick={()=>fetchTrends()}>
            {loading?`⏳ ${progress}`:filter==="Все"?"⚡ Обновить все тренды":`⚡ Обновить: ${filter}`}
          </button>

          {/* ── Кнопка «История генераций» ── */}
          <button
            onClick={() => setHistoryModal(true)}
            style={{background:"#ffffff",border:"1px solid #a78bfa",borderRadius:8,padding:"10px 16px",fontWeight:600,fontSize:12,cursor:"pointer",color:"#7c3aed",display:"flex",alignItems:"center",gap:6}}>
            📚 История генераций
          </button>

          {/* Кнопка решений КМ */}
          <button
            onClick={() => { setKmDecisions({}); setKmModal(true); }}
            style={{background:"#ffffff",border:"1px solid #22c55e",borderRadius:8,padding:"10px 16px",fontWeight:600,fontSize:12,cursor:"pointer",color:"#16a34a",display:"flex",alignItems:"center",gap:6}}>
            🗂 Решения КМ{filter!=="Все"?` · ${filter}`:""}
          </button>

          {filter !== "Все" && !loading && (
            <button onClick={()=>{setFeedbackText(catPrefs[filter]||""); setFeedbackModal(true);}}
              style={{background:"#ffffff",border:"1px solid #7c3aed",borderRadius:8,padding:"10px 16px",fontWeight:600,fontSize:12,cursor:"pointer",color:"#7c3aed",display:"flex",alignItems:"center",gap:6}}>
              💬 Уточнить запрос
            </button>
          )}
          {filter !== "Все" && rejectedBrands[filter] && rejectedBrands[filter].length > 0 && (
            <div style={{display:"flex",alignItems:"center",gap:6,background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:8,padding:"6px 12px",fontSize:11}}>
              <span style={{color:"#92400e"}}>👎 Отклонено: {rejectedBrands[filter].join(", ")}</span>
              <button onClick={()=>{const u={...rejectedBrands}; delete u[filter]; setRejectedBrands(u); localStorage.setItem("ayan_rejected_brands",JSON.stringify(u));}}
                style={{background:"none",border:"none",cursor:"pointer",color:"#9ca3af",fontSize:12,padding:0}}>✕</button>
            </div>
          )}
          {(() => {
            const isAll = filter === "Все";
            const catData = !isAll && catUpdates[filter];
            const displayTime = isAll ? lastUpdate : (catData ? catData.time : null);
            const displayTs = isAll ? lastUpdateTs : (catData ? catData.ts : null);
            const label = isAll ? "Обновлено:" : `Обновлено (${filter}):`;
            if (!displayTime || loading) return null;
            const allUpdates = Object.entries(catUpdates).map(([cat,v])=>({cat,time:v.time,ts:v.ts})).sort((a,b)=>b.ts-a.ts);
            const days = displayTs ? Math.floor((Date.now()-displayTs)/86400000) : null;
            const isStale = days!==null && days>=7;
            const dayLabel = days===null?"":days===0?"":days===1?"вчера":`${days} дн. назад`;
            return (
              <div style={{position:"relative",display:"inline-flex",alignItems:"center",gap:6}} onMouseEnter={()=>setShowUpdateTooltip(true)} onMouseLeave={()=>setShowUpdateTooltip(false)}>
                <span style={{fontSize:11,color:"#64748b"}}>{label}</span>
                <span style={{fontSize:11,color:"#a78bfa",fontWeight:600,borderBottom:"1px dashed #a78bfa",cursor:"help"}}>{displayTime}</span>
                {(dayLabel || isStale) && days!==null && (
                  <span style={{background:isStale?"rgba(255,77,109,0.15)":"rgba(34,197,94,0.12)",color:isStale?"#ff4d6d":"#22c55e",border:"1px solid "+(isStale?"#ff4d6d":"#22c55e"),borderRadius:5,padding:"2px 7px",fontSize:10,fontWeight:700}}>
                    {dayLabel}{isStale?" ⚠️":""}
                  </span>
                )}
                {showUpdateTooltip && (
                  <div style={{position:"absolute",top:"calc(100% + 8px)",left:0,zIndex:9999,background:"#0f172a",border:"1px solid #334155",borderRadius:10,padding:"14px 16px",minWidth:340,boxShadow:"0 8px 32px rgba(0,0,0,0.25)"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:10,letterSpacing:"0.08em"}}>📅 ИСТОРИЯ ОБНОВЛЕНИЙ ПО КАТЕГОРИЯМ</div>
                    {allUpdates.length===0 ? <div style={{fontSize:11,color:"#64748b",fontStyle:"italic"}}>Обновлений пока нет</div> : (
                      <div style={{display:"flex",flexDirection:"column",gap:4}}>
                        {allUpdates.map(u=>{const d=Math.floor((Date.now()-u.ts)/86400000); const dl=d===0?"":d===1?"вчера":`${d} дн. назад`; const stale=d>=7; return (
                          <div key={u.cat} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"1px solid #1e293b"}}>
                            <span style={{fontSize:12,fontWeight:600,color:"#f0f0f8",minWidth:130}}>{u.cat}</span>
                            <span style={{fontSize:10,color:"#64748b",flex:1}}>{u.time}</span>
                            {(dl||stale)&&<span style={{fontSize:10,fontWeight:700,color:stale?"#ff4d6d":"#22c55e",background:stale?"rgba(255,77,109,0.1)":"rgba(34,197,94,0.1)",borderRadius:4,padding:"2px 7px",whiteSpace:"nowrap"}}>{dl}{stale?" ⚠️":""}</span>}
                          </div>
                        );})}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          {error&&<div style={{fontSize:11,color:"#f87171"}}>⚠️ {error}</div>}
        </div>
        <button style={B()} onClick={exportExcel}>⬇ Excel</button>
        <button style={B({background:"#faf5ff",border:"1px solid #a78bfa",color:"#7c3aed"})} onClick={exportKM}>📋 Для КМ{filter!=="Все"?` · ${filter}`:""}</button>
        <button style={tabBtn("table")} onClick={()=>setTab("table")}>📊 Таблица</button>
        <button style={tabBtn("kanban")} onClick={()=>setTab("kanban")}>📋 Канбан</button>
      </div>

      {/* Фильтры */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
        {CATEGORIES.map(c=><CategoryFilterBtn key={c} cat={c} active={filter===c} onClick={()=>setFilter(c)}/>)}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6,alignItems:"center"}}>
        <span style={{fontSize:11,color:"#64748b",marginRight:2}}>🌍 Регион:</span>
        {[{label:"Все",id:"Все"},{label:"🌏 Азия",id:"Азия"},{label:"🌎 Америка",id:"Америка"},{label:"🌍 Европа",id:"Европа"},{label:"🌐 Глобальный",id:"Глобальный"}].map(r=>(
          <button key={r.id} style={fBtn(regionFilter===r.id)} onClick={()=>setRegionFilter(r.id)}>{r.label}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6,alignItems:"center"}}>
        <span style={{fontSize:11,color:"#64748b",marginRight:2}}>📋 Заявка:</span>
        {[{label:"Все",id:"Все"},{label:"Идея",id:"idea"},{label:"В работе",id:"commercial"},{label:"В ассортименте",id:"done"},{label:"Поставщик не найден",id:"nosupplier"},{label:"Не договорились",id:"nodeal"}].map(r=>(
          <button key={r.id} style={fBtn(requestFilter===r.id)} onClick={()=>setRequestFilter(r.id)}>{r.label}</button>
        ))}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16,alignItems:"center"}}>
        <span style={{fontSize:11,color:"#64748b",marginRight:2}}>🚦 Закупка:</span>
        {["Все","🟢 Готов к закупке","🟡 Ищем поставщика","🔴 Недоступно в КЗ"].map(r=>(
          <button key={r} style={fBtn(readyFilter===r)} onClick={()=>setReadyFilter(r)}>{r}</button>
        ))}
        <input placeholder="🔍 Поиск..." value={search} onChange={e=>setSearch(e.target.value)}
          style={{background:"#f1f5f9",border:"1px solid #2a2a3d",borderRadius:8,padding:"6px 12px",color:"#0f172a",fontSize:12,width:160,outline:"none",marginLeft:"auto"}}/>
      </div>

      {/* Таблица / Канбан */}
      {tab==="kanban" ? <KanbanBoard trends={trends} onMove={moveKanban} filter={filter}/> : (
        <div style={{background:"#ffffff",border:"1px solid #2a2a3d",borderRadius:14,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #2a2a3d",fontWeight:700,fontSize:13}}>
            📊 Таблица трендов — {filtered.length} позиций
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr>
                  {["#","Товар","Кат.","Регион","Статус","Интерес","💰 Цена ₸","ЗАКУПКА","Конкуренты","🇷🇺 Россия","🇰🇿 Казахстан","📲 Соцсети","🚚 Поставка","🎬 Контент","📋 Заявка","⚙️ Статус"].map(h=>(
                    <th key={h} style={TH}>{h==="ЗАКУПКА" ? <ProcurementTooltip/> : h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0 ? (
                  <tr><td colSpan={16} style={{...TD,textAlign:"center",color:"#64748b",padding:40}}>Ничего не найдено</td></tr>
                ) : filtered.map((t,i)=>{
                  const reg=REGION_MAP[t.region]||REGION_MAP["Глобальный"];
                  const st=STATUS_MAP[t.status]||STATUS_MAP["✅ Стабильный"];
                  return (
                    <tr key={i}>
                      <td style={{...TD,color:"#64748b"}}>{i+1}</td>
                      <td style={TD}>
                        <div style={{display:"flex",alignItems:"flex-start",gap:6}}>
                          <div style={{flex:1}}>
                            <div style={{fontWeight:600,marginBottom:2}}>{t.name}</div>
                            {t.product_type && <div style={{color:"#7c3aed",fontSize:10,fontWeight:600,marginBottom:1}}>{t.product_type}</div>}
                            <div style={{color:"#64748b",fontSize:10}}>{t.subname}</div>
                          </div>
                          <div style={{display:"flex",flexDirection:"column",gap:3}}>
                            <button onClick={()=>generateAnalysis(t)} title="Подробный анализ" style={{background:"rgba(124,58,237,0.1)",border:"1px solid #a78bfa",borderRadius:5,padding:"2px 5px",cursor:"pointer",fontSize:11,color:"#7c3aed"}}>📋</button>
                            <button onClick={()=>{
                              const cat=t.category; const brand=t.name.split(" ")[0];
                              const current=rejectedBrands[cat]||[];
                              if (!current.includes(brand)) {
                                const updated={...rejectedBrands,[cat]:[...current,brand]};
                                setRejectedBrands(updated); localStorage.setItem("ayan_rejected_brands",JSON.stringify(updated));
                              }
                              setTrends(prev=>prev.filter(x=>x.name!==t.name));
                            }} title="Не интересно" style={{background:"rgba(255,77,109,0.1)",border:"1px solid #fca5a5",borderRadius:5,padding:"2px 5px",cursor:"pointer",fontSize:11,color:"#ff4d6d"}}>👎</button>
                          </div>
                        </div>
                      </td>
                      <td style={TD}><Tag bg="rgba(124,58,237,0.2)" color="#a78bfa">{t.category}</Tag></td>
                      <td style={TD}><Tag bg={reg.bg} color={reg.color}>{reg.icon} {t.region}</Tag></td>
                      <td style={TD}><Tag bg={st.bg} color={st.color}>{t.status}</Tag></td>
                      <td style={TD}><HeatBar value={t.heat||5}/></td>
                      <td style={{...TD,whiteSpace:"nowrap",fontWeight:700,color:"#fbbf24"}}>{t.price_range||"—"}</td>
                      <td style={TD}><ReadyBadge value={t.procurement_ready||"🟡 Ищем поставщика"} onChange={v=>updateTrend(t.name,{procurement_ready:v})}/></td>
                      <td style={TD}><CompetitorCell competitors={t.competitors||[]} onChange={v=>updateTrend(t.name,{competitors:v})}/></td>
                      <td style={TD}>
                        <div style={{fontSize:11,fontWeight:600,color:MARKET_COLOR[t.russia_status]||"#64748b",marginBottom:3}}>{t.russia_status}</div>
                        <div style={{fontSize:11,color:"#64748b",maxWidth:140}}>{t.russia_detail}</div>
                      </td>
                      <td style={TD}>
                        <div style={{fontSize:11,fontWeight:600,color:MARKET_COLOR[t.kz_status]||"#64748b",marginBottom:3}}>{t.kz_status}</div>
                        <div style={{fontSize:11,color:"#64748b",maxWidth:140}}>{t.kz_detail}</div>
                      </td>
                      <td style={{...TD,maxWidth:180}}>
                        <SocialCell social1_platform={t.social1_platform} social1_desc={t.social1_desc} social2_platform={t.social2_platform} social2_desc={t.social2_desc}/>
                      </td>
                      <td style={TD}>
                        {t.supply_source ? <span style={{fontSize:12,fontWeight:600,color:"#a78bfa"}}>{t.supply_source}</span> : <span style={{fontSize:11,color:"#64748b"}}>—</span>}
                      </td>
                      <td style={TD}>
                        <button style={{fontSize:11,padding:"5px 10px",background:"linear-gradient(135deg,rgba(255,77,109,0.2),rgba(124,58,237,0.2))",border:"1px solid #7c3aed",color:"#c4b5fd",borderRadius:7,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}} onClick={()=>generatePost(t)}>📱 Контент</button>
                      </td>
                      <td style={TD}><RequestCell requestNum={t.request_num||""} onNumChange={v=>updateTrend(t.name,{request_num:v})}/></td>
                      <td style={TD}>
                        <select value={t.kanban||"idea"} onChange={e=>moveKanban(t.name,e.target.value)}
                          style={{background:"#f8fafc",color:"#a78bfa",border:"1px solid #7c3aed",borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer",outline:"none",minWidth:160}}>
                          {KANBAN_COLS.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Модал: История генераций ────────────────────────────────────────── */}
      {historyModal && (
        <HistoryModal
          filter={filter}
          currentTrends={trends}
          onRestore={restoreHistoryEntry}
          onClose={() => setHistoryModal(false)}
        />
      )}

      {/* Контент-модал */}
      {contentModal && instaItem && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(15,23,42,0.4)",zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"40px 16px",overflowY:"auto"}} onClick={e=>{if(e.target===e.currentTarget){setContentModal(false);setInstaItem(null);setInstaPosts(null);}}}>
          <div style={{background:"#ffffff",border:"1px solid #2a2a3d",borderRadius:16,width:"100%",maxWidth:720,padding:20,position:"relative"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <span style={{fontWeight:800,fontSize:14,color:"#0f172a"}}>📱 Контент-пакет</span>
                <span style={{marginLeft:8,fontSize:12,color:"#7c3aed",fontWeight:600}}>{instaItem.name}</span>
              </div>
              <button style={{background:"#f1f5f9",color:"#0f172a",border:"1px solid #2a2a3d",borderRadius:8,padding:"6px 12px",fontWeight:700,fontSize:13,cursor:"pointer"}} onClick={()=>{setContentModal(false);setInstaItem(null);setInstaPosts(null);}}>✕</button>
            </div>
            {instaLoading && (
              <div style={{textAlign:"center",padding:40,color:"#64748b"}}>
                <div style={{width:28,height:28,border:"3px solid #2a2a3d",borderTopColor:"#ff4d6d",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 12px"}}/>
                <div style={{fontSize:13}}>Генерирую контент-пакет...</div>
              </div>
            )}
            {instaPosts && (
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                {instaPosts.map((p,i)=>{
                  const isOffline = p.variant?.includes("офлайн") || p.variant?.includes("Промо");
                  return (
                    <div key={i} style={{background:"#f1f5f9",border:"1px solid "+(isOffline?"rgba(251,191,36,0.3)":"#e2e8f0"),borderRadius:10,padding:14,display:"flex",flexDirection:"column",gap:6}}>
                      <div style={{fontWeight:700,color:isOffline?"#fbbf24":"#ff4d6d",fontSize:12,marginBottom:2}}>{p.variant}</div>
                      <div style={{fontSize:12,color:"#334155",lineHeight:1.65,flex:1}}>{p.caption}</div>
                      {p.tip && <div style={{fontSize:11,color:"#7c3aed",background:"rgba(124,58,237,0.1)",border:"1px solid rgba(124,58,237,0.3)",borderRadius:6,padding:"4px 8px"}}>💡 {p.tip}</div>}
                      {p.hashtags && <div style={{fontSize:11,color:"#64748b",lineHeight:1.4}}>{p.hashtags}</div>}
                      {(p.caption||p.hashtags) && (
                        <button style={{background:"rgba(124,58,237,0.15)",color:"#a78bfa",border:"1px solid #7c3aed",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",marginTop:2,alignSelf:"flex-start"}}
                          onClick={()=>navigator.clipboard.writeText((p.caption||"")+"\n"+(p.hashtags||""))}>📋 Скопировать</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Анализ-модал */}
      {analysisModal && analysisItem && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(15,23,42,0.5)",zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"40px 16px",overflowY:"auto"}} onClick={e=>{if(e.target===e.currentTarget){setAnalysisModal(false);setAnalysisItem(null);setAnalysisData(null);}}}>
          <div style={{background:"#ffffff",border:"1px solid #2a2a3d",borderRadius:14,padding:24,maxWidth:900,width:"100%",maxHeight:"90vh",overflow:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,paddingBottom:14,borderBottom:"1px solid #2a2a3d"}}>
              <div>
                <div style={{fontSize:11,color:"#a78bfa",marginBottom:4,fontWeight:600}}>📋 КАРТОЧКА ТРЕНДА</div>
                <div style={{fontSize:20,fontWeight:700,color:"#0f172a"}}>{analysisItem.name}</div>
                <div style={{fontSize:13,color:"#64748b",marginTop:2}}>{analysisItem.subname} · {analysisItem.category}</div>
              </div>
              <button style={{background:"#f1f5f9",color:"#0f172a",border:"1px solid #2a2a3d",borderRadius:8,padding:"6px 12px",fontWeight:700,fontSize:13,cursor:"pointer"}} onClick={()=>{setAnalysisModal(false);setAnalysisItem(null);setAnalysisData(null);}}>✕</button>
            </div>
            {analysisLoading && (
              <div style={{textAlign:"center",padding:40}}>
                <div style={{fontSize:32,marginBottom:12}}>⏳</div>
                <div style={{fontSize:13,color:"#64748b"}}>Генерирую глубокий анализ...</div>
              </div>
            )}
            {!analysisLoading && analysisData && analysisData.error && (
              <div style={{background:"rgba(255,77,109,0.1)",border:"1px solid #ff4d6d",borderRadius:8,padding:16,color:"#fca5a5",fontSize:13}}>{analysisData.error}</div>
            )}
            {!analysisLoading && analysisData && !analysisData.error && (
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                {analysisData.trend_type && (
                  <div style={{background:"#f1f5f9",border:"1px solid #2a2a3d",borderRadius:10,padding:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#fbbf24",marginBottom:6}}>🔥 ТИП ТРЕНДА</div>
                    <div style={{fontSize:13,color:"#334155",lineHeight:1.5}}>{analysisData.trend_type}</div>
                  </div>
                )}
                {analysisData.trend_reason && (
                  <div style={{background:"#f1f5f9",border:"1px solid #2a2a3d",borderRadius:10,padding:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#ff4d6d",marginBottom:6}}>💡 ПОЧЕМУ ЭТО ТРЕНД</div>
                    <div style={{fontSize:13,color:"#334155",lineHeight:1.5}}>{analysisData.trend_reason}</div>
                    {analysisData.viral_formats && (
                      <ul style={{margin:"10px 0 0",paddingLeft:20,fontSize:12,color:"#64748b",lineHeight:1.6}}>
                        {analysisData.viral_formats.map((f,i)=>(<li key={i}>{f}</li>))}
                      </ul>
                    )}
                  </div>
                )}
                {analysisData.skus && analysisData.skus.length>0 && (
                  <div style={{background:"#f1f5f9",border:"1px solid #2a2a3d",borderRadius:10,padding:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#3a9eff",marginBottom:10}}>📦 КОНКРЕТНЫЕ SKU</div>
                    <table style={{width:"100%",fontSize:12,borderCollapse:"collapse"}}>
                      <thead><tr style={{color:"#64748b",fontSize:10,textAlign:"left"}}>
                        <th style={{padding:"4px 8px"}}>SKU</th><th style={{padding:"4px 8px"}}>Упаковка</th><th style={{padding:"4px 8px"}}>Цена РФ</th><th style={{padding:"4px 8px"}}>Прогноз КЗ</th>
                      </tr></thead>
                      <tbody>{analysisData.skus.map((s,i)=>(
                        <tr key={i} style={{borderTop:"1px solid #2a2a3d",color:"#334155"}}>
                          <td style={{padding:"6px 8px",fontWeight:600}}>{s.name}</td>
                          <td style={{padding:"6px 8px",color:"#64748b"}}>{s.pack}</td>
                          <td style={{padding:"6px 8px",color:"#64748b"}}>{s.price_rf}</td>
                          <td style={{padding:"6px 8px",color:"#fbbf24",fontWeight:600}}>{s.price_kz}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                {analysisData.supply_chain && (
                  <div style={{background:"#f1f5f9",border:"1px solid #2a2a3d",borderRadius:10,padding:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#22c55e",marginBottom:10}}>🚚 ЦЕПОЧКА ПОСТАВКИ</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:12}}>
                      {[["Производитель",analysisData.supply_chain.manufacturer],["Дистрибьютор",analysisData.supply_chain.distributor],["Маршрут",analysisData.supply_chain.route],["Сложность",analysisData.supply_chain.difficulty]].map(([l,v])=>(
                        <div key={l}><div style={{color:"#64748b",fontSize:10,marginBottom:2}}>{l}</div><div style={{color:"#334155"}}>{v}</div></div>
                      ))}
                      {analysisData.supply_chain.min_order && (
                        <div style={{gridColumn:"1/-1"}}><div style={{color:"#64748b",fontSize:10,marginBottom:2}}>Минимальная партия</div><div style={{color:"#fbbf24",fontWeight:600}}>{analysisData.supply_chain.min_order}</div></div>
                      )}
                    </div>
                  </div>
                )}
                {analysisData.kz_competitors && (
                  <div style={{background:"#f1f5f9",border:"1px solid #2a2a3d",borderRadius:10,padding:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#7c3aed",marginBottom:10}}>🏪 КОНКУРЕНТЫ В КЗ</div>
                    <div style={{display:"flex",flexDirection:"column",gap:8}}>
                      {analysisData.kz_competitors.map((c,i)=>(
                        <div key={i} style={{borderLeft:"2px solid #7c3aed",paddingLeft:10}}>
                          <div style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{c.name}</div>
                          <div style={{fontSize:11,color:"#64748b",marginTop:2}}>Статус: {c.status}</div>
                          <div style={{fontSize:11,color:"#fbbf24",marginTop:2}}>💡 Окно: {c.gap}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analysisData.ayan_strategy && (
                  <div style={{background:"linear-gradient(135deg,rgba(255,77,109,0.1),rgba(124,58,237,0.1))",border:"1px solid #7c3aed",borderRadius:10,padding:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#c4b5fd",marginBottom:10}}>🎯 СТРАТЕГИЯ ДЛЯ АЯНА</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,fontSize:12}}>
                      <div><div style={{color:"#64748b",fontSize:10,marginBottom:2}}>Приоритет</div><div style={{fontWeight:600}}>{analysisData.ayan_strategy.priority}</div></div>
                      <div><div style={{color:"#64748b",fontSize:10,marginBottom:2}}>Канал запуска</div><div style={{fontWeight:600}}>{analysisData.ayan_strategy.launch_channel}</div></div>
                      <div><div style={{color:"#64748b",fontSize:10,marginBottom:2}}>Тестовая партия</div><div style={{color:"#fbbf24",fontWeight:600}}>{analysisData.ayan_strategy.test_quantity}</div></div>
                      <div style={{gridColumn:"1/-1"}}><div style={{color:"#64748b",fontSize:10,marginBottom:2}}>Позиционирование</div><div style={{color:"#334155"}}>{analysisData.ayan_strategy.positioning}</div></div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Модал: Решения КМ ───────────────────────────────────────────────── */}
      {kmModal && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(15,23,42,0.55)",zIndex:9999,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"32px 16px",overflowY:"auto"}}
          onClick={e=>{if(e.target===e.currentTarget)setKmModal(false);}}>
          <div style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:16,width:"100%",maxWidth:860,boxShadow:"0 24px 64px rgba(15,23,42,0.14)",overflow:"hidden"}}>

            {/* Шапка */}
            <div style={{padding:"16px 20px",background:"#f0fdf4",borderBottom:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <div style={{fontSize:11,color:"#16a34a",fontWeight:700,marginBottom:2,letterSpacing:"0.06em"}}>🗂 ОБРАБОТКА РЕШЕНИЙ КМ</div>
                <div style={{fontSize:16,fontWeight:700,color:"#0f172a"}}>
                  {filter==="Все" ? "Все категории" : `${CAT_ICONS[filter]||""} ${filter}`}
                  <span style={{marginLeft:8,fontSize:12,color:"#64748b",fontWeight:400}}>{filtered.length} позиций</span>
                </div>
              </div>
              <button onClick={()=>setKmModal(false)} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 12px",cursor:"pointer",color:"#64748b",fontSize:13,fontWeight:700}}>✕</button>
            </div>

            {/* Легенда */}
            <div style={{padding:"10px 20px",background:"#fafafa",borderBottom:"1px solid #f0f0f0",display:"flex",gap:20,fontSize:11,color:"#64748b"}}>
              <span><span style={{fontWeight:700,color:"#16a34a"}}>✅ Берём</span> → В работе у ком. отдела</span>
              <span><span style={{fontWeight:700,color:"#f59e0b"}}>⏳ Обсуждаем</span> → остаётся в "Идея"</span>
              <span><span style={{fontWeight:700,color:"#ff4d6d"}}>❌ Не берём</span> → Не договорились</span>
              <span style={{marginLeft:"auto",color:"#94a3b8"}}>
                Отмечено: {Object.keys(kmDecisions).length} / {filtered.length}
              </span>
            </div>

            {/* Быстрые кнопки */}
            <div style={{padding:"8px 20px",borderBottom:"1px solid #f0f0f0",display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:11,color:"#64748b",marginRight:4}}>Выбрать все как:</span>
              {[
                {label:"✅ Все берём",    val:"take",    color:"#16a34a", bg:"#f0fdf4", border:"#86efac"},
                {label:"⏳ Все обсуждаем",val:"discuss", color:"#92400e", bg:"#fffbeb", border:"#fde68a"},
                {label:"❌ Все не берём", val:"reject",  color:"#991b1b", bg:"#fff0f4", border:"#fca5a5"},
              ].map(opt=>(
                <button key={opt.val} onClick={()=>{
                  const all = {};
                  filtered.forEach(t=>{ all[t.name]=opt.val; });
                  setKmDecisions(all);
                }} style={{fontSize:11,padding:"4px 12px",border:`1px solid ${opt.border}`,borderRadius:6,background:opt.bg,color:opt.color,cursor:"pointer",fontWeight:600}}>
                  {opt.label}
                </button>
              ))}
              <button onClick={()=>setKmDecisions({})} style={{fontSize:11,padding:"4px 10px",border:"1px solid #e2e8f0",borderRadius:6,background:"transparent",color:"#94a3b8",cursor:"pointer",marginLeft:4}}>
                Сбросить
              </button>
            </div>

            {/* Список товаров */}
            <div style={{maxHeight:"52vh",overflowY:"auto"}}>
              {filtered.map((t, i) => {
                const dec = kmDecisions[t.name];
                const rowBg = dec==="take" ? "#f0fdf4" : dec==="reject" ? "#fff5f7" : dec==="discuss" ? "#fffbeb" : i%2===0?"#ffffff":"#fafafa";
                const statusColor = {"🔥 Горячий":"#ff4d6d","✨ Новинка":"#f59e0b","📈 Растёт":"#22c55e","✅ Стабильный":"#64748b"}[t.status]||"#64748b";
                return (
                  <div key={t.name} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 20px",borderBottom:"1px solid #f0f0f0",background:rowBg,transition:"background 0.15s"}}>
                    {/* Номер */}
                    <div style={{fontSize:11,color:"#94a3b8",width:20,flexShrink:0,textAlign:"center"}}>{i+1}</div>

                    {/* Инфо о товаре */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                        <span style={{fontSize:13,fontWeight:600,color:"#0f172a"}}>{t.name}</span>
                        <span style={{fontSize:10,color:statusColor,fontWeight:700}}>{t.status}</span>
                      </div>
                      <div style={{display:"flex",gap:10,fontSize:11,color:"#64748b"}}>
                        <span>{t.subname}</span>
                        {filter==="Все" && <span style={{color:"#a78bfa"}}>· {t.category}</span>}
                        <span style={{color:"#fbbf24",fontWeight:600}}>· {t.price_range||"—"}</span>
                        <span>· {(t.procurement_ready||"").replace(/[🟢🟡🔴]/g,"").trim()}</span>
                      </div>
                    </div>

                    {/* Кнопки решения */}
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      {[
                        {val:"take",    label:"✅ Берём",      color:"#16a34a", bg: dec==="take"    ?"#16a34a":"#f0fdf4", border:"#22c55e", textColor: dec==="take"?"#fff":"#16a34a"},
                        {val:"discuss", label:"⏳ Обсуждаем", color:"#92400e", bg: dec==="discuss" ?"#f59e0b":"#fffbeb", border:"#fde68a", textColor: dec==="discuss"?"#fff":"#92400e"},
                        {val:"reject",  label:"❌ Не берём",  color:"#991b1b", bg: dec==="reject"  ?"#ff4d6d":"#fff5f7", border:"#fca5a5", textColor: dec==="reject"?"#fff":"#991b1b"},
                      ].map(opt=>(
                        <button key={opt.val} onClick={()=>setKmDecisions(prev=>({...prev,[t.name]:prev[t.name]===opt.val?undefined:opt.val}))}
                          style={{fontSize:11,padding:"5px 12px",border:`1px solid ${opt.border}`,borderRadius:6,background:opt.bg,color:opt.textColor,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap",transition:"all 0.15s"}}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Футер — сохранить */}
            <div style={{padding:"14px 20px",borderTop:"1px solid #e2e8f0",background:"#f8fafc",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
              <div style={{fontSize:12,color:"#64748b"}}>
                {Object.keys(kmDecisions).length === 0
                  ? "Отметьте решение по каждой позиции"
                  : <>
                      <span style={{color:"#16a34a",fontWeight:700}}>✅ {Object.values(kmDecisions).filter(v=>v==="take").length} берём</span>
                      {" · "}
                      <span style={{color:"#f59e0b",fontWeight:700}}>⏳ {Object.values(kmDecisions).filter(v=>v==="discuss").length} обсуждаем</span>
                      {" · "}
                      <span style={{color:"#ff4d6d",fontWeight:700}}>❌ {Object.values(kmDecisions).filter(v=>v==="reject").length} не берём</span>
                    </>
                }
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setKmModal(false)}
                  style={{padding:"8px 16px",border:"1px solid #e2e8f0",borderRadius:8,background:"#f1f5f9",color:"#64748b",cursor:"pointer",fontSize:12,fontWeight:600}}>
                  Отмена
                </button>
                <button
                  disabled={Object.keys(kmDecisions).length===0}
                  onClick={async ()=>{
                    const DECISION_MAP = { take:"commercial", discuss:"idea", reject:"nodeal" };
                    const updates = Object.entries(kmDecisions).filter(([,v])=>v);
                    for (const [name, dec] of updates) {
                      const kanban = DECISION_MAP[dec];
                      updateTrend(name, {kanban});
                    }
                    setKmModal(false);
                    setKmDecisions({});
                  }}
                  style={{padding:"8px 20px",border:"none",borderRadius:8,background:Object.keys(kmDecisions).length>0?"#16a34a":"#94a3b8",color:"#fff",cursor:Object.keys(kmDecisions).length>0?"pointer":"not-allowed",fontSize:12,fontWeight:700}}>
                  💾 Сохранить решения ({Object.keys(kmDecisions).length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback-модал */}
      {feedbackModal && filter !== "Все" && (
        <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(15,23,42,0.4)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget)setFeedbackModal(false);}}>
          <div style={{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:14,padding:24,maxWidth:560,width:"100%",boxShadow:"0 20px 60px rgba(15,23,42,0.12)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div>
                <div style={{fontSize:11,color:"#a78bfa",fontWeight:700,marginBottom:2}}>💬 УТОЧНИТЬ ЗАПРОС</div>
                <div style={{fontSize:16,fontWeight:700,color:"#0f172a"}}>Категория: {filter}</div>
              </div>
              <button onClick={()=>setFeedbackModal(false)} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",color:"#64748b",fontSize:14}}>✕</button>
            </div>
            <div style={{fontSize:11,color:"#94a3b8",marginBottom:8}}>Например: «Убери корейское, фокус на Европу», «Только новинки 2026», «Больше ЗОЖ-продуктов»</div>
            <textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder={`Что уточнить для «${filter}»?`}
              style={{width:"100%",minHeight:100,padding:"10px 12px",fontSize:13,border:"1px solid #cbd5e1",borderRadius:8,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"system-ui,sans-serif",marginBottom:12}}/>
            {catPrefs[filter] && (
              <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:8,padding:"8px 12px",fontSize:11,color:"#166534",marginBottom:12}}>
                ✅ Сохранённые предпочтения: {catPrefs[filter]}
              </div>
            )}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={()=>{const u={...catPrefs,[filter]:feedbackText}; setCatPrefs(u); localStorage.setItem("ayan_cat_prefs",JSON.stringify(u)); setFeedbackModal(false); fetchTrends(feedbackText);}}
                disabled={!feedbackText.trim()} style={{flex:1,background:"linear-gradient(135deg,#ff4d6d,#7c3aed)",color:"#fff",border:"none",borderRadius:8,padding:"10px",fontWeight:700,fontSize:13,cursor:feedbackText.trim()?"pointer":"not-allowed",opacity:feedbackText.trim()?1:0.5}}>
                ⚡ Сохранить и перегенерировать
              </button>
              <button onClick={()=>{const u={...catPrefs,[filter]:feedbackText}; setCatPrefs(u); localStorage.setItem("ayan_cat_prefs",JSON.stringify(u)); setFeedbackModal(false);}}
                style={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 14px",fontWeight:600,fontSize:13,cursor:"pointer",color:"#475569"}}>
                💾 Сохранить
              </button>
              {catPrefs[filter] && (
                <button onClick={()=>{const u={...catPrefs}; delete u[filter]; setCatPrefs(u); localStorage.setItem("ayan_cat_prefs",JSON.stringify(u)); setFeedbackText("");}}
                  style={{background:"none",border:"1px solid #fca5a5",borderRadius:8,padding:"10px 14px",fontSize:13,cursor:"pointer",color:"#ef4444"}}>
                  🗑 Сбросить
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{marginTop:24,borderTop:"1px solid #e2e8f0",paddingTop:16,fontSize:11,color:"#64748b"}}>
        Аян Супермаркет · Астана · Караганда · Темиртау · FMCG Intelligence v3.1 · История генераций
      </div>
    </div>
  );
}
