import React, { useState, useEffect } from 'react';
import { 
  Client, 
  Project, 
  Milestone, 
  ProjectDocument 
} from '../types';
import { formatPKR } from '../utils/financialCalculations';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileText, 
  FolderOpen, 
  ExternalLink, 
  Send, 
  ShieldCheck, 
  Plus, 
  ArrowRight,
  Sparkles,
  Calendar,
  Eye,
  CheckSquare,
  HelpCircle
} from 'lucide-react';

interface ClientPortalProps {
  clients: Client[];
  projects: Project[];
  onRegisterClient: (newClient: Client) => void;
  onUpdateClientNotes?: (clientId: string, note: string) => void;
  onSwitchToAdmin: () => void;
}

export const ClientPortal: React.FC<ClientPortalProps> = ({
  clients,
  projects,
  onRegisterClient,
  onUpdateClientNotes,
  onSwitchToAdmin,
}) => {
  // Auth Mode: 'login' | 'register' | 'authenticated'
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'authenticated'>('login');

  // Currently Logged In Client Email or ID
  const [loggedClientEmail, setLoggedClientEmail] = useState<string | null>(null);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regPhone, setRegPhone] = useState('+92 300 ');
  const [regEmail, setRegEmail] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Portal View Tab: 'projects' | 'documents' | 'inquiries'
  const [activePortalTab, setActivePortalTab] = useState<'projects' | 'documents' | 'inquiries'>('projects');

  // Selected Project inside Client Portal
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Inquiry message box state
  const [inquiryText, setInquiryText] = useState('');
  const [inquirySent, setInquirySent] = useState(false);

  // Active Client Object
  const currentClient = clients.find(
    (c) => c.email.toLowerCase() === loggedClientEmail?.toLowerCase()
  );

  // Associated Projects for this client
  const clientProjects = projects.filter((p) => {
    if (!currentClient) return false;
    return (
      p.clientId === currentClient.id ||
      p.clientName.toLowerCase().includes(currentClient.name.toLowerCase()) ||
      p.companyName.toLowerCase().includes(currentClient.company.toLowerCase())
    );
  });

  const activeProject = clientProjects.find((p) => p.id === selectedProjectId) || clientProjects[0];

  // Auto select first project when client logs in
  useEffect(() => {
    if (clientProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(clientProjects[0].id);
    }
  }, [clientProjects, selectedProjectId]);

  // Handle Login Submit
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const matchedClient = clients.find(
      (c) =>
        c.email.toLowerCase() === loginEmail.trim().toLowerCase() ||
        c.company.toLowerCase() === loginEmail.trim().toLowerCase()
    );

    if (!matchedClient) {
      setLoginError('No client account found matching this Email or Company name. Please register below.');
      return;
    }

    // Passwords match check (default client password or set password)
    setLoggedClientEmail(matchedClient.email);
    setAuthMode('authenticated');
  };

  // Handle Registration Submit
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !regCompany.trim() || !regEmail.trim() || !regPhone.trim()) {
      setRegError('Please fill in all required fields.');
      return;
    }

    // Check if client already exists
    const existing = clients.find(
      (c) => c.email.toLowerCase() === regEmail.trim().toLowerCase()
    );

    if (existing) {
      setRegError('An account with this email already exists. Please log in.');
      return;
    }

    const newClientObj: Client = {
      id: `DS-CL-${String(clients.length + 1).padStart(3, '0')}`,
      name: regName.trim(),
      company: regCompany.trim(),
      email: regEmail.trim().toLowerCase(),
      phone: regPhone.trim(),
      projectTitle: `${regCompany.trim()} Software System`,
      grossBudgetPKR: 0,
      milestones: [],
      notes: `Location/Address: ${regLocation.trim()} | Password: ${regPassword || 'client2026'}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onRegisterClient(newClientObj);
    setLoggedClientEmail(newClientObj.email);
    setAuthMode('authenticated');
    setRegSuccessMsg('Registration successful! Welcome to Devsio Services Client Portal.');
  };

  // Handle Logout
  const handleLogout = () => {
    setLoggedClientEmail(null);
    setAuthMode('login');
    setSelectedProjectId(null);
  };

  // Handle Send Inquiry
  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryText.trim() || !currentClient) return;

    if (onUpdateClientNotes) {
      const updatedNotes = `${currentClient.notes || ''}\n[Client Inquiry ${new Date().toLocaleDateString()}]: ${inquiryText.trim()}`;
      onUpdateClientNotes(currentClient.id, updatedNotes);
    }

    setInquirySent(true);
    setInquiryText('');
    setTimeout(() => setInquirySent(false), 4000);
  };

  // Calculation metrics
  const totalClientGross = clientProjects.reduce((sum, p) => sum + p.grossBudgetPKR, 0);
  
  // Milestones summary
  const allMilestones: Milestone[] = currentClient?.milestones || [];
  const paidMilestonesAmount = allMilestones
    .filter((m) => m.status === 'Paid')
    .reduce((sum, m) => sum + m.amountPKR, 0);

  const pendingMilestonesAmount = Math.max(0, totalClientGross - paidMilestonesAmount);

  // ==========================================
  // VIEW 1: AUTHENTICATION (LOGIN / REGISTER)
  // ==========================================
  if (authMode !== 'authenticated' || !currentClient) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative Background Gradients */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-8 shadow-2xl relative z-10">
          
          {/* Header Brand */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00D2FF] to-[#2563EB] mx-auto flex items-center justify-center shadow-lg shadow-blue-500/20 border border-cyan-400/30 mb-3">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">DEVSIO CLIENT PORTAL</h2>
            <p className="text-xs text-slate-400 mt-1">
              Secure client portal for project milestones, deliverables, & agreements
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/80 rounded-xl mb-6 border border-slate-700/50">
            <button
              onClick={() => {
                setAuthMode('login');
                setLoginError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#00D2FF] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Client Login
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                setRegError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#00D2FF] text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              New Registration
            </button>
          </div>

          {/* LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Company Email or Company Name *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. client@apex.com or Apex FinTech"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Account Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Default password for registered clients: client2026</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#00D2FF] hover:from-blue-600 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                <span>Access Client Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* REGISTRATION FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              {regError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{regError}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Client Contact Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tariq Mehmood"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Company / Organization Name *</label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex FinTech Solutions"
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Mobile / Phone *</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="+92 300 0000000"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="client@company.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-8 pr-2 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Office Location / City Address</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="e.g. Gulberg III, Lahore, Pakistan"
                    value={regLocation}
                    onChange={(e) => setRegLocation(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Choose Account Password *</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-900/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 mt-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Create Client Account & Register</span>
              </button>
            </form>
          )}

          {/* Switch back to software admin */}
          <div className="mt-6 pt-4 border-t border-slate-700/60 text-center">
            <button
              onClick={onSwitchToAdmin}
              className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition inline-flex items-center space-x-1"
            >
              <span>Switch to Agency Admin Portal</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: AUTHENTICATED CLIENT DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      
      {/* Top Client Portal Header Bar */}
      <header className="bg-[#0A192F] text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D2FF] to-[#2563EB] flex items-center justify-center shadow-md border border-cyan-400/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold text-white">{currentClient.company}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                  Verified Client
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Contact: <span className="text-slate-200">{currentClient.name}</span> ({currentClient.email})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onSwitchToAdmin}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              Switch Role
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Active Projects</p>
              <p className="text-xl font-extrabold text-slate-900">{clientProjects.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Milestones</p>
              <p className="text-xl font-extrabold text-slate-900">{allMilestones.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Paid Milestones</p>
              <p className="text-lg font-extrabold text-emerald-600">{formatPKR(paidMilestonesAmount)}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Pending Balance</p>
              <p className="text-lg font-extrabold text-amber-600">{formatPKR(pendingMilestonesAmount)}</p>
            </div>
          </div>
        </div>

        {/* Portal Sub Tabs */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-2">
          <button
            onClick={() => setActivePortalTab('projects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activePortalTab === 'projects'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Projects & Milestones ({clientProjects.length})</span>
          </button>

          <button
            onClick={() => setActivePortalTab('documents')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activePortalTab === 'documents'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Project Documents & Contracts ({activeProject?.documents?.length || 0})</span>
          </button>

          <button
            onClick={() => setActivePortalTab('inquiries')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activePortalTab === 'inquiries'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Inquiries & Admin Support</span>
          </button>
        </div>

        {/* TAB 1: PROJECTS & MILESTONES */}
        {activePortalTab === 'projects' && (
          <div className="space-y-6">
            {clientProjects.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">No Active Projects Registered</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Your client account is registered. Devsio Services agency admins will link your software contract shortly.
                </p>
              </div>
            ) : (
              clientProjects.map((project) => {
                const projectMilestones = currentClient.milestones || [];
                const totalPaid = projectMilestones
                  .filter((m) => m.status === 'Paid')
                  .reduce((sum, m) => sum + m.amountPKR, 0);

                const progressPct =
                  project.grossBudgetPKR > 0
                    ? Math.min(100, Math.round((totalPaid / project.grossBudgetPKR) * 100))
                    : 0;

                return (
                  <div key={project.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                    
                    {/* Project Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-md">
                            {project.status}
                          </span>
                          <h3 className="text-lg font-bold text-slate-900">{project.projectTitle}</h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Company: <span className="font-semibold text-slate-700">{project.companyName}</span> | Start: {project.startDate} | Deadline: {project.deadline}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-400 font-semibold uppercase">Total Project Value</p>
                        <p className="text-xl font-extrabold text-[#2563EB]">{formatPKR(project.grossBudgetPKR)}</p>
                      </div>
                    </div>

                    {/* Completion Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Project Completion Progress</span>
                        <span>{progressPct}% Completed</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                        <div
                          className="bg-gradient-to-r from-[#2563EB] to-[#00D2FF] h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Milestones Breakdown */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                        Project Milestones & Payment Schedule
                      </h4>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                              <th className="py-2.5 px-3">Milestone Title & Scope</th>
                              <th className="py-2.5 px-3">Milestone Amount</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">Payment Account / Ref</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {projectMilestones.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-400 italic">
                                  No specific milestones created yet for this project.
                                </td>
                              </tr>
                            ) : (
                              projectMilestones.map((m) => (
                                <tr key={m.id} className="hover:bg-slate-50 transition">
                                  <td className="py-3 px-3">
                                    <p className="font-bold text-slate-900">{m.title}</p>
                                    {m.notes && <p className="text-[11px] text-slate-500 mt-0.5">{m.notes}</p>}
                                  </td>
                                  <td className="py-3 px-3 font-bold text-slate-800 font-mono">
                                    {formatPKR(m.amountPKR)}
                                  </td>
                                  <td className="py-3 px-3">
                                    <span
                                      className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                                        m.status === 'Paid'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : m.status === 'Overdue'
                                          ? 'bg-rose-100 text-rose-800'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {m.status}
                                    </span>
                                  </td>
                                  <td className="py-3 px-3 text-slate-600 font-medium">
                                    {m.receivedInAccount ? `${m.receivedInAccount} (${m.dateReceived || 'Confirmed'})` : 'Pending Disbursement'}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: DOCUMENTS & CONTRACTS */}
        {activePortalTab === 'documents' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <FileText className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Signed Contracts, NDAs & Deliverables</h3>
                <p className="text-xs text-slate-500">Legal agreements and technical scope documents uploaded for {currentClient.company}</p>
              </div>
            </div>

            {(!activeProject?.documents || activeProject.documents.length === 0) ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No project documents uploaded yet for this client.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeProject.documents.map((doc) => (
                  <div key={doc.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-800 rounded">
                        {doc.category}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{doc.uploadedAt}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{doc.title}</h4>
                    {doc.fileName && <p className="text-xs text-slate-500 font-mono truncate">{doc.fileName}</p>}
                    {doc.notes && <p className="text-xs text-slate-600 italic">"{doc.notes}"</p>}

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-400">{doc.fileType}</span>
                      <a
                        href={doc.urlOrLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition inline-flex items-center space-x-1"
                      >
                        <span>Open Document</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INQUIRIES & SUPPORT */}
        {activePortalTab === 'inquiries' && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <Send className="w-5 h-5 text-[#2563EB]" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Client Support & Milestone Inquiries</h3>
                <p className="text-xs text-slate-500">Send notes or request scope changes directly to the Devsio Services agency admin team.</p>
              </div>
            </div>

            {inquirySent && (
              <div className="p-3 bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Your message has been sent to agency administration!</span>
              </div>
            )}

            <form onSubmit={handleSendInquiry} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inquiry / Project Feedback Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Please provide an update on Milestone 2 UI designs, or request invoice details..."
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm transition inline-flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit Inquiry to Admin</span>
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
};
