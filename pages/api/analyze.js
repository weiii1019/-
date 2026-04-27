export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { company } = req.body;
  if (!company) {
    return res.status(400).json({ error: "Company name required" });
  }

  try {
    // 調用 Claude 進行分析
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY || "sk-ant-api03-WQ0DBognqFgAYAubXLjUtk1bYq2fHTFgaJu7V6JutjC6ZNUw7Ac9aTR3VtCu0rx1jMuns2sFLNM3Q1b1KiEhWg-hckdhAAA",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `你是頂尖的供應鏈分析師。請搜尋並分析「${company}」的以下資訊來源：

1. 最新法說會逐字稿（Earnings Call Transcript）
2. 投資人關係文件（Investor Relations）
3. SEC 官方文件（10-Q、8-K）
4. 公開資訊觀測站（台股公司）
5. 官方新聞稿（Press Release）
6. 產業新聞與分析

請分析並找出：
- 資本支出（Capex）信號
- 需求預測
- 點名的供應商/客戶
- 瓶頸限制
- 指引方向變化

最後輸出純 JSON（只有 JSON，無其他文字）：
{
  "company": "公司名稱",
  "industry": "產業別",
  "overallSentiment": "強烈看多|看多|中性|看空|強烈看空",
  "sentimentScore": -100到100,
  "dataSources": ["法說會", "IR", "SEC", "新聞", ...],
  "keySignals": [
    { "type": "capex|demand|supply_chain|bottleneck|guidance", "title": "...", "description": "...", "source": "...", "confidence": "高|中|低", "impact": "正面|負面|中性" }
  ],
  "namedPartners": [
    { "name": "...", "relationship": "供應商|客戶|合作夥伴", "context": "...", "source": "..." }
  ],
  "beneficiaryStocks": [
    { "name": "...", "ticker": "...", "market": "台股|美股", "reason": "...", "confidence": "高|中|低", "sources": [...] }
  ],
  "risks": [
    { "risk": "...", "severity": "高|中|低", "source": "..." }
  ],
  "summary": "整體分析摘要"
}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("API Error:", data.error);
      return res.status(500).json({ error: `API 錯誤: ${data.error.message}` });
    }

    const textContent = data.content?.find(b => b.type === "text")?.text || "";
    
    if (!textContent) {
      return res.status(500).json({ error: "No response from Claude" });
    }

    // 提取 JSON
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: "Invalid JSON format in response" });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: err.message || "Analysis failed" });
  }
}
