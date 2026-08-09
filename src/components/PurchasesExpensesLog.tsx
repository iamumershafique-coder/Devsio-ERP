import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  ShoppingBag, 
  Building2, 
  Download, 
  Landmark, 
  Wallet, 
  Filter, 
  Search,
  FileSpreadsheet
} from 'lucide-react';
import { Purchase, GeneralExpense, AccountHead } from '../types';
import { formatPKR, exportToCSV, generateFinancialPDFReport } from '../utils/financialCalculations';

interface PurchasesExpensesLogProps {
  purchases: Purchase[];
  expenses: GeneralExpense[];
  searchQuery: string;
  onAddPurchase: (purchase: Purchase) => void;
  onAddGeneralExpense: (expense: GeneralExpense) => void;
}

export const PurchasesExpensesLog: React.FC<PurchasesExpensesLogProps> = ({
  purchases,
  expenses,
  searchQuery,
  onAddPurchase,
  onAddGeneralExpense,
}) => {
  const [activeTab, setActiveTab] = useState<'PURCHASES' | 'EXPENSES'>('PURCHASES');
  const [showModal, setShowModal] = useState(false);

  // Form State for Purchase
  const [itemName, setItemName] = useState('');
  const [purchaseCategory, setPurchaseCategory] = useState<Purchase['category']>('SaaS Tool');
  const [vendor, setVendor] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState<number>(15000);
  const [purchasePaidVia, setPurchasePaidVia] = useState<AccountHead>('UBL');
  const [purchaseRef, setPurchaseRef] = useState(`INV-${Date.now().toString().slice(-6)}`);

  // Form State for Expense
  const [expDescription, setExpDescription] = useState('');
  const [expCategory, setExpCategory] = useState<GeneralExpense['category']>('Office Rent & Bills');
  const [expAmount, setExpAmount] = useState<number>(25000);
  const [expPaidVia, setExpPaidVia] = useState<AccountHead>('UBL');
  const [expApprovedBy, setExpApprovedBy] = useState('Umar Shafique (CEO)');

  const filteredPurchases = purchases.filter(
    (p) =>
      p.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpenses = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.approvedBy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Submit Purchase
  const handlePurchaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (itemName.trim() && purchaseAmount > 0) {
      const newP: Purchase = {
        id: `PUR-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        itemName,
        category: purchaseCategory,
        vendor: vendor || 'Direct Merchant',
        amountPKR: purchaseAmount,
        paidVia: purchasePaidVia,
        receiptRef: purchaseRef,
      };

      onAddPurchase(newP);
      setShowModal(false);
      setItemName('');
      setVendor('');
    }
  };

  // Submit Expense
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expDescription.trim() && expAmount > 0) {
      const newE: GeneralExpense = {
        id: `EXP-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
        description: expDescription,
        category: expCategory,
        amountPKR: expAmount,
        paidVia: expPaidVia,
        approvedBy: expApprovedBy,
      };

      onAddGeneralExpense(newE);
      setShowModal(false);
      setExpDescription('');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (activeTab === 'PURCHASES') {
      const headers = ['ID', 'Date', 'Item Name', 'Category', 'Vendor', 'Amount (PKR)', 'Paid Via', 'Receipt Ref'];
      const rows = purchases.map((p) => [p.id, p.date, p.itemName, p.category, p.vendor, p.amountPKR, p.paidVia, p.receiptRef || '-']);
      exportToCSV('devsio_purchases_log', headers, rows);
    } else {
      const headers = ['ID', 'Date', 'Description', 'Category', 'Amount (PKR)', 'Paid Via', 'Approved By'];
      const rows = expenses.map((e) => [e.id, e.date, e.description, e.category, e.amountPKR, e.paidVia, e.approvedBy]);
      exportToCSV('devsio_expenses_log', headers, rows);
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    if (activeTab === 'PURCHASES') {
      const headers = ['Date', 'Item Name', 'Vendor', 'Category', 'Paid Via', 'Amount (PKR)'];
      const rows = purchases.map((p) => [
        p.date,
        p.itemName,
        p.vendor,
        p.category,
        p.paidVia === 'UBL' ? 'UBL Bank' : 'Umar Cash',
        p.amountPKR.toLocaleString('en-PK'),
      ]);
      const total = purchases.reduce((a, b) => a + b.amountPKR, 0);

      generateFinancialPDFReport('Purchases & Hardware Assets Log', 'Tools, Subscriptions & Devices', headers, rows, [
        { label: 'Total Purchases', value: formatPKR(total) },
      ]);
    } else {
      const headers = ['Date', 'Description', 'Category', 'Approved By', 'Paid Via', 'Amount (PKR)'];
      const rows = expenses.map((e) => [
        e.date,
        e.description,
        e.category,
        e.approvedBy,
        e.paidVia === 'UBL' ? 'UBL Bank' : 'Umar Cash',
        e.amountPKR.toLocaleString('en-PK'),
      ]);
      const total = expenses.reduce((a, b) => a + b.amountPKR, 0);

      generateFinancialPDFReport('Operating Expenses Audit Log', 'Office Bills, Ads & Salaries', headers, rows, [
        { label: 'Total Operating Expenses', value: formatPKR(total) },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Purchases & Operational Expenses Audit Log</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
              Module 5
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track SaaS subscriptions, API tools, hardware purchases, office bills, and ad marketing campaigns.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#00D2FF]" />
            <span>PDF Report</span>
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log Entry</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-slate-200">
        <button
          onClick={() => setActiveTab('PURCHASES')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'PURCHASES'
              ? 'bg-[#0A192F] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Purchases & SaaS Tools ({purchases.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'EXPENSES'
              ? 'bg-[#0A192F] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>General Operating Expenses ({expenses.length})</span>
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {activeTab === 'PURCHASES' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Paid Via</th>
                  <th className="py-3 px-4 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No purchases recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-extrabold text-slate-400">{p.id}</td>
                      <td className="py-3 px-4 text-slate-600">{p.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{p.itemName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.vendor}</td>
                      <td className="py-3 px-4 font-bold">
                        {p.paidVia === 'UBL' ? (
                          <span className="text-blue-700 inline-flex items-center space-x-1">
                            <Landmark className="w-3 h-3" />
                            <span>UBL Bank</span>
                          </span>
                        ) : (
                          <span className="text-amber-700 inline-flex items-center space-x-1">
                            <Wallet className="w-3 h-3" />
                            <span>Umar Cash</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        {formatPKR(p.amountPKR)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Approved By</th>
                  <th className="py-3 px-4">Paid Via</th>
                  <th className="py-3 px-4 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No general expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-extrabold text-slate-400">{e.id}</td>
                      <td className="py-3 px-4 text-slate-600">{e.date}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{e.description}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{e.approvedBy}</td>
                      <td className="py-3 px-4 font-bold">
                        {e.paidVia === 'UBL' ? (
                          <span className="text-blue-700 inline-flex items-center space-x-1">
                            <Landmark className="w-3 h-3" />
                            <span>UBL Bank</span>
                          </span>
                        ) : (
                          <span className="text-amber-700 inline-flex items-center space-x-1">
                            <Wallet className="w-3 h-3" />
                            <span>Umar Cash</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-700">
                        {formatPKR(e.amountPKR)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              Log New {activeTab === 'PURCHASES' ? 'Purchase / SaaS Tool' : 'General Operating Expense'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">Updates financial ledger and account head balance immediately</p>

            {activeTab === 'PURCHASES' ? (
              <form onSubmit={handlePurchaseSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hostinger Cloud VPS or Figma License"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={purchaseCategory}
                    onChange={(e) => setPurchaseCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="SaaS Tool">SaaS Tool</option>
                    <option value="Domain/Hosting">Domain/Hosting</option>
                    <option value="API License">API License</option>
                    <option value="Hardware/Device">Hardware/Device</option>
                    <option value="Design Assets">Design Assets</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vendor Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GitHub, OpenAI, Hostinger"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    min="500"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paid Via Account Head</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPurchasePaidVia('UBL')}
                      className={`py-2 text-xs font-bold rounded-lg border ${
                        purchasePaidVia === 'UBL' ? 'bg-blue-50 border-blue-600 text-blue-900' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      Devsio UBL Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => setPurchasePaidVia('UMAR_CASH')}
                      className={`py-2 text-xs font-bold rounded-lg border ${
                        purchasePaidVia === 'UMAR_CASH' ? 'bg-amber-50 border-amber-600 text-amber-900' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      Umar Cash Head
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                  >
                    Save Purchase
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleExpenseSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office Rent & Lahore Tech Hub Electricity"
                    value={expDescription}
                    onChange={(e) => setExpDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Office Rent & Bills">Office Rent & Bills</option>
                    <option value="Meta/Google Ads">Meta/Google Ads</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Salaries/Perks">Salaries/Perks</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Misc">Misc</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    min="500"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Paid Via Account Head</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExpPaidVia('UBL')}
                      className={`py-2 text-xs font-bold rounded-lg border ${
                        expPaidVia === 'UBL' ? 'bg-blue-50 border-blue-600 text-blue-900' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      Devsio UBL Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpPaidVia('UMAR_CASH')}
                      className={`py-2 text-xs font-bold rounded-lg border ${
                        expPaidVia === 'UMAR_CASH' ? 'bg-amber-50 border-amber-600 text-amber-900' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      Umar Cash Head
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-lg"
                  >
                    Save Expense
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
