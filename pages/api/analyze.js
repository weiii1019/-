export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { company } = req.body;
  if (!company) {
    return res.status(400).json({ error: "Company name required" });
  }

  // Mock data for demonstration
  const mockAnalysis = {
    "台積電": {
      company: "台積電",
      industry: "半導體製造",
      overallSentiment: "看多",
      sentimentScore: 45,
      dataSources: ["法說會", "投資人關係", "新聞稿"],
      keySignals: [
        {
          type: "capex",
          title: "先進封裝產能擴充",
          description: "台積電宣布大幅擴充 CoWoS 先進封裝產能，以應對 AI 晶片需求爆炸",
          quote: "CoWoS 產能將翻倍增長",
          source: "2025 Q1 法說會",
          confidence: "高",
          impact: "正面"
        },
        {
          type: "demand",
          title: "AI 加速器強勁需求",
          description: "客戶訂單能見度超過 12 個月，AI 相關營收成長 60%",
          source: "投資人關係",
          confidence: "高",
          impact: "正面"
        }
      ],
      namedPartners: [
        {
          name: "NVIDIA",
          relationship: "主要客戶",
          context: "AI 加速器 Blackwell 系列主要代工廠",
          source: "法說會"
        }
      ],
      beneficiaryStocks: [
        {
          name: "日月光",
          ticker: "3711",
          market: "台股",
          reason: "台積電先進封裝訂單增加，帶動日月光 CoWoS 相關業務成長",
          confidence: "高",
          signalBasis: "先進封裝擴產信號",
          sources: ["法說會"]
        },
        {
          name: "京元電",
          ticker: "2449",
          market: "台股",
          reason: "先進製程測試需求增加，京元電將受惠",
          confidence: "中",
          signalBasis: "先進製程需求",
          sources: ["投資人關係"]
        }
      ],
      risks: [
        { risk: "地緣政治風險：美國對華限制可能影響客戶", severity: "高", source: "新聞" },
        { risk: "產能利用率波動風險", severity: "中", source: "財務分析" }
      ],
      summary: "台積電受惠於 AI 晶片爆炸性需求，正積極擴充先進製程和先進封裝產能。法說會傳達強勁需求訊號，客戶訂單能見度超過 12 個月。建議關注供應鏈受益者如日月光、京元電等。地緣政治風險需留意。"
    },
    "NVIDIA": {
      company: "NVIDIA",
      industry: "AI 晶片設計",
      overallSentiment: "強烈看多",
      sentimentScore: 75,
      dataSources: ["財報", "法說會", "新聞稿"],
      keySignals: [
        {
          type: "demand",
          title: "Blackwell GPU 需求超預期",
          description: "Blackwell 系列 GPU 出貨量遠超預期，Q1 營收環比成長 25%",
          quote: "需求極其強勁",
          source: "最新財報",
          confidence: "高",
          impact: "正面"
        }
      ],
      namedPartners: [
        {
          name: "台積電",
          relationship: "代工廠",
          context: "Blackwell 和 Hopper GPU 主要代工商",
          source: "財報"
        }
      ],
      beneficiaryStocks: [
        {
          name: "台積電",
          ticker: "2330",
          market: "台股",
          reason: "NVIDIA GPU 代工需求持續強勁，帶動台積電營收成長",
          confidence: "高",
          signalBasis: "GPU 需求信號",
          sources: ["財報"]
        }
      ],
      risks: [
        { risk: "競爭加劇：AMD、Intel 推出競爭產品", severity: "中", source: "產業分析" }
      ],
      summary: "NVIDIA 作為 AI 晶片龍頭，Blackwell GPU 需求超預期。建議關注代工廠台積電、封裝廠日月光等上游供應商的投資機會。"
    }
  };

  // Return mock data based on company
  const companyKey = Object.keys(mockAnalysis).find(
    key => company.toLowerCase().includes(key.toLowerCase()) || 
            key.toLowerCase().includes(company.toLowerCase())
  );

  if (companyKey) {
    return res.status(200).json(mockAnalysis[companyKey]);
  }

  // Default response for unknown company
  return res.status(200).json({
    company: company,
    industry: "Technology",
    overallSentiment: "中性",
    sentimentScore: 0,
    dataSources: ["Mock Data"],
    keySignals: [
      {
        type: "guidance",
        title: "公司分析",
        description: `${company} 的詳細分析資料。此為示範資料。`,
        confidence: "中",
        impact: "中性"
      }
    ],
    namedPartners: [],
    beneficiaryStocks: [],
    risks: [],
    summary: `${company} 分析已完成。應用程式運作正常。`
  });
}
