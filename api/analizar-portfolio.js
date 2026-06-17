export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const { assets, horizon, mode } = req.body;
  if (!assets || !assets.length) return res.status(400).json({ error: "Sin activos" });

  const today = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });

  function buildPrompt() {
    if (mode === "portfolio") {
      const horizonDesc =
        horizon === "diario" ? "diagnóstico diario (señales de corto plazo para hoy/esta semana)" :
        horizon === "semanal" ? "perspectiva semanal (próximas 2-4 semanas)" :
        "perspectiva de mediano plazo (próximos 3-6 meses)";
      return `Hoy es ${today}. Actuás como analista financiero senior especializado en mercados argentinos (BCBA, CEDEARs) y americanos (NYSE/NASDAQ) con enfoque técnico-fundamental avanzado.

El usuario tiene el siguiente portafolio:
${assets.map(a => `- ${a.ticker} (${a.market}) — ${a.qty} unidades`).join("\n")}

Horizonte: ${horizonDesc}

Para CADA activo, buscá datos actuales y producí un análisis avanzado con estas secciones exactas:

## [TICKER] — [Nombre completo]

**ANÁLISIS TÉCNICO**
- Precio actual y variación reciente
- Tendencia principal (alcista/bajista/lateral) y fuerza
- MA20 / MA50 / MA200: posición relativa del precio
- RSI (14): nivel e interpretación (sobrecomprado >70, sobrevendido <30)
- MACD: señal actual (cruce, divergencia)
- Bandas de Bollinger: posición y volatilidad implícita
- Volumen: confirmación o divergencia con precio
- Soporte clave: $X.XX
- Resistencia clave: $X.XX
- 🚦 Señal técnica: COMPRAR / MANTENER / VENDER / TOMAR GANANCIAS / SOPORTE DE COMPRA

**ANÁLISIS FUNDAMENTAL**
- Valuación: P/E actual vs histórico y peers
- Últimos resultados trimestrales (ingresos, ganancias, variación YoY)
- Catalizadores positivos próximos (earnings, macro, regulatorio, dividendos)
- Riesgos principales

**DIAGNÓSTICO Y ACCIÓN SUGERIDA**
- 📌 Señal principal: [señal clara]
- 💰 Toma de ganancias: $X.XX (nivel sugerido para venta parcial)
- 🛒 Soporte de compra: $X.XX (nivel para agregar posición)
- 🛑 Stop loss: $X.XX
- 📊 Convicción: Alta / Media / Baja — [justificación en 1 línea]

Si el activo es argentino, considerá el contexto macro local (inflación, tipo de cambio, riesgo país). Sé concreto con los precios en números reales.`;
    }

    if (mode === "watchlist") {
      const horizonDesc = horizon === "diario" ? "señal de entrada de corto plazo" : "perspectiva de mediano plazo (3-6 meses)";
      return `Hoy es ${today}. Actuás como analista financiero senior.

El usuario está considerando comprar estos activos (aún NO los tiene en cartera):
${assets.map(a => `- ${a.ticker} (${a.market})`).join("\n")}

Enfoque: ${horizonDesc}

Para CADA activo:

## [TICKER] — [Nombre completo]

**¿ES BUEN MOMENTO PARA ENTRAR?**
- Precio actual vs niveles históricos recientes
- Tendencia actual: ¿ciclo favorable?
- RSI y MACD: ¿señal de entrada o hay que esperar?
- Soporte cercano: $X.XX

**ANÁLISIS FUNDAMENTAL**
- Valuación: ¿cara o barata? (P/E, PEG, EV/EBITDA)
- Crecimiento ingresos/ganancias últimos 2 trimestres
- Catalizadores próximos
- Sector y posición vs competidores

**VEREDICTO DE ENTRADA**
- 🚦 Decisión: ENTRAR AHORA / ESPERAR CORRECCIÓN / EVITAR
- 🛒 Precio ideal de entrada: $X.XX — $X.XX
- 🎯 Precio objetivo: $X.XX (upside potencial: X%)
- 🛑 Stop loss: $X.XX
- ⚖️ Relación riesgo/beneficio: X:1
- 📊 Convicción: Alta / Media / Baja`;
    }

    if (mode === "crypto") {
      const horizonDesc = horizon === "diario" ? "diagnóstico diario" : "perspectiva de mediano plazo";
      return `Hoy es ${today}. Actuás como analista cripto especializado en análisis técnico y on-chain.

Criptomonedas a analizar:
${assets.map(a => `- ${a.ticker}/${a.base}`).join("\n")}

Horizonte: ${horizonDesc}

Para CADA cripto:

## [TICKER]/[BASE] — [Nombre completo]

**ANÁLISIS TÉCNICO**
- Precio actual y capitalización de mercado
- Tendencia diaria y semanal
- RSI (14): nivel y contexto
- MACD: señal actual
- MA50 / MA200: ¿death cross o golden cross?
- Soporte clave: $X.XX
- Resistencia clave: $X.XX
- Dominance de BTC si es relevante para altcoins

**ANÁLISIS FUNDAMENTAL**
- Utilidad y casos de uso del proyecto
- Actividad on-chain reciente
- Narrativas dominantes (ETFs, Layer2, DeFi, etc.)
- Próximos eventos: halvings, upgrades, unlocks de tokens
- Fear & Greed Index estimado

**SEÑAL Y ACCIÓN**
- 🚦 Señal: ACUMULAR / MANTENER / REDUCIR / VENDER
- 🛒 Zona de acumulación: $X.XX — $X.XX
- 🎯 Target parcial: $X.XX / Target total: $X.XX
- 🛑 Stop loss: $X.XX
- 📊 Convicción: Alta / Media / Baja — [justificación]`;
    }

    if (mode === "alarm_check") {
      return `Hoy es ${today}. Buscá el precio actual de mercado de estos activos usando Google Search.
Respondé ÚNICAMENTE con un JSON array válido, sin texto adicional, sin markdown, sin explicaciones:
[{"ticker":"AAPL","price":213.45},{"ticker":"GGAL","price":8750.00}]

Activos a consultar:
${assets.map(a => `- ${a.ticker} (${a.market || a.base || ""})`).join("\n")}`;
    }

    return "";
  }

  const prompt = buildPrompt();
  if (!prompt) return res.status(400).json({ error: "Modo inválido" });

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      },
    };

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await geminiRes.json();

    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join("\n") || "";

    if (!text) return res.status(500).json({ error: "Respuesta vacía de Gemini" });

    return res.status(200).json({ result: text });
  } catch (err) {
    return res.status(500).json({ error: "Error interno: " + err.message });
  }
}
