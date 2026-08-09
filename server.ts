import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini Client
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment");
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  };

  // API 1: Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API 2: Gemini Profit & Financial Distribution Intelligence
  app.post("/api/gemini/calculate-profits", async (req, res) => {
    try {
      const { paymentAmount, totalSales, totalPurchases, teamPayouts, clientName } = req.body;

      const amount = Number(paymentAmount) || 50000;
      const sales = Number(totalSales) || 450000;
      const purchases = Number(totalPurchases) || 85000;
      const payouts = Number(teamPayouts) || 120000;

      // Exact mathematical formula:
      // Company Reserve: 20%
      // Founder: 20%
      // Co-founder: 20%
      // Team Members: 40%
      const companyReserve = amount * 0.20;
      const founderShare = amount * 0.20;
      const cofounderShare = amount * 0.20;
      const teamPool = amount * 0.40;

      const netAgencyProfit = sales - purchases - payouts;

      const prompt = `
You are Gemini 3 AI Financial Intelligence & Profit Advisor for Devsio Services Agency.
Explain the profit breakdown for a client payment of PKR ${amount.toLocaleString()} in simple, crystal-clear language that even a child or non-accountant can easily understand.

Context Data:
- Client Payment Received: PKR ${amount.toLocaleString()} ${clientName ? `from ${clientName}` : ''}
- Company Reserve (20%): PKR ${companyReserve.toLocaleString()} (Saved in Devsio Company Piggy Bank for growth & rainy days)
- Founder Share (20%): PKR ${founderShare.toLocaleString()}
- Co-founder Share (20%): PKR ${cofounderShare.toLocaleString()}
- Team Members Pool (40%): PKR ${teamPool.toLocaleString()}
- Total Agency Cumulative Sales: PKR ${sales.toLocaleString()}
- Total Agency Hardware/Software Purchases: PKR ${purchases.toLocaleString()}
- Total Salary/Payouts to Team: PKR ${payouts.toLocaleString()}
- Net Agency Net Reserve: PKR ${netAgencyProfit.toLocaleString()}

Instructions:
1. Provide a fun, child-friendly analogy (e.g. sharing a 10-piece pizza or toy budget) explaining why 20% goes to the company, 20% to founder, 20% to co-founder, and 40% to team members.
2. Provide 3 simple key bullet points on agency financial health and whether profit margins are healthy.
3. Keep the tone encouraging, super clear, and structured with clean markdown headers.
`;

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      res.json({
        success: true,
        breakdown: {
          paymentAmount: amount,
          companyReserve,
          founderShare,
          cofounderShare,
          teamPool,
          percentages: {
            companyReserve: "20%",
            founderShare: "20%",
            cofounderShare: "20%",
            teamPool: "40%",
          },
        },
        aiExplanation: response.text || "Calculation complete.",
      });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to process profit intelligence call.",
      });
    }
  });

  // API 3: Gemini 3 AI Financial Forecasting & Cash Flow Risk Advisor
  app.post("/api/gemini/financial-forecast", async (req, res) => {
    try {
      const { bankBalance, pendingReceivables, upcomingMilestones, historicalAvgDaysToPay, monthlyExpenses, forecastHorizonDays } = req.body;

      const currentBalance = Number(bankBalance) || 0;
      const receivables = Number(pendingReceivables) || 0;
      const expenses = Number(monthlyExpenses) || 0;
      const horizon = Number(forecastHorizonDays) || 30;

      const prompt = `
You are Gemini 3 Strategic Financial Forecaster & Chief Risk Officer for Devsio Services Agency.
Provide a high-accuracy, strategic cash flow projection and risk analysis for the next ${horizon} days.

Current Agency Financial Position:
- Current Bank & Cash Treasury: PKR ${currentBalance.toLocaleString()}
- Total Pending Receivables: PKR ${receivables.toLocaleString()}
- Monthly Operating & Team Expenses: PKR ${expenses.toLocaleString()}
- Historical Avg Client Payment Delay: ${historicalAvgDaysToPay || 5} days after milestone completion
- Upcoming Milestones Context: ${JSON.stringify(upcomingMilestones || []).slice(0, 1000)}

Please structure your response with:
1. **Forecasted End-of-Period Cash Balance**: An estimated range for the next ${horizon} days.
2. **Cash Runway & Deficit Risk**: How many days/months of operational runway the agency currently holds.
3. **3 Strategic Action Items**: Specific recommendations to accelerate collections, reduce cash drag, or buffer reserves.
4. **Optimistic vs Conservative Scenario**: Brief contrast between timely client payments vs 15-day delayed collections.

Keep the language executive, actionable, crisp, and formatted with clean markdown headings and bullet points.
`;

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      res.json({
        success: true,
        forecastReport: response.text || "Financial forecast complete.",
      });
    } catch (error: any) {
      console.error("Gemini Forecast API Error:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate financial forecast.",
      });
    }
  });

  // Vite Middleware for Dev Mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
