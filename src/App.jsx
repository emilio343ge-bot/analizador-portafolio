import React, { useState, useEffect, useRef } from "react";

const API_URL = "/api/analizar-portfolio";

// ── Helpers ──
function uid() { return Math.random().toString(36).slice(2, 8); }

function formatMD(text) {
  return text
    .replace(/^## (.+)$/gm, '<h2 style="font-size:16px;font-weight:800;color:#f0ede8;margin:1.5rem 0 0.5rem;border-bottom:1px solid #222;padding-bottom:6px">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:13px;font-weight:700;color:#aaa;margin:1rem 0 0.25rem;letter-spacing:1px;text-transform:uppercase">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#f0ede8">$1</strong>')
    .replace(/🚦 Señal técnica: (.+)/g, (_, s) => {
      const colors = { COMPRAR: "#00e676", MANTENER: "#fbbf24", VENDER: "#ff4444", "TOMAR GANANCIAS": "#f97316", "SOPORTE DE COMPRA": "#60a5fa", ACUMULAR: "#00e676", REDUCIR: "#f97316" };
      const c = Object.keys(colors).find(k => s.includes(k));
      return `<div style="display:inline-flex;align-items:center;gap:8px;background:${c ? colors[c] + "22" : "#222"};border:1px solid ${c ? colors[c] + "55" : "#333"};border-radius:10px;padding:8px 14px;margin:8px 0;font-weight:800;font-size:14px;color:${c ? colors[c] : "#f0ede8"}">🚦 ${s}</div>`;
    })
    .replace(/🚦 Decisión: (.+)/g, (_, s) => {
      const colors = { "ENTRAR AHORA": "#00e676", "ESPERAR CORRECCIÓN": "#fbbf24", EVITAR: "#ff4444", ACUMULAR: "#00e676", MANTENER: "#fbbf24", REDUCIR: "#f97316", VENDER: "#ff4444" };
      const c = Object.keys(colors).find(k => s.includes(k));
      return `<div style="display:inline-flex;align-items:center;gap:8px;background:${c ? colors[c] + "22" : "#222"};border:1px solid ${c ? colors[c] + "55" : "#333"};border-radius:10px;padding:8px 14px;margin:8px 0;font-weight:800;font-size:14px;color:${c ? colors[c] : "#f0ede8"}">🚦 ${s}</div>`;
    })
    .replace(/^(- .+)$/gm, '<div style="font-size:13px;color:#aaa;margin:3px 0;padding-left:4px">$1</div>')
    .replace(/📌 (.+)/g, '<div style="color:#60a5fa;font-size:13px;font-weight:700;margin:4px 0">📌 $1</div>')
    .replace(/💰 (.+)/g, '<div style="color:#00e676;font-size:13px;font-weight:700;margin:4px 0">💰 $1</div>')
    .replace(/🛒 (.+)/g, '<div style="color:#34d399;font-size:13px;font-weight:700;margin:4px 0">🛒 $1</div>')
    .replace(/🛑 (.+)/g, '<div style="color:#ff4444;font-size:13px;font-weight:700;margin:4px 0">🛑 $1</div>')
    .replace(/🎯 (.+)/g, '<div style="color:#f97316;font-size:13px;font-weight:700;margin:4px 0">🎯 $1</div>')
    .replace(/⚖️ (.+)/g, '<div style="color:#a78bfa;font-size:13px;font-weight:700;margin:4px 0">⚖️ $1</div>')
    .replace(/📊 (.+)/g, '<div style="color:#fbbf24;font-size:13px;font-weight:700;margin:4px 0">📊 $1</div>')
    .replace(/\n{2,}/g, '<div style="height:8px"></div>')
    .replace(/\n/g, "<br/>");
}

// ── Styles ──
const S = {
  app: { minHeight: "100vh", background: "#0a0a0a", color: "#f0ede8", fontFamily: "'DM Sans', sans-serif", maxWidth: 480, margin: "0 auto", paddingBottom: 100 },
  input: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "11px 14px", color: "#f0ede8", fontSize: 14, outline: "none", boxSizing: "border-box" },
  select: { width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "11px 14px", color: "#f0ede8", fontSize: 14, outline: "none", boxSizing: "border-box", appearance: "none" },
  label: { display: "block", fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 },
  card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: "16px 18px", marginBottom: 12 },
  btnPrimary: (color = "#00e676") => ({ background: color, border: "none", borderRadius: 14, padding: "14px 0", color: "#000", fontWeight: 900, fontSize: 14, cursor: "pointer", width: "100%", letterSpacing: 0.3 }),
  btnOutline: (color = "#333") => ({ background: "none", border: `1px solid ${color}`, borderRadius: 12, padding: "10px 16px", color: "#888", fontWeight: 700, fontSize: 12, cursor: "pointer" }),
  btnIcon: { background: "none", border: "1px solid #2a2a2a", borderRadius: 10, width: 34, height: 34, color: "#555", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  chip: (active, color) => ({ padding: "6px 12px", borderRadius: 20, border: "none", background: active ? color : "#1a1a1a", color: active ? "#000" : "#666", fontWeight: active ? 800 : 500, fontSize: 12, cursor: "pointer" }),
  tab: (active) => ({ flex: 1, padding: "12px 0", border: "none", background: "none", color: active ? "#f0ede8" : "#444", fontWeight: active ? 800 : 500, fontSize: 13, cursor: "pointer", borderBottom: active ? "2px solid #f0ede8" : "2px solid transparent" }),
  subtab: (active, color) => ({ padding: "7px 16px", borderRadius: 20, border: "none", background: active ? color + "22" : "none", color: active ? color : "#444", fontWeight: active ? 800 : 500, fontSize: 12, cursor: "pointer", border: active ? `1px solid ${color}44` : "1px solid transparent" }),
};

// ── Row components ──
function PortfolioRow({ row, onChange, onRemove }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 34px", gap: 6, marginBottom: 8 }}>
      <input style={S.input} placeholder="GGAL, AAPL…" value={row.ticker} onChange={e => onChange({ ...row, ticker: e.target.value.toUpperCase() })} />
      <select style={S.select} value={row.market} onChange={e => onChange({ ...row, market: e.target.value })}>
        <option value="BCBA">BCBA</option>
        <option value="NYSE">NYSE</option>
        <option value="NASDAQ">NASDAQ</option>
        <option value="CEDEAR">CEDEAR</option>
      </select>
      <input style={S.input} type="number" placeholder="Cant." value={row.qty} onChange={e => onChange({ ...row, qty: e.target.value })} />
      <button style={S.btnIcon} onClick={onRemove}>✕</button>
    </div>
  );
}

function WatchlistRow({ row, onChange, onRemove }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 34px", gap: 6, marginBottom: 8 }}>
      <input style={S.input} placeholder="MSFT, NVDA…" value={row.ticker} onChange={e => onChange({ ...row, ticker: e.target.value.toUpperCase() })} />
      <select style={S.select} value={row.market} onChange={e => onChange({ ...row, market: e.target.value })}>
        <option value="NYSE">NYSE</option>
        <option value="NASDAQ">NASDAQ</option>
        <option value="BCBA">BCBA</option>
        <option value="CEDEAR">CEDEAR</option>
      </select>
      <button style={S.btnIcon} onClick={onRemove}>✕</button>
    </div>
  );
}

function CryptoRow({ row, onChange, onRemove }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 34px", gap: 6, marginBottom: 8 }}>
      <input style={S.input} placeholder="BTC, ETH, SOL…" value={row.ticker} onChange={e => onChange({ ...row, ticker: e.target.value.toUpperCase() })} />
      <select style={S.select} value={row.base} onChange={e => onChange({ ...row, base: e.target.value })}>
        <option value="USD">USD</option>
        <option value="USDT">USDT</option>
      </select>
      <button style={S.btnIcon} onClick={onRemove}>✕</button>
    </div>
  );
}

// ── Alarm row ──
function AlarmRow({ alarm, onRemove }) {
  const typeColors = { compra: "#00e676", venta: "#ff4444", stop: "#fbbf24", ruptura: "#60a5fa" };
  const typeLabels = { compra: "Soporte compra", venta: "Toma ganancias", stop: "Stop loss", ruptura: "Ruptura alcista" };
  const color = typeColors[alarm.type] || "#888";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#111", border: `1px solid ${color}33`, borderRadius: 12, padding: "10px 14px", marginBottom: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 800, fontSize: 14, color }}>{alarm.ticker}</span>
          <span style={{ fontSize: 10, background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>{typeLabels[alarm.type]}</span>
          {alarm.status === "fired" && <span style={{ fontSize: 10, background: "#fbbf2422", color: "#fbbf24", border: "1px solid #fbbf2444", borderRadius: 20, padding: "2px 8px", fontWeight: 700 }}>🔔 Disparada</span>}
        </div>
        <div style={{ fontSize: 12, color: "#555" }}>Nivel: <span style={{ color, fontWeight: 700 }}>${parseFloat(alarm.price).toLocaleString("es-AR")}</span>{alarm.note ? ` · ${alarm.note}` : ""}</div>
        {alarm.currentPrice && (
          <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
            Precio actual: <span style={{ color: "#aaa" }}>${parseFloat(alarm.currentPrice).toLocaleString("es-AR")}</span>
            {" · "}
            <span style={{ color: alarm.currentPrice >= alarm.price ? "#00e676" : "#ff4444" }}>
              {((alarm.price - alarm.currentPrice) / alarm.currentPrice * 100).toFixed(2)}% al objetivo
            </span>
          </div>
        )}
      </div>
      <button style={S.btnIcon} onClick={onRemove}>🗑</button>
    </div>
  );
}

// ── Analysis result ──
function AnalysisResult({ result, timestamp, onDeepen }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#444" }}>⏱ {timestamp}</div>
        <button style={S.btnOutline("#333")} onClick={onDeepen}>Profundizar ↗</button>
      </div>
      <div style={{ ...S.card, background: "#0d0d0d" }}>
        <div dangerouslySetInnerHTML={{ __html: formatMD(result) }} />
      </div>
    </div>
  );
}

// ── Loading ──
function Loading({ text = "Analizando con IA y buscando datos actualizados…" }) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "2rem 0", color: "#555", fontSize: 14 }}>
      <div style={{ width: 18, height: 18, border: "2px solid #222", borderTopColor: "#00e676", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
      {text}{dots}
    </div>
  );
}

// ── Main App ──
export default function App() {
  const [tab, setTab] = useState("portfolio");
  const [horizon, setHorizon] = useState({ portfolio: "diario", watchlist: "diario", crypto: "diario" });

  // Portfolio
  const [portfolioRows, setPortfolioRows] = useState([{ id: uid(), ticker: "", market: "BCBA", qty: "" }, { id: uid(), ticker: "", market: "NYSE", qty: "" }]);
  const [portfolioResult, setPortfolioResult] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioTs, setPortfolioTs] = useState("");

  // Watchlist
  const [watchlistRows, setWatchlistRows] = useState([{ id: uid(), ticker: "", market: "NYSE" }]);
  const [watchlistResult, setWatchlistResult] = useState(null);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistTs, setWatchlistTs] = useState("");

  // Crypto
  const [cryptoRows, setCryptoRows] = useState([{ id: uid(), ticker: "", base: "USD" }]);
  const [cryptoResult, setCryptoResult] = useState(null);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [cryptoTs, setCryptoTs] = useState("");

  // Alarmas
  const [alarms, setAlarms] = useState([]);
  const [alarmForm, setAlarmForm] = useState({ ticker: "", market: "NYSE", price: "", type: "compra", note: "" });
  const [alarmLog, setAlarmLog] = useState([]);
  const [monitorRunning, setMonitorRunning] = useState(false);
  const [monitorStatus, setMonitorStatus] = useState("Detenido");
  const [alarmSubtab, setAlarmSubtab] = useState("lista");
  const monitorRef = useRef(null);

  // Toast
  const [toast, setToast] = useState(null);
  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  }

  // ── API call ──
  async function callAPI(mode, assets, h) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, assets, horizon: h }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.result;
  }

  // ── Portfolio analyze ──
  async function analyzePortfolio() {
    const assets = portfolioRows.filter(r => r.ticker.trim());
    if (!assets.length) { showToast("Agregá al menos un activo", false); return; }
    setPortfolioLoading(true); setPortfolioResult(null);
    try {
      const result = await callAPI("portfolio", assets, horizon.portfolio);
      setPortfolioResult(result);
      setPortfolioTs(new Date().toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }));
    } catch (e) { showToast("Error: " + e.message, false); }
    setPortfolioLoading(false);
  }

  // ── Watchlist analyze ──
  async function analyzeWatchlist() {
    const assets = watchlistRows.filter(r => r.ticker.trim());
    if (!assets.length) { showToast("Agregá al menos un activo", false); return; }
    setWatchlistLoading(true); setWatchlistResult(null);
    try {
      const result = await callAPI("watchlist", assets, horizon.watchlist);
      setWatchlistResult(result);
      setWatchlistTs(new Date().toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }));
    } catch (e) { showToast("Error: " + e.message, false); }
    setWatchlistLoading(false);
  }

  // ── Crypto analyze ──
  async function analyzeCrypto() {
    const assets = cryptoRows.filter(r => r.ticker.trim());
    if (!assets.length) { showToast("Agregá al menos un activo", false); return; }
    setCryptoLoading(true); setCryptoResult(null);
    try {
      const result = await callAPI("crypto", assets, horizon.crypto);
      setCryptoResult(result);
      setCryptoTs(new Date().toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }));
    } catch (e) { showToast("Error: " + e.message, false); }
    setCryptoLoading(false);
  }

  // ── Alarms ──
  function addAlarm() {
    if (!alarmForm.ticker.trim() || !alarmForm.price) { showToast("Completá ticker y precio", false); return; }
    setAlarms(a => [...a, { ...alarmForm, id: uid(), status: "active", currentPrice: null }]);
    setAlarmForm({ ticker: "", market: "NYSE", price: "", type: "compra", note: "" });
    showToast("Alarma guardada ✓");
  }

  async function runAlarmCheck() {
    const active = alarms.filter(a => a.status === "active");
    if (!active.length) return;
    const tickers = [...new Set(active.map(a => a.ticker))];
    const assets = tickers.map(t => { const a = active.find(x => x.ticker === t); return { ticker: t, market: a.market }; });
    try {
      const result = await callAPI("alarm_check", assets, "");
      const clean = result.replace(/```json|```/g, "").trim();
      const prices = JSON.parse(clean);
      setAlarms(prev => prev.map(alarm => {
        const found = prices.find(p => p.ticker === alarm.ticker);
        if (!found) return alarm;
        const price = parseFloat(found.price);
        const triggered =
          (alarm.type === "compra" && price <= parseFloat(alarm.price)) ||
          (alarm.type === "venta" && price >= parseFloat(alarm.price)) ||
          (alarm.type === "stop" && price <= parseFloat(alarm.price)) ||
          (alarm.type === "ruptura" && price >= parseFloat(alarm.price));
        if (triggered && alarm.status === "active") {
          const entry = { id: uid(), ticker: alarm.ticker, type: alarm.type, triggerPrice: alarm.price, currentPrice: price, time: new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }) };
          setAlarmLog(l => [entry, ...l]);
          showToast(`🔔 Alarma: ${alarm.ticker} alcanzó $${alarm.price}`);
          return { ...alarm, status: "fired", currentPrice: price };
        }
        return { ...alarm, currentPrice: price };
      }));
      setMonitorStatus("Último chequeo: " + new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }));
    } catch (_) { }
  }

  function toggleMonitor() {
    if (monitorRunning) {
      clearInterval(monitorRef.current);
      setMonitorRunning(false);
      setMonitorStatus("Detenido");
    } else {
      setMonitorRunning(true);
      runAlarmCheck();
      monitorRef.current = setInterval(runAlarmCheck, 5 * 60 * 1000);
      setMonitorStatus("Monitoreando cada 5 min…");
    }
  }

  // ── Row helpers ──
  function updateRow(setter, id, val) { setter(rows => rows.map(r => r.id === id ? val : r)); }
  function removeRow(setter, id) { setter(rows => rows.filter(r => r.id !== id)); }
  function addRow(setter, defaults) { setter(rows => [...rows, { id: uid(), ...defaults }]); }

  const HORIZONS = [["diario", "Diario"], ["semanal", "Semanal"], ["mediano", "Mediano plazo"]];
  const ALARM_TYPES = [["compra", "Soporte compra", "#00e676"], ["venta", "Toma ganancias", "#ff4444"], ["stop", "Stop loss", "#fbbf24"], ["ruptura", "Ruptura alcista", "#60a5fa"]];

  return (
    <div style={S.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: #444; }
        input:focus, select:focus { border-color: #333 !important; }
        button:active { opacity: 0.75; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0a0a0a", borderBottom: "1px solid #1a1a1a", padding: "20px 20px 0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ fontSize: 11, color: "#444", letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>Analizador de</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#f0ede8", marginBottom: 16, letterSpacing: -0.5 }}>Portafolio 📈</div>
        <div style={{ display: "flex", gap: 0 }}>
          {[["portfolio", "📊 Portafolio"], ["watchlist", "👁 Watchlist"], ["crypto", "₿ Cripto"], ["alarmas", "🔔 Alarmas"]].map(([t, l]) => (
            <button key={t} style={S.tab(tab === t)} onClick={() => setTab(t)}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 16px" }}>

        {/* ── PORTFOLIO TAB ── */}
        {tab === "portfolio" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Activos en cartera</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px 34px", gap: 6, marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>TICKER</div>
              <div style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>MERCADO</div>
              <div style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>CANT.</div>
              <div />
            </div>
            {portfolioRows.map(r => (
              <PortfolioRow key={r.id} row={r} onChange={val => updateRow(setPortfolioRows, r.id, val)} onRemove={() => removeRow(setPortfolioRows, r.id)} />
            ))}
            <button style={{ ...S.btnOutline("#2a2a2a"), width: "100%", marginBottom: 20, padding: "10px 0", borderStyle: "dashed" }} onClick={() => addRow(setPortfolioRows, { ticker: "", market: "NYSE", qty: "" })}>+ Agregar activo</button>

            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Horizonte</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {HORIZONS.map(([v, l]) => (
                <button key={v} style={S.chip(horizon.portfolio === v, "#00e676")} onClick={() => setHorizon(h => ({ ...h, portfolio: v }))}>{l}</button>
              ))}
            </div>

            <button style={S.btnPrimary("#00e676")} onClick={analyzePortfolio} disabled={portfolioLoading}>
              {portfolioLoading ? "Analizando…" : "📊 Analizar portafolio"}
            </button>

            <div style={{ marginTop: 20 }}>
              {portfolioLoading && <Loading />}
              {portfolioResult && !portfolioLoading && (
                <AnalysisResult result={portfolioResult} timestamp={portfolioTs} onDeepen={() => alert("Abrí el chat para profundizar el análisis")} />
              )}
            </div>
          </div>
        )}

        {/* ── WATCHLIST TAB ── */}
        {tab === "watchlist" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Acciones de interés</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 34px", gap: 6, marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>TICKER</div>
              <div style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>MERCADO</div>
              <div />
            </div>
            {watchlistRows.map(r => (
              <WatchlistRow key={r.id} row={r} onChange={val => updateRow(setWatchlistRows, r.id, val)} onRemove={() => removeRow(setWatchlistRows, r.id)} />
            ))}
            <button style={{ ...S.btnOutline("#2a2a2a"), width: "100%", marginBottom: 20, padding: "10px 0", borderStyle: "dashed" }} onClick={() => addRow(setWatchlistRows, { ticker: "", market: "NYSE" })}>+ Agregar a watchlist</button>

            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Horizonte</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[["diario", "Entrada diaria"], ["mediano", "Mediano plazo"]].map(([v, l]) => (
                <button key={v} style={S.chip(horizon.watchlist === v, "#60a5fa")} onClick={() => setHorizon(h => ({ ...h, watchlist: v }))}>{l}</button>
              ))}
            </div>

            <button style={S.btnPrimary("#60a5fa")} onClick={analyzeWatchlist} disabled={watchlistLoading}>
              {watchlistLoading ? "Analizando…" : "👁 Analizar watchlist"}
            </button>

            <div style={{ marginTop: 20 }}>
              {watchlistLoading && <Loading />}
              {watchlistResult && !watchlistLoading && (
                <AnalysisResult result={watchlistResult} timestamp={watchlistTs} onDeepen={() => {}} />
              )}
            </div>
          </div>
        )}

        {/* ── CRYPTO TAB ── */}
        {tab === "crypto" && (
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Criptomonedas</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 34px", gap: 6, marginBottom: 6 }}>
              <div style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>CRIPTO</div>
              <div style={{ fontSize: 10, color: "#333", letterSpacing: 1 }}>BASE</div>
              <div />
            </div>
            {cryptoRows.map(r => (
              <CryptoRow key={r.id} row={r} onChange={val => updateRow(setCryptoRows, r.id, val)} onRemove={() => removeRow(setCryptoRows, r.id)} />
            ))}
            <button style={{ ...S.btnOutline("#2a2a2a"), width: "100%", marginBottom: 20, padding: "10px 0", borderStyle: "dashed" }} onClick={() => addRow(setCryptoRows, { ticker: "", base: "USD" })}>+ Agregar cripto</button>

            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Horizonte</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[["diario", "Diario"], ["mediano", "Mediano plazo"]].map(([v, l]) => (
                <button key={v} style={S.chip(horizon.crypto === v, "#ec4899")} onClick={() => setHorizon(h => ({ ...h, crypto: v }))}>{l}</button>
              ))}
            </div>

            <button style={S.btnPrimary("#ec4899")} onClick={analyzeCrypto} disabled={cryptoLoading}>
              {cryptoLoading ? "Analizando…" : "₿ Analizar cripto"}
            </button>

            <div style={{ marginTop: 20 }}>
              {cryptoLoading && <Loading />}
              {cryptoResult && !cryptoLoading && (
                <AnalysisResult result={cryptoResult} timestamp={cryptoTs} onDeepen={() => {}} />
              )}
            </div>
          </div>
        )}

        {/* ── ALARMAS TAB ── */}
        {tab === "alarmas" && (
          <div>
            {/* Subtabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[["lista", "Mis alarmas"], ["nueva", "Nueva alarma"], ["log", "Historial"]].map(([v, l]) => (
                <button key={v} style={S.subtab(alarmSubtab === v, "#fbbf24")} onClick={() => setAlarmSubtab(v)}>{l}</button>
              ))}
            </div>

            {/* Nueva alarma */}
            {alarmSubtab === "nueva" && (
              <div>
                <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Configurar alarma</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={S.label}>Ticker</div>
                    <input style={S.input} placeholder="AAPL, GGAL…" value={alarmForm.ticker} onChange={e => setAlarmForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} />
                  </div>
                  <div>
                    <div style={S.label}>Mercado</div>
                    <select style={S.select} value={alarmForm.market} onChange={e => setAlarmForm(f => ({ ...f, market: e.target.value }))}>
                      <option value="NYSE">NYSE</option>
                      <option value="NASDAQ">NASDAQ</option>
                      <option value="BCBA">BCBA</option>
                      <option value="CEDEAR">CEDEAR</option>
                      <option value="CRYPTO">CRYPTO</option>
                    </select>
                  </div>
                </div>
                <div style={S.label}>Tipo de alarma</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {ALARM_TYPES.map(([v, l, c]) => (
                    <button key={v} style={{ ...S.chip(alarmForm.type === v, c), color: alarmForm.type === v ? "#000" : "#555" }} onClick={() => setAlarmForm(f => ({ ...f, type: v }))}>{l}</button>
                  ))}
                </div>
                <div style={S.label}>Precio objetivo ($)</div>
                <input style={{ ...S.input, marginBottom: 8 }} type="number" placeholder="Ej: 215.50" value={alarmForm.price} onChange={e => setAlarmForm(f => ({ ...f, price: e.target.value }))} />
                <div style={S.label}>Nota (opcional)</div>
                <input style={{ ...S.input, marginBottom: 16 }} placeholder="Ej: Soporte en MA200" value={alarmForm.note} onChange={e => setAlarmForm(f => ({ ...f, note: e.target.value }))} />
                <button style={S.btnPrimary("#fbbf24")} onClick={addAlarm}>🔔 Guardar alarma</button>
              </div>
            )}

            {/* Lista de alarmas + monitor */}
            {alarmSubtab === "lista" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: "#555" }}>{monitorStatus}</div>
                  <button
                    style={{ ...S.btnOutline(monitorRunning ? "#ff4444" : "#00e676"), color: monitorRunning ? "#ff4444" : "#00e676", padding: "8px 14px" }}
                    onClick={toggleMonitor}
                  >
                    {monitorRunning ? "⏹ Detener" : "▶ Iniciar monitor"}
                  </button>
                </div>
                {alarms.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem 0", color: "#444", fontSize: 14 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                    No hay alarmas configuradas
                  </div>
                ) : (
                  alarms.map(a => (
                    <AlarmRow key={a.id} alarm={a} onRemove={() => setAlarms(arr => arr.filter(x => x.id !== a.id))} />
                  ))
                )}
              </div>
            )}

            {/* Historial */}
            {alarmSubtab === "log" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase" }}>Alarmas disparadas</div>
                  {alarmLog.length > 0 && <button style={{ ...S.btnOutline(), fontSize: 11, padding: "5px 12px" }} onClick={() => setAlarmLog([])}>Limpiar</button>}
                </div>
                {alarmLog.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem 0", color: "#444", fontSize: 14 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                    Sin disparos registrados
                  </div>
                ) : (
                  alarmLog.map(e => {
                    const typeColors = { compra: "#00e676", venta: "#ff4444", stop: "#fbbf24", ruptura: "#60a5fa" };
                    const typeLabels = { compra: "Soporte compra", venta: "Toma ganancias", stop: "Stop loss", ruptura: "Ruptura alcista" };
                    const color = typeColors[e.type];
                    return (
                      <div key={e.id} style={{ background: "#111", border: `1px solid ${color}33`, borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: 14, color }}>🔔 {e.ticker}</span>
                          <span style={{ fontSize: 10, background: color + "22", color, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{typeLabels[e.type]}</span>
                          <span style={{ fontSize: 11, color: "#444", marginLeft: "auto" }}>{e.time}</span>
                        </div>
                        <div style={{ fontSize: 12, color: "#aaa" }}>
                          Precio actual <strong style={{ color }}>${parseFloat(e.currentPrice).toLocaleString("es-AR")}</strong> alcanzó el nivel <strong style={{ color: "#f0ede8" }}>${parseFloat(e.triggerPrice).toLocaleString("es-AR")}</strong>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#00e676" : "#ff4444", color: "#000", padding: "10px 20px", borderRadius: 20, fontWeight: 800, fontSize: 13, zIndex: 300 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
