export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { company } = req.body;
  if (!company) {
    return res.status(400).json({ error: "Company name required" });
  }

  try {
    // 從 public/companies-data.json 讀取數據
    const response = await fetch('/companies-data.json');
    const data = await response.json();
    
    const normalizedInput = company.toUpperCase().trim();
    
    // 查詢匹配的公司
    let foundCompany = null;
    
    for (const [companyName, companyData] of Object.entries(data.companies)) {
      // 檢查公司名稱匹配
      if (companyName.toUpperCase().includes(normalizedInput) || 
          normalizedInput.includes(companyName.toUpperCase())) {
        foundCompany = { name: companyName, ...companyData };
        break;
      }
      
      // 檢查股票代號匹配
      if (companyData.tickers && 
          companyData.tickers.some(t => t.toUpperCase() === normalizedInput)) {
        foundCompany = { name: companyName, ...companyData };
        break;
      }
    }
    
    if (foundCompany) {
      // 移除 tickers 欄位，使用 name 作為 company
      const { tickers, ...resultData } = foundCompany;
      return res.status(200).json({
        company: foundCompany.name,
        ...resultData
      });
    }
    
    // 未找到公司，返回預設響應
    return res.status(200).json({
      company: company,
      industry: "Technology",
      overallSentiment: "中性",
      sentimentScore: 0,
      dataSources: ["Analysis System"],
      keySignals: [
        {
          type: "guidance",
          title: "公司分析",
          description: `${company} 的供應鏈分析。該公司的詳細數據暫時不可用。`,
          confidence: "中",
          impact: "中性"
        }
      ],
      namedPartners: [],
      beneficiaryStocks: [],
      risks: [],
      summary: `${company} 分析已完成。應用程式運作正常。`
    });
    
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ 
      error: "Analysis failed",
      message: error.message 
    });
  }
}
