import React, { useState, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

const API_URL = "/api/analizar-portfolio";

// ── Helpers ──
function uid() { return Math.random().toString(36).slice(2, 8); }

function fmtPrice(n, currency = "USD") {
  if (n === null || n === undefined || isNaN(n)) return "—";
  const sym = currency === "ARS" ? "$" : "$";
  return sym + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const SIGNAL_META = {
  COMPRAR: { label: "COMPRAR", color: "#00e676" },
  MANTENER: { label: "MANTENER", color: "#fbbf24" },
  VENDER: { label: "VENDER", color: "#ff4444" },
  TOMAR_GANANCIAS: { label: "TOMAR GANANCIAS", color: "#f97316" },
  SOPORTE_DE_COMPRA: { label: "SOPORTE DE COMPRA", color: "#60a5fa" },
  ENTRAR_AHORA: { label: "ENTRAR AHORA", color: "#00e676" },
  ESPERAR_CORRECCION: { label: "ESPERAR CORRECCIÓN", color: "#fbbf24" },
  EVITAR: { label: "EVITAR", color: "#ff4444" },
  ACUMULAR: { label: "ACUMULAR", color: "#00e676" },
  REDUCIR: { label: "REDUCIR", color: "#f97316" },
};

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
  metricCell: { background: "#161616", borderRadius: 10, padding: "8px 10px", textAlign: "center" },
  metricLabel: { fontSize: 9, color: "#555", letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 },
  metricValue: { fontSize: 14, fontWeight: 700, color: "#f0ede8" },
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

// ── Price chart ──
function PriceChart({ asset }) {
  if (!asset.serie_precios || !asset.serie_precios.length) return null;

  const data = asset.serie_precios.map(p => ({
    fecha: p.fecha?.slice(5) || "",
    precio: p.precio,
  }));

  return (
    <div style={{ width: "100%", height: 220, marginBottom: 4 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
          <XAxis dataKey="fecha" tick={{ fill: "#555", fontSize: 9 }} interval={Math.floor(data.length / 5)} axisLine={{ stroke: "#222" }} tickLine={false} />
          <YAxis tick={{ fill: "#555", fontSize: 9 }} axisLine={false} tickLine={false} domain={["auto", "auto"]} width={42} />
          <Tooltip
            contentStyle={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#888" }}
            itemStyle={{ color: "#00e676" }}
          />
          {asset.resistencia && <ReferenceLine y={asset.resistencia} stroke="#ff4444" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: "Resist.", fill: "#ff4444", fontSize: 9, position: "insideTopRight" }} />}
          {asset.soporte && <ReferenceLine y={asset.soporte} stroke="#00e676" strokeDasharray="4 4" strokeOpacity={0.6} label={{ value: "Soporte", fill: "#00e676", fontSize: 9, position: "insideBottomRight" }} />}
          <Line type="monotone" dataKey="precio" stroke="#60a5fa" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Asset analysis card ──
function AssetCard({ asset }) {
  if (asset.error) {
    return (
      <div style={{ ...S.card, borderColor: "#ff444433" }}>
        <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6 }}>{asset.ticker}</div>
        <div style={{ fontSize: 13, color: "#ff8888" }}>No se pudo analizar: {asset.error}</div>
      </div>
    );
  }

  const sig = SIGNAL_META[asset.señal_tecnica] || { label: asset.señal_tecnica || "—", color: "#888" };
  const trendColor = asset.tendencia === "alcista" ? "#00e676" : asset.tendencia === "bajista" ? "#ff4444" : "#fbbf24";

  return (
    <div style={S.card}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 2 }}>
        <div>
          <span style={{ fontSize: 17, fontWeight: 900 }}>{asset.ticker}</span>
          <span style={{ fontSize: 12, color: "#555", marginLeft: 8 }}>{asset.nombre_completo}</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 800 }}>{fmtPrice(asset.precio_actual, asset.moneda)}</span>
      </div>
      {asset.variacion_pct_1m !== undefined && (
        <div style={{ fontSize: 12, color: asset.variacion_pct_1m >= 0 ? "#00e676" : "#ff4444", marginBottom: 10 }}>
          {asset.variacion_pct_1m >= 0 ? "▲" : "▼"} {Math.abs(asset.variacion_pct_1m).toFixed(2)}% últimos 30 días
        </div>
      )}

      {/* Chart */}
      <PriceChart asset={asset} />

      {/* Signal badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: sig.color + "22", border: `1px solid ${sig.color}55`, borderRadius: 10, padding: "7px 14px", margin: "10px 0", fontWeight: 800, fontSize: 13, color: sig.color }}>
        🚦 {sig.label}
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, margin: "10px 0" }}>
        <div style={S.metricCell}><div style={S.metricLabel}>MA20</div><div style={S.metricValue}>{fmtPrice(asset.ma20, asset.moneda)}</div></div>
        <div style={S.metricCell}><div style={S.metricLabel}>MA50</div><div style={S.metricValue}>{fmtPrice(asset.ma50, asset.moneda)}</div></div>
        <div style={S.metricCell}><div style={S.metricLabel}>RSI</div><div style={{ ...S.metricValue, color: asset.rsi > 70 ? "#ff4444" : asset.rsi < 30 ? "#00e676" : "#f0ede8" }}>{asset.rsi}</div></div>
        <div style={S.metricCell}><div style={S.metricLabel}>Tendencia</div><div style={{ ...S.metricValue, color: trendColor, fontSize: 11 }}>{asset.tendencia}</div></div>
      </div>

      {/* Technical analysis */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Análisis técnico</div>
        <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.6 }}>{asset.analisis_tecnico}</div>
      </div>

      {/* Fundamental analysis */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Análisis fundamental</div>
        <div style={{ fontSize: 13, color: "#bbb", lineHeight: 1.6 }}>{asset.analisis_fundamental}</div>
      </div>

      {/* Diagnosis */}
      <div style={{ marginTop: 12, background: "#0d0d0d", borderRadius: 10, padding: "10px 12px" }}>
        <div style={{ fontSize: 10, color: "#555", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>Diagnóstico y niveles</div>
        <div style={{ fontSize: 13, color: "#ddd", lineHeight: 1.6, marginBottom: 8 }}>{asset.diagnostico}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {asset.toma_ganancias && <div style={{ fontSize: 12 }}><span style={{ color: "#00e676" }}>💰 Toma ganancias:</span> <strong>{fmtPrice(asset.toma_ganancias, asset.moneda)}</strong></div>}
          {asset.soporte_compra && <div style={{ fontSize: 12 }}><span style={{ color: "#60a5fa" }}>🛒 Soporte compra:</span> <strong>{fmtPrice(asset.soporte_compra, asset.moneda)}</strong></div>}
          {asset.precio_objetivo && <div style={{ fontSize: 12 }}><span style={{ color: "#f97316" }}>🎯 Objetivo:</span> <strong>{fmtPrice(asset.precio_objetivo, asset.moneda)}</strong></div>}
          {asset.stop_loss && <div style={{ fontSize: 12 }}><span style={{ color: "#ff4444" }}>🛑 Stop loss:</span> <strong>{fmtPrice(asset.stop_loss, asset.moneda)}</strong></div>}
        </div>
        {asset.conviccion && (
          <div style={{ fontSize: 12, marginTop: 8, color: "#888" }}>
            📊 Convicción: <strong style={{ color: "#f0ede8" }}>{asset.conviccion}</strong>
            {asset.justificacion_conviccion ? ` — ${asset.justificacion_conviccion}` : ""}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Loading ──
function Loading({ text = "Buscando datos reales y generando el análisis…" }) {
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
  const [portfolioResults, setPortfolioResults] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioTs, setPortfolioTs] = useState("");

  // Watchlist
  const [watchlistRows, setWatchlistRows] = useState([{ id: uid(), ticker: "", market: "NYSE" }]);
  const [watchlistResults, setWatchlistResults] = useState(null);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [watchlistTs, setWatchlistTs] = useState("");

  // Crypto
  const [cryptoRows, setCryptoRows] = useState([{ id: uid(), ticker: "", base: "USD" }]);
  const [cryptoResults, setCryptoResults] = useState(null);
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
    setTimeout(() => setToast(null), 3000);
  }

  // ── API calls ──
  async function callAnalyze(mode, assets, h) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, assets, horizon: h }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.assets; // array of structured asset objects
  }

  async function callAlarmCheck(assets) {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "alarm_check", assets, horizon: "" }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return JSON.parse(data.result);
  }

  // ── Portfolio analyze ──
  async function analyzePortfolio() {
    const assets = portfolioRows.filter(r => r.ticker.trim());
    if (!assets.length) { showToast("Agregá al menos un activo", false); return; }
    setPortfolioLoading(true); setPortfolioResults(null);
    try {
      const results = await callAnalyze("portfolio", assets, horizon.portfolio);
      setPortfolioResults(results);
      setPortfolioTs(new Date().toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }));
    } catch (e) { showToast("Error: " + e.message, false); }
    setPortfolioLoading(false);
  }

  // ── Watchlist analyze ──
  async function analyzeWatchlist() {
    const assets = watchlistRows.filter(r => r.ticker.trim());
    if (!assets.length) { showToast("Agregá al menos un activo", false); return; }
    setWatchlistLoading(true); setWatchlistResults(null);
    try {
      const results = await callAnalyze("watchlist", assets, horizon.watchlist);
      setWatchlistResults(results);
      setWatchlistTs(new Date().toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }));
    } catch (e) { showToast("Error: " + e.message, false); }
    setWatchlistLoading(false);
  }

  // ── Crypto analyze ──
  async function analyzeCrypto() {
    const assets = cryptoRows.filter(r => r.ticker.trim());
    if (!assets.length) { showToast("Agregá al menos un activo", false); return; }
    setCryptoLoading(true); setCryptoResults(null);
    try {
      const results = await callAnalyze("crypto", assets, horizon.crypto);
      setCryptoResults(results);
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
      const prices = await callAlarmCheck(assets);
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
              {portfolioResults && !portfolioLoading && (
                <div>
                  <div style={{ fontSize: 11, color: "#444", marginBottom: 12 }}>⏱ Actualizado: {portfolioTs}</div>
                  {portfolioResults.map((a, i) => <AssetCard key={i} asset={a} />)}
                </div>
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
              {watchlistResults && !watchlistLoading && (
                <div>
                  <div style={{ fontSize: 11, color: "#444", marginBottom: 12 }}>⏱ Actualizado: {watchlistTs}</div>
                  {watchlistResults.map((a, i) => <AssetCard key={i} asset={a} />)}
                </div>
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
              {cryptoResults && !cryptoLoading && (
                <div>
                  <div style={{ fontSize: 11, color: "#444", marginBottom: 12 }}>⏱ Actualizado: {cryptoTs}</div>
                  {cryptoResults.map((a, i) => <AssetCard key={i} asset={a} />)}
                </div>
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
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.ok ? "#00e676" : "#ff4444", color: "#000", padding: "10px 20px", borderRadius: 20, fontWeight: 800, fontSize: 13, zIndex: 300, maxWidth: "90%", textAlign: "center" }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}