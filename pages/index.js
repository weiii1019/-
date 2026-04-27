import { useState, useRef } from "react";
import Head from "next/head";

const TICKER_MAP = {
  "2330": "台積電", "TSM": "台積電", "2317": "鴻海", "2454": "聯發科",
  "NVDA": "NVIDIA", "AAPL": "Apple", "AMD": "AMD",
};

const resolveCompany = (input) => {
  const upper = input.trim().toUpperCase();
  return TICKER_MAP[upper] || input.trim();
};

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);

  const analyze = async () => {
    const raw = input.trim();
    if (!raw) return;
    const company = resolveCompany(raw);
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(e.message || "Error occurred");
    }
    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>法說會供應鏈解碼器</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div style={{ minHeight: "100vh", background: "#07070f", color: "#e0e0f0", fontFamily: "Arial, sans-serif", paddingBottom: 60 }}>
        <div style={{ borderBottom: "1px solid #161630", padding: "18px 22px", background: "linear-gradient(180deg,#0d0d22,#07070f)" }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>⚡ 法說會供應鏈解碼器</div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>輸入公司名稱 → AI 分析供應鏈投資機會</div>
        </div>

        <div style={{ maxWidth: 820, margin: "0 auto", padding: "24px 16px" }}>
          <div style={{ background: "#0d0d1e", border: "1px solid #1c1c38", borderRadius: 14, padding: "18px", marginBottom: 18 }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 9 }}>公司名稱或股票代號</div>
            <div style={{ display: "flex", gap: 9 }}>
              <input
                placeholder="例：台積電、2330、NVDA..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && analyze()}
                style={{ flex: 1, background: "#13132a", border: "1px solid #252550", borderRadius: 8, color: "#e0e0f0", padding: "11px 14px", fontSize: 14, outline: "none" }}
              />
              <button onClick={analyze} disabled={loading || !input.trim()} style={{
                background: loading || !input.trim() ? "#1a1a30" : "linear-gradient(135deg,#5533ff,#3399ff)",
                border: "none", color: loading || !input.trim() ? "#444" : "#fff",
                padding: "0 22px", borderRadius: 8, fontSize: 14, fontWeight: 600,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
              }}>
                {loading ? "分析中..." : "⚡ 分析"}
              </button>
            </div>
          </div>

          {loading && (
            <div style={{ background: "#0d0d1e", border: "1px solid #1c1c38", borderRadius: 14, padding: "28px 20px", textAlign: "center" }}>
              <div style={{ fontSize: 30, marginBottom: 16 }}>⚡</div>
              <div style={{ color: "#aad4ff", marginBottom: 10 }}>正在搜尋資料...</div>
              <div style={{ fontSize: 12, color: "#252540" }}>約需 30–60 秒</div>
            </div>
          )}

          {error && (
            <div style={{ background: "#1a0808", border: "1px solid #3a1010", borderRadius: 12, padding: "14px 16px", color: "#ff7755", fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div ref={resultRef} style={{ background: "linear-gradient(135deg,#0d0d22,#111128)", border: "1px solid #222244", borderRadius: 16, padding: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{result.company}</div>
              <div style={{ color: "#666", fontSize: 12, marginTop: 8 }}>{result.industry}</div>
              <div style={{ marginTop: 12, padding: "11px 14px", background: "#09091a", borderRadius: 8, fontSize: 13, lineHeight: 1.8, color: "#bbb" }}>
                {result.summary}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
