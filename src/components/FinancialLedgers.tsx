import React, { useState, useMemo } from 'react';
import { 
  BookOpenCheck, 
  Landmark, 
  Wallet, 
  Download, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Upload,
  ShieldCheck,
  Layers,
  Search,
  FileCheck,
  Plus,
  X,
  Link2,
  Unlink,
  Sparkles,
  Check,
  HelpCircle
} from 'lucide-react';
import { LedgerTransaction, AccountHead } from '../types';
import { formatPKR, exportToCSV, generateFinancialPDFReport } from '../utils/financialCalculations';

interface BankStatementLine {
  id: string;
  date: string;
  description: string;
  amountPKR: number;
  flow: 'INFLOW' | 'OUTFLOW';
  accountHead: AccountHead;
  bankRef: string;
}

interface ReconciliationRecord {
  reconciled: boolean;
  bankStatementLineId?: string;
  bankRef?: string;
  notes?: string;
  matchedAt?: string;
}

interface FinancialLedgersProps {
  ledger: LedgerTransaction[];
  searchQuery: string;
}

// Sample Bank Statement Feed for quick testing
const INITIAL_BANK_FEED: BankStatementLine[] = [
  { id: 'STMT-101', date: '2026-08-01', description: 'UBL ONLINE DEPOSIT - CL-001 MILESTONE', amountPKR: 200000, flow: 'INFLOW', accountHead: 'UBL', bankRef: 'UBL-FT-88391' },
  { id: 'STMT-102', date: '2026-08-02', description: 'ATM CASH WITHDRAWAL - UMAR HEAD', amountPKR: 15000, flow: 'OUTFLOW', accountHead: 'UBL', bankRef: 'UBL-ATM-4410' },
  { id: 'STMT-103', date: '2026-08-03', description: 'IBFT OUT - SALARY HASAN KHAN', amountPKR: 45000, flow: 'OUTFLOW', accountHead: 'UBL', bankRef: 'UBL-FT-90211' },
  { id: 'STMT-104', date: '2026-08-04', description: 'CARD POS - AWS HOSTING SERVER', amountPKR: 8500, flow: 'OUTFLOW', accountHead: 'UBL', bankRef: 'UBL-POS-3329' },
  { id: 'STMT-105', date: '2026-08-05', description: 'CASH DEPOSIT - RENT & UTILITIES', amountPKR: 25000, flow: 'OUTFLOW', accountHead: 'UMAR_CASH', bankRef: 'CASH-REC-012' },
  { id: 'STMT-106', date: '2026-08-06', description: 'IBFT IN - ACME APP ADVANCE', amountPKR: 150000, flow: 'INFLOW', accountHead: 'UBL', bankRef: 'UBL-FT-99410' },
];

export const FinancialLedgers: React.FC<FinancialLedgersProps> = ({
  ledger,
  searchQuery,
}) => {
  const [accountFilter, setAccountFilter] = useState<'ALL' | 'UBL' | 'UMAR_CASH'>('ALL');
  const [flowFilter, setFlowFilter] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');

  // Reconciliation Mode States
  const [isReconciliationMode, setIsReconciliationMode] = useState<boolean>(false);
  const [reconciliationFilter, setReconciliationFilter] = useState<'ALL' | 'UNMATCHED' | 'MATCHED'>('ALL');
  const [bankFeed, setBankFeed] = useState<BankStatementLine[]>(INITIAL_BANK_FEED);
  
  // Map of ledger Txn ID -> ReconciliationRecord
  const [reconciliationMap, setReconciliationMap] = useState<Record<string, ReconciliationRecord>>({
    'TXN-001': { reconciled: true, bankStatementLineId: 'STMT-101', bankRef: 'UBL-FT-88391', matchedAt: '2026-08-01' },
    'TXN-002': { reconciled: true, bankStatementLineId: 'STMT-103', bankRef: 'UBL-FT-90211', matchedAt: '2026-08-03' },
  });

  // Modal / Add Line State
  const [isAddStatementModalOpen, setIsAddStatementModalOpen] = useState(false);
  const [newStmtDate, setNewStmtDate] = useState('2026-08-08');
  const [newStmtDesc, setNewStmtDesc] = useState('');
  const [newStmtAmount, setNewStmtAmount] = useState('');
  const [newStmtFlow, setNewStmtFlow] = useState<'INFLOW' | 'OUTFLOW'>('INFLOW');
  const [newStmtAccount, setNewStmtAccount] = useState<AccountHead>('UBL');
  const [newStmtRef, setNewStmtRef] = useState('');

  // Selected ledger transaction to pair manually
  const [selectedTxnForMatch, setSelectedTxnForMatch] = useState<string | null>(null);

  // Filter Transactions
  const filteredLedger = ledger.filter((txn) => {
    const matchesAccount = accountFilter === 'ALL' || txn.accountHead === accountFilter;
    const matchesFlow = flowFilter === 'ALL' || txn.flow === flowFilter;
    const matchesSearch =
      txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.referenceId.toLowerCase().includes(searchQuery.toLowerCase());

    if (isReconciliationMode) {
      const isReconciled = reconciliationMap[txn.id]?.reconciled || false;
      if (reconciliationFilter === 'MATCHED' && !isReconciled) return false;
      if (reconciliationFilter === 'UNMATCHED' && isReconciled) return false;
    }

    return matchesAccount && matchesFlow && matchesSearch;
  });

  // Compute Running Balance per row
  let runningBalance = 0;
  const ledgerWithRunningBalance = filteredLedger.map((txn) => {
    if (txn.flow === 'INFLOW') {
      runningBalance += txn.amountPKR;
    } else {
      runningBalance -= txn.amountPKR;
    }
    return { ...txn, currentBalance: runningBalance };
  });

  // Calculate Summary Metrics for current view
  const totalInflow = filteredLedger
    .filter((t) => t.flow === 'INFLOW')
    .reduce((acc, t) => acc + t.amountPKR, 0);

  const totalOutflow = filteredLedger
    .filter((t) => t.flow === 'OUTFLOW')
    .reduce((acc, t) => acc + t.amountPKR, 0);

  const netPeriodBalance = totalInflow - totalOutflow;

  // Reconciliation Metrics
  const reconciliationStats = useMemo(() => {
    const totalLedgerCount = ledger.length;
    const matchedCount = ledger.filter((t) => reconciliationMap[t.id]?.reconciled).length;
    const unmatchedCount = totalLedgerCount - matchedCount;

    const matchedVolume = ledger
      .filter((t) => reconciliationMap[t.id]?.reconciled)
      .reduce((sum, t) => sum + t.amountPKR, 0);

    const unmatchedVolume = ledger
      .filter((t) => !reconciliationMap[t.id]?.reconciled)
      .reduce((sum, t) => sum + t.amountPKR, 0);

    const matchPercentage = totalLedgerCount > 0 ? Math.round((matchedCount / totalLedgerCount) * 100) : 0;

    return {
      totalLedgerCount,
      matchedCount,
      unmatchedCount,
      matchedVolume,
      unmatchedVolume,
      matchPercentage,
    };
  }, [ledger, reconciliationMap]);

  // Quick Auto-Match Engine
  const handleAutoMatch = () => {
    const updatedMap = { ...reconciliationMap };
    let autoMatchedCount = 0;

    ledger.forEach((txn) => {
      if (!updatedMap[txn.id]?.reconciled) {
        // Find matching bank statement line by amount, flow, and account head
        const match = bankFeed.find((stmt) => {
          const alreadyLinked = (Object.values(updatedMap) as ReconciliationRecord[]).some((r) => r.bankStatementLineId === stmt.id);
          return (
            !alreadyLinked &&
            stmt.amountPKR === txn.amountPKR &&
            stmt.flow === txn.flow &&
            stmt.accountHead === txn.accountHead
          );
        });

        if (match) {
          updatedMap[txn.id] = {
            reconciled: true,
            bankStatementLineId: match.id,
            bankRef: match.bankRef,
            matchedAt: new Date().toISOString().split('T')[0],
            notes: `Auto-matched with ${match.bankRef} (${match.description})`,
          };
          autoMatchedCount++;
        }
      }
    });

    setReconciliationMap(updatedMap);
    alert(`Auto-Match complete! Linked ${autoMatchedCount} ledger transactions to bank statement items.`);
  };

  // Toggle single transaction reconciliation state
  const handleToggleReconcile = (txnId: string, bankLine?: BankStatementLine) => {
    const current = reconciliationMap[txnId];
    if (current?.reconciled) {
      // Unlink
      const updated = { ...reconciliationMap };
      delete updated[txnId];
      setReconciliationMap(updated);
    } else {
      // Link
      const line = bankLine || bankFeed.find((b) => !(Object.values(reconciliationMap) as ReconciliationRecord[]).some((r) => r.bankStatementLineId === b.id));
      setReconciliationMap({
        ...reconciliationMap,
        [txnId]: {
          reconciled: true,
          bankStatementLineId: line?.id,
          bankRef: line?.bankRef || `REF-MANUAL-${Math.floor(1000 + Math.random() * 9000)}`,
          matchedAt: new Date().toISOString().split('T')[0],
          notes: line ? `Matched with Bank Line: ${line.description}` : 'Manual Admin Verification',
        },
      });
    }
  };

  // Add Statement Entry
  const handleAddBankStatementLine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStmtDesc || !newStmtAmount) return;

    const newEntry: BankStatementLine = {
      id: `STMT-${Date.now().toString().slice(-4)}`,
      date: newStmtDate,
      description: newStmtDesc,
      amountPKR: Number(newStmtAmount),
      flow: newStmtFlow,
      accountHead: newStmtAccount,
      bankRef: newStmtRef || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
    };

    setBankFeed([newEntry, ...bankFeed]);
    setIsAddStatementModalOpen(false);
    setNewStmtDesc('');
    setNewStmtAmount('');
    setNewStmtRef('');
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Txn ID', 'Date', 'Account Head', 'Type', 'Flow', 'Category', 'Description', 'Amount (PKR)', 'Reconciled', 'Bank Ref'];
    const rows = filteredLedger.map((t) => [
      t.id,
      t.date,
      t.accountHead === 'UBL' ? 'Devsio (UBL Bank)' : 'Umar (Cash Head)',
      t.type,
      t.flow,
      t.category,
      t.description,
      t.amountPKR,
      reconciliationMap[t.id]?.reconciled ? 'YES' : 'NO',
      reconciliationMap[t.id]?.bankRef || 'N/A',
    ]);

    exportToCSV(`devsio_ledger_reconciliation_${accountFilter.toLowerCase()}`, headers, rows);
  };

  // Export PDF
  const handleExportPDF = () => {
    const headers = ['Date', 'Account Head', 'Description', 'Amount (PKR)', 'Flow', 'Reconciliation Status', 'Bank Ref'];
    const rows = filteredLedger.map((t) => [
      t.date,
      t.accountHead === 'UBL' ? 'Devsio (UBL)' : 'Umar (Cash)',
      t.description,
      t.amountPKR.toLocaleString('en-PK'),
      t.flow,
      reconciliationMap[t.id]?.reconciled ? 'MATCHED' : 'UNMATCHED',
      reconciliationMap[t.id]?.bankRef || '-',
    ]);

    const summary = [
      { label: 'Total Reconciled Count', value: `${reconciliationStats.matchedCount} / ${reconciliationStats.totalLedgerCount}` },
      { label: 'Reconciliation Match Rate', value: `${reconciliationStats.matchPercentage}%` },
      { label: 'Reconciled Volume', value: formatPKR(reconciliationStats.matchedVolume) },
      { label: 'Unreconciled Variance', value: formatPKR(reconciliationStats.unmatchedVolume) },
    ];

    generateFinancialPDFReport(
      `Bank Statement Reconciliation Certificate - ${accountFilter === 'ALL' ? 'Multi-Account Combined' : accountFilter}`,
      'Official Devsio Bank Reconciliation & Discrepancy Audit',
      headers,
      rows,
      summary
    );
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Multi-Account Statement of Accounts & Financial Ledgers</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
              Module 6
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete debit/credit inflow and outflow transactions for Devsio UBL Bank and Umar Cash Head.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {/* Reconciliation Mode Toggle */}
          <button
            onClick={() => setIsReconciliationMode(!isReconciliationMode)}
            className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl transition border shadow-xs ${
              isReconciliationMode
                ? 'bg-gradient-to-r from-blue-900 via-slate-900 to-blue-950 text-white border-blue-500/50 shadow-md'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200'
            }`}
          >
            <ShieldCheck className={`w-4 h-4 ${isReconciliationMode ? 'text-cyan-400' : 'text-blue-600'}`} />
            <span>{isReconciliationMode ? 'Exit Reconciliation Mode' : 'Bank Reconciliation Mode'}</span>
            {isReconciliationMode && (
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-1"></span>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Statement</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#0A192F] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#00D2FF]" />
            <span>Audit PDF</span>
          </button>
        </div>
      </div>

      {/* RECONCILIATION CONTROL CENTER PANEL (Visible when Reconciliation Mode Active) */}
      {isReconciliationMode && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-blue-500/30 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black shadow-md">
                <ShieldCheck className="w-5 h-5 text-slate-950" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
                  <span>Bank Statement Reconciliation & Discrepancy Matching</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Verify internal ledger records against external bank feeds (UBL Bank Statement & Cash Registry)
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleAutoMatch}
                className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Auto-Match Rules</span>
              </button>

              <button
                onClick={() => setIsAddStatementModalOpen(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Bank Line</span>
              </button>
            </div>
          </div>

          {/* Reconciliation Metric Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Reconciliation Rate</p>
              <div className="flex items-baseline justify-between mt-1">
                <p className="text-2xl font-black text-white font-mono">{reconciliationStats.matchPercentage}%</p>
                <span className="text-xs font-bold text-cyan-300">
                  {reconciliationStats.matchedCount} / {reconciliationStats.totalLedgerCount} Matched
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full"
                  style={{ width: `${reconciliationStats.matchPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Reconciled Ledger Volume</p>
              <p className="text-xl font-black text-emerald-400 mt-1 font-mono">{formatPKR(reconciliationStats.matchedVolume)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Verified bank entries</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Unmatched Discrepancy Variance</p>
              <p className="text-xl font-black text-amber-400 mt-1 font-mono">{formatPKR(reconciliationStats.unmatchedVolume)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{reconciliationStats.unmatchedCount} unlinked transactions</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">External Bank Feed Items</p>
              <p className="text-xl font-black text-cyan-300 mt-1 font-mono">{bankFeed.length} Statement Lines</p>
              <p className="text-[10px] text-slate-400 mt-0.5">UBL Bank & Cash Head Feed</p>
            </div>

          </div>

          {/* Reconciliation Filter Tabs */}
          <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase">View Filter:</span>
            {[
              { id: 'ALL', label: 'All Transactions' },
              { id: 'UNMATCHED', label: `Unmatched Discrepancies (${reconciliationStats.unmatchedCount})` },
              { id: 'MATCHED', label: `Matched / Reconciled (${reconciliationStats.matchedCount})` },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setReconciliationFilter(f.id as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                  reconciliationFilter === f.id
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

        </div>
      )}

      {/* Account Balance Summaries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Inflows */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filtered Total Inflows</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{formatPKR(totalInflow)}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        {/* Total Outflows */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Filtered Total Outflows</p>
            <p className="text-xl font-black text-rose-600 mt-0.5">{formatPKR(totalOutflow)}</p>
          </div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Net Period Position */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300">Net Account Position</p>
            <p className="text-xl font-black text-[#00D2FF] mt-0.5">{formatPKR(netPeriodBalance)}</p>
          </div>
          <div className="p-2.5 bg-[#00D2FF]/20 text-[#00D2FF] rounded-xl border border-[#00D2FF]/40">
            <BookOpenCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200">
        
        {/* Account Head Filter Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAccountFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              accountFilter === 'ALL'
                ? 'bg-[#0A192F] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Accounts Combined
          </button>

          <button
            onClick={() => setAccountFilter('UBL')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              accountFilter === 'UBL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Devsio (UBL Bank)</span>
          </button>

          <button
            onClick={() => setAccountFilter('UMAR_CASH')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              accountFilter === 'UMAR_CASH'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Umar (Cash Head)</span>
          </button>
        </div>

        {/* Flow Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-bold uppercase">Flow:</span>
          <select
            value={flowFilter}
            onChange={(e) => setFlowFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 text-xs font-bold rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">All Flows (Inflow + Outflow)</option>
            <option value="INFLOW">INFLOW (Client Collections)</option>
            <option value="OUTFLOW">OUTFLOW (Payouts & Expenses)</option>
          </select>
        </div>

      </div>

      {/* Main Ledger Table with Running Balance & Reconciliation Status */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Account Head</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category / Description</th>
                <th className="py-3 px-4 text-right">Debit / Credit (PKR)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                {isReconciliationMode && (
                  <th className="py-3 px-4 text-center bg-blue-50/80 text-blue-900 font-black">
                    Reconciliation Status
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {ledgerWithRunningBalance.length === 0 ? (
                <tr>
                  <td colSpan={isReconciliationMode ? 8 : 7} className="py-8 text-center text-slate-400">
                    No transactions found for the selected account filters.
                  </td>
                </tr>
              ) : (
                ledgerWithRunningBalance.map((txn) => {
                  const recInfo = reconciliationMap[txn.id];
                  const isReconciled = recInfo?.reconciled || false;

                  return (
                    <tr key={txn.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-400">{txn.id}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{txn.date}</td>
                      <td className="py-3 px-4 font-bold">
                        {txn.accountHead === 'UBL' ? (
                          <span className="text-blue-700 inline-flex items-center space-x-1">
                            <Landmark className="w-3 h-3" />
                            <span>Devsio (UBL)</span>
                          </span>
                        ) : (
                          <span className="text-amber-700 inline-flex items-center space-x-1">
                            <Wallet className="w-3 h-3" />
                            <span>Umar (Cash)</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md">
                          {txn.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{txn.description}</p>
                        <p className="text-[10px] text-slate-400">{txn.category} • Ref: {txn.referenceId}</p>
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-black ${
                          txn.flow === 'INFLOW' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {txn.flow === 'INFLOW' ? '+' : '-'}{formatPKR(txn.amountPKR)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900 bg-slate-50/50">
                        {formatPKR(txn.currentBalance)}
                      </td>

                      {/* Reconciliation Column */}
                      {isReconciliationMode && (
                        <td className="py-3 px-4 text-center bg-blue-50/20">
                          {isReconciled ? (
                            <div className="flex items-center justify-center space-x-1.5">
                              <span className="inline-flex items-center space-x-1 px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-lg border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Reconciled</span>
                              </span>
                              <button
                                onClick={() => handleToggleReconcile(txn.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Unlink Statement Match"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-1.5">
                              <span className="inline-flex items-center space-x-1 px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg border border-amber-200">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span>Unmatched</span>
                              </span>
                              <button
                                onClick={() => handleToggleReconcile(txn.id)}
                                className="px-2 py-1 bg-[#0A192F] hover:bg-slate-800 text-white text-[10px] font-bold rounded-lg transition flex items-center space-x-1"
                              >
                                <Link2 className="w-3 h-3 text-cyan-400" />
                                <span>Match</span>
                              </button>
                            </div>
                          )}
                          {recInfo?.bankRef && (
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                              {recInfo.bankRef}
                            </p>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD BANK STATEMENT ENTRY MODAL */}
      {isAddStatementModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 font-sans animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Landmark className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-extrabold text-slate-900">Add Bank Statement Line</h3>
              </div>
              <button
                onClick={() => setIsAddStatementModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBankStatementLine} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Date</label>
                <input
                  type="date"
                  value={newStmtDate}
                  onChange={(e) => setNewStmtDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Head</label>
                <select
                  value={newStmtAccount}
                  onChange={(e) => setNewStmtAccount(e.target.value as AccountHead)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                >
                  <option value="UBL">Devsio (UBL Bank Statement)</option>
                  <option value="UMAR_CASH">Umar (Cash Head Registry)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Statement Description</label>
                <input
                  type="text"
                  value={newStmtDesc}
                  onChange={(e) => setNewStmtDesc(e.target.value)}
                  placeholder="e.g. IBFT IN - CLIENT PAYMENT"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Flow</label>
                  <select
                    value={newStmtFlow}
                    onChange={(e) => setNewStmtFlow(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="INFLOW">INFLOW (+)</option>
                    <option value="OUTFLOW">OUTFLOW (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (PKR)</label>
                  <input
                    type="number"
                    value={newStmtAmount}
                    onChange={(e) => setNewStmtAmount(e.target.value)}
                    placeholder="150000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Reference / Ref ID</label>
                <input
                  type="text"
                  value={newStmtRef}
                  onChange={(e) => setNewStmtRef(e.target.value)}
                  placeholder="e.g. UBL-FT-99410"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddStatementModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0A192F] hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Add Statement Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

