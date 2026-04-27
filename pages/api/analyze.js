export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { company } = req.body;
  if (!company) return res.status(400).json({ error: "缺少公司名稱" });

  const SYSTEM_PROMPT = `你是一位頂尖的產業鏈分析師，專精於從多方資料來源解讀供應鏈投資機會。

用戶給你公司名稱或股票代號後，請用 web_search 工具搜尋以下多方資料來源：

【搜尋策略 - 執行 5-7 次搜尋，涵蓋所有資料來源】
1. 法說會 (Earnings Call)
   - "{公司} earnings call transcript 2025"
   - "{公司} 法說會逐字稿"
   - "{公司} quarterly earnings latest"

2. 投資人關係 (IR - Investor Relations)
   - "{公司} investor relations supply chain"
   - "{公司} IR presentation 2025"
   - "{公司} investor update guidance"

3. 美股（SEC 官方文件）
   - "{公司} SEC 10-Q 2025"
   - "{公司} SEC 8-K"
   - "{公司} SEC filing supply chain"

4. 台股（公開資訊觀測站）
   - "{公司名} 公開資訊觀測站"
   - "{公司名} 法說會 2025"
   - "{公司名} 年報"

5. 公司官方新聞稿
   - "{公司} press release 2025"
   - "{公司} news 供應鏈"
   - "{公司} 新聞稿"

6. 產業新聞與分析
   - "{公司} supply chain news latest"
   - "{公司} production capacity expansion"

7. 指引與展望
   - "{公司} forward guidance"
   - "{公司} capex investment plan"

供應鏈知識庫：
- AI/GPU擴產 → 台積電(2330)、日月光(3711)、京元電(2449)、雙鴻(3324)、奇鋐(3017)、聯發科(2454)
- 伺服器 → 廣達(2382)、英業達(2356)、緯穎(6669)、緯創(3231)、神達(2379)
- HBM/記憶體 → 南亞科(2408)、華邦電(2344)
- PCB → 臻鼎-KY(4958)、欣興(3037)、景碩(3189)、健鼎(3044)
- 被動元件 → 國巨(2327)、華新科(2492)
- 連接器 → 正崴(2392)、嘉澤(3533)
- 電源 → 台達電(2308)、光寶科(2301)、明泰(3380)
- 機殼/散熱 → 可成(2474)、鴻準(2354)
- 美股AI供應鏈 → AMAT, ASML, LRCX, KLAC, MRVL, ON, NVDA
- Apple供應鏈 → 台積電(2330)、大立光(3008)、鴻海(2317)、可成(2474)

【輸出要求】只輸出純 JSON（無 markdown、無其他文字）：
{
  "company": "公司名稱",
  "industry": "產業別",
  "overallSentiment": "強烈看多|看多|中性|看空|強烈看空",
  "sentimentScore": -100到100的整數,
  "dataSources": ["法說會", "投資人關係", "新聞稿", "SEC 10-Q", "...等"],
  "keySignals": [
    { "type": "capex|demand|supply_chain|bottleneck|guidance|partnership", "title": "標題", "description": "說明", "quote": "引用（20字內）", "source": "資料來源", "confidence": "高|中|低", "impact": "正面|負面|中性" }
  ],
  "namedPartners": [
    { "name": "公司", "relationship": "供應商|客戶|合作夥伴", "context": "背景", "source": "資料來源" }
  ],
  "beneficiaryStocks": [
    { "name": "公司", "ticker": "代號", "market": "台股|美股", "reason": "受益原因（詳細250字以內）", "confidence": "高|中|低", "signalBasis": "對應信號", "sources": ["來源1","來源2"] }
  ],
  "risks": [
    { "risk": "風險說明", "severity": "高|中|低", "source": "資料來源" }
  ],
  "summary": "整體分析（300字以內）"
}`;

  try {
    const messages = [
      {
        role: "user",
        content: \`請搜尋「\${company}」的多方資料來源（法說會、IR、SEC、公開資訊觀測站、新聞稿等），並分析供應鏈投資機會。請執行至少 5-7 次 web_search，涵蓋所有資料類型。\`,
      },
    ];

    let finalText = "";

    for (let round = 0; round < 10; round++) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system: SYSTEM_PROMPT,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      messages.push({ role: "assistant", content: data.content });

      if (data.stop_reason === "end_turn") {
        finalText = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
        break;
      }

      const toolUses = data.content.filter((b) => b.type === "tool_use");
      if (toolUses.length === 0) {
        finalText = data.content.filter((b) => b.type === "text").map((b) => b.text).join("");
        break;
      }

      messages.push({
        role: "user",
        content: toolUses.map((tu) => ({
          type: "tool_result",
          tool_use_id: tu.id,
          content: [],
        })),
      });
    }

    if (!finalText) throw new Error("未收到有效回應");

    const clean = finalText.replace(/```json|```/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("回應格式錯誤");

    const parsed = JSON.parse(match[0]);
    return res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "分析失敗，請稍後再試" });
  }
}
