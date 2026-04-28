export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { company } = req.body;
  if (!company) {
    return res.status(400).json({ error: "Company name required" });
  }

  const API_KEY = "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";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `分析「${company}」的供應鏈投資機會。搜尋法說會、IR文件、SEC檔案、新聞稿。輸出純JSON：
{
  "company": "公司名",
  "industry": "產業",
  "overallSentiment": "看多|中性|看空",
  "sentimentScore": 0,
  "dataSources": ["法說會", "IR", "新聞"],
  "keySignals": [{"type": "capex|demand|guidance", "title": "標題", "description": "說明", "source": "來源", "confidence": "高|中|低", "impact": "正面|負面"}],
  "namedPartners": [{"name": "公司", "relationship": "供應商|客戶", "context": "背景", "source": "來源"}],
  "beneficiaryStocks": [{"name": "名稱", "ticker": "代號", "market": "台股|美股", "reason": "原因", "confidence": "高|中|低", "sources": ["來源"]}],
  "risks": [{"risk": "風險", "severity": "高|中|低", "source": "來源"}],
  "summary": "摘要"
}`,
          },
        ],
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const textContent = data.content?.find(b => b.type === "text")?.text || "";
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      return res.status(500).json({ error: "Parse error" });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
