import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Landmark, 
  Wallet, 
  Download, 
  FileText,
  Building2,
  ChevronRight,
  Phone,
  Mail,
  Edit2,
  Trash2
} from 'lucide-react';
import { Client, Milestone, AccountHead } from '../types';
import { formatPKR, exportToCSV, generateFinancialPDFReport, generateClientInvoicePDF } from '../utils/financialCalculations';

interface ClientManagementProps {
  clients: Client[];
  searchQuery: string;
  onOpenNewClientModal: () => void;
  onOpenLogPaymentModal: (clientId?: string, milestoneId?: string) => void;
  onAddMilestoneToClient: (clientId: string, title: string, amountPKR: number) => void;
  onUpdateClient?: (updatedClient: Client) => void;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({
  clients,
  searchQuery,
  onOpenNewClientModal,
  onOpenLogPaymentModal,
  onAddMilestoneToClient,
  onUpdateClient,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(clients[0]?.id || null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  
  // New Milestone Form state
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneAmount, setNewMilestoneAmount] = useState<number>(50000);

  // Edit Client Modal state
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editCompany, setEditCompany] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editProjectTitle, setEditProjectTitle] = useState('');

  // Edit Milestone state
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editMilestoneTitle, setEditMilestoneTitle] = useState('');
  const [editMilestoneAmount, setEditMilestoneAmount] = useState<number>(0);

  // Filter clients by search query and payment status
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.id.toLowerCase().includes(searchQuery.toLowerCase());

    const totalReceived = client.milestones.reduce(
      (acc, m) => acc + (m.status === 'Paid' ? m.amountPKR : 0),
      0
    );
    const totalPending = client.grossBudgetPKR - totalReceived;

    if (filterStatus === 'PAID') return matchesSearch && totalPending <= 0;
    if (filterStatus === 'PENDING') return matchesSearch && totalPending > 0;
    return matchesSearch;
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];

  const handleCreateMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClient && newMilestoneTitle.trim() && newMilestoneAmount > 0) {
      onAddMilestoneToClient(selectedClient.id, newMilestoneTitle, newMilestoneAmount);
      setNewMilestoneTitle('');
      setNewMilestoneAmount(50000);
      setShowAddMilestoneModal(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Client ID', 'Customer Name', 'Company Name', 'Contact', 'Email', 'Project Title', 'Gross Budget (PKR)', 'Total Received (PKR)', 'Pending Receivable (PKR)'];
    const rows = clients.map((c) => {
      const received = c.milestones.reduce((acc, m) => acc + (m.status === 'Paid' ? m.amountPKR : 0), 0);
      const pending = c.grossBudgetPKR - received;
      return [c.id, c.name, c.company, c.phone, c.email, c.projectTitle, c.grossBudgetPKR, received, pending];
    });

    exportToCSV('devsio_clients_milestones', headers, rows);
  };

  // Export Selected Client PDF Statement
  const handleExportClientPDF = (client: Client) => {
    const headers = ['Milestone Title', 'Amount (PKR)', 'Status', 'Received Account', 'Date Received', 'Notes'];
    const rows = client.milestones.map((m) => [
      m.title,
      m.amountPKR.toLocaleString('en-PK'),
      m.status,
      m.receivedInAccount ? (m.receivedInAccount === 'UBL' ? 'Devsio (UBL Bank)' : 'Umar (Cash Head)') : '-',
      m.dateReceived || '-',
      m.notes || '-',
    ]);

    const totalReceived = client.milestones.reduce((acc, m) => acc + (m.status === 'Paid' ? m.amountPKR : 0), 0);
    const pending = client.grossBudgetPKR - totalReceived;

    const summary = [
      { label: 'Gross Budget', value: formatPKR(client.grossBudgetPKR) },
      { label: 'Total Received', value: formatPKR(totalReceived) },
      { label: 'Pending Receivable', value: formatPKR(pending) },
    ];

    generateFinancialPDFReport(
      `Client Statement - ${client.company}`,
      `Project: ${client.projectTitle} (${client.id})`,
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
            <h1 className="text-xl font-bold text-slate-900">Client & Sales Management (CRM & Milestones)</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
              Module 2
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track client milestones, advance collections, payment channel routing (UBL Bank vs Umar Cash), and pending receivables.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenNewClientModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              filterStatus === 'ALL'
                ? 'bg-[#0A192F] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Clients ({clients.length})
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              filterStatus === 'PENDING'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            With Receivables
          </button>
          <button
            onClick={() => setFilterStatus('PAID')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              filterStatus === 'PAID'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Fully Settled
          </button>
        </div>

        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
          Showing {filteredClients.length} of {clients.length} clients
        </span>
      </div>

      {/* Main Grid: Client List + Detail Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Client Cards List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500 text-xs">
              No clients found matching filter.
            </div>
          ) : (
            filteredClients.map((client) => {
              const totalReceived = client.milestones.reduce(
                (acc, m) => acc + (m.status === 'Paid' ? m.amountPKR : 0),
                0
              );
              const pendingReceivable = Math.max(0, client.grossBudgetPKR - totalReceived);
              const progressPct =
                client.grossBudgetPKR > 0
                  ? Math.min(100, Math.round((totalReceived / client.grossBudgetPKR) * 100))
                  : 0;

              const isSelected = client.id === selectedClientId;

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`bg-white rounded-2xl p-4 border transition cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 text-[10px] font-extrabold bg-slate-100 text-slate-700 rounded-md">
                          {client.id}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{client.company}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{client.name} • {client.projectTitle}</p>
                    </div>

                    <ChevronRight className={`w-4 h-4 text-slate-400 transition ${isSelected ? 'translate-x-1 text-[#2563EB]' : ''}`} />
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Gross Budget</p>
                      <p className="font-bold text-slate-900">{formatPKR(client.grossBudgetPKR)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">Pending Receivable</p>
                      <p className={`font-bold ${pendingReceivable > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatPKR(pendingReceivable)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                      <span>Milestone Progress</span>
                      <span>{progressPct}% Paid</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-[#2563EB] h-1.5 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Detailed Milestones Table & Statement */}
        <div className="lg:col-span-7">
          {selectedClient ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              
              {/* Client Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-1 text-xs font-extrabold bg-[#0A192F] text-[#00D2FF] rounded-lg">
                      {selectedClient.id}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">{selectedClient.company}</h2>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1">{selectedClient.projectTitle}</p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedClient.name}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedClient.phone}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedClient.email}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditCompany(selectedClient.company);
                      setEditName(selectedClient.name);
                      setEditEmail(selectedClient.email);
                      setEditPhone(selectedClient.phone);
                      setEditProjectTitle(selectedClient.projectTitle);
                      setShowEditClientModal(true);
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Edit Client</span>
                  </button>

                  <button
                    onClick={() => generateClientInvoicePDF(selectedClient)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Invoice PDF</span>
                  </button>

                  <button
                    onClick={() => handleExportClientPDF(selectedClient)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#00D2FF]" />
                    <span>Statement PDF</span>
                  </button>
                </div>
              </div>

              {/* Financial Milestone Summary Cards */}
              {(() => {
                const totalReceived = selectedClient.milestones.reduce(
                  (acc, m) => acc + (m.status === 'Paid' ? m.amountPKR : 0),
                  0
                );
                const pending = Math.max(0, selectedClient.grossBudgetPKR - totalReceived);

                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Gross Budget</p>
                      <p className="text-sm font-extrabold text-slate-900 mt-0.5">{formatPKR(selectedClient.grossBudgetPKR)}</p>
                    </div>
                    <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                      <p className="text-[10px] text-emerald-700 uppercase font-bold">Total Received</p>
                      <p className="text-sm font-extrabold text-emerald-800 mt-0.5">{formatPKR(totalReceived)}</p>
                    </div>
                    <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                      <p className="text-[10px] text-amber-700 uppercase font-bold">Pending Receivable</p>
                      <p className="text-sm font-extrabold text-amber-800 mt-0.5">{formatPKR(pending)}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Milestone Breakdown Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900">Milestones Breakdown & Payment Log</h3>
                  <button
                    onClick={() => setShowAddMilestoneModal(true)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-3">Milestone</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Received In</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedClient.milestones.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-slate-900">{m.title}</p>
                            {m.notes && <p className="text-[10px] text-slate-400">{m.notes}</p>}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {formatPKR(m.amountPKR)}
                          </td>
                          <td className="py-2.5 px-3">
                            {m.status === 'Paid' ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Paid</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {m.receivedInAccount === 'UBL' && (
                              <span className="inline-flex items-center space-x-1 text-blue-700 font-bold">
                                <Landmark className="w-3 h-3" />
                                <span>Devsio (UBL)</span>
                              </span>
                            )}
                            {m.receivedInAccount === 'UMAR_CASH' && (
                              <span className="inline-flex items-center space-x-1 text-amber-700 font-bold">
                                <Wallet className="w-3 h-3" />
                                <span>Umar (Cash)</span>
                              </span>
                            )}
                            {!m.receivedInAccount && <span className="text-slate-400">-</span>}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {m.status === 'Pending' ? (
                              <button
                                onClick={() => onOpenLogPaymentModal(selectedClient.id, m.id)}
                                className="px-2.5 py-1 bg-[#00D2FF] hover:bg-cyan-400 text-slate-950 font-bold text-[11px] rounded-lg transition"
                              >
                                Record Payment
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400">{m.dateReceived || 'Received'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400">
              Select a client to view milestones statement
            </div>
          )}
        </div>

      </div>

      {/* Add Milestone Modal */}
      {showAddMilestoneModal && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <h3 className="text-lg font-bold text-slate-900">Add Milestone to {selectedClient.company}</h3>
            <p className="text-xs text-slate-500 mt-1">Define new milestone billing schedule</p>

            <form onSubmit={handleCreateMilestoneSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 3rd Milestone / Production Launch (30%)"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Amount (PKR)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  value={newMilestoneAmount}
                  onChange={(e) => setNewMilestoneAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMilestoneModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-lg shadow-sm"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditClientModal && selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <h3 className="text-lg font-bold text-slate-900">Edit Client & Project Profile</h3>
            <p className="text-xs text-slate-500 mt-1">Update company details, primary contact, email, phone, and project title</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedClient && onUpdateClient) {
                  onUpdateClient({
                    ...selectedClient,
                    company: editCompany,
                    name: editName,
                    email: editEmail,
                    phone: editPhone,
                    projectTitle: editProjectTitle,
                  });
                  setShowEditClientModal(false);
                }
              }}
              className="mt-4 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    value={editCompany}
                    onChange={(e) => setEditCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Contact Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone (+92)</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={editProjectTitle}
                  onChange={(e) => setEditProjectTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditClientModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-lg shadow-sm"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
