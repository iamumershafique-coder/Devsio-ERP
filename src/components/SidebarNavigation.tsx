import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calculator, 
  UserCheck, 
  Receipt, 
  BookOpenCheck, 
  FileCode2,
  ShieldAlert,
  Landmark,
  Wallet,
  LogIn,
  Sparkles,
  Bell,
  BellRing,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap
} from 'lucide-react';
import { formatPKR } from '../utils/financialCalculations';

export type ActiveTab = 'dashboard' | 'clients' | 'costing' | 'gemini_profit' | 'team' | 'team_portal' | 'expenses' | 'ledgers' | 'docs';

export interface NotificationBadgeCounts {
  urgentTotal?: number;
  unpaidReceivablesCount?: number;
  overdueReceivablesCount?: number;
  pendingPayablesCount?: number;
  activeTasksCount?: number;
  costingAlertsCount?: number;
  recentExpensesCount?: number;
  geminiInsightsCount?: number;
}

interface SidebarNavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingReceivablesCount: number;
  pendingPayablesCount: number;
  ublBankBalance?: number;
  umarCashBalance?: number;
  notificationCounts?: NotificationBadgeCounts;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeTab,
  setActiveTab,
  pendingReceivablesCount,
  pendingPayablesCount,
  ublBankBalance = 428500,
  umarCashBalance = 12300,
  notificationCounts = {} as NotificationBadgeCounts,
}) => {
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(false);

  // Extract counts with fallbacks
  const {
    unpaidReceivablesCount: unpaidReceivables = pendingReceivablesCount,
    overdueReceivablesCount: overdueReceivables = pendingReceivablesCount > 0 ? 1 : 0,
    pendingPayablesCount: pendingPayables = pendingPayablesCount,
    activeTasksCount: activeTasks = 4,
    costingAlertsCount: costingAlerts = 2,
    geminiInsightsCount: geminiInsights = 3,
    recentExpensesCount: recentExpenses = 2,
  } = notificationCounts;

  // Calculate total system action items
  const totalActionItems = overdueReceivables + unpaidReceivables + pendingPayables + activeTasks;

  // Navigation Items with Notification Badges
  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard Control',
      description: 'Executive KPI Center',
      icon: LayoutDashboard,
      badgeCount: totalActionItems > 0 && !isAcknowledged ? totalActionItems : null,
      badgeLabel: totalActionItems > 0 ? `${totalActionItems} Actions` : 'Clean',
      badgeType: totalActionItems > 0 ? 'urgent' : 'success',
      badgeColor: totalActionItems > 0 ? 'bg-rose-500/25 text-rose-300 border-rose-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      hasPulse: totalActionItems > 0 && !isAcknowledged,
    },
    {
      id: 'gemini_profit' as ActiveTab,
      label: 'Gemini 3 Profit AI',
      description: '20/20/20/40 Split & AI Audit',
      icon: Sparkles,
      badgeCount: geminiInsights,
      badgeLabel: `${geminiInsights} AI Insights`,
      badgeType: 'ai',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      hasPulse: true,
    },
    {
      id: 'clients' as ActiveTab,
      label: 'Client Milestones',
      description: 'Milestones & Receivables',
      icon: Users,
      badgeCount: unpaidReceivables,
      badgeLabel: overdueReceivables > 0 ? `${overdueReceivables} Overdue` : unpaidReceivables > 0 ? `${unpaidReceivables} Unpaid` : 'Up to date',
      badgeType: overdueReceivables > 0 ? 'urgent' : unpaidReceivables > 0 ? 'warning' : 'info',
      badgeColor: overdueReceivables > 0 
        ? 'bg-rose-500/25 text-rose-300 border-rose-500/40' 
        : unpaidReceivables > 0 
        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' 
        : 'bg-slate-800 text-slate-400 border-slate-700',
      hasPulse: overdueReceivables > 0,
    },
    {
      id: 'costing' as ActiveTab,
      label: 'Project Calculator',
      description: '20% Cut & Net Pool',
      icon: Calculator,
      badgeCount: costingAlerts,
      badgeLabel: `${costingAlerts} Projects`,
      badgeType: 'info',
      badgeColor: 'bg-[#00D2FF]/20 text-[#00D2FF] border-[#00D2FF]/30',
      hasPulse: false,
    },
    {
      id: 'team' as ActiveTab,
      label: 'Team Ledgers',
      description: '10 Member Earnings & Balances',
      icon: UserCheck,
      badgeCount: pendingPayables,
      badgeLabel: pendingPayables > 0 ? `${pendingPayables} Pending` : 'Cleared',
      badgeType: pendingPayables > 0 ? 'urgent' : 'success',
      badgeColor: pendingPayables > 0 ? 'bg-rose-500/25 text-rose-300 border-rose-500/40' : 'bg-slate-800 text-slate-400 border-slate-700',
      hasPulse: pendingPayables > 0,
    },
    {
      id: 'team_portal' as ActiveTab,
      label: 'Team Member Portal',
      description: 'Login, KYC & Task Tracker',
      icon: LogIn,
      badgeCount: activeTasks,
      badgeLabel: `${activeTasks} Active Tasks`,
      badgeType: 'info',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      hasPulse: false,
    },
    {
      id: 'expenses' as ActiveTab,
      label: 'Purchases & Expenses',
      description: 'Tools, Subscriptions & Bills',
      icon: Receipt,
      badgeCount: recentExpenses,
      badgeLabel: `${recentExpenses} Recent`,
      badgeType: 'info',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      hasPulse: false,
    },
    {
      id: 'ledgers' as ActiveTab,
      label: 'Financial Ledger',
      description: 'UBL Bank & Umar Cash Head',
      icon: BookOpenCheck,
      badgeCount: null,
      badgeLabel: 'UBL / Cash',
      badgeType: 'success',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      hasPulse: false,
    },
    {
      id: 'docs' as ActiveTab,
      label: 'Setup & Docs',
      description: 'Formulas & Security',
      icon: FileCode2,
      badgeCount: null,
      badgeLabel: 'Docs',
      badgeType: 'slate',
      badgeColor: 'bg-slate-700 text-slate-300 border-slate-600',
      hasPulse: false,
    },
  ];

  return (
    <aside className="w-full md:w-60 bg-[#0A192F] text-slate-300 shrink-0 border-r border-white/10 flex flex-col justify-between relative">
      <div>
        {/* Brand Header & Notification Trigger */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#00D2FF] rounded flex items-center justify-center shrink-0 shadow-sm shadow-[#00D2FF]/20">
                <span className="text-[#0A192F] font-black text-xs italic">DS</span>
              </div>
              <h1 className="text-white font-bold tracking-tight text-base">
                Devsio<span className="text-[#00D2FF]">Services</span>
              </h1>
            </div>
            <p className="text-[9px] text-white/40 mt-0.5 uppercase tracking-widest font-semibold">
              Financial ERP v2.4
            </p>
          </div>

          {/* Action Center Bell Icon */}
          <button
            onClick={() => setIsAlertDrawerOpen(!isAlertDrawerOpen)}
            className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition group"
            title="Open Notification Action Center"
          >
            {totalActionItems > 0 && !isAcknowledged ? (
              <BellRing className="w-4 h-4 text-rose-400 animate-bounce" />
            ) : (
              <Bell className="w-4 h-4 text-slate-400 group-hover:text-white" />
            )}

            {totalActionItems > 0 && !isAcknowledged && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border border-[#0A192F] shadow-sm animate-pulse">
                {totalActionItems}
              </span>
            )}
          </button>
        </div>

        {/* Live System Alerts Summary Bar */}
        {totalActionItems > 0 && !isAcknowledged && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between text-[11px]">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span className="font-bold text-rose-200">{totalActionItems} Unread Action Items</span>
            </div>
            <button
              onClick={() => setIsAlertDrawerOpen(true)}
              className="text-[10px] font-extrabold uppercase text-[#00D2FF] hover:underline flex items-center space-x-0.5"
            >
              <span>Review</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsAlertDrawerOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-between group relative ${
                  isActive
                    ? 'bg-[#00D2FF]/15 text-[#00D2FF] border border-[#00D2FF]/30 shadow-sm'
                    : 'text-white/70 hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#00D2FF]' : 'text-white/50 group-hover:text-white'}`} />
                    {item.hasPulse && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    )}
                  </div>
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badgeLabel && (
                  <span
                    className={`ml-1 px-2 py-0.5 text-[9px] font-bold border rounded-full uppercase tracking-wider shrink-0 flex items-center space-x-1 ${
                      item.badgeColor
                    }`}
                  >
                    {item.badgeType === 'urgent' && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>}
                    {item.badgeType === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                    {item.badgeType === 'ai' && <Sparkles className="w-2.5 h-2.5 text-cyan-300" />}
                    <span>{item.badgeLabel}</span>
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ACTION CENTER FLYOUT / DRAWER */}
      {isAlertDrawerOpen && (
        <div className="absolute top-14 left-2 right-2 z-50 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-xs text-slate-200 backdrop-blur-xl animate-in fade-in duration-150 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-[#00D2FF]" />
              <span className="font-extrabold text-white uppercase text-[11px] tracking-wider">System Action Center</span>
            </div>
            <button
              onClick={() => setIsAlertDrawerOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {/* Action Item 1: Overdue & Unpaid Receivables */}
            <div
              onClick={() => {
                setActiveTab('clients');
                setIsAlertDrawerOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unpaid Client Milestones</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {unpaidReceivables} milestone{unpaidReceivables !== 1 ? 's' : ''} awaiting collection ({overdueReceivables} past due)
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#00D2FF]" />
            </div>

            {/* Action Item 2: Pending Team Payouts */}
            <div
              onClick={() => {
                setActiveTab('team');
                setIsAlertDrawerOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Pending Team Payouts</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {pendingPayables} team assignment payout{pendingPayables !== 1 ? 's' : ''} pending
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#00D2FF]" />
            </div>

            {/* Action Item 3: Gemini Profit Insights */}
            <div
              onClick={() => {
                setActiveTab('gemini_profit');
                setIsAlertDrawerOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gemini 3 Profit Audits</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {geminiInsights} project margin optimizations calculated
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#00D2FF]" />
            </div>

            {/* Action Item 4: Active Portal Tasks */}
            <div
              onClick={() => {
                setActiveTab('team_portal');
                setIsAlertDrawerOpen(false);
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 cursor-pointer transition flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5 font-bold text-slate-200">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>Team Portal Tasks</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {activeTasks} member task{activeTasks !== 1 ? 's' : ''} in progress
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#00D2FF]" />
            </div>
          </div>

          {/* Action Center Footer */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                setIsAcknowledged(!isAcknowledged);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-lg transition flex items-center space-x-1"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>{isAcknowledged ? 'Show Badges' : 'Mark All Read'}</span>
            </button>
            <span className="text-[9px] text-slate-500">Live Financial ERP</span>
          </div>
        </div>
      )}

      {/* Account Balance Widget */}
      <div className="p-4 border-t border-white/10">
        <div className="bg-white/5 p-3 rounded-lg border border-white/5 space-y-2">
          <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Account Balance</p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/60 flex items-center gap-1">
              <Landmark className="w-3 h-3 text-[#00D2FF]" />
              <span>UBL Bank</span>
            </span>
            <span className="text-xs font-mono font-bold text-[#00D2FF]">{formatPKR(ublBankBalance)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/60 flex items-center gap-1">
              <Wallet className="w-3 h-3 text-amber-400" />
              <span>Umar Cash</span>
            </span>
            <span className="text-xs font-mono font-bold text-white">{formatPKR(umarCashBalance)}</span>
          </div>
        </div>

        {/* Security Indicator */}
        <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-400 font-semibold px-1">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Audit Engine Active (20% Cut)</span>
        </div>
      </div>
    </aside>
  );
};
