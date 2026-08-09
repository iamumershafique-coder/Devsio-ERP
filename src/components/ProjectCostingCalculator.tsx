import React, { useState } from 'react';
import { 
  Calculator, 
  PiggyBank, 
  Receipt, 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Landmark, 
  Wallet,
  Building2,
  FileSpreadsheet,
  Calendar,
  Columns3,
  FolderOpen,
  FileText,
  Lock,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import { Project, TeamMember, DirectExpense, TeamAssignment, AccountHead, ProjectStatus } from '../types';
import { 
  formatPKR, 
  calculateCompanyReserve, 
  calculateNetDistributablePool,
  generateFinancialPDFReport
} from '../utils/financialCalculations';
import { ProjectMilestoneCalendar } from './ProjectMilestoneCalendar';
import { ProjectKanbanBoard } from './ProjectKanbanBoard';
import { ProjectDocumentsSection } from './ProjectDocumentsSection';

interface ProjectCostingCalculatorProps {
  projects: Project[];
  teamMembers: TeamMember[];
  onUpdateProjectFinancials: (updatedProject: Project) => void;
  onLogTeamPayout: (
    projectId: string,
    teamMemberId: string,
    teamMemberName: string,
    amountPKR: number,
    paidFromAccount: AccountHead,
    receiptRef: string
  ) => void;
}

export const ProjectCostingCalculator: React.FC<ProjectCostingCalculatorProps> = ({
  projects,
  teamMembers,
  onUpdateProjectFinancials,
  onLogTeamPayout,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [costingSubTab, setCostingSubTab] = useState<'calculator' | 'kanban' | 'calendar' | 'documents'>('calculator');
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Payout Dispatch Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutTeamMemberId, setPayoutTeamMemberId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState<number>(10000);
  const [payoutAccount, setPayoutAccount] = useState<AccountHead>('UBL');
  const [payoutRef, setPayoutRef] = useState(`TXN-${Date.now().toString().slice(-6)}`);

  // Direct Expense Modal State
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<DirectExpense['category']>('Hosting/Domain');
  const [expenseAmount, setExpenseAmount] = useState<number>(5000);
  const [expenseAccount, setExpenseAccount] = useState<AccountHead>('UBL');

  // Team Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignMemberId, setAssignMemberId] = useState(teamMembers[0]?.id || '');
  const [assignRole, setAssignRole] = useState('Frontend Developer');
  const [assignAmount, setAssignAmount] = useState<number>(20000);

  if (!activeProject) {
    return <div className="p-8 text-center text-slate-500">No project selected.</div>;
  }

  // Live Formula Calculations
  const companyReserve = calculateCompanyReserve(activeProject.grossBudgetPKR);
  const directExpensesSum = activeProject.directExpensesList.reduce((acc, e) => acc + e.amountPKR, 0);
  const netPool = calculateNetDistributablePool(activeProject.grossBudgetPKR, directExpensesSum);

  const totalAssignedToTeam = activeProject.teamAssignments.reduce((acc, ta) => acc + ta.promisedAmountPKR, 0);
  const totalPaidToTeam = activeProject.teamAssignments.reduce((acc, ta) => acc + ta.paidAmountPKR, 0);
  const unallocatedNetPool = netPool - totalAssignedToTeam;

  // Validation Indicator Status
  let validationStatus: 'BALANCED' | 'UNDER' | 'OVER' = 'BALANCED';
  if (unallocatedNetPool > 0) validationStatus = 'UNDER';
  if (unallocatedNetPool < 0) validationStatus = 'OVER';

  // Handle Adding Direct Expense
  const handleAddDirectExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseTitle.trim() && expenseAmount > 0) {
      const newExp: DirectExpense = {
        id: `DE-${Date.now()}`,
        title: expenseTitle,
        category: expenseCategory,
        amountPKR: expenseAmount,
        paidFromAccount: expenseAccount,
        date: new Date().toISOString().split('T')[0],
      };

      const updatedExpensesList = [...activeProject.directExpensesList, newExp];
      const newDirectTotal = updatedExpensesList.reduce((a, b) => a + b.amountPKR, 0);
      const newNetPool = calculateNetDistributablePool(activeProject.grossBudgetPKR, newDirectTotal);

      const updatedProject: Project = {
        ...activeProject,
        directExpensesList: updatedExpensesList,
        directExpensesPKR: newDirectTotal,
        netDistributablePoolPKR: newNetPool,
      };

      onUpdateProjectFinancials(updatedProject);
      setExpenseTitle('');
      setShowExpenseModal(false);
    }
  };

  // Handle Remove Direct Expense
  const handleRemoveExpense = (expenseId: string) => {
    const updatedList = activeProject.directExpensesList.filter((e) => e.id !== expenseId);
    const newDirectTotal = updatedList.reduce((a, b) => a + b.amountPKR, 0);
    const newNetPool = calculateNetDistributablePool(activeProject.grossBudgetPKR, newDirectTotal);

    onUpdateProjectFinancials({
      ...activeProject,
      directExpensesList: updatedList,
      directExpensesPKR: newDirectTotal,
      netDistributablePoolPKR: newNetPool,
    });
  };

  // Handle Adding Team Assignment
  const handleAddTeamAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const member = teamMembers.find((m) => m.id === assignMemberId);
    if (member && assignAmount > 0) {
      const existingIdx = activeProject.teamAssignments.findIndex((a) => a.teamMemberId === member.id);
      let updatedAssignments = [...activeProject.teamAssignments];

      if (existingIdx >= 0) {
        updatedAssignments[existingIdx] = {
          ...updatedAssignments[existingIdx],
          roleOnProject: assignRole,
          promisedAmountPKR: assignAmount,
        };
      } else {
        updatedAssignments.push({
          teamMemberId: member.id,
          teamMemberName: member.name,
          roleOnProject: assignRole,
          promisedAmountPKR: assignAmount,
          paidAmountPKR: 0,
        });
      }

      onUpdateProjectFinancials({
        ...activeProject,
        teamAssignments: updatedAssignments,
      });

      setShowAssignModal(false);
    }
  };

  // Handle Remove Team Assignment
  const handleRemoveAssignment = (memberId: string) => {
    const updatedAssignments = activeProject.teamAssignments.filter((a) => a.teamMemberId !== memberId);
    onUpdateProjectFinancials({
      ...activeProject,
      teamAssignments: updatedAssignments,
    });
  };

  // Dispatch Payout Submit
  const handleDispatchPayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const member = teamMembers.find((m) => m.id === payoutTeamMemberId);
    if (member && payoutAmount > 0) {
      onLogTeamPayout(
        activeProject.id,
        member.id,
        member.name,
        payoutAmount,
        payoutAccount,
        payoutRef
      );

      // Update paidAmountPKR in project assignment
      const updatedAssignments = activeProject.teamAssignments.map((ta) => {
        if (ta.teamMemberId === member.id) {
          return {
            ...ta,
            paidAmountPKR: (ta.paidAmountPKR || 0) + payoutAmount,
          };
        }
        return ta;
      });

      onUpdateProjectFinancials({
        ...activeProject,
        teamAssignments: updatedAssignments,
      });

      setShowPayoutModal(false);
    }
  };

  // Export PDF Statement for Project
  const handleExportProjectPDF = () => {
    const headers = ['Team Member', 'Role on Project', 'Promised (PKR)', 'Paid to Date (PKR)', 'Pending Payable'];
    const rows = activeProject.teamAssignments.map((ta) => [
      ta.teamMemberName,
      ta.roleOnProject,
      ta.promisedAmountPKR.toLocaleString('en-PK'),
      ta.paidAmountPKR.toLocaleString('en-PK'),
      (ta.promisedAmountPKR - ta.paidAmountPKR).toLocaleString('en-PK'),
    ]);

    const summary = [
      { label: 'Gross Budget', value: formatPKR(activeProject.grossBudgetPKR) },
      { label: '20% Devsio Cut', value: formatPKR(companyReserve) },
      { label: 'Net Pool', value: formatPKR(netPool) },
    ];

    generateFinancialPDFReport(
      `Project Costing Breakdown - ${activeProject.companyName}`,
      `Title: ${activeProject.projectTitle} (${activeProject.id})`,
      headers,
      rows,
      summary
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Project Costing & Automated Team Payout Calculator</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#00D2FF]/20 text-slate-900 border border-[#00D2FF]/40 rounded-full">
              Module 3
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Automated 20% Devsio reserve cut, direct tool cost deduction, net pool distribution, and live team allocation validation.
          </p>
        </div>

        {/* Select Active Project Dropdown */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Project:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 text-xs font-bold rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.companyName} - {p.projectTitle}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportProjectPDF}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition shrink-0"
            title="Download Costing PDF"
          >
            <FileSpreadsheet className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation Bar */}
      <div className="flex items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setCostingSubTab('calculator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            costingSubTab === 'calculator'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4 text-blue-600" />
          <span>20% Cut & Net Pool Calculator</span>
        </button>

        <button
          onClick={() => setCostingSubTab('kanban')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            costingSubTab === 'kanban'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Columns3 className="w-4 h-4 text-purple-600" />
          <span>Project Kanban Board</span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-100 text-purple-900 rounded-full uppercase">
            Pipeline
          </span>
        </button>

        <button
          onClick={() => setCostingSubTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            costingSubTab === 'calendar'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Milestone Deadlines Calendar</span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-[#00D2FF]/20 text-slate-900 rounded-full uppercase">
            Schedule
          </span>
        </button>

        <button
          onClick={() => setCostingSubTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            costingSubTab === 'documents'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FolderOpen className="w-4 h-4 text-purple-600" />
          <span>Project Documents & Vault</span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-purple-100 text-purple-900 rounded-full uppercase">
            {activeProject.documents?.length || 0} Docs
          </span>
        </button>
      </div>

      {costingSubTab === 'kanban' ? (
        <ProjectKanbanBoard
          projects={projects}
          onUpdateProjectStatus={(project, newStatus) => {
            onUpdateProjectFinancials({
              ...project,
              status: newStatus,
            });
          }}
          onSelectProjectForCosting={(projId) => {
            setSelectedProjectId(projId);
            setCostingSubTab('calculator');
          }}
        />
      ) : costingSubTab === 'calendar' ? (
        <ProjectMilestoneCalendar
          projects={projects}
          teamMembers={teamMembers}
          onUpdateProject={onUpdateProjectFinancials}
          selectedProjectId={selectedProjectId}
        />
      ) : costingSubTab === 'documents' ? (
        <ProjectDocumentsSection
          projects={projects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onUpdateProject={onUpdateProjectFinancials}
        />
      ) : (
        <>
      {/* 6-Step Financial Costing Waterfall Pipeline */}
      <div className="bg-[#0A192F] text-white rounded-2xl p-6 border border-[#1B365D] shadow-xl space-y-6">
        
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-[#00D2FF]" />
            <span>Project Financial Distribution Waterfall ({activeProject.id})</span>
          </h2>
          <span className="text-xs text-slate-400">Client: {activeProject.companyName}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Step 1: Gross Budget */}
          <div className="bg-[#112240] p-4 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1">
              <span>STEP 1</span>
              <span>Gross Budget</span>
            </div>
            <p className="text-xl font-extrabold text-white">{formatPKR(activeProject.grossBudgetPKR)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Booked total in PKR</p>
          </div>

          {/* Step 2: 20% Devsio Company Reserve */}
          <div className="bg-[#112240] p-4 rounded-xl border border-indigo-500/30">
            <div className="flex items-center justify-between text-xs text-indigo-300 font-semibold mb-1">
              <span>STEP 2</span>
              <span>Devsio Cut (Fixed 20%)</span>
            </div>
            <p className="text-xl font-extrabold text-[#00D2FF]">- {formatPKR(companyReserve)}</p>
            <p className="text-[10px] text-indigo-200 mt-1">Rule A: Retained Earnings</p>
          </div>

          {/* Step 3: Direct Project Expenses */}
          <div className="bg-[#112240] p-4 rounded-xl border border-amber-500/30">
            <div className="flex items-center justify-between text-xs text-amber-300 font-semibold mb-1">
              <span>STEP 3</span>
              <span>Direct Expenses</span>
            </div>
            <p className="text-xl font-extrabold text-amber-400">- {formatPKR(directExpensesSum)}</p>
            <p className="text-[10px] text-amber-200 mt-1">Domains, APIs, Plugins</p>
          </div>

          {/* Step 4: Net Pool Remaining */}
          <div className="bg-gradient-to-br from-[#2563EB]/40 to-[#00D2FF]/20 p-4 rounded-xl border border-[#00D2FF]/50">
            <div className="flex items-center justify-between text-xs text-blue-200 font-semibold mb-1">
              <span>STEP 4</span>
              <span>Net Pool Remaining</span>
            </div>
            <p className="text-xl font-black text-white">{formatPKR(netPool)}</p>
            <p className="text-[10px] text-blue-200 mt-1">Distributable to Team</p>
          </div>

        </div>

        {/* Step 5: Live Validation Indicator Bar */}
        <div className="bg-[#112240] p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Step 5: Team Allocation Pool Validation</span>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-slate-300">
                Assigned: <strong className="text-white">{formatPKR(totalAssignedToTeam)}</strong>
              </span>
              <span className="text-xs text-slate-300">
                Net Pool: <strong className="text-[#00D2FF]">{formatPKR(netPool)}</strong>
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {validationStatus === 'BALANCED' && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Perfect Allocation (100% Net Pool Assigned)</span>
              </div>
            )}
            {validationStatus === 'UNDER' && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Under-Allocated: {formatPKR(unallocatedNetPool)} Remaining</span>
              </div>
            )}
            {validationStatus === 'OVER' && (
              <div className="flex items-center space-x-2 px-4 py-2 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Over-Allocated by {formatPKR(Math.abs(unallocatedNetPool))}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Two Column Layout: Direct Expenses vs Team Assignments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Direct Project Expenses Table */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Direct Project Expenses</h3>
              <p className="text-xs text-slate-500">Deducted before team distribution</p>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Direct Expense</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <th className="py-2.5 px-3">Expense</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Paid From</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {activeProject.directExpensesList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      No direct project expenses logged.
                    </td>
                  </tr>
                ) : (
                  activeProject.directExpensesList.map((de) => (
                    <tr key={de.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-slate-900">{de.title}</p>
                        <p className="text-[10px] text-slate-400">{de.category}</p>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-amber-700">
                        {formatPKR(de.amountPKR)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700">
                        {de.paidFromAccount === 'UBL' ? 'UBL Bank' : 'Umar Cash'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleRemoveExpense(de.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step 5 & 6: Team Allocation & Payout Log Table */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Team Assignments & Promised Earnings</h3>
              <p className="text-xs text-slate-500">10-Member Team Pool Allocation</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Assign Team Member</span>
              </button>

              <button
                onClick={() => setShowPayoutModal(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>Step 6: Log Payout</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <th className="py-2.5 px-3">Team Member</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Promised</th>
                  <th className="py-2.5 px-3">Paid to Date</th>
                  <th className="py-2.5 px-3">Pending</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {activeProject.teamAssignments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No team members assigned to this project yet.
                    </td>
                  </tr>
                ) : (
                  activeProject.teamAssignments.map((ta) => {
                    const pending = Math.max(0, ta.promisedAmountPKR - ta.paidAmountPKR);
                    return (
                      <tr key={ta.teamMemberId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{ta.teamMemberName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{ta.roleOnProject}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{formatPKR(ta.promisedAmountPKR)}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700">{formatPKR(ta.paidAmountPKR)}</td>
                        <td className={`py-2.5 px-3 font-bold ${pending > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                          {formatPKR(pending)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleRemoveAssignment(ta.teamMemberId)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Project Documents & Legal Contracts Quick Vault Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-purple-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Project Documents & Legal Vault</h3>
              <p className="text-xs text-slate-500">NDAs, Master Service Contracts, Briefs & Technical Documents for {activeProject.companyName}</p>
            </div>
          </div>

          <button
            onClick={() => setCostingSubTab('documents')}
            className="flex items-center space-x-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-xl border border-purple-200 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Manage Project Documents ({activeProject.documents?.length || 0})</span>
          </button>
        </div>

        {(!activeProject.documents || activeProject.documents.length === 0) ? (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
            <p className="text-xs text-slate-500">No NDAs, contracts, or project briefs uploaded yet for {activeProject.companyName}.</p>
            <button
              onClick={() => setCostingSubTab('documents')}
              className="mt-2 text-xs font-bold text-purple-600 hover:text-purple-700 underline"
            >
              + Upload or attach document link
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activeProject.documents.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-purple-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-100 text-purple-800 rounded">
                      {doc.category}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">{doc.uploadedAt}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">{doc.title}</p>
                  {doc.fileName && <p className="text-[10px] text-slate-500 font-mono truncate">{doc.fileName}</p>}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold uppercase text-[9px]">{doc.fileType}</span>
                  <a
                    href={doc.urlOrLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-purple-700 hover:text-purple-900 flex items-center space-x-1"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: Add Direct Expense */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Add Direct Project Expense</h3>
            <p className="text-xs text-slate-500 mt-1">Deducted directly before team distribution</p>

            <form onSubmit={handleAddDirectExpense} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Domain & Twilio SMS API"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Hosting/Domain">Hosting/Domain</option>
                  <option value="Plugins/Licenses">Plugins/Licenses</option>
                  <option value="Third-Party API">Third-Party API</option>
                  <option value="Subcontractor">Subcontractor</option>
                  <option value="Design Assets">Design Assets</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  required
                  min="500"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Paid From Account</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpenseAccount('UBL')}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      expenseAccount === 'UBL'
                        ? 'bg-blue-50 border-blue-600 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Devsio UBL Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseAccount('UMAR_CASH')}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      expenseAccount === 'UMAR_CASH'
                        ? 'bg-amber-50 border-amber-600 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Umar Cash
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                >
                  Save Direct Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Assign Team Member */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Assign Team Member to Project</h3>
            <p className="text-xs text-slate-500 mt-1">Assign custom PKR allocation from Net Pool</p>

            <form onSubmit={handleAddTeamAssignment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Team Member (10 Pool)</label>
                <select
                  value={assignMemberId}
                  onChange={(e) => setAssignMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name} ({tm.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Specific Task / Role on Project</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Frontend Web Portal Dev"
                  value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Promised Allocation Amount (PKR)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={assignAmount}
                  onChange={(e) => setAssignAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-lg"
                >
                  Assign Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Log Team Payout */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Step 6: Log Team Payout Transaction</h3>
            <p className="text-xs text-slate-500 mt-1">Record payment dispatched to team member</p>

            <form onSubmit={handleDispatchPayoutSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Team Member</label>
                <select
                  value={payoutTeamMemberId}
                  onChange={(e) => setPayoutTeamMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="">-- Select Member --</option>
                  {activeProject.teamAssignments.map((ta) => (
                    <option key={ta.teamMemberId} value={ta.teamMemberId}>
                      {ta.teamMemberName} (Pending: {formatPKR(ta.promisedAmountPKR - ta.paidAmountPKR)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payout Amount (PKR)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dispatched From Account Head</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutAccount('UBL')}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      payoutAccount === 'UBL'
                        ? 'bg-blue-50 border-blue-600 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Devsio UBL Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutAccount('UMAR_CASH')}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      payoutAccount === 'UMAR_CASH'
                        ? 'bg-amber-50 border-amber-600 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    Umar Cash Head
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Ref / Transaction ID</label>
                <input
                  type="text"
                  required
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
                >
                  Confirm Payout & Update Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}

    </div>
  );
};
