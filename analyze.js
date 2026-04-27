export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { company } = req.body;
  if (!company) {
    return res.status(400).json({ error: "Missing company name" });
  }

  try {
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
        messages: [
          {
            role: "user",
            content: `Analyze supply chain opportunities for ${company}. Search for earnings calls, IR documents, SEC filings, and news releases. Return JSON with company analysis.`,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    return res.status(200).json({
      company: company,
      industry: "Technology",
      overallSentiment: "中性",
      sentimentScore: 0,
      dataSources: ["API"],
      keySignals: [],
      namedPartners: [],
      beneficiaryStocks: [],
      risks: [],
      summary: "Analysis in progress",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
