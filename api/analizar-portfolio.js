export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

  const { assets, horizon, mode } = req.body;
  if (!assets || !assets.length) return res.status(400).json({ error: "Sin activos" });

  const today = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });

  // ── Prompt for chart + analysis (one asset at a time, structured JSON) ──
  function buildChartPrompt(asset, kind) {
    const horizonDesc =
      horizon === "diario" ? "diagnóstico diario (corto plazo)" :
        horizon === "semanal" ? "perspectiva semanal (2-4 semanas)" :
          "perspectiva de mediano plazo (3-6 meses)";

    const contextLine = kind === "watchlist"
      ? `El usuario está EVALUANDO comprar ${asset.ticker} (${asset.market}). Aún no lo tiene en cartera.`
      : kind === "crypto"
        ? `Analizar la criptomoneda ${asset.ticker}/${asset.base}.`
        : `El usuario TIENE ${asset.ticker} (${asset.market}) en cartera, cantidad: ${asset.qty || "no especificada"}.`;

    return `Hoy es ${today}. Actuás como analista financiero senior con enfoque técnico-fundamental.

${contextLine}
Horizonte de análisis: ${horizonDesc}

PASO 1: Buscá en internet el precio de cierre diario de este activo para los últimos 4 meses (aproximadamente 90-120 días hábiles). Necesito datos REALES de precio de cierre, no inventados. Si encontrás los datos exactos día por día, mejor; si solo encontrás datos semanales o puntos de referencia (mínimos, máximos, precio actual, precio hace 1 mes, hace 3 meses), interpolá una serie razonable que respete esos puntos reales y la tendencia real conocida.

PASO 2: Calculá sobre esa serie: MA20, MA50, RSI(14) aproximado, y 1-2 niveles de soporte y resistencia reales basados en mínimos/máximos recientes.

PASO 3: Buscá los fundamentos reales: P/E, resultados últimos trimestres, catalizadores, riesgos.

Respondé ÚNICAMENTE con un JSON válido (sin markdown, sin \`\`\`json, sin texto antes o después), con esta estructura EXACTA:

{
  "ticker": "${asset.ticker}",
  "nombre_completo": "nombre de la empresa o activo",
  "precio_actual": 123.45,
  "moneda": "USD o ARS",
  "variacion_pct_1m": -2.3,
  "serie_precios": [
    {"fecha": "2026-02-17", "precio": 118.20},
    {"fecha": "2026-02-18", "precio": 119.00}
  ],
  "ma20": 120.5,
  "ma50": 115.3,
  "rsi": 58,
  "soporte": 112.0,
  "resistencia": 130.0,
  "tendencia": "alcista | bajista | lateral",
  "señal_tecnica": "COMPRAR | MANTENER | VENDER | TOMAR_GANANCIAS | SOPORTE_DE_COMPRA | ENTRAR_AHORA | ESPERAR_CORRECCION | EVITAR",
  "analisis_tecnico": "2-4 oraciones explicando la lectura técnica: tendencia, MAs, RSI, volumen, soporte/resistencia.",
  "analisis_fundamental": "2-4 oraciones con P/E, resultados recientes, catalizadores y riesgos principales.",
  "diagnostico": "2-3 oraciones con la acción concreta sugerida.",
  "toma_ganancias": 135.0,
  "soporte_compra": 110.0,
  "stop_loss": 105.0,
  "precio_objetivo": 140.0,
  "conviccion": "Alta | Media | Baja",
  "justificacion_conviccion": "1 oración"
}

La serie_precios debe tener entre 60 y 90 puntos cubriendo los últimos 3-4 meses hasta hoy (${today}). Usá fechas reales en formato YYYY-MM-DD. Todos los precios en la moneda de cotización del activo (ARS para BCBA, USD para NYSE/NASDAQ/cripto).

IMPORTANTE: el JSON debe ser válido y parseable. Los textos de analisis_tecnico, analisis_fundamental y diagnostico deben ser oraciones seguidas en una sola línea, SIN saltos de línea reales dentro del string (no uses Enter dentro de los valores de texto).`;
  }

  function buildAlarmPrompt() {
    return `Hoy es ${today}. Buscá el precio actual de mercado de estos activos usando Google Search.
Respondé ÚNICAMENTE con un JSON array válido, sin texto adicional, sin markdown:
[{"ticker":"AAPL","price":213.45}]

Activos a consultar:
${assets.map(a => `- ${a.ticker} (${a.market || a.base || ""})`).join("\n")}`;
  }

  async function callGemini(prompt) {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const model = "gemini-2.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.25, maxOutputTokens: 8192 },
    };

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await geminiRes.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.candidates?.[0]?.content?.parts
      ?.filter(p => p.text)
      ?.map(p => p.text)
      ?.join("\n") || "";

    if (!text) throw new Error("Respuesta vacía de Gemini");
    return text;
  }

  function safeParseJSON(text) {
    let clean = text.replace(/```json|```/g, "").trim();
    // Extract the outermost JSON object/array in case there's stray text
    const firstBrace = Math.min(
      ...["{", "["].map(c => { const i = clean.indexOf(c); return i === -1 ? Infinity : i; })
    );
    if (firstBrace !== Infinity) clean = clean.slice(firstBrace);
    const lastBraceObj = clean.lastIndexOf("}");
    const lastBraceArr = clean.lastIndexOf("]");
    const lastBrace = Math.max(lastBraceObj, lastBraceArr);
    if (lastBrace !== -1) clean = clean.slice(0, lastBrace + 1);

    try {
      return JSON.parse(clean);
    } catch (e) {
      // Sanitize: escape raw control characters (newlines, tabs, etc.) that appear
      // INSIDE string literals but were not escaped by the model.
      let sanitized = "";
      let inString = false;
      let escapeNext = false;
      for (let i = 0; i < clean.length; i++) {
        const ch = clean[i];
        if (escapeNext) {
          sanitized += ch;
          escapeNext = false;
          continue;
        }
        if (ch === "\\") {
          sanitized += ch;
          escapeNext = true;
          continue;
        }
        if (ch === '"') {
          inString = !inString;
          sanitized += ch;
          continue;
        }
        if (inString && (ch === "\n" || ch === "\r" || ch === "\t")) {
          sanitized += ch === "\t" ? "\\t" : "\\n";
          continue;
        }
        // Strip other control characters that break JSON.parse
        if (inString && ch.charCodeAt(0) < 0x20) {
          continue;
        }
        sanitized += ch;
      }
      return JSON.parse(sanitized);
    }
  }

  try {
    if (mode === "alarm_check") {
      const text = await callGemini(buildAlarmPrompt());
      const parsed = safeParseJSON(text);
      return res.status(200).json({ result: JSON.stringify(parsed) });
    }

    if (mode === "portfolio" || mode === "watchlist" || mode === "crypto") {
      const kind = mode;
      const results = [];
      for (const asset of assets) {
        try {
          const text = await callGemini(buildChartPrompt(asset, kind));
          const parsed = safeParseJSON(text);
          results.push(parsed);
        } catch (e) {
          results.push({ ticker: asset.ticker, error: e.message });
        }
      }
      return res.status(200).json({ assets: results });
    }

    return res.status(400).json({ error: "Modo inválido" });
  } catch (err) {
    return res.status(500).json({ error: "Error interno: " + err.message });
  }
}