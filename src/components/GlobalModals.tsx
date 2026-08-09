import React, { useState } from 'react';
import { Client, Milestone, AccountHead, GeneralExpense, Purchase } from '../types';
import { formatPKR } from '../utils/financialCalculations';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddClient: (newClient: Client) => void;
  existingClientsCount: number;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onAddClient,
  existingClientsCount,
}) => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+92 ');
  const [projectTitle, setProjectTitle] = useState('');
  const [grossBudgetPKR, setGrossBudgetPKR] = useState<number>(300000);
  const [milestoneCount, setMilestoneCount] = useState<3 | 4>(3);
  
  // Customizable milestone list state
  const [customMilestones, setCustomMilestones] = useState<{ title: string; amountPKR: number }[]>([
    { title: '1st Advance Payment (40% Kickoff)', amountPKR: 120000 },
    { title: '2nd Milestone (30% Beta Sign-off)', amountPKR: 90000 },
    { title: '3rd Final Milestone (30% Launch)', amountPKR: 90000 },
  ]);

  // Recalculate default milestone splits whenever gross budget or count changes
  const handleBudgetOrCountChange = (budget: number, count: 3 | 4) => {
    setGrossBudgetPKR(budget);
    setMilestoneCount(count);
    if (count === 3) {
      const m1 = Math.round(budget * 0.40);
      const m2 = Math.round(budget * 0.30);
      const m3 = budget - m1 - m2;
      setCustomMilestones([
        { title: '1st Advance Payment (40% Kickoff)', amountPKR: m1 },
        { title: '2nd Milestone (30% Beta Sign-off)', amountPKR: m2 },
        { title: '3rd Final Milestone (30% Launch)', amountPKR: m3 },
      ]);
    } else {
      const m1 = Math.round(budget * 0.30);
      const m2 = Math.round(budget * 0.25);
      const m3 = Math.round(budget * 0.25);
      const m4 = budget - m1 - m2 - m3;
      setCustomMilestones([
        { title: '1st Advance Payment (30% Kickoff)', amountPKR: m1 },
        { title: '2nd Milestone (25% Wireframes & Architecture)', amountPKR: m2 },
        { title: '3rd Milestone (25% Beta Deliverable)', amountPKR: m3 },
        { title: '4th Final Milestone (20% Production Release)', amountPKR: m4 },
      ]);
    }
  };

  const handleMilestoneChange = (index: number, field: 'title' | 'amountPKR', val: string | number) => {
    const next = [...customMilestones];
    if (field === 'title') {
      next[index].title = val as string;
    } else {
      next[index].amountPKR = Number(val);
    }
    setCustomMilestones(next);

    // Auto-update total gross budget from sum of milestones
    const sum = next.reduce((acc, m) => acc + m.amountPKR, 0);
    setGrossBudgetPKR(sum);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company.trim() && projectTitle.trim() && grossBudgetPKR > 0) {
      const clientId = `DS-CL-00${existingClientsCount + 1}`;

      const milestones: Milestone[] = customMilestones.map((m, idx) => ({
        id: `MS-${clientId}-${idx + 1}`,
        title: m.title || `Milestone ${idx + 1}`,
        amountPKR: m.amountPKR,
        status: 'Pending',
        receivedInAccount: null,
      }));

      const newClient: Client = {
        id: clientId,
        name: name || 'Primary Contact',
        company,
        email: email || `contact@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: phone || '+92 300 0000000',
        projectTitle,
        grossBudgetPKR,
        milestones,
        createdAt: new Date().toISOString().split('T')[0],
      };

      onAddClient(newClient);
      onClose();
      // Reset
      setName('');
      setCompany('');
      setProjectTitle('');
      setEmail('');
      setPhone('+92 ');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 my-8">
        <h3 className="text-lg font-bold text-slate-900">Add New Client & Book Project</h3>
        <p className="text-xs text-slate-500 mt-1">Registers client details, configures 3–4 milestones, and sets project budget</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Apex FinTech"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Primary Contact Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Shaheryar Hashmi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="shaheryar@apex.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number (+92) *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Project Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mobile Banking SaaS Portal"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Gross Project Budget (PKR)</label>
            <input
              type="number"
              required
              min="10000"
              value={grossBudgetPKR}
              onChange={(e) => handleBudgetOrCountChange(Number(e.target.value), milestoneCount)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold"
            />
          </div>

          {/* Milestone Selection & Manual Adjustment */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Milestone Breakdown Strategy</label>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => handleBudgetOrCountChange(grossBudgetPKR, 3)}
                  className={`px-2.5 py-1 rounded font-bold text-[11px] transition ${
                    milestoneCount === 3
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3 Milestones
                </button>
                <button
                  type="button"
                  onClick={() => handleBudgetOrCountChange(grossBudgetPKR, 4)}
                  className={`px-2.5 py-1 rounded font-bold text-[11px] transition ${
                    milestoneCount === 4
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  4 Milestones
                </button>
              </div>
            </div>

            {/* Editable Milestones List */}
            <div className="space-y-2">
              {customMilestones.map((m, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200">
                  <span className="col-span-1 text-[10px] font-bold text-slate-400 font-mono">#{idx + 1}</span>
                  <input
                    type="text"
                    required
                    value={m.title}
                    onChange={(e) => handleMilestoneChange(idx, 'title', e.target.value)}
                    className="col-span-7 px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500"
                    placeholder={`Milestone ${idx + 1} Title`}
                  />
                  <input
                    type="number"
                    required
                    value={m.amountPKR}
                    onChange={(e) => handleMilestoneChange(idx, 'amountPKR', e.target.value)}
                    className="col-span-4 px-2 py-1 text-xs font-mono font-bold border border-slate-200 rounded text-right focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-600 font-semibold">
              <span>20% Devsio Reserve Cut: <strong>{formatPKR(grossBudgetPKR * 0.20)}</strong></span>
              <span>Net Pool: <strong>{formatPKR(grossBudgetPKR * 0.80)}</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-lg shadow-sm"
            >
              Save Client & Book Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface LogPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  initialClientId?: string;
  initialMilestoneId?: string;
  onRecordPayment: (
    clientId: string,
    milestoneId: string,
    accountHead: AccountHead,
    amountPKR: number,
    date: string,
    notes: string
  ) => void;
}

export const LogPaymentModal: React.FC<LogPaymentModalProps> = ({
  isOpen,
  onClose,
  clients,
  initialClientId,
  initialMilestoneId,
  onRecordPayment,
}) => {
  const [selectedClientId, setSelectedClientId] = useState(initialClientId || clients[0]?.id || '');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState(initialMilestoneId || '');
  const [accountHead, setAccountHead] = useState<AccountHead>('UBL');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const currentClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const pendingMilestones = currentClient?.milestones.filter((m) => m.status === 'Pending') || [];
  const activeMilestone = currentClient?.milestones.find((m) => m.id === selectedMilestoneId) || pendingMilestones[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentClient && activeMilestone) {
      onRecordPayment(
        currentClient.id,
        activeMilestone.id,
        accountHead,
        activeMilestone.amountPKR,
        paymentDate,
        notes || `Milestone payment received into ${accountHead === 'UBL' ? 'UBL Bank' : 'Umar Cash'}`
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">Record Milestone Inflow Payment</h3>
        <p className="text-xs text-slate-500 mt-1">Marks milestone as Paid and logs inflow transaction to Account Head</p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => {
                setSelectedClientId(e.target.value);
                const nextClient = clients.find((c) => c.id === e.target.value);
                const firstPending = nextClient?.milestones.find((m) => m.status === 'Pending');
                if (firstPending) setSelectedMilestoneId(firstPending.id);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company} ({c.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Pending Milestone</label>
            <select
              value={activeMilestone?.id || ''}
              onChange={(e) => setSelectedMilestoneId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            >
              {pendingMilestones.length === 0 ? (
                <option value="">No pending milestones for this client</option>
              ) : (
                pendingMilestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} - {formatPKR(m.amountPKR)}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Received In Account Head</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAccountHead('UBL')}
                className={`py-2 text-xs font-bold rounded-lg border transition ${
                  accountHead === 'UBL'
                    ? 'bg-blue-50 border-blue-600 text-blue-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Devsio (UBL Bank)
              </button>
              <button
                type="button"
                onClick={() => setAccountHead('UMAR_CASH')}
                className={`py-2 text-xs font-bold rounded-lg border transition ${
                  accountHead === 'UMAR_CASH'
                    ? 'bg-amber-50 border-amber-600 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                Umar (Cash Head)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Payment Notes / Txn Ref</label>
            <input
              type="text"
              placeholder="e.g. Wire transfer confirmed via UBL Corporate portal"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!activeMilestone}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#00D2FF] text-slate-950 hover:bg-cyan-400 disabled:opacity-50 rounded-lg shadow-sm"
            >
              Confirm Payment & Update Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
