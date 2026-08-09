import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Wallet, 
  Landmark, 
  TrendingUp, 
  PiggyBank, 
  Users, 
  Receipt, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Bell,
  Calendar as CalendarIcon,
  ArrowRight,
  AlertCircle,
  SlidersHorizontal,
  Eye,
  EyeOff,
  RotateCcw,
  X,
  Check,
  LayoutGrid,
  Settings
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { Client, Project, LedgerTransaction, GeneralExpense, TeamMember } from '../types';
import { ExecutiveKPIs, formatPKR, generateFinancialPDFReport } from '../utils/financialCalculations';
import { FinancialForecasting } from './FinancialForecasting';

interface ExecutiveDashboardProps {
  kpis: ExecutiveKPIs;
  clients: Client[];
  projects: Project[];
  ledger: LedgerTransaction[];
  expenses?: GeneralExpense[];
  teamMembers?: TeamMember[];
  onNavigateToTab: (tab: any) => void;
  onOpenLogPaymentModal: (clientId?: string, milestoneId?: string) => void;
}

export interface WidgetVisibilityConfig {
  kpiGrossSales: boolean;
  kpiCashCollected: boolean;
  kpiReceivables: boolean;
  kpiCompanyReserve: boolean;
  kpiTeamPayables: boolean;
  kpiOperatingExpenses: boolean;
  accountBalances: boolean;
  pendingMilestones: boolean;
  financialCharts: boolean;
  financialForecasting: boolean;
  recentTransactions: boolean;
}

const DEFAULT_WIDGET_CONFIG: WidgetVisibilityConfig = {
  kpiGrossSales: true,
  kpiCashCollected: true,
  kpiReceivables: true,
  kpiCompanyReserve: true,
  kpiTeamPayables: true,
  kpiOperatingExpenses: true,
  accountBalances: true,
  pendingMilestones: true,
  financialCharts: true,
  financialForecasting: true,
  recentTransactions: true,
};

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  kpis,
  clients,
  projects,
  ledger,
  expenses = [],
  teamMembers = [],
  onNavigateToTab,
  onOpenLogPaymentModal,
}) => {
  const [filterScope, setFilterScope] = useState<'7_DAYS' | 'OVERDUE' | 'ALL_PENDING'>('7_DAYS');
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState<boolean>(false);

  // Load widget visibility from localStorage or use defaults
  const [widgetConfig, setWidgetConfig] = useState<WidgetVisibilityConfig>(() => {
    try {
      const saved = localStorage.getItem('devsio_dashboard_widgets_v1');
      return saved ? JSON.parse(saved) : DEFAULT_WIDGET_CONFIG;
    } catch (e) {
      return DEFAULT_WIDGET_CONFIG;
    }
  });

  // Save to localStorage when widgetConfig changes
  useEffect(() => {
    try {
      localStorage.setItem('devsio_dashboard_widgets_v1', JSON.stringify(widgetConfig));
    } catch (e) {
      console.error('Failed to save dashboard widget settings', e);
    }
  }, [widgetConfig]);

  const toggleWidget = (key: keyof WidgetVisibilityConfig) => {
    setWidgetConfig((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetWidgets = () => {
    setWidgetConfig(DEFAULT_WIDGET_CONFIG);
  };

  const selectAllWidgets = () => {
    setWidgetConfig({
      kpiGrossSales: true,
      kpiCashCollected: true,
      kpiReceivables: true,
      kpiCompanyReserve: true,
      kpiTeamPayables: true,
      kpiOperatingExpenses: true,
      accountBalances: true,
      pendingMilestones: true,
      financialCharts: true,
      financialForecasting: true,
      recentTransactions: true,
    });
  };

  // Check if at least 1 top KPI card is visible
  const hasVisibleKpis =
    widgetConfig.kpiGrossSales ||
    widgetConfig.kpiCashCollected ||
    widgetConfig.kpiReceivables ||
    widgetConfig.kpiCompanyReserve ||
    widgetConfig.kpiTeamPayables ||
    widgetConfig.kpiOperatingExpenses;

  // Baseline today date: August 9, 2026
  const TODAY_STR = '2026-08-09';
  const todayDateObj = new Date(TODAY_STR);

  // Helper to parse date string YYYY-MM-DD
  const getDaysDifference = (dueDateStr?: string) => {
    if (!dueDateStr) return 999;
    const due = new Date(dueDateStr);
    const diffMs = due.getTime() - todayDateObj.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  interface PendingMilestoneItem {
    id: string;
    clientId?: string;
    milestoneId?: string;
    projectId?: string;
    title: string;
    companyName: string;
    projectTitle: string;
    amountPKR: number;
    dueDate: string;
    diffDays: number;
    type: 'RECEIVABLE' | 'DELIVERABLE';
    status: string;
  }

  const allPendingMilestoneItems: PendingMilestoneItem[] = [];

  // 1. Client Financial Milestone Receivables
  clients.forEach((client) => {
    client.milestones.forEach((m) => {
      if (m.status !== 'Paid') {
        const diffDays = getDaysDifference(m.dueDate);
        allPendingMilestoneItems.push({
          id: `CLM-${m.id}`,
          clientId: client.id,
          milestoneId: m.id,
          title: m.title,
          companyName: client.company,
          projectTitle: client.projectTitle,
          amountPKR: m.amountPKR,
          dueDate: m.dueDate || 'No Due Date',
          diffDays,
          type: 'RECEIVABLE',
          status: m.status,
        });
      }
    });
  });

  // 2. Project Milestone Deadlines (Deliverables)
  projects.forEach((proj) => {
    proj.milestoneDeadlines?.forEach((m) => {
      if (m.status !== 'Completed') {
        const diffDays = getDaysDifference(m.dueDate);
        allPendingMilestoneItems.push({
          id: `PRJM-${m.id}`,
          projectId: proj.id,
          title: m.title,
          companyName: proj.companyName,
          projectTitle: proj.projectTitle,
          amountPKR: m.amountPKR || 0,
          dueDate: m.dueDate,
          diffDays,
          type: 'DELIVERABLE',
          status: m.status,
        });
      }
    });
  });

  // Sort by due date (soonest first)
  allPendingMilestoneItems.sort((a, b) => a.diffDays - b.diffDays);

  // Filtered lists
  const next7DaysItems = allPendingMilestoneItems.filter((i) => i.diffDays >= 0 && i.diffDays <= 7);
  const overdueItems = allPendingMilestoneItems.filter((i) => i.diffDays < 0);
  const next7DaysAmount = next7DaysItems.reduce((acc, i) => acc + i.amountPKR, 0);

  let displayMilestones = allPendingMilestoneItems;
  if (filterScope === '7_DAYS') {
    displayMilestones = next7DaysItems;
  } else if (filterScope === 'OVERDUE') {
    displayMilestones = overdueItems;
  }
  // Chart Data Preparation
  const accountHeadData = [
    { name: 'Devsio UBL Bank', balance: kpis.ublBankBalance, fill: '#00D2FF' },
    { name: 'Umar Cash Head', balance: kpis.umarCashBalance, fill: '#F59E0B' },
  ];

  const projectStatusCounts = [
    { name: 'In Progress', value: projects.filter((p) => p.status === 'In Progress').length, color: '#2563EB' },
    { name: 'Completed', value: projects.filter((p) => p.status === 'Completed').length, color: '#10B981' },
    { name: 'On Hold', value: projects.filter((p) => p.status === 'On Hold').length, color: '#F59E0B' },
  ];

  const financialBreakdownData = [
    { category: 'Gross Sales', amount: kpis.totalGrossSales },
    { category: 'Collected', amount: kpis.totalCashCollected },
    { category: '20% Reserve', amount: kpis.totalCompanyReserve },
    { category: 'Team Paid', amount: kpis.totalTeamPaid },
    { category: 'Op Expenses', amount: kpis.totalOperatingExpenses },
  ];

  // Recent 5 Ledger Transactions
  const recentTransactions = [...ledger].reverse().slice(0, 5);

  // PDF Export
  const handleExportPDF = () => {
    const headers = ['Date', 'Account Head', 'Type', 'Description', 'Amount (PKR)', 'Flow'];
    const rows = ledger.map((t) => [
      t.date,
      t.accountHead === 'UBL' ? 'Devsio (UBL)' : 'Umar (Cash)',
      t.type,
      t.description,
      t.amountPKR.toLocaleString('en-PK'),
      t.flow,
    ]);

    const summaryInfo = [
      { label: 'Gross Sales', value: formatPKR(kpis.totalGrossSales) },
      { label: 'Collected Cash', value: formatPKR(kpis.totalCashCollected) },
      { label: 'Net Cash in Hand', value: formatPKR(kpis.netAgencyLiquidity) },
    ];

    generateFinancialPDFReport(
      'Executive Financial Overview Statement',
      'Comprehensive Agency Accounting & Liquidity Audit',
      headers,
      rows,
      summaryInfo
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#0A192F] via-[#112240] to-[#1B365D] rounded-2xl p-6 text-white border border-[#1B365D] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black tracking-tight font-sans">
              Executive Financial Command Center
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#00D2FF]/20 text-[#00D2FF] border border-[#00D2FF]/40 rounded-full">
              Devsio Control
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time financial status, 20% company reserve tracking, client milestone receivables, and multi-account cash flow monitoring.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0 flex-wrap gap-y-2">
          <button
            onClick={() => setIsCustomizeModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl transition shadow-md border border-cyan-500/30"
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Customize Dashboard</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition shadow-md border border-blue-400/30"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Executive PDF</span>
          </button>
        </div>
      </div>

      {/* High Density Executive KPI Cards */}
      {hasVisibleKpis && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* KPI 1: Gross Sales */}
          {widgetConfig.kpiGrossSales && (
            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Sales</p>
              <p className="text-base font-mono font-bold text-slate-900 mt-1">{formatPKR(kpis.totalGrossSales)}</p>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                <span className="text-emerald-500 font-bold">100%</span>
                <span>booked</span>
              </div>
            </div>
          )}

          {/* KPI 2: Cash Collected */}
          {widgetConfig.kpiCashCollected && (
            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cash Collected</p>
              <p className="text-base font-mono font-bold text-emerald-600 mt-1">{formatPKR(kpis.totalCashCollected)}</p>
              <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1 rounded-full"
                  style={{
                    width: `${kpis.totalGrossSales > 0 ? Math.min(100, Math.round((kpis.totalCashCollected / kpis.totalGrossSales) * 100)) : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* KPI 3: Client Receivables */}
          {widgetConfig.kpiReceivables && (
            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-amber-400 flex flex-col justify-between">
              <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Receivables</p>
              <p className="text-base font-mono font-bold text-amber-600 mt-1">{formatPKR(kpis.totalPendingReceivables)}</p>
              <span className="text-[10px] text-amber-700 font-medium">Milestones pending</span>
            </div>
          )}

          {/* KPI 4: 20% Company Reserve */}
          {widgetConfig.kpiCompanyReserve && (
            <div className="bg-[#0A192F] p-3.5 rounded-xl shadow-sm border border-slate-800 text-white flex flex-col justify-between">
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">20% Company Cut</p>
              <p className="text-base font-mono font-bold text-[#00D2FF] mt-1">{formatPKR(kpis.totalCompanyReserve)}</p>
              <span className="text-[10px] text-[#00D2FF]/80 font-medium">Rule A: Reserved</span>
            </div>
          )}

          {/* KPI 5: Team Pending Payables */}
          {widgetConfig.kpiTeamPayables && (
            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-rose-400 flex flex-col justify-between">
              <p className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Team Payables</p>
              <p className="text-base font-mono font-bold text-rose-600 mt-1">{formatPKR(kpis.totalTeamPendingPayables)}</p>
              <span className="text-[10px] text-slate-500 font-medium">Promised to team</span>
            </div>
          )}

          {/* KPI 6: Operating Expenses */}
          {widgetConfig.kpiOperatingExpenses && (
            <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Operating Expenses</p>
              <p className="text-base font-mono font-bold text-slate-900 mt-1">{formatPKR(kpis.totalOperatingExpenses)}</p>
              <span className="text-[10px] text-slate-500 font-medium">Direct + SaaS + Bills</span>
            </div>
          )}
        </div>
      )}

      {/* Account Balance Head Cards Widget */}
      {widgetConfig.accountBalances && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Devsio UBL Bank Head */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Devsio (UBL Bank Account)</h3>
                  <p className="text-xs text-slate-500">Official Company Bank Head</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-extrabold rounded-full">
                Primary Account
              </span>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-semibold uppercase">Current Bank Balance</p>
                <p className="text-2xl font-extrabold text-blue-900">{formatPKR(kpis.ublBankBalance)}</p>
              </div>
              <button
                onClick={() => onNavigateToTab('ledgers')}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition"
              >
                View Statement
              </button>
            </div>
          </div>

          {/* Umar Personal / Cash Head */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Umar (Personal / Cash Account)</h3>
                  <p className="text-xs text-slate-500">Owner Cash & Personal Head</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-extrabold rounded-full">
                Cash Head
              </span>
            </div>

            <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 font-semibold uppercase">Current Cash Balance</p>
                <p className="text-2xl font-extrabold text-amber-900">{formatPKR(kpis.umarCashBalance)}</p>
              </div>
              <button
                onClick={() => onNavigateToTab('ledgers')}
                className="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 text-xs font-bold rounded-lg transition"
              >
                View Statement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Milestones & Deadlines Alert Widget */}
      {widgetConfig.pendingMilestones && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900">Pending Milestones & Receivables Alert</h3>
                  <span className="px-2.5 py-0.5 text-xs font-extrabold bg-amber-100 text-amber-800 rounded-full border border-amber-200">
                    {next7DaysItems.length} Due in Next 7 Days
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Financial receivables & deliverable deadlines scheduled within the next 7 days (Aug 9 – Aug 16)
                </p>
              </div>
            </div>

            {/* Scope Filters & Total Receivable */}
            <div className="flex items-center gap-2 self-start md:self-auto">
              <div className="hidden lg:flex flex-col text-right mr-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">7-Day Value</span>
                <span className="text-sm font-mono font-extrabold text-amber-700">{formatPKR(next7DaysAmount)}</span>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterScope('7_DAYS')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterScope === '7_DAYS'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Next 7 Days ({next7DaysItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterScope('OVERDUE')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterScope === 'OVERDUE'
                      ? 'bg-white text-rose-700 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Overdue ({overdueItems.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterScope('ALL_PENDING')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    filterScope === 'ALL_PENDING'
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Pending ({allPendingMilestoneItems.length})
                </button>
              </div>
            </div>
          </div>

          {/* List of Milestones */}
          {displayMilestones.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No Pending Milestones in this View</p>
              <p className="text-[11px] text-slate-400 mt-1">
                All client milestone receivables and deliverable deadlines for this scope are clear.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {displayMilestones.map((item) => {
                const isDueToday = item.diffDays === 0;
                const isOverdue = item.diffDays < 0;

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition flex flex-col justify-between space-y-2.5 ${
                      isOverdue
                        ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300'
                        : isDueToday
                        ? 'bg-amber-50/50 border-amber-300 hover:border-amber-400'
                        : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center space-x-1.5 mb-1 flex-wrap gap-y-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              item.type === 'RECEIVABLE'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-purple-100 text-purple-800 border border-purple-200'
                            }`}
                          >
                            {item.type === 'RECEIVABLE' ? 'Client Receivable' : 'Deliverable Milestone'}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : isDueToday
                                ? 'bg-amber-200 text-amber-900 border border-amber-300 animate-pulse'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {isOverdue
                              ? `Overdue by ${Math.abs(item.diffDays)} day${Math.abs(item.diffDays) > 1 ? 's' : ''}`
                              : isDueToday
                              ? 'Due Today!'
                              : item.dueDate !== 'No Due Date'
                              ? `Due in ${item.diffDays} day${item.diffDays > 1 ? 's' : ''} (${item.dueDate})`
                              : 'Pending'}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                        <p className="text-[11px] text-blue-700 font-semibold mt-0.5">{item.companyName}</p>
                        <p className="text-[10px] text-slate-400">{item.projectTitle}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Amount</span>
                        <span className="text-sm font-mono font-bold text-slate-900">
                          {item.amountPKR > 0 ? formatPKR(item.amountPKR) : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-500 font-medium">
                        Status: <strong className="text-slate-700">{item.status}</strong>
                      </span>

                      {item.type === 'RECEIVABLE' ? (
                        <button
                          type="button"
                          onClick={() => onOpenLogPaymentModal(item.clientId, item.milestoneId)}
                          className="px-2.5 py-1 bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-[11px] rounded-lg shadow-2xs transition flex items-center space-x-1"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Log Payment</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onNavigateToTab('calendar')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded-lg shadow-2xs transition flex items-center space-x-1"
                        >
                          <CalendarIcon className="w-3 h-3" />
                          <span>View Calendar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Financial Allocation & Project Distribution Charts */}
      {widgetConfig.financialCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Financial Allocation Breakdown */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-1">Financial Allocation & Flow Overview</h3>
            <p className="text-xs text-slate-500 mb-4">
              Comparison of Gross Sales, Cash Collections, Reserves, Team Payouts & Expenses
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialBreakdownData}>
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: any) => formatPKR(Number(value))} />
                  <Bar dataKey="amount" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Projects Status Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">Project Status Distribution</h3>
              <p className="text-xs text-slate-500 mb-2">Active agency projects</p>
              <div className="h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectStatusCounts}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {projectStatusCounts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <span>Total Active Projects: {projects.length}</span>
              <button
                onClick={() => onNavigateToTab('costing')}
                className="text-[#2563EB] font-bold hover:underline"
              >
                Open Costing Panel →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Financial Forecasting Tool Widget */}
      {widgetConfig.financialForecasting && (
        <FinancialForecasting
          kpis={kpis}
          clients={clients}
          expenses={expenses}
          teamMembers={teamMembers}
        />
      )}

      {/* Recent Activity Ledger Log */}
      {widgetConfig.recentTransactions && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Financial Transactions</h3>
              <p className="text-xs text-slate-500">Live multi-account audit stream</p>
            </div>
            <button
              onClick={() => onNavigateToTab('ledgers')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              View Full Ledger Statements →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Account Head</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{txn.date}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {txn.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {txn.accountHead === 'UBL' ? (
                        <span className="inline-flex items-center space-x-1 text-blue-700 font-bold">
                          <Landmark className="w-3 h-3 text-blue-600" />
                          <span>Devsio (UBL)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-amber-700 font-bold">
                          <Wallet className="w-3 h-3 text-amber-600" />
                          <span>Umar (Cash)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-800">{txn.description}</td>
                    <td
                      className={`py-3 px-4 text-right font-bold ${
                        txn.flow === 'INFLOW' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {txn.flow === 'INFLOW' ? '+' : '-'}{formatPKR(txn.amountPKR)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CUSTOMIZE DASHBOARD MODAL */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-150">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <SlidersHorizontal className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">Customize Executive Dashboard</h3>
                  <p className="text-xs text-slate-400">Toggle KPI cards & widget panels on your command center</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomizeModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content - Scrollable Toggles */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-800">
              
              {/* SECTION 1: Top KPI Summary Cards */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                    <LayoutGrid className="w-3.5 h-3.5 text-blue-600" />
                    <span>Top Summary KPI Cards</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500">6 Indicators</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { key: 'kpiGrossSales', label: 'Gross Sales', sub: formatPKR(kpis.totalGrossSales) },
                    { key: 'kpiCashCollected', label: 'Cash Collected', sub: formatPKR(kpis.totalCashCollected) },
                    { key: 'kpiReceivables', label: 'Client Receivables', sub: formatPKR(kpis.totalPendingReceivables) },
                    { key: 'kpiCompanyReserve', label: '20% Company Reserve', sub: formatPKR(kpis.totalCompanyReserve) },
                    { key: 'kpiTeamPayables', label: 'Team Payouts / Payables', sub: formatPKR(kpis.totalTeamPendingPayables) },
                    { key: 'kpiOperatingExpenses', label: 'Operating Expenses', sub: formatPKR(kpis.totalOperatingExpenses) },
                  ].map((item) => {
                    const isChecked = widgetConfig[item.key as keyof WidgetVisibilityConfig];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleWidget(item.key as keyof WidgetVisibilityConfig)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                          isChecked
                            ? 'bg-blue-50/60 border-blue-300 text-slate-900 shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <div>
                          <p className={`text-xs font-bold ${isChecked ? 'text-slate-900' : 'text-slate-500'}`}>
                            {item.label}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">{item.sub}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition ${
                            isChecked ? 'bg-blue-600 text-white' : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 2: Major Dashboard Widget Modules */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                    <Settings className="w-3.5 h-3.5 text-blue-600" />
                    <span>Main Widget Panels</span>
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500">5 Modules</span>
                </div>

                <div className="space-y-2.5">
                  {[
                    {
                      key: 'accountBalances',
                      label: 'Account Balances Head Widget',
                      desc: 'Devsio UBL Bank Balance & Umar Personal Cash Balance Cards',
                      icon: Landmark,
                    },
                    {
                      key: 'pendingMilestones',
                      label: 'Pending Milestones & Project Deadlines Alert',
                      desc: 'Upcoming milestone receivables & deliverable deadlines in 7 days',
                      icon: Bell,
                    },
                    {
                      key: 'financialCharts',
                      label: 'Financial Flow & Project Distribution Charts',
                      desc: 'Bar charts for allocation flow & Pie chart for active project statuses',
                      icon: TrendingUp,
                    },
                    {
                      key: 'financialForecasting',
                      label: 'Financial Forecasting & Predictive Cash Flow Tool',
                      desc: 'Predictive 30/60/90-day cash curve, scenario simulator & Gemini risk audit',
                      icon: TrendingUp,
                    },
                    {
                      key: 'recentTransactions',
                      label: 'Recent Activity Financial Ledger Log',
                      desc: 'Audit table listing the 5 most recent deposits, expenses & payouts',
                      icon: Receipt,
                    },
                  ].map((item) => {
                    const isChecked = widgetConfig[item.key as keyof WidgetVisibilityConfig];
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => toggleWidget(item.key as keyof WidgetVisibilityConfig)}
                        className={`w-full p-3.5 rounded-2xl border text-left flex items-start justify-between transition ${
                          isChecked
                            ? 'bg-slate-900 border-slate-800 text-white shadow-sm'
                            : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              isChecked ? 'bg-blue-600/30 text-cyan-400' : 'bg-slate-200 text-slate-400'
                            }`}
                          >
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-xs font-black ${isChecked ? 'text-white' : 'text-slate-700'}`}>
                              {item.label}
                            </p>
                            <p className={`text-[11px] mt-0.5 ${isChecked ? 'text-slate-400' : 'text-slate-400'}`}>
                              {item.desc}
                            </p>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition mt-1 ${
                            isChecked ? 'bg-cyan-400 text-slate-950 font-bold' : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={resetWidgets}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition flex items-center space-x-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
                <button
                  type="button"
                  onClick={selectAllWidgets}
                  className="px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition"
                >
                  Select All
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsCustomizeModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-md"
              >
                Done / Save Layout
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
