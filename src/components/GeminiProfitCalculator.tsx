import React, { useState } from 'react';
import { 
  Sparkles, 
  Calculator, 
  TrendingUp, 
  Building2, 
  Crown, 
  Rocket, 
  Users, 
  ArrowRight, 
  DollarSign, 
  ShieldCheck, 
  HelpCircle, 
  Award,
  BarChart3,
  CheckCircle2,
  PieChart,
  RefreshCw,
  Zap,
  Heart
} from 'lucide-react';
import { formatPKR } from '../utils/financialCalculations';
import { Client, GeneralExpense, TeamMember } from '../types';

interface GeminiProfitCalculatorProps {
  clients: Client[];
  expenses: GeneralExpense[];
  teamMembers: TeamMember[];
}

export const GeminiProfitCalculator: React.FC<GeminiProfitCalculatorProps> = ({
  clients,
  expenses,
  teamMembers,
}) => {
  // Input simulator payment amount (default 50,000 PKR as requested in example)
  const [customPayment, setCustomPayment] = useState<number>(50000);
  const [selectedClient, setSelectedClient] = useState<string>('');

  // AI Loading & Result state
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Overall Financial Calculations
  const totalSalesPKR = clients.reduce((acc, c) => {
    const paidInMilestones = c.milestones
      .filter((m) => m.status === 'Paid')
      .reduce((sum, m) => sum + m.amountPKR, 0);
    return acc + paidInMilestones;
  }, 0);

  const totalPurchasesPKR = expenses.reduce((acc, e) => acc + e.amountPKR, 0);

  const totalTeamPayoutsPKR = teamMembers.reduce((acc, tm) => acc + (tm.totalPaidOutPKR || 0), 0);

  const overallNetAgencyProfit = totalSalesPKR - totalPurchasesPKR - totalTeamPayoutsPKR;

  // Formula Breakdown for Custom Payment (or 50,000 PKR example)
  const companyReservePKR = customPayment * 0.20;
  const founderSharePKR = customPayment * 0.20;
  const cofounderSharePKR = customPayment * 0.20;
  const teamPoolPKR = customPayment * 0.40;

  // Individual Team Member Share calculation
  const activeTeamCount = teamMembers.length || 1;
  const sharePerTeamMember = teamPoolPKR / activeTeamCount;

  // Handle Gemini AI Profit Call
  const handleAnalyzeWithGemini = async () => {
    setIsLoadingAI(true);
    setAiError(null);
    setAiAnalysis(null);

    try {
      const res = await fetch('/api/gemini/calculate-profits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentAmount: customPayment,
          totalSales: totalSalesPKR,
          totalPurchases: totalPurchasesPKR,
          teamPayouts: totalTeamPayoutsPKR,
          clientName: selectedClient || 'Devsio Client',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.aiExplanation);
      } else {
        setAiError(data.error || 'Failed to analyze with Gemini.');
      }
    } catch (err: any) {
      setAiError(err.message || 'Error connecting to Gemini backend.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <div className="space-[#F8FAFC] space-y-8 font-sans">
      
      {/* HEADER: Gemini 3 Intelligence Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-blue-500/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-gradient-to-bl from-cyan-500/20 via-blue-600/10 to-transparent blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-3 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-full flex items-center space-x-1 shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                <span>GEMINI 3 AI PROFIT ENGINE</span>
              </span>
              <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold rounded-full">
                20/20/20/40 Split Rule
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Child-Friendly Profit & Distribution Intelligence
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Calculates net agency profits based on sales, purchases, and payouts. Automatically splits every incoming payment into <strong className="text-cyan-300">20% Company Reserve</strong>, <strong className="text-purple-300">20% Founder</strong>, <strong className="text-indigo-300">20% Co-Founder</strong>, and <strong className="text-emerald-300">40% Team Pool</strong>.
            </p>
          </div>

          <button
            onClick={handleAnalyzeWithGemini}
            disabled={isLoadingAI}
            className="shrink-0 px-6 py-4 bg-gradient-to-r from-[#00D2FF] via-blue-500 to-[#2563EB] hover:from-cyan-300 hover:to-blue-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-cyan-500/20 transition transform active:scale-95 flex items-center justify-center space-x-2 border border-cyan-300"
          >
            {isLoadingAI ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>Gemini 3 Thinking...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-slate-950" />
                <span>Ask Gemini 3 to Explain</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE PAYMENT SPLIT CALCULATOR */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-[#2563EB]" />
              <span>Interactive Client Payment Profit Splitter</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter any received amount or test the 50,000 PKR example to see exact 20/20/20/40 distribution.
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[50000, 100000, 250000, 500000].map((amt) => (
              <button
                key={amt}
                onClick={() => setCustomPayment(amt)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition ${
                  customPayment === amt
                    ? 'bg-[#2563EB] text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                }`}
              >
                {amt.toLocaleString()} PKR
              </button>
            ))}
          </div>
        </div>

        {/* Input & Live Visual Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col justify-between">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Incoming Client Payment (PKR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">PKR</span>
                <input
                  type="number"
                  value={customPayment}
                  onChange={(e) => setCustomPayment(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-14 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-lg font-black text-slate-900 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <label className="block text-xs font-extrabold text-slate-600 mb-1">Select Client (Optional)</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none"
              >
                <option value="">-- General Agency Payment --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.company}>
                    {c.company} ({c.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Graphical Visual Distribution Bar */}
          <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Visual Distribution Ratio (100%)
                </span>
                <span className="text-xs font-mono font-black text-cyan-400">
                  Total = {formatPKR(customPayment)}
                </span>
              </div>

              {/* Stacked Progress Bar */}
              <div className="h-6 w-full bg-slate-800 rounded-xl overflow-hidden flex shadow-inner">
                <div style={{ width: '20%' }} className="bg-[#00D2FF] h-full transition-all flex items-center justify-center text-[10px] font-black text-slate-950" title="Company Reserve 20%">
                  20%
                </div>
                <div style={{ width: '20%' }} className="bg-purple-500 h-full transition-all flex items-center justify-center text-[10px] font-black text-white" title="Founder 20%">
                  20%
                </div>
                <div style={{ width: '20%' }} className="bg-indigo-500 h-full transition-all flex items-center justify-center text-[10px] font-black text-white" title="Co-Founder 20%">
                  20%
                </div>
                <div style={{ width: '40%' }} className="bg-emerald-500 h-full transition-all flex items-center justify-center text-[10px] font-black text-slate-950" title="Team Pool 40%">
                  40% Team Pool
                </div>
              </div>
            </div>

            {/* Quick Legend Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 text-[11px] font-bold">
              <div className="flex items-center space-x-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00D2FF]"></span>
                <span>Company: 20%</span>
              </div>
              <div className="flex items-center space-x-1.5 text-purple-400">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span>Founder: 20%</span>
              </div>
              <div className="flex items-center space-x-1.5 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span>Co-Founder: 20%</span>
              </div>
              <div className="flex items-center space-x-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Team: 40%</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: CHILD-FRIENDLY CARDS FOR THE 4 BENEFICIARIES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* CARD 1: COMPANY RESERVE (20%) */}
          <div className="bg-gradient-to-b from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-black bg-blue-600 text-white rounded-full uppercase">
                20% Cut
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">🏢 Company Reserve</p>
            <p className="text-xl font-black text-slate-900 mt-1 font-mono">{formatPKR(companyReservePKR)}</p>
            
            <div className="mt-3 pt-3 border-t border-blue-200/60 text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-blue-900">Child-Friendly Explanation:</p>
              <p className="text-slate-600 text-[11px] leading-snug">
                Put into the Devsio Agency Piggy Bank to buy future computers, pay office rent, and save for rainy days!
              </p>
            </div>
          </div>

          {/* CARD 2: FOUNDER (20%) */}
          <div className="bg-gradient-to-b from-purple-50 to-indigo-50 rounded-2xl p-5 border border-purple-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                <Crown className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-black bg-purple-600 text-white rounded-full uppercase">
                20% Share
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">👑 Founder Share</p>
            <p className="text-xl font-black text-slate-900 mt-1 font-mono">{formatPKR(founderSharePKR)}</p>
            
            <div className="mt-3 pt-3 border-t border-purple-200/60 text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-purple-900">Child-Friendly Explanation:</p>
              <p className="text-slate-600 text-[11px] leading-snug">
                Earned by the Agency Founder for building the agency vision, getting clients, and leading operations.
              </p>
            </div>
          </div>

          {/* CARD 3: CO-FOUNDER (20%) */}
          <div className="bg-gradient-to-b from-indigo-50 to-slate-50 rounded-2xl p-5 border border-indigo-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
                <Rocket className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-black bg-indigo-600 text-white rounded-full uppercase">
                20% Share
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">🚀 Co-Founder Share</p>
            <p className="text-xl font-black text-slate-900 mt-1 font-mono">{formatPKR(cofounderSharePKR)}</p>
            
            <div className="mt-3 pt-3 border-t border-indigo-200/60 text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-indigo-900">Child-Friendly Explanation:</p>
              <p className="text-slate-600 text-[11px] leading-snug">
                Earned by the Co-Founder for managing daily technical execution, systems, and product quality.
              </p>
            </div>
          </div>

          {/* CARD 4: TEAM MEMBERS POOL (40%) */}
          <div className="bg-gradient-to-b from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-200/80 shadow-sm relative overflow-hidden group hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Users className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-black bg-emerald-600 text-white rounded-full uppercase">
                40% Pool
              </span>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">👥 Team Superheroes</p>
            <p className="text-xl font-black text-slate-900 mt-1 font-mono">{formatPKR(teamPoolPKR)}</p>
            
            <div className="mt-3 pt-3 border-t border-emerald-200/60 text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-emerald-900">
                Split among {activeTeamCount} Members (~{formatPKR(sharePerTeamMember)} each):
              </p>
              <p className="text-slate-600 text-[11px] leading-snug">
                Given to developers and designers for writing code, fixing bugs, and delivering work on time!
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3: GEMINI AI REAL-TIME AUDIT RESPONSE CARD */}
      {(aiAnalysis || aiError || isLoadingAI) && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-slate-100 rounded-3xl p-6 sm:p-8 shadow-2xl border border-cyan-500/30 relative">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-800 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h4 className="text-base font-black text-white flex items-center space-x-2">
                <span>Gemini 3 Financial Intelligence Audit</span>
                <span className="px-2 py-0.5 text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  AI Realtime Output
                </span>
              </h4>
              <p className="text-xs text-slate-400">Smart analysis generated using Gemini 3.6 Flash</p>
            </div>
          </div>

          {isLoadingAI && (
            <div className="py-8 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-sm font-bold text-cyan-300">Gemini 3 AI is crunching the financial numbers...</p>
              <p className="text-xs text-slate-400">Calculating profit margins, purchases, and child-friendly story breakdown.</p>
            </div>
          )}

          {aiError && (
            <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-300 text-xs">
              <p className="font-bold">Gemini API Notice:</p>
              <p className="mt-1">{aiError}</p>
            </div>
          )}

          {aiAnalysis && (
            <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 leading-relaxed space-y-3 whitespace-pre-line">
              {aiAnalysis}
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: OVERALL AGENCY PROFIT & LOSS AUDIT TABLE */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80">
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>Agency Cumulative Net Profit Calculator</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live profit tally: Sales (Client Payments) - Purchases (Expenses) - Team Member Payments.
            </p>
          </div>

          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-full border border-emerald-200">
            Realtime Audit
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Sales (Collected)</p>
            <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">{formatPKR(totalSalesPKR)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Sum of all paid client milestones</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Purchases & Tools</p>
            <p className="text-2xl font-black text-rose-600 mt-1 font-mono">- {formatPKR(totalPurchasesPKR)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Software, hosting, hardware bills</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Team Member Payouts</p>
            <p className="text-2xl font-black text-amber-600 mt-1 font-mono">- {formatPKR(totalTeamPayoutsPKR)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Total salaries disbursed to team</p>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 text-white border border-blue-800 shadow-md">
            <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">Net Agency Reserve</p>
            <p className="text-2xl font-black text-white mt-1 font-mono">{formatPKR(overallNetAgencyProfit)}</p>
            <p className="text-[10px] text-slate-300 mt-1">Available in company treasury</p>
          </div>

        </div>
      </div>

    </div>
  );
};
