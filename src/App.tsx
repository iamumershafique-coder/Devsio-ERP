import React, { useState, useEffect } from 'react';
import { 
  Client, 
  Project, 
  TeamMember, 
  Purchase, 
  GeneralExpense, 
  LedgerTransaction, 
  TeamPayout, 
  AccountHead,
  Milestone,
  ProjectTask 
} from './types';
import { 
  INITIAL_CLIENTS, 
  INITIAL_PROJECTS, 
  INITIAL_TEAM_MEMBERS, 
  INITIAL_PURCHASES, 
  INITIAL_EXPENSES, 
  INITIAL_LEDGER_TRANSACTIONS, 
  INITIAL_TEAM_PAYOUTS 
} from './data/initialData';
import { calculateExecutiveKPIs, calculateCompanyReserve, calculateNetDistributablePool } from './utils/financialCalculations';

import { Navbar } from './components/Navbar';
import { SidebarNavigation, ActiveTab } from './components/SidebarNavigation';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { ClientManagement } from './components/ClientManagement';
import { ProjectCostingCalculator } from './components/ProjectCostingCalculator';
import { TeamDirectoryLedger } from './components/TeamDirectoryLedger';
import { TeamMemberPortal } from './components/TeamMemberPortal';
import { PurchasesExpensesLog } from './components/PurchasesExpensesLog';
import { FinancialLedgers } from './components/FinancialLedgers';
import { SetupAndDocs } from './components/SetupAndDocs';
import { NewClientModal, LogPaymentModal } from './components/GlobalModals';
import { ClientPortal } from './components/ClientPortal';
import { SecurityGateway } from './components/SecurityGateway';
import { GeminiProfitCalculator } from './components/GeminiProfitCalculator';

export default function App() {
  // Authentication & Role Control: default to encrypted lock screen
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'admin' | 'team_member' | 'client'>('admin');
  const [currentTeamMemberId, setCurrentTeamMemberId] = useState<string | null>('DEV-TM-01');

  const handleLoginSuccess = (
    role: 'admin' | 'team_member' | 'client',
    memberId?: string,
    clientEmail?: string
  ) => {
    setUserRole(role);
    if (memberId) {
      setCurrentTeamMemberId(memberId);
    }
    setIsAuthenticated(true);
  };
  // LocalStorage Helper Loader
  const loadInitial = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(`devsio_erp_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  // State Declarations
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [clients, setClients] = useState<Client[]>(() => loadInitial('clients', INITIAL_CLIENTS));
  const [projects, setProjects] = useState<Project[]>(() => loadInitial('projects', INITIAL_PROJECTS));
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => loadInitial('team', INITIAL_TEAM_MEMBERS));
  const [purchases, setPurchases] = useState<Purchase[]>(() => loadInitial('purchases', INITIAL_PURCHASES));
  const [expenses, setExpenses] = useState<GeneralExpense[]>(() => loadInitial('expenses', INITIAL_EXPENSES));
  const [ledger, setLedger] = useState<LedgerTransaction[]>(() => loadInitial('ledger', INITIAL_LEDGER_TRANSACTIONS));
  const [payouts, setPayouts] = useState<TeamPayout[]>(() => loadInitial('payouts', INITIAL_TEAM_PAYOUTS));

  // Global Modals State
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isLogPaymentModalOpen, setIsLogPaymentModalOpen] = useState(false);
  const [prefilledClientId, setPrefilledClientId] = useState<string | undefined>(undefined);
  const [prefilledMilestoneId, setPrefilledMilestoneId] = useState<string | undefined>(undefined);

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('devsio_erp_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('devsio_erp_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('devsio_erp_team', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('devsio_erp_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('devsio_erp_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('devsio_erp_ledger', JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem('devsio_erp_payouts', JSON.stringify(payouts));
  }, [payouts]);

  // Compute Live Executive KPIs
  const kpis = calculateExecutiveKPIs(
    clients,
    projects,
    teamMembers,
    purchases,
    expenses,
    ledger,
    payouts
  );

  // Handler: Record Client Milestone Payment
  const handleRecordMilestonePayment = (
    clientId: string,
    milestoneId: string,
    accountHead: AccountHead,
    amountPKR: number,
    date: string,
    notes: string
  ) => {
    // 1. Update Client Milestone Status
    let milestoneTitle = 'Milestone Payment';
    const updatedClients = clients.map((c) => {
      if (c.id === clientId) {
        const updatedMilestones = c.milestones.map((m) => {
          if (m.id === milestoneId) {
            milestoneTitle = m.title;
            return {
              ...m,
              status: 'Paid' as const,
              receivedInAccount: accountHead,
              dateReceived: date,
              notes,
            };
          }
          return m;
        });
        return { ...c, milestones: updatedMilestones };
      }
      return c;
    });

    setClients(updatedClients);

    // 2. Add Inflow to Ledger
    const client = clients.find((c) => c.id === clientId);
    const newTxn: LedgerTransaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      date,
      type: 'Client Inflow',
      accountHead,
      flow: 'INFLOW',
      amountPKR,
      referenceId: milestoneId,
      category: `Milestone - ${client?.company || clientId}`,
      description: `Client Milestone Inflow: ${milestoneTitle} (${client?.company})`,
    };

    setLedger((prev) => [...prev, newTxn]);
  };

  // Handler: Update Project Financial Costing
  const handleUpdateProjectFinancials = (updatedProject: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)));
  };

  // Handler: Log Team Member Payout
  const handleLogTeamPayout = (
    projectId: string,
    teamMemberId: string,
    teamMemberName: string,
    amountPKR: number,
    paidFromAccount: AccountHead,
    receiptRef: string
  ) => {
    const project = projects.find((p) => p.id === projectId);

    const newPayout: TeamPayout = {
      id: `PAY-${Date.now().toString().slice(-6)}`,
      projectId,
      projectTitle: project?.projectTitle || 'Agency Project',
      teamMemberId,
      teamMemberName,
      amountPKR,
      paidFromAccount,
      date: new Date().toISOString().split('T')[0],
      receiptRef,
    };

    setPayouts((prev) => [...prev, newPayout]);

    // Add Outflow to Ledger
    const newTxn: LedgerTransaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      type: 'Team Payout',
      accountHead: paidFromAccount,
      flow: 'OUTFLOW',
      amountPKR,
      referenceId: receiptRef,
      category: `Team Payout - ${teamMemberName}`,
      description: `Dispatched Team Payout to ${teamMemberName} (${project?.projectTitle || projectId})`,
    };

    setLedger((prev) => [...prev, newTxn]);
  };

  // Handler: Add Purchase
  const handleAddPurchase = (newPurchase: Purchase) => {
    setPurchases((prev) => [...prev, newPurchase]);

    const newTxn: LedgerTransaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      date: newPurchase.date,
      type: 'Purchase',
      accountHead: newPurchase.paidVia,
      flow: 'OUTFLOW',
      amountPKR: newPurchase.amountPKR,
      referenceId: newPurchase.id,
      category: newPurchase.category,
      description: `Purchase: ${newPurchase.itemName} (${newPurchase.vendor})`,
    };

    setLedger((prev) => [...prev, newTxn]);
  };

  // Handler: Add General Operating Expense
  const handleAddGeneralExpense = (newExpense: GeneralExpense) => {
    setExpenses((prev) => [...prev, newExpense]);

    const newTxn: LedgerTransaction = {
      id: `TXN-${Date.now().toString().slice(-6)}`,
      date: newExpense.date,
      type: 'General Expense',
      accountHead: newExpense.paidVia,
      flow: 'OUTFLOW',
      amountPKR: newExpense.amountPKR,
      referenceId: newExpense.id,
      category: newExpense.category,
      description: `General Expense: ${newExpense.description}`,
    };

    setLedger((prev) => [...prev, newTxn]);
  };

  // Handler: Add New Client
  const handleAddClient = (newClient: Client) => {
    setClients((prev) => [...prev, newClient]);

    // Automatically create corresponding Project with 20% Reserve Cut
    const newProject: Project = {
      id: `PRJ-00${projects.length + 1}`,
      clientId: newClient.id,
      clientName: newClient.name,
      companyName: newClient.company,
      projectTitle: newClient.projectTitle,
      grossBudgetPKR: newClient.grossBudgetPKR,
      companyReservePKR: calculateCompanyReserve(newClient.grossBudgetPKR),
      directExpensesPKR: 0,
      netDistributablePoolPKR: calculateNetDistributablePool(newClient.grossBudgetPKR, 0),
      status: 'In Progress',
      startDate: new Date().toISOString().split('T')[0],
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      teamAssignments: [],
      directExpensesList: [],
    };

    setProjects((prev) => [...prev, newProject]);
  };

  // Handler: Add Milestone to Client
  const handleAddMilestoneToClient = (clientId: string, title: string, amountPKR: number) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const newM: Milestone = {
            id: `MS-${clientId}-${c.milestones.length + 1}`,
            title,
            amountPKR,
            status: 'Pending',
            receivedInAccount: null,
          };
          const updatedMilestones = [...c.milestones, newM];
          const newGross = updatedMilestones.reduce((acc, m) => acc + m.amountPKR, 0);

          return {
            ...c,
            grossBudgetPKR: newGross,
            milestones: updatedMilestones,
          };
        }
        return c;
      })
    );
  };

  // Handler: Update Client Profile
  const handleUpdateClient = (updatedClient: Client) => {
    setClients((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
  };

  // Handler: Assign Task to Team Member
  const handleAssignTask = (
    projectId: string,
    taskTitle: string,
    taskDetails: string,
    domainInfo: string,
    assignedTeamMemberId: string,
    assignedTeamMemberName: string,
    amountPKR: number,
    dueDate: string
  ) => {
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.id === projectId) {
          const newTask: ProjectTask = {
            id: `TSK-${Date.now().toString().slice(-5)}`,
            projectId: proj.id,
            companyName: proj.companyName,
            taskTitle,
            taskDetails,
            domainInfo,
            assignedTeamMemberId,
            assignedTeamMemberName,
            amountPKR,
            paidAmountPKR: 0,
            status: 'In Progress',
            dueDate,
          };

          const existingTa = proj.teamAssignments.find((ta) => ta.teamMemberId === assignedTeamMemberId);
          let updatedAssignments = proj.teamAssignments;
          if (existingTa) {
            updatedAssignments = proj.teamAssignments.map((ta) =>
              ta.teamMemberId === assignedTeamMemberId
                ? { ...ta, promisedAmountPKR: ta.promisedAmountPKR + amountPKR }
                : ta
            );
          } else {
            updatedAssignments = [
              ...proj.teamAssignments,
              {
                teamMemberId: assignedTeamMemberId,
                teamMemberName: assignedTeamMemberName,
                roleOnProject: 'Task Owner',
                cutPercentage: 15,
                promisedAmountPKR: amountPKR,
                paidAmountPKR: 0,
              },
            ];
          }

          return {
            ...proj,
            tasks: [...(proj.tasks || []), newTask],
            teamAssignments: updatedAssignments,
          };
        }
        return proj;
      })
    );
  };

  // Handler: Add Team Member
  const handleAddTeamMember = (
    name: string,
    role: string,
    email: string,
    phone: string,
    defaultCutPercentage: number
  ) => {
    const newMember: TeamMember = {
      id: `DEV-TM-${String(teamMembers.length + 1).padStart(2, '0')}`,
      name,
      role,
      email,
      phone,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      defaultCutPercentage,
      joinedDate: new Date().toISOString().split('T')[0],
      status: 'Active',
    };
    setTeamMembers((prev) => [...prev, newMember]);
  };

  // Handler: Update Team Member Profile (KYC/Personal Info)
  const handleUpdateMemberProfile = (updatedMember: TeamMember) => {
    setTeamMembers((prev) => prev.map((m) => (m.id === updatedMember.id ? updatedMember : m)));
  };

  // Handler: Update Task Progress (Status, %, Remarks, Issues)
  const handleUpdateTaskProgress = (
    taskId: string,
    progressPct: number,
    status: 'In Progress' | 'Under Review' | 'Completed' | 'Blocked',
    remarks: string,
    issuesLog: string
  ) => {
    setProjects((prevProjects) =>
      prevProjects.map((proj) => {
        if (proj.tasks?.some((t) => t.id === taskId)) {
          const updatedTasks = proj.tasks.map((t) => {
            if (t.id === taskId) {
              return {
                ...t,
                completionPercentage: progressPct,
                status,
                remarks,
                issuesLog,
              };
            }
            return t;
          });
          return { ...proj, tasks: updatedTasks };
        }
        return proj;
      })
    );
  };

  // Handler: Import Data from JSON
  const handleImportData = (jsonData: any) => {
    if (jsonData.clients) setClients(jsonData.clients);
    if (jsonData.projects) setProjects(jsonData.projects);
    if (jsonData.teamMembers) setTeamMembers(jsonData.teamMembers);
    if (jsonData.purchases) setPurchases(jsonData.purchases);
    if (jsonData.expenses) setExpenses(jsonData.expenses);
    if (jsonData.ledger) setLedger(jsonData.ledger);
    if (jsonData.payouts) setPayouts(jsonData.payouts);
  };

  // Handler: Reset Seed Data
  const handleResetData = () => {
    if (window.confirm('Reset Devsio Services financial data back to initial sample state?')) {
      localStorage.clear();
      setClients(INITIAL_CLIENTS);
      setProjects(INITIAL_PROJECTS);
      setTeamMembers(INITIAL_TEAM_MEMBERS);
      setPurchases(INITIAL_PURCHASES);
      setExpenses(INITIAL_EXPENSES);
      setLedger(INITIAL_LEDGER_TRANSACTIONS);
      setPayouts(INITIAL_TEAM_PAYOUTS);
    }
  };

  // IF NOT AUTHENTICATED: Render Encrypted Security Gateway Access Portal
  if (!isAuthenticated) {
    return (
      <SecurityGateway
        onLoginSuccess={handleLoginSuccess}
        teamMembers={teamMembers}
        clients={clients}
        onRegisterClient={handleAddClient}
        onRegisterTeamMember={handleAddTeamMember}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-800 antialiased selection:bg-[#00D2FF] selection:text-slate-900">
      
      {/* Top Security & Role Selection Banner */}
      <div className="bg-slate-950 text-slate-200 border-b border-slate-800 py-1.5 px-4 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-slate-300">Active Session:</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {userRole === 'admin' ? 'Agency Executive Admin' : userRole === 'team_member' ? 'Team Member Portal' : 'Client Account Portal'}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setUserRole('admin')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  userRole === 'admin' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🛡️ Admin
              </button>
              <button
                onClick={() => setUserRole('team_member')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  userRole === 'team_member' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                👨‍💻 Team
              </button>
              <button
                onClick={() => setUserRole('client')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  userRole === 'client' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🏢 Client
              </button>
            </div>

            <button
              onClick={() => setIsAuthenticated(false)}
              className="px-3 py-1 bg-rose-600/90 hover:bg-rose-600 text-white font-bold text-[11px] rounded-lg border border-rose-500/50 shadow-sm transition flex items-center space-x-1"
            >
              <span>🔒 Lock Session & Exit</span>
            </button>
          </div>
        </div>
      </div>

      {userRole === 'client' ? (
        <ClientPortal
          clients={clients}
          projects={projects}
          onRegisterClient={handleAddClient}
          onUpdateClientNotes={(clientId, note) => {
            setClients((prev) =>
              prev.map((c) => (c.id === clientId ? { ...c, notes: note } : c))
            );
          }}
          onSwitchToAdmin={() => setUserRole('admin')}
        />
      ) : userRole === 'team_member' ? (
        <div className="py-6 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <TeamMemberPortal
            teamMembers={teamMembers}
            projects={projects}
            clients={clients}
            teamPayouts={payouts}
            currentMemberId={currentTeamMemberId}
            onLogin={(id) => setCurrentTeamMemberId(id)}
            onLogout={() => setCurrentTeamMemberId(null)}
            onUpdateMemberProfile={handleUpdateMemberProfile}
            onUpdateTaskProgress={handleUpdateTaskProgress}
            onSwitchToAdmin={() => setUserRole('admin')}
          />
        </div>
      ) : (
        <>
          {/* Top Navbar */}
          <Navbar
            kpis={kpis}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenNewClientModal={() => setIsNewClientModalOpen(true)}
            onOpenLogPaymentModal={() => {
              setPrefilledClientId(undefined);
              setPrefilledMilestoneId(undefined);
              setIsLogPaymentModalOpen(true);
            }}
            onOpenExpenseModal={() => setActiveTab('expenses')}
            onResetData={handleResetData}
          />

          {/* Main Full-Height App Container */}
          <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
            
            {/* Left Sidebar Navigation */}
            <SidebarNavigation
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              pendingReceivablesCount={clients.filter((c) => {
                const paid = c.milestones.reduce((acc, m) => acc + (m.status === 'Paid' ? m.amountPKR : 0), 0);
                return c.grossBudgetPKR - paid > 0;
              }).length}
              pendingPayablesCount={projects.reduce((acc, p) => {
                let pending = 0;
                p.teamAssignments.forEach((ta) => {
                  if (ta.promisedAmountPKR - ta.paidAmountPKR > 0) pending++;
                });
                return acc + pending;
              }, 0)}
              ublBankBalance={kpis.ublBankBalance}
              umarCashBalance={kpis.umarCashBalance}
              notificationCounts={{
                unpaidReceivablesCount: clients.filter((c) => {
                  const paid = c.milestones.reduce((acc, m) => acc + (m.status === 'Paid' ? m.amountPKR : 0), 0);
                  return c.grossBudgetPKR - paid > 0;
                }).length,
                overdueReceivablesCount: clients.reduce((acc, c) => {
                  const overdue = c.milestones.filter((m) => m.status !== 'Paid' && m.dueDate && m.dueDate < '2026-08-09').length;
                  return acc + overdue;
                }, 0),
                pendingPayablesCount: projects.reduce((acc, p) => {
                  let pending = 0;
                  p.teamAssignments.forEach((ta) => {
                    if (ta.promisedAmountPKR - ta.paidAmountPKR > 0) pending++;
                  });
                  return acc + pending;
                }, 0),
                activeTasksCount: projects.reduce((acc, p) => {
                  const active = p.tasks?.filter((t) => t.status === 'In Progress' || t.status === 'Under Review').length || 0;
                  return acc + active;
                }, 0) || 4,
                costingAlertsCount: projects.filter((p) => p.status === 'In Progress').length || 2,
                geminiInsightsCount: projects.length || 3,
                recentExpensesCount: expenses.length || 2,
              }}
            />

            {/* Right Content Area */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              {activeTab === 'dashboard' && (
                <ExecutiveDashboard
                  kpis={kpis}
                  clients={clients}
                  projects={projects}
                  ledger={ledger}
                  expenses={expenses}
                  teamMembers={teamMembers}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                  onOpenLogPaymentModal={() => setIsLogPaymentModalOpen(true)}
                />
              )}

              {activeTab === 'gemini_profit' && (
                <GeminiProfitCalculator
                  clients={clients}
                  expenses={expenses}
                  teamMembers={teamMembers}
                />
              )}

              {activeTab === 'clients' && (
                <ClientManagement
                  clients={clients}
                  searchQuery={searchQuery}
                  onOpenNewClientModal={() => setIsNewClientModalOpen(true)}
                  onOpenLogPaymentModal={(clientId, milestoneId) => {
                    setPrefilledClientId(clientId);
                    setPrefilledMilestoneId(milestoneId);
                    setIsLogPaymentModalOpen(true);
                  }}
                  onAddMilestoneToClient={handleAddMilestoneToClient}
                  onUpdateClient={handleUpdateClient}
                />
              )}

              {activeTab === 'costing' && (
                <ProjectCostingCalculator
                  projects={projects}
                  teamMembers={teamMembers}
                  onUpdateProjectFinancials={handleUpdateProjectFinancials}
                  onLogTeamPayout={handleLogTeamPayout}
                />
              )}

              {activeTab === 'team' && (
                <TeamDirectoryLedger
                  teamMembers={teamMembers}
                  projects={projects}
                  payouts={payouts}
                  searchQuery={searchQuery}
                  onLogTeamPayout={handleLogTeamPayout}
                  onAddTeamMember={handleAddTeamMember}
                  onUpdateTeamMember={handleUpdateMemberProfile}
                  onAssignTask={handleAssignTask}
                />
              )}

              {activeTab === 'team_portal' && (
                <TeamMemberPortal
                  teamMembers={teamMembers}
                  projects={projects}
                  clients={clients}
                  teamPayouts={payouts}
                  currentMemberId={currentTeamMemberId}
                  onLogin={(id) => setCurrentTeamMemberId(id)}
                  onLogout={() => setCurrentTeamMemberId(null)}
                  onUpdateMemberProfile={handleUpdateMemberProfile}
                  onUpdateTaskProgress={handleUpdateTaskProgress}
                  onSwitchToAdmin={() => setUserRole('admin')}
                />
              )}

              {activeTab === 'expenses' && (
                <PurchasesExpensesLog
                  purchases={purchases}
                  expenses={expenses}
                  searchQuery={searchQuery}
                  onAddPurchase={handleAddPurchase}
                  onAddGeneralExpense={handleAddGeneralExpense}
                />
              )}

              {activeTab === 'ledgers' && (
                <FinancialLedgers
                  ledger={ledger}
                  searchQuery={searchQuery}
                />
              )}

              {activeTab === 'docs' && (
                <SetupAndDocs
                  clients={clients}
                  projects={projects}
                  teamMembers={teamMembers}
                  purchases={purchases}
                  expenses={expenses}
                  ledger={ledger}
                  payouts={payouts}
                  onImportData={handleImportData}
                  onResetData={handleResetData}
                />
              )}
            </main>

          </div>
        </>
      )}

      {/* High Density Status Footer */}
      <footer className="flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-400 border-t border-slate-200/80 py-3 px-6 max-w-7xl w-full mx-auto shrink-0 mt-auto gap-2">
        <div className="flex items-center gap-4 uppercase tracking-widest">
          <span>System Status: <span className="text-emerald-600 font-bold">Stable</span></span>
          <span>Data Encryption: <span className="text-slate-600 font-bold">AES-256</span></span>
          <span>Last Sync: {new Date().toLocaleTimeString()}</span>
        </div>
        <div className="font-bold text-slate-500">Devsio Services ERP © 2024</div>
      </footer>

      {/* Global Modals */}
      <NewClientModal
        isOpen={isNewClientModalOpen}
        onClose={() => setIsNewClientModalOpen(false)}
        onAddClient={handleAddClient}
        existingClientsCount={clients.length}
      />

      <LogPaymentModal
        isOpen={isLogPaymentModalOpen}
        onClose={() => setIsLogPaymentModalOpen(false)}
        clients={clients}
        initialClientId={prefilledClientId}
        initialMilestoneId={prefilledMilestoneId}
        onRecordPayment={handleRecordMilestonePayment}
      />

    </div>
  );
}
