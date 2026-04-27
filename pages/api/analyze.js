export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { company } = req.body;
  if (!company) {
    return res.status(400).json({ error: "Company name required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const messages = [
      {
        role: "user",
        content: `Analyze supply chain opportunities for ${company}. Search for earnings calls, investor relations, SEC filings, news releases. Return only valid JSON with company analysis, key signals, beneficiary stocks, and risks.`
      }
    ];

    let finalResponse = null;

    for (let round = 0; round < 5; round++) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: messages,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        }),
      });

      const data = await response.json();

      if (data.error) {
        return res.status(500).json({ error: data.error.message || "API error" });
      }

      messages.push({ role: "assistant", content: data.content });

      if (data.stop_reason === "end_turn") {
        finalResponse = data.content;
        break;
      }

      const toolUses = data.content.filter(b => b.type === "tool_use");
      if (toolUses.length === 0) {
        finalResponse = data.content;
        break;
      }

      messages.push({
        role: "user",
        content: toolUses.map(tu => ({
          type: "tool_result",
          tool_use_id: tu.id,
          content: [],
        })),
      });
    }

    if (!finalResponse) {
      return res.status(500).json({ error: "No response from AI" });
    }

    const text = finalResponse
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(200).json({
        company: company,
        industry: "Technology",
        overallSentiment: "中性",
        sentimentScore: 0,
        dataSources: [],
        keySignals: [],
        namedPartners: [],
        beneficiaryStocks: [],
        risks: [],
        summary: text || "Analysis completed",
      });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return res.status(200).json(parsed);

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: err.message || "Analysis failed" });
  }
}
