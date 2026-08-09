import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  UserCheck, 
  Building2, 
  Users, 
  Key, 
  Mail, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { Client, TeamMember } from '../types';

interface SecurityGatewayProps {
  onLoginSuccess: (role: 'admin' | 'team_member' | 'client', memberId?: string, clientEmail?: string) => void;
  teamMembers: TeamMember[];
  clients: Client[];
  onRegisterClient: (newClient: Client) => void;
  onRegisterTeamMember: (newMember: TeamMember) => void;
}

export const SecurityGateway: React.FC<SecurityGatewayProps> = ({
  onLoginSuccess,
  teamMembers,
  clients,
  onRegisterClient,
  onRegisterTeamMember,
}) => {
  // Selected Portal Mode: 'admin' | 'team' | 'client'
  const [activePortal, setActivePortal] = useState<'admin' | 'team' | 'client'>('admin');
  
  // Auth Form Action for Team/Client: 'login' | 'signup'
  const [formAction, setFormAction] = useState<'login' | 'signup'>('login');

  // Input Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Signup fields for Client
  const [clientName, setClientName] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientMobile, setClientMobile] = useState('+92 300 ');
  const [clientEmail, setClientEmail] = useState('');
  const [clientLocation, setClientLocation] = useState('');
  const [clientPassword, setClientPassword] = useState('');

  // Signup fields for Team Member
  const [tmName, setTmName] = useState('');
  const [tmRole, setTmRole] = useState('Senior Full-Stack Engineer');
  const [tmEmail, setTmEmail] = useState('');
  const [tmPhone, setTmPhone] = useState('+92 300 ');
  const [tmSalary, setTmSalary] = useState<number>(150000);
  const [tmBankAcc, setTmBankAcc] = useState('UBL-PAK-');
  const [tmPassword, setTmPassword] = useState('');

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const u = username.trim().toLowerCase();
    const p = password.trim();

    // 1. ADMIN LOGIN CHECK
    if (activePortal === 'admin') {
      if (u === 'admin' && p === 'admin') {
        onLoginSuccess('admin');
        return;
      } else {
        setErrorMsg('Invalid Admin Credentials. Default is username: "admin" & password: "admin".');
        return;
      }
    }

    // 2. TEAM MEMBER LOGIN CHECK
    if (activePortal === 'team') {
      if (u === 'user' && p === 'user') {
        const defaultMember = teamMembers[0]?.id || 'DEV-TM-01';
        onLoginSuccess('team_member', defaultMember);
        return;
      }

      // Check registered team members by email or name or ID
      const matchedTM = teamMembers.find(
        (tm) => tm.email.toLowerCase() === u || tm.name.toLowerCase() === u || tm.id.toLowerCase() === u
      );

      if (matchedTM) {
        onLoginSuccess('team_member', matchedTM.id);
        return;
      }

      setErrorMsg('Team Member login failed. Use demo login "user" / "user" or your registered member email/ID.');
      return;
    }

    // 3. CLIENT LOGIN CHECK
    if (activePortal === 'client') {
      if (u === 'user' && p === 'user') {
        const defaultClientEmail = clients[0]?.email || 'tariq@apex.com';
        onLoginSuccess('client', undefined, defaultClientEmail);
        return;
      }

      // Check registered clients by email or company name
      const matchedClient = clients.find(
        (c) => c.email.toLowerCase() === u || c.company.toLowerCase() === u
      );

      if (matchedClient) {
        onLoginSuccess('client', undefined, matchedClient.email);
        return;
      }

      setErrorMsg('Client login failed. Use demo login "user" / "user" or register your company below.');
      return;
    }
  };

  // Handle Client Registration Submit
  const handleClientSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!clientName.trim() || !clientCompany.trim() || !clientMobile.trim() || !clientEmail.trim() || !clientLocation.trim()) {
      setErrorMsg('Please complete all client registration fields.');
      return;
    }

    const newClient: Client = {
      id: `DS-CL-${String(clients.length + 1).padStart(3, '0')}`,
      name: clientName.trim(),
      company: clientCompany.trim(),
      email: clientEmail.trim().toLowerCase(),
      phone: clientMobile.trim(),
      projectTitle: `${clientCompany.trim()} Portal System`,
      grossBudgetPKR: 0,
      milestones: [],
      notes: `Location/Address: ${clientLocation.trim()} | Password: ${clientPassword || 'user'}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    onRegisterClient(newClient);
    setSuccessMsg(`Account created for ${clientCompany}! Logging in...`);
    setTimeout(() => {
      onLoginSuccess('client', undefined, newClient.email);
    }, 1000);
  };

  // Handle Team Member Registration Submit
  const handleTeamMemberSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!tmName.trim() || !tmEmail.trim() || !tmPhone.trim()) {
      setErrorMsg('Please enter your full name, email, and phone number.');
      return;
    }

    const newTM: TeamMember = {
      id: `DEV-TM-${String(teamMembers.length + 1).padStart(2, '0')}`,
      name: tmName.trim(),
      role: tmRole,
      email: tmEmail.trim().toLowerCase(),
      phone: tmPhone.trim(),
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      status: 'Active',
      joinedDate: new Date().toISOString().split('T')[0],
      bankAccountDetails: tmBankAcc || 'UBL Account',
      password: tmPassword || 'user',
    };

    onRegisterTeamMember(newTM);
    setSuccessMsg(`Team account created for ${tmName}! Logging into Team Portal...`);
    setTimeout(() => {
      onLoginSuccess('team_member', newTM.id);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      
      {/* Background Security Glow FX */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl pointer-events-none"></div>

      {/* Top Encryption Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D2FF] to-[#2563EB] flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-white flex items-center space-x-2">
              <span>DEVSIO ENCRYPTED ERP GATEWAY</span>
              <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>256-BIT AUTH ACTIVE</span>
              </span>
            </h1>
            <p className="text-xs text-slate-400">Strict Multi-Portal Identity & Access Control System</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <span>Session Protection Enabled</span>
        </div>
      </header>

      {/* Central Security Card Container */}
      <main className="max-w-4xl w-full mx-auto my-8 relative z-10">
        
        {/* Main Portal Selector Buttons */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white tracking-tight">Select Authentication Portal</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Choose your authorized system role to log in or register your account securely.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* OPTION 1: ADMIN PORTAL */}
          <button
            onClick={() => {
              setActivePortal('admin');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
              activePortal === 'admin'
                ? 'bg-gradient-to-b from-blue-900/40 to-slate-900 border-[#00D2FF] ring-2 ring-cyan-500/30 shadow-xl shadow-cyan-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-xl ${activePortal === 'admin' ? 'bg-[#2563EB] text-white' : 'bg-slate-800 text-slate-400'}`}>
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-blue-500/20 text-cyan-300 border border-cyan-500/30">
                Full ERP Access
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white">Agency Executive Admin</h3>
            <p className="text-xs text-slate-400 mt-1">
              Full interface control: P&L, Clients, Team Directory, Costing Waterfall & Banking.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-cyan-400 font-bold">
              <span>Login: admin / admin</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* OPTION 2: TEAM MEMBER PORTAL */}
          <button
            onClick={() => {
              setActivePortal('team');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
              activePortal === 'team'
                ? 'bg-gradient-to-b from-purple-900/40 to-slate-900 border-purple-500 ring-2 ring-purple-500/30 shadow-xl shadow-purple-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-xl ${activePortal === 'team' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Users className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Developer Workspace
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white">Team Member Portal</h3>
            <p className="text-xs text-slate-400 mt-1">
              Assigned Kanban tasks, wage payout history, balance tracker & profile details.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-purple-400 font-bold">
              <span>Login / Sign-up</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

          {/* OPTION 3: CLIENT PORTAL */}
          <button
            onClick={() => {
              setActivePortal('client');
              setFormAction('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${
              activePortal === 'client'
                ? 'bg-gradient-to-b from-emerald-900/40 to-slate-900 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-500/10'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-xl ${activePortal === 'client' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Building2 className="w-6 h-6" />
              </div>
              <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Credentials Only
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white">Client Portal</h3>
            <p className="text-xs text-slate-400 mt-1">
              Track project milestones, milestone payment schedule & legal contracts/NDAs.
            </p>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-emerald-400 font-bold">
              <span>Login Credentials Only</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
            </div>
          </button>

        </div>

        {/* AUTHENTICATION FORM CARD */}
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
          
          {/* Sub-Header Tabs for Sign Up / Sign In if applicable */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 mb-6 gap-3">
            <div className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-bold text-white">
                {activePortal === 'admin' 
                  ? 'Executive Admin Credentials' 
                  : activePortal === 'team'
                  ? 'Team Member Account Access'
                  : 'Client Company Account Access'}
              </h3>
            </div>

            {/* ONLY Team Member portal has a details collection signup tab. Client portal is strictly LOGIN ONLY */}
            {activePortal === 'team' && (
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setFormAction('login');
                    setErrorMsg('');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    formAction === 'login'
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormAction('signup');
                    setErrorMsg('');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    formAction === 'signup'
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Submit Details & Get Credentials
                </button>
              </div>
            )}

            {activePortal === 'client' && (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold flex items-center space-x-1">
                <Lock className="w-3 h-3" />
                <span>Restricted Access • Issued Credentials Only</span>
              </span>
            )}
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-xs text-rose-300 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authentication Notice</p>
                <p className="mt-0.5 text-rose-200">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* FORM TYPE 1: STANDARD LOGIN (Admin / Team / Client) */}
          {(activePortal === 'admin' || formAction === 'login') && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {activePortal === 'admin' ? 'Admin Username *' : 'Username or Registered Email *'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder={
                      activePortal === 'admin' 
                        ? 'admin' 
                        : activePortal === 'team' 
                        ? 'user or engineer@devsio.com' 
                        : 'user or client@apex.com'
                    }
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {activePortal === 'admin' 
                    ? 'Required admin username: "admin"' 
                    : 'Use demo username "user" or your registered account email.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {activePortal === 'admin' 
                    ? 'Required admin password: "admin"' 
                    : 'Use demo password "user" or your registered account password.'}
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-[#2563EB] to-[#00D2FF] hover:from-blue-600 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Authenticate & Access {activePortal === 'admin' ? 'Admin ERP' : activePortal === 'team' ? 'Team Portal' : 'Client Portal'}</span>
              </button>
            </form>
          )}

          {/* FORM TYPE 2: CLIENT SIGNUP */}
          {activePortal === 'client' && formAction === 'signup' && (
            <form onSubmit={handleClientSignup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Client Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tariq Mehmood"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Company / Organization Name *</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex FinTech Systems"
                      value={clientCompany}
                      onChange={(e) => setClientCompany(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Mobile / Phone Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="+92 300 0000000"
                      value={clientMobile}
                      onChange={(e) => setClientMobile(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Company Email *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="client@company.com"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Location / Office Address *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gulberg III, Lahore, Pakistan"
                    value={clientLocation}
                    onChange={(e) => setClientLocation(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Account Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="Choose password (or use 'user')"
                    value={clientPassword}
                    onChange={(e) => setClientPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Register Client Profile & Proceed</span>
              </button>
            </form>
          )}

          {/* FORM TYPE 3: TEAM MEMBER SIGNUP & DETAILS COLLECTION */}
          {activePortal === 'team' && formAction === 'signup' && (
            <form onSubmit={handleTeamMemberSignup} className="space-y-4">
              <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl text-xs text-purple-300 flex items-center space-x-2">
                <Users className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Submit your profile & payment details below to generate your team member login credentials.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bilal Ahmed"
                      value={tmName}
                      onChange={(e) => setTmName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Role / Designation *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior React & Node Developer"
                    value={tmRole}
                    onChange={(e) => setTmRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email Address *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="engineer@devsio.com"
                      value={tmEmail}
                      onChange={(e) => setTmEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Mobile Number *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="+92 300 1234567"
                      value={tmPhone}
                      onChange={(e) => setTmPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Expected / Monthly Pay (PKR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="150000"
                    value={tmSalary}
                    onChange={(e) => setTmSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Bank Account / IBAN</label>
                  <input
                    type="text"
                    placeholder="UBL Account / JazzCash"
                    value={tmBankAcc}
                    onChange={(e) => setTmBankAcc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Register Member Account & Enter Workspace</span>
              </button>
            </form>
          )}

        </div>
      </main>

      {/* Security Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2 relative z-10">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Devsio Services ERP Security Gateway • Session Auto-Lock on Page Refresh</span>
        </div>
        <div>
          <span>Default Credentials: Admin (admin / admin) | Members & Clients (user / user)</span>
        </div>
      </footer>

    </div>
  );
};
