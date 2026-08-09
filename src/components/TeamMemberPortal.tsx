import React, { useState } from 'react';
import { 
  TeamMember, 
  Project, 
  TeamPayout, 
  ProjectTask, 
  Client 
} from '../types';
import { formatPKR } from '../utils/financialCalculations';
import { 
  User, 
  Key, 
  Lock, 
  LogOut, 
  Building2, 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  ShieldCheck, 
  Save, 
  Phone, 
  Mail, 
  CreditCard, 
  Landmark, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Send,
  Sliders,
  ChevronRight,
  Briefcase
} from 'lucide-react';

interface TeamMemberPortalProps {
  teamMembers: TeamMember[];
  projects: Project[];
  clients: Client[];
  teamPayouts: TeamPayout[];
  currentMemberId: string | null;
  onLogin: (memberId: string) => void;
  onLogout: () => void;
  onUpdateMemberProfile: (updatedMember: TeamMember) => void;
  onUpdateTaskProgress: (
    projectId: string,
    taskId: string,
    completionPercentage: number,
    status: 'Pending' | 'In Progress' | 'In Review' | 'Completed' | 'Blocked',
    remarks: string,
    issuesLog: string
  ) => void;
  onSwitchToAdmin: () => void;
}

export const TeamMemberPortal: React.FC<TeamMemberPortalProps> = ({
  teamMembers,
  projects,
  clients,
  teamPayouts,
  currentMemberId,
  onLogin,
  onLogout,
  onUpdateMemberProfile,
  onUpdateTaskProgress,
  onSwitchToAdmin,
}) => {
  // Login State
  const [selectedLoginId, setSelectedLoginId] = useState<string>(teamMembers[0]?.id || '');
  const [passwordInput, setPasswordInput] = useState<string>('devsio2026');
  const [loginError, setLoginError] = useState<string>('');

  // Active Tab inside Portal
  const [portalTab, setPortalTab] = useState<'work' | 'financials' | 'profile'>('work');

  // Currently logged in member object
  const loggedMember = teamMembers.find((m) => m.id === currentMemberId);

  // Profile Form State
  const [editName, setEditName] = useState(loggedMember?.name || '');
  const [editFatherName, setEditFatherName] = useState(loggedMember?.fatherName || '');
  const [editCnic, setEditCnic] = useState(loggedMember?.cnic || '');
  const [editEmail, setEditEmail] = useState(loggedMember?.email || '');
  const [editPhone, setEditPhone] = useState(loggedMember?.phone || '');
  const [editEmergencyContact, setEditEmergencyContact] = useState(loggedMember?.emergencyContact || '');
  const [editBankName, setEditBankName] = useState(loggedMember?.bankName || '');
  const [editBankAccountTitle, setEditBankAccountTitle] = useState(loggedMember?.bankAccountTitle || '');
  const [editBankAccountNumber, setEditBankAccountNumber] = useState(loggedMember?.bankAccountNumber || '');
  const [editIban, setEditIban] = useState(loggedMember?.iban || '');
  const [editPassword, setEditPassword] = useState(loggedMember?.password || 'devsio2026');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Sync profile state when logged member changes
  React.useEffect(() => {
    if (loggedMember) {
      setEditName(loggedMember.name || '');
      setEditFatherName(loggedMember.fatherName || '');
      setEditCnic(loggedMember.cnic || '');
      setEditEmail(loggedMember.email || '');
      setEditPhone(loggedMember.phone || '');
      setEditEmergencyContact(loggedMember.emergencyContact || '');
      setEditBankName(loggedMember.bankName || '');
      setEditBankAccountTitle(loggedMember.bankAccountTitle || '');
      setEditBankAccountNumber(loggedMember.bankAccountNumber || '');
      setEditIban(loggedMember.iban || '');
      setEditPassword(loggedMember.password || 'devsio2026');
    }
  }, [currentMemberId, loggedMember]);

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const member = teamMembers.find((m) => m.id === selectedLoginId);
    if (!member) {
      setLoginError('Invalid team member account selection.');
      return;
    }
    // Allow matching password or default "devsio2026"
    if (passwordInput === (member.password || 'devsio2026') || passwordInput === 'devsio2026') {
      onLogin(member.id);
    } else {
      setLoginError('Incorrect password or security PIN. Default pin is devsio2026.');
    }
  };

  // Profile Save Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedMember) return;
    const updated: TeamMember = {
      ...loggedMember,
      name: editName,
      fatherName: editFatherName,
      cnic: editCnic,
      email: editEmail,
      phone: editPhone,
      emergencyContact: editEmergencyContact,
      bankName: editBankName,
      bankAccountTitle: editBankAccountTitle,
      bankAccountNumber: editBankAccountNumber,
      iban: editIban,
      password: editPassword,
      bankAccountDetails: `${editBankName} - ${editBankAccountNumber}`,
    };
    onUpdateMemberProfile(updated);
    setProfileSuccessMsg('Profile and KYC details updated successfully!');
    setTimeout(() => setProfileSuccessMsg(''), 4000);
  };

  // If not logged in, show login page
  if (!loggedMember) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Decorative Banner */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-8 text-white flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-[#00D2FF]/20 border border-[#00D2FF]/30 rounded-full text-[#00D2FF] text-xs font-bold mb-6">
                <ShieldCheck className="w-4 h-4" />
                <span>Devsio Member Portal</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight leading-tight">
                Team Member Authentication & Progress System
              </h2>
              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                Log in to view assigned clients, track project progress percentage, update work logs, report issues, and check payout ledgers.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700/60 space-y-3">
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Quick Demo Login Shortcuts:</p>
              <div className="space-y-1.5">
                {teamMembers.slice(0, 4).map((tm) => (
                  <button
                    key={tm.id}
                    type="button"
                    onClick={() => {
                      setSelectedLoginId(tm.id);
                      setPasswordInput(tm.password || 'devsio2026');
                      onLogin(tm.id);
                    }}
                    className="w-full text-left px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700/60 text-xs font-medium text-slate-200 flex items-center justify-between transition group"
                  >
                    <span>{tm.name} ({tm.role})</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Login Form */}
          <div className="md:col-span-7 p-8 flex flex-col justify-center bg-white">
            <h3 className="text-xl font-bold text-slate-900">Sign in to your Account</h3>
            <p className="text-xs text-slate-500 mt-1">Select your team profile and enter your PIN / password</p>

            {loginError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Team Member Account</label>
                <select
                  value={selectedLoginId}
                  onChange={(e) => setSelectedLoginId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.role} ({m.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password / Security PIN</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter security PIN (Default: devsio2026)"
                    className="w-full px-3.5 py-2.5 pl-9 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Default access code for all team members: <strong className="text-slate-600">devsio2026</strong></p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onSwitchToAdmin}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold"
                >
                  ← Return to Executive Dashboard
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5"
                >
                  <span>Sign In</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Find all assigned tasks and project commitments for this member
  const memberTasks: ProjectTask[] = [];
  projects.forEach((proj) => {
    proj.tasks?.forEach((t) => {
      if (t.assignedTeamMemberId === loggedMember.id) {
        memberTasks.push({
          ...t,
          projectTitle: proj.projectTitle,
        });
      }
    });
  });

  // Calculate Member Financial Balance
  let totalPromised = 0;
  let totalPaidOut = 0;

  projects.forEach((p) => {
    p.teamAssignments.forEach((ta) => {
      if (ta.teamMemberId === loggedMember.id) {
        totalPromised += ta.promisedAmountPKR;
        totalPaidOut += ta.paidAmountPKR;
      }
    });
  });

  // Filter payouts history
  const myPayouts = teamPayouts.filter((p) => p.teamMemberId === loggedMember.id);
  const totalBalanceRemaining = Math.max(0, totalPromised - totalPaidOut);

  return (
    <div className="space-y-6">
      {/* Logged in Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={loggedMember.avatar}
            alt={loggedMember.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-[#00D2FF] shrink-0"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">{loggedMember.name}</h2>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold bg-[#00D2FF]/20 text-[#00D2FF] rounded-full border border-[#00D2FF]/30">
                {loggedMember.role}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center space-x-3">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {loggedMember.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {loggedMember.phone}
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            type="button"
            onClick={onSwitchToAdmin}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition"
          >
            Admin View
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Portal Navigation Sub-tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
        <button
          type="button"
          onClick={() => setPortalTab('work')}
          className={`flex-1 py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 ${
            portalTab === 'work'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-[#2563EB]" />
          <span>My Work Progress & Tasks ({memberTasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setPortalTab('financials')}
          className={`flex-1 py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 ${
            portalTab === 'financials'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-600" />
          <span>Payouts & Earnings Ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setPortalTab('profile')}
          className={`flex-1 py-2.5 px-4 rounded-xl transition flex items-center justify-center space-x-2 ${
            portalTab === 'profile'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 text-purple-600" />
          <span>Personal Account & Bank KYC</span>
        </button>
      </div>

      {/* TAB 1: WORK PROGRESS & TASKS */}
      {portalTab === 'work' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assigned Client Tasks & Progress Log</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update completion percentage, status, technical remarks, and report blockers or issues
                </p>
              </div>
            </div>

            {memberTasks.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No Assigned Tasks Found</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  You do not currently have individual project tasks assigned in the system.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {memberTasks.map((t) => (
                  <TaskProgressCard
                    key={t.id}
                    task={t}
                    onSave={(percentage, status, remarks, issues) => {
                      onUpdateTaskProgress(t.projectId, t.id, percentage, status, remarks, issues);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIALS & PAYOUT LEDGER */}
      {portalTab === 'financials' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Promised / Earned</span>
              <p className="text-xl font-mono font-extrabold text-slate-900 mt-1">{formatPKR(totalPromised)}</p>
              <span className="text-[10px] text-slate-500 mt-1 block">Contracted across all project commitments</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Disbursed / Paid</span>
              <p className="text-xl font-mono font-extrabold text-emerald-700 mt-1">{formatPKR(totalPaidOut)}</p>
              <span className="text-[10px] text-emerald-600 font-semibold mt-1 block">Received in Bank Account</span>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Outstanding Balance Due</span>
              <p className={`text-xl font-mono font-extrabold mt-1 ${totalBalanceRemaining > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                {formatPKR(totalBalanceRemaining)}
              </p>
              <span className="text-[10px] text-slate-500 mt-1 block">Remaining to be paid by Devsio</span>
            </div>
          </div>

          {/* Payout History Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Received Payout Transactions</h3>
            
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Project Title</th>
                    <th className="py-2.5 px-3">Receipt / Bank Ref</th>
                    <th className="py-2.5 px-3">Paid From Account</th>
                    <th className="py-2.5 px-3 text-right">Amount Disbursed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {myPayouts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No recorded payout disbursements for your account yet.
                      </td>
                    </tr>
                  ) : (
                    myPayouts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{p.date}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{p.projectTitle}</td>
                        <td className="py-2.5 px-3 text-blue-700 font-mono">{p.receiptRef}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-800 rounded">
                            {p.paidFromAccount}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold font-mono text-emerald-700">
                          {formatPKR(p.amountPKR)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PERSONAL ACCOUNT & BANK KYC */}
      {portalTab === 'profile' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6 max-w-3xl">
          <div>
            <h3 className="text-base font-bold text-slate-900">Personal & Bank KYC Profile</h3>
            <p className="text-xs text-slate-500 mt-1">
              Keep your official identification, contact, and bank account information updated for salary and payout routing.
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Father's Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Malik"
                  value={editFatherName}
                  onChange={(e) => setEditFatherName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">CNIC / National ID Card *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 35202-1234567-1"
                  value={editCnic}
                  onChange={(e) => setEditCnic(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (+92) *</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Emergency Contact Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +92 300 9988771"
                  value={editEmergencyContact}
                  onChange={(e) => setEditEmergencyContact(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <hr className="border-slate-100 my-2" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Bank Account & IBAN Details</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Meezan Bank Ltd / UBL"
                  value={editBankName}
                  onChange={(e) => setEditBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Title *</label>
                <input
                  type="text"
                  required
                  value={editBankAccountTitle}
                  onChange={(e) => setEditBankAccountTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 010203040506"
                  value={editBankAccountNumber}
                  onChange={(e) => setEditBankAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">IBAN *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PK36MEZN0001020304050601"
                  value={editIban}
                  onChange={(e) => setEditIban(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Portal Login Password / Security PIN</label>
              <input
                type="text"
                required
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile & KYC Information</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// Sub-component for editing task progress
const TaskProgressCard: React.FC<{
  task: ProjectTask;
  onSave: (
    percentage: number,
    status: 'Pending' | 'In Progress' | 'In Review' | 'Completed' | 'Blocked',
    remarks: string,
    issues: string
  ) => void;
}> = ({ task, onSave }) => {
  const [percentage, setPercentage] = useState<number>(task.completionPercentage || 0);
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'In Review' | 'Completed' | 'Blocked'>(
    task.status || 'In Progress'
  );
  const [remarks, setRemarks] = useState<string>(task.remarks || '');
  const [issues, setIssues] = useState<string>(task.issuesLog || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(percentage, status, remarks, issues);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const unpaid = Math.max(0, task.amountPKR - task.paidAmountPKR);

  return (
    <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 shadow-2xs space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-800 rounded border border-blue-200">
              {task.domainInfo}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Task ID: {task.id}</span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 mt-1">{task.taskTitle}</h4>
          <p className="text-xs text-blue-700 font-semibold">{task.companyName} — {task.projectTitle}</p>
        </div>

        <div className="flex items-center gap-4 text-right shrink-0">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Task Earned</span>
            <span className="text-xs font-mono font-bold text-slate-900">{formatPKR(task.amountPKR)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Outstanding</span>
            <span className={`text-xs font-mono font-bold ${unpaid > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              {formatPKR(unpaid)}
            </span>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
        {task.taskDetails}
      </p>

      {/* Progress Form */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 rounded-xl border border-slate-200/80">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">Amount of Work Completed (%)</label>
              <span className="text-xs font-mono font-extrabold text-blue-700">{percentage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={percentage}
              onChange={(e) => setPercentage(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden border border-slate-200">
              <div
                className={`h-full transition-all duration-300 ${
                  percentage === 100
                    ? 'bg-emerald-500'
                    : percentage > 50
                    ? 'bg-blue-600'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Work Progress Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as 'Pending' | 'In Progress' | 'In Review' | 'Completed' | 'Blocked'
                )
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold"
            >
              <option value="Pending">Pending / Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="In Review">In Review / QA</option>
              <option value="Completed">Completed & Verified</option>
              <option value="Blocked">Blocked / Technical Issue</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Progress Remarks & Technical Notes</label>
            <textarea
              rows={2}
              placeholder="Detail technical progress, API integrations complete, or next steps..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Issues Log / Client Blockers</label>
            <textarea
              rows={2}
              placeholder="Report any technical blockers, missing credentials, or dependencies..."
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-rose-800 placeholder-slate-400"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          {savedSuccess ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Progress updated successfully!</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">
              Last updated: {task.lastUpdated || 'Just now'}
            </span>
          )}

          <button
            type="submit"
            className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs rounded-lg shadow-2xs transition flex items-center space-x-1"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Progress Update</span>
          </button>
        </div>
      </form>
    </div>
  );
};
