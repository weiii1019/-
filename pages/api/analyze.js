export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { company } = req.body;
  if (!company) {
    return res.status(400).json({ error: "Company name required" });
  }

  try {
    // 直接返回成功響應，不調用 Anthropic API
    return res.status(200).json({
      company: company,
      industry: "Technology",
      overallSentiment: "中性",
      sentimentScore: 0,
      dataSources: ["Analysis System"],
      keySignals: [
        {
          type: "guidance",
          title: "Test Signal",
          description: `Analysis for ${company} completed successfully`,
          confidence: "中",
          impact: "正面"
        }
      ],
      namedPartners: [],
      beneficiaryStocks: [
        {
          name: "Sample Stock",
          ticker: "TEST",
          market: "台股",
          reason: `Related to ${company} supply chain`,
          confidence: "中"
        }
      ],
      risks: ["Market volatility"],
      summary: `Successfully analyzed ${company}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
