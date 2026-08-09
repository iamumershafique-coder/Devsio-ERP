import React, { useState } from 'react';
import { 
  UserCheck, 
  Mail, 
  Phone, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  Landmark, 
  Wallet,
  Plus,
  CreditCard,
  Briefcase,
  CheckSquare
} from 'lucide-react';
import { TeamMember, Project, TeamPayout, AccountHead, ProjectTask } from '../types';
import { formatPKR, exportToCSV, generateFinancialPDFReport } from '../utils/financialCalculations';

interface TeamDirectoryLedgerProps {
  teamMembers: TeamMember[];
  projects: Project[];
  payouts: TeamPayout[];
  searchQuery: string;
  onLogTeamPayout: (
    projectId: string,
    teamMemberId: string,
    teamMemberName: string,
    amountPKR: number,
    paidFromAccount: AccountHead,
    receiptRef: string
  ) => void;
  onAddTeamMember?: (
    name: string,
    role: string,
    email: string,
    phone: string,
    defaultCutPercentage: number
  ) => void;
  onUpdateTeamMember?: (member: TeamMember) => void;
  onAssignTask?: (
    projectId: string,
    taskTitle: string,
    taskDetails: string,
    domainInfo: string,
    assignedTeamMemberId: string,
    assignedTeamMemberName: string,
    amountPKR: number,
    dueDate: string
  ) => void;
}

export const TeamDirectoryLedger: React.FC<TeamDirectoryLedgerProps> = ({
  teamMembers,
  projects,
  payouts,
  searchQuery,
  onLogTeamPayout,
  onAddTeamMember,
  onUpdateTeamMember,
  onAssignTask,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(teamMembers[0]?.id || '');
  
  // Payout Modal State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [payoutAmount, setPayoutAmount] = useState<number>(15000);
  const [payoutAccount, setPayoutAccount] = useState<AccountHead>('UBL');
  const [receiptRef, setReceiptRef] = useState(`TXN-DEV-${Date.now().toString().slice(-6)}`);

  // Add Member Modal State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('Senior Full Stack Dev');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPhone, setMemberPhone] = useState('+92 300 ');
  const [memberCut, setMemberCut] = useState(15);

  // Edit Member Modal State
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editMemberData, setEditMemberData] = useState<Partial<TeamMember>>({});

  // Assign Task Modal State
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [taskProjectId, setTaskProjectId] = useState<string>(projects[0]?.id || '');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDetails, setTaskDetails] = useState('');
  const [taskDomainInfo, setTaskDomainInfo] = useState('Fintech / Banking API');
  const [taskAmountPKR, setTaskAmountPKR] = useState<number>(45000);
  const [taskDueDate, setTaskDueDate] = useState<string>('2026-08-25');

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (memberName.trim() && memberEmail.trim() && onAddTeamMember) {
      onAddTeamMember(memberName, memberRole, memberEmail, memberPhone, memberCut);
      setShowAddMemberModal(false);
      setMemberName('');
      setMemberEmail('');
    }
  };

  const filteredMembers = teamMembers.filter(
    (tm) =>
      tm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tm.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tm.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMember = teamMembers.find((tm) => tm.id === selectedMemberId) || teamMembers[0];

  // Calculate stats for selected member
  const memberAssignments: { project: Project; roleOnProject: string; promised: number; paid: number }[] = [];
  let totalPromised = 0;
  let totalPaid = 0;

  projects.forEach((p) => {
    p.teamAssignments.forEach((ta) => {
      if (ta.teamMemberId === selectedMember?.id) {
        memberAssignments.push({
          project: p,
          roleOnProject: ta.roleOnProject,
          promised: ta.promisedAmountPKR,
          paid: ta.paidAmountPKR,
        });
        totalPromised += ta.promisedAmountPKR;
        totalPaid += ta.paidAmountPKR;
      }
    });
  });

  // Collect assigned tasks for selected member
  const memberTasks: ProjectTask[] = [];
  projects.forEach((p) => {
    p.tasks?.forEach((t) => {
      if (t.assignedTeamMemberId === selectedMember?.id) {
        memberTasks.push(t);
      }
    });
  });

  const balanceOutstanding = Math.max(0, totalPromised - totalPaid);

  // Filter payouts for this team member
  const memberPayoutHistory = payouts.filter((p) => p.teamMemberId === selectedMember?.id);

  // Handle Payout Submit
  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMember && selectedProjectId && payoutAmount > 0) {
      onLogTeamPayout(
        selectedProjectId,
        selectedMember.id,
        selectedMember.name,
        payoutAmount,
        payoutAccount,
        receiptRef
      );

      setShowPayoutModal(false);
      setPayoutAmount(15000);
    }
  };

  // Export CSV for All Members
  const handleExportCSV = () => {
    const headers = ['Member ID', 'Name', 'Role', 'Email', 'Phone', 'Promised Earnings (PKR)', 'Payments Dispatched (PKR)', 'Outstanding Balance (PKR)'];
    const rows = teamMembers.map((tm) => {
      let promised = 0;
      let paid = 0;
      projects.forEach((p) => {
        p.teamAssignments.forEach((ta) => {
          if (ta.teamMemberId === tm.id) {
            promised += ta.promisedAmountPKR;
            paid += ta.paidAmountPKR;
          }
        });
      });
      return [tm.id, tm.name, tm.role, tm.email, tm.phone, promised, paid, Math.max(0, promised - paid)];
    });

    exportToCSV('devsio_team_directory_ledger', headers, rows);
  };

  // Export Selected Member Statement PDF
  const handleExportMemberPDF = () => {
    if (!selectedMember) return;

    const headers = ['Project Title', 'Role on Project', 'Promised (PKR)', 'Paid (PKR)', 'Outstanding (PKR)'];
    const rows = memberAssignments.map((ma) => [
      ma.project.projectTitle,
      ma.roleOnProject,
      ma.promised.toLocaleString('en-PK'),
      ma.paid.toLocaleString('en-PK'),
      (ma.promised - ma.paid).toLocaleString('en-PK'),
    ]);

    const summary = [
      { label: 'Total Promised', value: formatPKR(totalPromised) },
      { label: 'Total Dispatched', value: formatPKR(totalPaid) },
      { label: 'Outstanding Balance', value: formatPKR(balanceOutstanding) },
    ];

    generateFinancialPDFReport(
      `Team Member Statement - ${selectedMember.name}`,
      `Role: ${selectedMember.role} (${selectedMember.id})`,
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
            <h1 className="text-xl font-bold text-slate-900">Team Members Directory & Individual Ledgers</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-[#2563EB]/10 text-[#2563EB] rounded-full">
              10 Member Pool
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track individual team member earnings, assigned project payouts, and outstanding payable balances.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => {
              if (selectedMember) {
                setTaskProjectId(projects[0]?.id || '');
                setShowAssignTaskModal(true);
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#00D2FF] text-slate-950 hover:bg-cyan-400 text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Briefcase className="w-4 h-4" />
            <span>Assign Task</span>
          </button>

          <button
            onClick={() => setShowAddMemberModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Team Member</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid: 10 Members List + Member Detailed Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Team Directory Cards */}
        <div className="lg:col-span-5 space-y-3">
          {filteredMembers.map((tm) => {
            let promised = 0;
            let paid = 0;
            projects.forEach((p) => {
              p.teamAssignments.forEach((ta) => {
                if (ta.teamMemberId === tm.id) {
                  promised += ta.promisedAmountPKR;
                  paid += ta.paidAmountPKR;
                }
              });
            });
            const outstanding = Math.max(0, promised - paid);
            const isSelected = tm.id === selectedMemberId;

            return (
              <div
                key={tm.id}
                onClick={() => setSelectedMemberId(tm.id)}
                className={`bg-white rounded-2xl p-4 border transition cursor-pointer relative ${
                  isSelected
                    ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={tm.avatar}
                    alt={tm.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{tm.name}</h3>
                      <span className="text-[10px] font-extrabold text-slate-400">{tm.id}</span>
                    </div>
                    <p className="text-xs text-[#2563EB] font-medium">{tm.role}</p>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Promised</p>
                    <p className="font-bold text-slate-900">{formatPKR(promised)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Outstanding Balance</p>
                    <p className={`font-bold ${outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatPKR(outstanding)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Member Detailed Ledger */}
        <div className="lg:col-span-7">
          {selectedMember ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              
              {/* Member Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedMember.avatar}
                    alt={selectedMember.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#2563EB]"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-xl font-bold text-slate-900">{selectedMember.name}</h2>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md">
                        {selectedMember.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#2563EB] font-semibold">{selectedMember.role}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedMember.email} • {selectedMember.phone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setEditMemberData({ ...selectedMember });
                      setShowEditMemberModal(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center space-x-1"
                  >
                    <span>Edit Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      if (memberAssignments.length > 0) {
                        setSelectedProjectId(memberAssignments[0].project.id);
                        setShowPayoutModal(true);
                      }
                    }}
                    disabled={memberAssignments.length === 0}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Pay Member</span>
                  </button>

                  <button
                    onClick={handleExportMemberPDF}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition"
                    title="Export PDF Statement"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-[#00D2FF]" />
                  </button>
                </div>
              </div>

              {/* KYC & Verification Details Grid */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Father's Name</p>
                  <p className="font-bold text-slate-800">{selectedMember.fathersName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">CNIC / ID Card</p>
                  <p className="font-bold text-slate-800 font-mono">{selectedMember.idCardNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Bank / IBAN</p>
                  <p className="font-bold text-slate-800 font-mono text-[11px] truncate">{selectedMember.bankIban || selectedMember.bankAccountDetails || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">Emergency Contact</p>
                  <p className="font-bold text-slate-800">{selectedMember.emergencyContact || 'N/A'}</p>
                </div>
              </div>

              {/* Financial KPI Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Total Promised</p>
                  <p className="text-sm font-extrabold text-slate-900 mt-0.5">{formatPKR(totalPromised)}</p>
                </div>
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                  <p className="text-[10px] text-emerald-700 uppercase font-bold">Total Paid to Date</p>
                  <p className="text-sm font-extrabold text-emerald-800 mt-0.5">{formatPKR(totalPaid)}</p>
                </div>
                <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200">
                  <p className="text-[10px] text-rose-700 uppercase font-bold">Balance Outstanding</p>
                  <p className="text-sm font-extrabold text-rose-800 mt-0.5">{formatPKR(balanceOutstanding)}</p>
                </div>
              </div>

              {/* Bank Account Details */}
              {selectedMember.bankAccountDetails && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-3 text-xs text-slate-700">
                  <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    <strong>Payout Destination:</strong> {selectedMember.bankAccountDetails}
                  </span>
                </div>
              )}

              {/* Project Assignments Ledger Table */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Assigned Projects Ledger</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                        <th className="py-2.5 px-3">Project</th>
                        <th className="py-2.5 px-3">Role</th>
                        <th className="py-2.5 px-3">Promised</th>
                        <th className="py-2.5 px-3">Paid</th>
                        <th className="py-2.5 px-3 text-right">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {memberAssignments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400">
                            No project assignments found for this team member.
                          </td>
                        </tr>
                      ) : (
                        memberAssignments.map((ma, idx) => {
                          const outstanding = Math.max(0, ma.promised - ma.paid);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3">
                                <p className="font-bold text-slate-900">{ma.project.projectTitle}</p>
                                <p className="text-[10px] text-slate-400">{ma.project.companyName}</p>
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">{ma.roleOnProject}</td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">{formatPKR(ma.promised)}</td>
                              <td className="py-2.5 px-3 font-bold text-emerald-700">{formatPKR(ma.paid)}</td>
                              <td className={`py-2.5 px-3 text-right font-bold ${outstanding > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                {formatPKR(outstanding)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assigned Tasks & Domain Info Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                    <CheckSquare className="w-4 h-4 text-[#2563EB]" />
                    <span>Assigned Tasks & Domain Information</span>
                  </h3>
                  <button
                    onClick={() => {
                      setTaskProjectId(projects[0]?.id || '');
                      setShowAssignTaskModal(true);
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Assign Task</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                        <th className="py-2.5 px-3">Company & Task Details</th>
                        <th className="py-2.5 px-3">Work Progress</th>
                        <th className="py-2.5 px-3">Domain Info</th>
                        <th className="py-2.5 px-3">Task Amount</th>
                        <th className="py-2.5 px-3">Paid</th>
                        <th className="py-2.5 px-3 text-right">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {memberTasks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-slate-400">
                            No individual tasks assigned to this team member yet.
                          </td>
                        </tr>
                      ) : (
                        memberTasks.map((t) => {
                          const unpaid = Math.max(0, t.amountPKR - t.paidAmountPKR);
                          const pct = t.completionPercentage ?? (t.status === 'Completed' ? 100 : 50);
                          return (
                            <tr key={t.id} className="hover:bg-slate-50">
                              <td className="py-2.5 px-3">
                                <p className="font-bold text-slate-900">{t.taskTitle}</p>
                                <p className="text-[10px] text-blue-600 font-semibold">{t.companyName}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5">{t.taskDetails}</p>
                                {t.remarks && <p className="text-[10px] text-slate-600 italic mt-0.5">Remarks: {t.remarks}</p>}
                                {t.issuesLog && <p className="text-[10px] text-rose-600 font-medium mt-0.5">Issue: {t.issuesLog}</p>}
                              </td>
                              <td className="py-2.5 px-3 min-w-[120px]">
                                <div className="flex items-center justify-between text-[10px] font-bold text-slate-700 mb-1">
                                  <span>{pct}% Done</span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                                    t.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                    t.status === 'Blocked' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                                  }`}>{t.status}</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      t.status === 'Completed' ? 'bg-emerald-600' :
                                      t.status === 'Blocked' ? 'bg-rose-500' : 'bg-[#2563EB]'
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                                  {t.domainInfo}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900">{formatPKR(t.amountPKR)}</td>
                              <td className="py-2.5 px-3 font-bold text-emerald-700">{formatPKR(t.paidAmountPKR)}</td>
                              <td className={`py-2.5 px-3 text-right font-bold ${unpaid > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                {formatPKR(unpaid)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment History Log */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3">Payout Transaction Log</h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Project</th>
                        <th className="py-2.5 px-3">Paid From</th>
                        <th className="py-2.5 px-3">Reference</th>
                        <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {memberPayoutHistory.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400">
                            No payment transactions recorded yet.
                          </td>
                        </tr>
                      ) : (
                        memberPayoutHistory.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 text-slate-600">{p.date}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">{p.projectTitle}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">
                              {p.paidFromAccount === 'UBL' ? 'Devsio UBL Bank' : 'Umar Cash Head'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">{p.receiptRef}</td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">
                              +{formatPKR(p.amountPKR)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400">
              Select a team member to view ledger
            </div>
          )}
        </div>

      </div>

      {/* Pay Member Modal */}
      {showPayoutModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Dispatch Payment to {selectedMember.name}</h3>
            <p className="text-xs text-slate-500 mt-1">Record payment and update team ledger</p>

            <form onSubmit={handlePayoutSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {memberAssignments.map((ma) => (
                    <option key={ma.project.id} value={ma.project.id}>
                      {ma.project.projectTitle} (Pending: {formatPKR(ma.promised - ma.paid)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (PKR)</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Paid From Account Head</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Reference / Txn ID</label>
                <input
                  type="text"
                  required
                  value={receiptRef}
                  onChange={(e) => setReceiptRef(e.target.value)}
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
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Team Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <h3 className="text-lg font-bold text-slate-900">Add New Team Member</h3>
            <p className="text-xs text-slate-500 mt-1">Register a developer, designer, or lead to the agency directory</p>

            <form onSubmit={handleAddMemberSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Usama Khan"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Agency Role / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Full Stack Developer"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="dev@devsioservices.com"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Default Allocation Cut %</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="50"
                  value={memberCut}
                  onChange={(e) => setMemberCut(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-lg shadow-sm"
                >
                  Add Team Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Task Modal */}
      {showAssignTaskModal && selectedMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <h3 className="text-lg font-bold text-slate-900">Assign Admin Task to {selectedMember.name}</h3>
            <p className="text-xs text-slate-500 mt-1">Specify company, task details, domain info, and task amount</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const targetProject = projects.find((p) => p.id === taskProjectId);
                if (targetProject && taskTitle.trim() && onAssignTask) {
                  onAssignTask(
                    targetProject.id,
                    taskTitle,
                    taskDetails || taskTitle,
                    taskDomainInfo,
                    selectedMember.id,
                    selectedMember.name,
                    taskAmountPKR,
                    taskDueDate
                  );
                  setShowAssignTaskModal(false);
                  setTaskTitle('');
                  setTaskDetails('');
                }
              }}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Client Company / Project *</label>
                <select
                  value={taskProjectId}
                  onChange={(e) => setTaskProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.companyName} — {p.projectTitle} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Implement OAuth2 & JWT Middleware"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Domain Information *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fintech / Core Banking"
                    value={taskDomainInfo}
                    onChange={(e) => setTaskDomainInfo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Task Details & Description</label>
                <textarea
                  rows={2}
                  placeholder="Detailed technical specifications, endpoint requirements, or deliverables..."
                  value={taskDetails}
                  onChange={(e) => setTaskDetails(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Task Amount (PKR) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    value={taskAmountPKR}
                    onChange={(e) => setTaskAmountPKR(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Task Due Date *</label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-900">
                <p className="font-bold">Financial Calculation Note:</p>
                <p>This task amount (<strong>{formatPKR(taskAmountPKR)}</strong>) will be recorded and added to the total team member liabilities & project outstanding balance.</p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAssignTaskModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-[#00D2FF] hover:bg-cyan-400 rounded-lg shadow-sm"
                >
                  Confirm & Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Member Profile Modal */}
      {showEditMemberModal && editMemberData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900">Edit Member Profile ({editMemberData.name})</h3>
            <p className="text-xs text-slate-500 mt-0.5">Update team member information, KYC, and bank details</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onUpdateTeamMember && editMemberData.id) {
                  onUpdateTeamMember(editMemberData as TeamMember);
                  setShowEditMemberModal(false);
                }
              }}
              className="mt-4 space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editMemberData.name || ''}
                    onChange={(e) => setEditMemberData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={editMemberData.fathersName || ''}
                    onChange={(e) => setEditMemberData((prev) => ({ ...prev, fathersName: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Designation / Role *</label>
                  <input
                    type="text"
                    required
                    value={editMemberData.role || ''}
                    onChange={(e) => setEditMemberData((prev) => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">CNIC / National ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="35202-XXXXXXX-X"
                    value={editMemberData.idCardNumber || ''}
                    onChange={(e) => setEditMemberData((prev) => ({ ...prev, idCardNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editMemberData.email || ''}
                    onChange={(e) => setEditMemberData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={editMemberData.phone || ''}
                    onChange={(e) => setEditMemberData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Number</label>
                  <input
                    type="text"
                    value={editMemberData.emergencyContact || ''}
                    onChange={(e) => setEditMemberData((prev) => ({ ...prev, emergencyContact: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Password (Login)</label>
                  <input
                    type="text"
                    value={editMemberData.password || ''}
                    onChange={(e) => setEditMemberData((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-800 mb-2">Bank & Payout Account Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Meezan Bank / HBL"
                      value={editMemberData.bankName || ''}
                      onChange={(e) => setEditMemberData((prev) => ({ ...prev, bankName: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Title / Name</label>
                    <input
                      type="text"
                      placeholder="Account Title"
                      value={editMemberData.bankAccountTitle || ''}
                      onChange={(e) => setEditMemberData((prev) => ({ ...prev, bankAccountTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Account Number / IBAN</label>
                    <input
                      type="text"
                      placeholder="PKXX MEZN 0000 0000 0000 0000"
                      value={editMemberData.bankIban || editMemberData.bankAccountDetails || ''}
                      onChange={(e) =>
                        setEditMemberData((prev) => ({
                          ...prev,
                          bankIban: e.target.value,
                          bankAccountDetails: `${prev.bankName || 'Bank'}: ${e.target.value}`,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditMemberModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-lg shadow-sm"
                >
                  Save Member Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
