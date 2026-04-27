import { useState, useRef } from "react";
import Head from "next/head";

const TICKER_MAP = {
  "2330": "台積電", "TSM": "台積電",
  "2317": "鴻海", "2454": "聯發科", "2382": "廣達",
  "3324": "雙鴻", "3017": "奇鋐", "2308": "台達電",
  "3711": "日月光", "2327": "國巨",
  "NVDA": "NVIDIA", "AAPL": "Apple",
  "AMD": "AMD", "INTC": "Intel",
  "MSFT": "Microsoft", "GOOGL": "Google",
};

const resolveCompany = (input) => {
  const upper = input.trim().toUpperCase();
  return TICKER_MAP[upper] || input.trim();
};

const Badge = ({ level }) => {
  const c = { 高: "#00ff88", 中: "#ffcc00", 低: "#ff6644" };
  return (
    <span style={{ background: c[level] + "22", color: c[level], border: \`1px solid \${c[level]}44\`, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
      {level}信心
    </span>
  );
};

const Meter = ({ score }) => {
  const pct = (score + 100) / 2;
  const col = score > 30 ? "#00ff88" : score > 0 ? "#88ffcc" : score > -30 ? "#ffcc00" : "#ff4444";
  const lbl = score > 50 ? "強烈看多 🚀" : score > 20 ? "看多 📈" : score > -20 ? "中性 ➡️" : score > -50 ? "看空 📉" : "強烈看空 ⛔";
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "#888", fontSize: 12 }}>市場情緒</span>
        <span style={{ color: col, fontWeight: 700, fontSize: 13 }}>{lbl} ({score > 0 ? "+" : ""}{score})</span>
      </div>
      <div style={{ background: "#111", borderRadius: 8, height: 7, overflow: "hidden" }}>
        <div style={{ width: \`\${pct}%\`, height: "100%", background: \`linear-gradient(90deg,#ff4444,#ffcc00,\${col})\`, borderRadius: 8, transition: "width 1.2s" }} />
      </div>
    </div>
  );
};

const STEPS = ["🔍 搜尋多方資料來源...", "📰 抓取 IR、SEC、新聞稿...", "🧩 比對供應鏈知識庫...", "⚡ 生成投資信號..."];
const QUICK = ["NVIDIA", "台積電", "Apple", "聯發科", "AMD", "鴻海"];

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("signals");
  const resultRef = useRef(null);
  const timer = useRef(null);

  const startAnim = () => {
    let i = 0; setStep(0);
    timer.current = setInterval(() => { i++; if (i < STEPS.length) setStep(i); }, 3000);
  };
  const stopAnim = () => clearInterval(timer.current);

  const analyze = async () => {
    const raw = input.trim();
    if (!raw) return;
    const company = resolveCompany(raw);
    setLoading(true); setResult(null); setError(null);
    startAnim();
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      stopAnim();
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      stopAnim();
      setError(e.message || "發生錯誤，請稍後再試");
    }
    setLoading(false);
  };

  const TABS = [
    { id: "signals",  label: "📡 關鍵信號", n: result?.keySignals?.length },
    { id: "stocks",   label: "📊 受益股票", n: result?.beneficiaryStocks?.length },
    { id: "partners", label: "🔗 點名夥伴", n: result?.namedPartners?.length },
    { id: "risks",    label: "⚠️ 風險",     n: result?.risks?.length },
  ];

  return (
    <>
      <Head>
        <title>法說會供應鏈解碼器</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=Noto+Sans+TC:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <div style={{ minHeight: "100vh", background: "#07070f", color: "#e0e0f0", fontFamily: "'DM Sans','Noto Sans TC',sans-serif", paddingBottom: 60 }}>

        <div style={{ borderBottom: "1px solid #161630", padding: "18px 22px", display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(180deg,#0d0d22,#07070f)" }}>
          <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#5533ff,#00bbff)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>法說會供應鏈解碼器</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 1 }}>搜尋法說會、IR、SEC、新聞稿 → AI 分析供應鏈投資機會</div>
          </div>
        </div>

        <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px" }}>

          <div style={{ background: "#0d0d1e", border: "1px solid #1c1c38", borderRadius: 14, padding: "18px 18px 14px", marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 9 }}>公司名稱 或 股票代號（台股 / 美股皆可）</div>
            <div style={{ display: "flex", gap: 9 }}>
              <input
                placeholder="例：台積電、2330、NVDA、NVIDIA、AAPL..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !loading && analyze()}
                style={{ flex: 1, background: "#13132a", border: "1px solid #252550", borderRadius: 8, color: "#e0e0f0", padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
              />
              <button onClick={analyze} disabled={loading || !input.trim()} style={{
                background: loading || !input.trim() ? "#1a1a30" : "linear-gradient(135deg,#5533ff,#3399ff)",
                border: "none", color: loading || !input.trim() ? "#444" : "#fff",
                padding: "0 22px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap",
              }}>
                {loading ? "分析中..." : "⚡ 分析"}
              </button>
            </div>
            <div style={{ marginTop: 11, display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#444" }}>快速選擇：</span>
              {QUICK.map(q => (
                <button key={q} onClick={() => setInput(q)} style={{
                  background: "#131328", border: "1px solid #1e1e3e", color: "#666",
                  padding: "3px 11px", borderRadius: 20, fontSize: 11, cursor: "pointer",
                }}>
                  {q}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "#333" }}>
              💡 支援：台股代號（2330）、美股代號（NVDA）、中文（台積電）、英文（NVIDIA）
            </div>
          </div>

          {loading && (
            <div style={{ background: "#0d0d1e", border: "1px solid #1c1c38", borderRadius: 14, padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 30, marginBottom: 16 }}>⚡</div>
              {STEPS.map((s, i) => (
                <div key={i} style={{ fontSize: 13, marginBottom: 10, color: i < step ? "#2a2a44" : i === step ? "#aad4ff" : "#1e1e38", display: "flex", alignItems: "center", justifyContent: "center", gap: 9, transition: "color 0.5s" }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0, background: i < step ? "#111" : i === step ? "#5533ff" : "#0d0d1e", border: \`2px solid \${i <= step ? "#5533ff" : "#1a1a38"}\`, transition: "all 0.5s" }} />
                  {s}
                </div>
              ))}
              <div style={{ marginTop: 14, fontSize: 11, color: "#252540" }}>正在搜尋法說會、IR、SEC、新聞稿等多方資料，約需 30–60 秒...</div>
            </div>
          )}

          {error && (
            <div style={{ background: "#1a0808", border: "1px solid #3a1010", borderRadius: 12, padding: "14px 16px", color: "#ff7755", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div ref={resultRef}>
              <div style={{ background: "linear-gradient(135deg,#0d0d22,#111128)", border: "1px solid #222244", borderRadius: 16, padding: 20, marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{result.company}</div>
                    <div style={{ color: "#666", fontSize: 12, marginTop: 3 }}>{result.industry}</div>
                    {result.dataSources?.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {result.dataSources.map((s, i) => (
                          <span key={i} style={{ background: "#111130", border: "1px solid #1e1e3e", borderRadius: 4, padding: "2px 7px", fontSize: 10, color: "#555" }}>📎 {s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ background: result.sentimentScore > 20 ? "#002a18" : result.sentimentScore < -20 ? "#2a0808" : "#1a1800", border: \`1px solid \${result.sentimentScore > 20 ? "#00ff8830" : result.sentimentScore < -20 ? "#ff444430" : "#ffcc0030"}\`, borderRadius: 10, padding: "9px 16px", textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 24 }}>{result.sentimentScore > 50 ? "🚀" : result.sentimentScore > 20 ? "📈" : result.sentimentScore > -20 ? "➡️" : "📉"}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, marginTop: 3, color: result.sentimentScore > 20 ? "#00ff88" : result.sentimentScore < -20 ? "#ff5555" : "#ffcc00" }}>{result.overallSentiment}</div>
                  </div>
                </div>
                <Meter score={result.sentimentScore} />
                <div style={{ marginTop: 12, padding: "11px 14px", background: "#09091a", borderRadius: 8, borderLeft: "3px solid #5533ff", fontSize: 13, lineHeight: 1.8, color: "#bbb" }}>
                  {result.summary}
                </div>
              </div>

              <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)} style={{
                    background: tab === t.id ? "#1a1a38" : "transparent",
                    border: \`1px solid \${tab === t.id ? "#3333aa" : "#181830"}\`,
                    color: tab === t.id ? "#fff" : "#555",
                    padding: "6px 14px", borderRadius: 8, fontSize: 12,
                    cursor: "pointer", fontWeight: tab === t.id ? 600 : 400,
                  }}>
                    {t.label}
                    {t.n > 0 && <span style={{ marginLeft: 5, background: tab === t.id ? "#5533ff" : "#1a1a30", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>{t.n}</span>}
                  </button>
                ))}
              </div>

              {tab === "signals" && result.keySignals?.map((s, i) => (
                <div key={i} style={{ background: "#0d0d1e", border: \`1px solid \${s.impact === "正面" ? "#163026" : s.impact === "負面" ? "#301616" : "#1e1e30"}\`, borderLeft: \`3px solid \${s.impact === "正面" ? "#00ff88" : s.impact === "負面" ? "#ff4444" : "#666"}\`, borderRadius: 12, padding: 16, marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>
                      {({ capex: "💰", demand: "📈", supply_chain: "🔗", bottleneck: "⚠️", guidance: "🎯", partnership: "🤝" }[s.type] || "📌")} {s.title}
                    </div>
                    <Badge level={s.confidence} />
                  </div>
                  <div style={{ color: "#aaa", fontSize: 13, lineHeight: 1.7 }}>{s.description}</div>
                  {s.source && <div style={{ marginTop: 6, fontSize: 11, color: "#555" }}>📎 來源：{s.source}</div>}
                  {s.quote && <div style={{ marginTop: 9, padding: "7px 11px", background: "#09091a", borderRadius: 6, borderLeft: "2px solid #333", fontSize: 12, color: "#777", fontStyle: "italic" }}>"{s.quote}"</div>}
                </div>
              ))}

              {tab === "stocks" && result.beneficiaryStocks?.map((s, i) => (
                <div key={i} style={{ background: "#0d0d1e", border: "1px solid #163026", borderLeft: "3px solid #00ff88", borderRadius: 12, padding: 16, marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ background: s.market === "台股" ? "#001833" : "#1a0033", border: \`1px solid \${s.market === "台股" ? "#003366" : "#330066"}\`, borderRadius: 8, padding: "7px 12px", minWidth: 66, textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: s.market === "台股" ? "#44aaff" : "#aa66ff" }}>{s.ticker}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{s.market}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3 }}>{s.name}</div>
                    <div style={{ color: "#999", fontSize: 13, lineHeight: 1.6 }}>{s.reason}</div>
                    {s.sources?.length > 0 && <div style={{ marginTop: 6, fontSize: 11, color: "#555" }}>📎 資料來源：{s.sources.join(", ")}</div>}
                  </div>
                  <Badge level={s.confidence} />
                </div>
              ))}

              {tab === "partners" && (
                result.namedPartners?.length > 0
                  ? result.namedPartners.map((p, i) => (
                    <div key={i} style={{ background: "#0d0d1e", border: "1px solid #1e1e38", borderRadius: 12, padding: 16, marginBottom: 10, display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <span style={{ background: "#131330", border: "1px solid #222244", borderRadius: 6, padding: "4px 11px", fontSize: 12, color: "#888", whiteSpace: "nowrap" }}>{p.relationship}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                        <div style={{ color: "#777", fontSize: 13, marginTop: 2 }}>{p.context}</div>
                        {p.source && <div style={{ marginTop: 4, fontSize: 11, color: "#555" }}>📎 來源：{p.source}</div>}
                      </div>
                    </div>
                  ))
                  : <div style={{ color: "#444", textAlign: "center", padding: 28, fontSize: 13 }}>本次分析未發現明確點名的合作夥伴</div>
              )}

              {tab === "risks" && result.risks?.map((r, i) => (
                <div key={i} style={{ background: "#0d0d1e", border: "1px solid #301616", borderLeft: "3px solid #ff4444", borderRadius: 12, padding: 16, marginBottom: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ color: "#ff4444", flexShrink: 0, fontSize: 14 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#bb8888", fontSize: 13, lineHeight: 1.7 }}>{r.risk}</div>
                    {r.severity && <div style={{ marginTop: 4, fontSize: 11, color: "#555" }}>嚴重程度：{r.severity}</div>}
                    {r.source && <div style={{ marginTop: 3, fontSize: 11, color: "#555" }}>📎 來源：{r.source}</div>}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 20, padding: "9px 13px", background: "#090909", borderRadius: 8, border: "1px solid #141414", fontSize: 11, color: "#333", lineHeight: 1.8 }}>
                ⚠️ 免責聲明：本分析由 AI 自動生成，資料來源為公開網路資訊，涵蓋法說會、投資人關係文件、SEC 官方文件、公開資訊觀測站與公司新聞稿。僅供研究參考，不構成任何投資建議。投資有風險，請自行判斷並承擔投資決策責任。
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
