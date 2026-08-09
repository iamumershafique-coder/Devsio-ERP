import React from 'react';
import { 
  Building2, 
  Wallet, 
  Landmark, 
  Search, 
  Plus, 
  RotateCcw, 
  DollarSign, 
  ShieldCheck, 
  TrendingUp,
  FileText
} from 'lucide-react';
import { formatPKR, ExecutiveKPIs } from '../utils/financialCalculations';

interface NavbarProps {
  kpis: ExecutiveKPIs;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenNewClientModal: () => void;
  onOpenLogPaymentModal: () => void;
  onOpenExpenseModal: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  kpis,
  searchQuery,
  setSearchQuery,
  onOpenNewClientModal,
  onOpenLogPaymentModal,
  onOpenExpenseModal,
  onResetData,
}) => {
  return (
    <header className="bg-[#0A192F] text-white sticky top-0 z-30 border-b border-[#1B365D] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Devsio Brand Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00D2FF] to-[#2563EB] flex items-center justify-center shadow-md shadow-[#00D2FF]/20 border border-[#00D2FF]/40">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-white font-sans">
                  DEVSIO <span className="text-[#00D2FF]">SERVICES</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#00D2FF]/20 text-[#00D2FF] border border-[#00D2FF]/30 rounded-full">
                  ERP v2.4
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Agency Financial & ERP Operations Control
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search clients, projects, team..."
                className="block w-full pl-9 pr-3 py-1.5 border border-slate-700 rounded-lg bg-[#112240] text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-[#00D2FF] focus:ring-1 focus:ring-[#00D2FF] transition"
              />
            </div>
          </div>

          {/* Quick Account Head Balance Widgets */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Devsio UBL Bank Balance */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#112240] border border-slate-700/80 rounded-lg">
              <Landmark className="w-4 h-4 text-[#00D2FF]" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Devsio (UBL Bank)</p>
                <p className="text-xs font-bold text-emerald-400">{formatPKR(kpis.ublBankBalance)}</p>
              </div>
            </div>

            {/* Umar Personal / Cash Balance */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#112240] border border-slate-700/80 rounded-lg">
              <Wallet className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Umar (Personal/Cash)</p>
                <p className="text-xs font-bold text-amber-300">{formatPKR(kpis.umarCashBalance)}</p>
              </div>
            </div>

            {/* Net Liquidity */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-[#2563EB]/30 to-[#00D2FF]/20 border border-[#2563EB]/50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-[#00D2FF]" />
              <div>
                <p className="text-[10px] text-blue-200 font-medium uppercase tracking-wider">Net Cash in Hand</p>
                <p className="text-xs font-extrabold text-white">{formatPKR(kpis.netAgencyLiquidity)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenNewClientModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-600 rounded-lg transition shadow-sm border border-blue-400/30"
              title="Add New Client & Project"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Client</span>
            </button>

            <button
              onClick={onOpenLogPaymentModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-[#00D2FF] hover:bg-cyan-300 rounded-lg transition shadow-sm border border-cyan-200"
              title="Record Milestone Payment"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Milestone</span>
            </button>

            <button
              onClick={onOpenExpenseModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#112240] hover:bg-slate-800 rounded-lg border border-slate-700 transition"
              title="Add Purchase / General Expense"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">+ Expense</span>
            </button>

            <button
              onClick={onResetData}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              title="Reset Sample Seed Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
