import React, { useRef, useState } from 'react';
import { 
  FileCode2, 
  Terminal, 
  Server, 
  ShieldCheck, 
  Lock, 
  Database, 
  Key, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  BookOpen,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  FileCheck,
  Shield,
  Eye,
  EyeOff,
  AlertTriangle,
  Archive,
  Sparkles,
  FileText
} from 'lucide-react';
import { Client, Project, TeamMember, Purchase, GeneralExpense, LedgerTransaction, TeamPayout } from '../types';
import { exportERPBackupJSON } from '../utils/financialCalculations';
import { 
  encryptBackupData, 
  decryptBackupData, 
  downloadEncryptedBackupFile,
  EncryptedBackupContainer 
} from '../utils/encryptionUtils';

interface SetupAndDocsProps {
  clients?: Client[];
  projects?: Project[];
  teamMembers?: TeamMember[];
  purchases?: Purchase[];
  expenses?: GeneralExpense[];
  ledger?: LedgerTransaction[];
  payouts?: TeamPayout[];
  onImportData?: (jsonData: any) => void;
  onResetData?: () => void;
}

export const SetupAndDocs: React.FC<SetupAndDocsProps> = ({
  clients = [],
  projects = [],
  teamMembers = [],
  purchases = [],
  expenses = [],
  ledger = [],
  payouts = [],
  onImportData,
  onResetData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const encryptedFileInputRef = useRef<HTMLInputElement>(null);

  // Encryption state
  const [encryptionPassphrase, setEncryptionPassphrase] = useState<string>('DevsioERP2026#MasterSecret');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [isEncrypting, setIsEncrypting] = useState<boolean>(false);
  const [encryptionSuccessMsg, setEncryptionSuccessMsg] = useState<string | null>(null);

  // Decryption state
  const [decryptionPassphrase, setDecryptionPassphrase] = useState<string>('');
  const [showDecryptionPassphrase, setShowDecryptionPassphrase] = useState<boolean>(false);
  const [uploadedEncryptedContainer, setUploadedEncryptedContainer] = useState<EncryptedBackupContainer | null>(null);
  const [decryptedPreviewData, setDecryptedPreviewData] = useState<any | null>(null);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  // 1. Unencrypted Plain JSON Backup
  const handleExportJSON = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      app: 'Devsio Services ERP',
      version: '2.4',
      clients,
      projects,
      teamMembers,
      purchases,
      expenses,
      ledger,
      payouts,
    };
    exportERPBackupJSON(backupData);
  };

  // 2. AES-256 Encrypted Database Backup
  const handleExportEncryptedBackup = async () => {
    if (!encryptionPassphrase || encryptionPassphrase.length < 6) {
      alert('Please enter a secure passkey (at least 6 characters) for encryption.');
      return;
    }

    setIsEncrypting(true);
    setEncryptionSuccessMsg(null);

    try {
      const fullStatePayload = {
        timestamp: new Date().toISOString(),
        app: 'Devsio Services ERP',
        version: '2.4',
        clients,
        projects,
        teamMembers,
        purchases,
        expenses,
        ledger,
        payouts,
      };

      const encryptedContainer = await encryptBackupData(fullStatePayload, encryptionPassphrase);
      downloadEncryptedBackupFile(encryptedContainer);
      setEncryptionSuccessMsg('Encrypted AES-256 database backup file generated and downloaded!');
    } catch (err: any) {
      alert(`Encryption error: ${err.message || 'Failed to encrypt database backup.'}`);
    } finally {
      setIsEncrypting(false);
    }
  };

  // 3. File upload handler for Encrypted .enc file
  const handleEncryptedFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.format === 'DEVSIO_ENCRYPTED_BACKUP_V1') {
          setUploadedEncryptedContainer(parsed);
          setDecryptedPreviewData(null);
          setDecryptionError(null);
        } else {
          setDecryptionError('Invalid or unrecognized encrypted file format.');
        }
      } catch (err) {
        setDecryptionError('Failed to parse file. Make sure it is a valid Devsio .enc backup file.');
      }
    };
    reader.readAsText(file);
  };

  // 4. Decrypt and verify payload
  const handleDecryptFile = async () => {
    if (!uploadedEncryptedContainer) return;
    if (!decryptionPassphrase) {
      setDecryptionError('Please enter the decryption passkey.');
      return;
    }

    setIsDecrypting(true);
    setDecryptionError(null);

    try {
      const decryptedPayload = await decryptBackupData(uploadedEncryptedContainer, decryptionPassphrase);
      setDecryptedPreviewData(decryptedPayload);
    } catch (err: any) {
      setDecryptionError('Decryption failed! Incorrect passkey or corrupted backup payload.');
    } finally {
      setIsDecrypting(false);
    }
  };

  // 5. Confirm State Restoration
  const handleConfirmRestoration = () => {
    if (!decryptedPreviewData || !onImportData) return;
    onImportData(decryptedPreviewData);
    alert('Devsio ERP Financial State successfully restored from AES-256 encrypted backup!');
    setUploadedEncryptedContainer(null);
    setDecryptedPreviewData(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        if (onImportData) {
          onImportData(jsonData);
          alert('Devsio ERP Financial State successfully restored from backup JSON!');
        }
      } catch (err) {
        alert('Invalid JSON backup file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="bg-[#0A192F] text-white rounded-2xl p-6 border border-[#1B365D] shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#00D2FF]/20 text-[#00D2FF] rounded-xl border border-[#00D2FF]/40">
            <FileCode2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">System Architecture, Formulas & Setup Documentation</h1>
            <p className="text-xs text-slate-300 mt-1">
              Devsio Services ERP Technical Manual, Deployment Guide, Financial Engine Formulas, and Role-Based Access Control (RBAC) Guidelines.
            </p>
          </div>
        </div>
      </div>

      {/* AES-256 ENCRYPTED DATABASE BACKUP & ARCHIVING ENGINE */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-cyan-500/30 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center space-x-2">
                <span>AES-256 Encrypted Database Backup & Archive Engine</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Client-side Web Crypto PBKDF2 + AES-GCM 256-bit encryption for secure external cold storage & archiving.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold rounded-full border border-cyan-500/30 self-start md:self-auto">
            PBKDF2 + AES-GCM
          </span>
        </div>

        {/* Encrypted Download Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Box A: Export Encrypted Archive */}
          <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>1. Download Encrypted Backup (.enc)</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Encrypts all clients, project contracts, double-entry financial ledgers, and team salary balances into a single password-protected file.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                Encryption Passkey
              </label>
              <div className="relative">
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={encryptionPassphrase}
                  onChange={(e) => setEncryptionPassphrase(e.target.value)}
                  placeholder="Enter secret passphrase..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-cyan-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleExportEncryptedBackup}
              disabled={isEncrypting}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center space-x-2"
            >
              {isEncrypting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Encrypting Payload...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download Encrypted JSON (.enc)</span>
                </>
              )}
            </button>

            {encryptionSuccessMsg && (
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{encryptionSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Box B: Decrypt & Restore Archive */}
          <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>2. Upload & Decrypt Archive (.enc)</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upload an encrypted backup archive, supply the decryption key, and restore the ERP state safely after verification.
            </p>

            <div>
              <button
                onClick={() => encryptedFileInputRef.current?.click()}
                className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2"
              >
                <Archive className="w-4 h-4 text-emerald-400" />
                <span>
                  {uploadedEncryptedContainer
                    ? `Selected File (${uploadedEncryptedContainer.timestamp.slice(0, 10)})`
                    : 'Select .enc Encrypted File'}
                </span>
              </button>

              <input
                type="file"
                ref={encryptedFileInputRef}
                onChange={handleEncryptedFileChange}
                accept=".enc,.json"
                className="hidden"
              />
            </div>

            {uploadedEncryptedContainer && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Enter Decryption Passkey
                  </label>
                  <div className="relative">
                    <input
                      type={showDecryptionPassphrase ? 'text' : 'password'}
                      value={decryptionPassphrase}
                      onChange={(e) => setDecryptionPassphrase(e.target.value)}
                      placeholder="Enter passkey to unlock file..."
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-emerald-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDecryptionPassphrase(!showDecryptionPassphrase)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-white"
                    >
                      {showDecryptionPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleDecryptFile}
                  disabled={isDecrypting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center space-x-2"
                >
                  {isDecrypting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Decrypting...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      <span>Decrypt & Verify Payload</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {decryptionError && (
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{decryptionError}</span>
              </div>
            )}

            {/* Decrypted Payload Summary & Confirmation */}
            {decryptedPreviewData && (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Payload Decrypted Successfully!</span>
                </div>

                <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                  <p>Clients: {decryptedPreviewData.clients?.length || 0}</p>
                  <p>Projects: {decryptedPreviewData.projects?.length || 0}</p>
                  <p>Ledger Entries: {decryptedPreviewData.ledger?.length || 0}</p>
                  <p>Team Members: {decryptedPreviewData.teamMembers?.length || 0}</p>
                </div>

                <button
                  onClick={handleConfirmRestoration}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition"
                >
                  Confirm & Overwrite ERP State
                </button>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Interactive Standard JSON Backup & Data Management Center */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Database className="w-5 h-5 text-[#00D2FF]" />
              <span>Standard Data Backup & Quick Reset Center</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unencrypted raw JSON backups & system factory resets.
            </p>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-lg">
            Active Records: {clients.length + projects.length + ledger.length} items
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          
          <button
            onClick={handleExportJSON}
            className="p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl border border-slate-700 flex flex-col items-start justify-between space-y-3 group transition"
          >
            <div className="p-2 bg-[#00D2FF]/20 text-[#00D2FF] rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm text-white">Export Raw JSON Snapshot</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Download unencrypted database JSON</p>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-xl border border-slate-200 flex flex-col items-start justify-between space-y-3 group transition"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm text-slate-900">Restore Raw JSON</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Upload plain ERP backup JSON</p>
            </div>
          </button>

          <button
            onClick={onResetData}
            className="p-4 bg-rose-50 hover:bg-rose-100 text-rose-900 rounded-xl border border-rose-200 flex flex-col items-start justify-between space-y-3 group transition"
          >
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-sm text-rose-900">Reset to Initial State</h3>
              <p className="text-[11px] text-rose-700 mt-0.5">Clear local changes & restore sample dataset</p>
            </div>
          </button>

        </div>
      </div>

      {/* Section 1: Core Financial Engine Formulas */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-[#2563EB]" />
          <span>1. Core Mathematical Financial Engine Rules</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Rule A: Fixed 20% Devsio Reserve Cut</h3>
            <p className="text-slate-600">
              On every booked project gross budget (PKR), exactly 20% is automatically assigned to Devsio Company Retained Earnings / Reserve Fund.
            </p>
            <div className="p-2.5 bg-[#0A192F] text-[#00D2FF] font-mono rounded-lg">
              Company Reserve (20%) = Gross Budget * 0.20
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Rule B: Direct Project Expenses Allocation</h3>
            <p className="text-slate-600">
              Direct tools, domains, hosting, or third-party API licenses are deducted from the remaining budget before team pool distribution.
            </p>
            <div className="p-2.5 bg-[#0A192F] text-amber-300 font-mono rounded-lg">
              Net Distributable Pool = (Gross Budget * 0.80) - Direct Expenses
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Rule C: Team Member Allocation Pool</h3>
            <p className="text-slate-600">
              10-member team pool (UI/UX, Frontend, Backend, SEO, Content, Video, QA, PM, etc.). Assigned custom PKR amounts that must equal Net Distributable Pool.
            </p>
            <div className="p-2.5 bg-[#0A192F] text-emerald-300 font-mono rounded-lg">
              Pending Payable = Promised Amount - Paid Amount to Date
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <h3 className="font-bold text-slate-900 text-sm">Rule E: Multi-Account Cash Flow Routing</h3>
            <p className="text-slate-600">
              Every inflow (Client Milestone) and outflow (Payout / Purchase) is tagged to Devsio (UBL Bank Account) or Umar (Personal / Cash Account).
            </p>
            <div className="p-2.5 bg-[#0A192F] text-blue-200 font-mono rounded-lg">
              Account Net Balance = Sum(Inflows) - Sum(Outflows)
            </div>
          </div>

        </div>
      </div>

      {/* Section 2: Environment & Deployment Setup Instructions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-emerald-600" />
          <span>2. Environment & Local/Cloud Deployment Setup Guide</span>
        </h2>

        <div className="space-y-4 text-xs text-slate-700">
          
          <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono space-y-2">
            <p className="text-emerald-400 font-bold"># Step 1: Clone Repository & Install Dependencies</p>
            <p>git clone https://github.com/devsio-services/devsio-erp.git</p>
            <p>cd devsio-erp</p>
            <p>npm install</p>
            
            <p className="text-emerald-400 font-bold pt-2"># Step 2: Configure Environment Variables (.env)</p>
            <p>cp .env.example .env</p>
            <p># Set APP_URL=http://localhost:3000</p>

            <p className="text-emerald-400 font-bold pt-2"># Step 3: Run Development Server Locally</p>
            <p>npm run dev</p>
            <p># Server binds to http://localhost:3000</p>

            <p className="text-emerald-400 font-bold pt-2"># Step 4: Production Build & Containerization (Cloud Run / Vercel Free Tier)</p>
            <p>npm run build</p>
            <p>npm start</p>
          </div>

        </div>
      </div>

      {/* Section 3: Secure Authentication & API Role-Based Access Control (RBAC) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <span>3. Secure Authentication & API Role-Based Access Control (RBAC)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-indigo-900 font-bold">
              <Key className="w-4 h-4 text-indigo-600" />
              <span>Role 1: Owner / CEO (Umar Shafique)</span>
            </div>
            <p className="text-indigo-950">
              Full administrative privileges. Unrestricted access to UBL Bank Head, Umar Personal Cash Head, 20% Reserve Funds, Team Payout authorizations, and raw financial exports.
            </p>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-blue-900 font-bold">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Role 2: Finance & Project Manager</span>
            </div>
            <p className="text-blue-950">
              Access to Client Milestones, Project Costing Calculator, and Direct Expense logging. Cannot modify historical company reserve ratios or manipulate personal cash accounts without CEO signature.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <Lock className="w-4 h-4 text-slate-600" />
              <span>Role 3: Team Member (Read-Only Portal)</span>
            </div>
            <p className="text-slate-600">
              Restricted personal view showing only assigned tasks, promised earnings, dispatched payouts, and personal outstanding balances. Complete privacy isolation between team members.
            </p>
          </div>

        </div>
      </div>

      {/* Section 4: Database Schema Definition (SQL Ready) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Database className="w-5 h-5 text-purple-600" />
          <span>4. Database Schema Structure (PostgreSQL / Firestore Ready)</span>
        </h2>

        <div className="p-4 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto space-y-2">
          <p className="text-purple-400 font-bold">-- Clients & Project Milestones Table</p>
          <p>CREATE TABLE clients (id VARCHAR(20) PRIMARY KEY, name VARCHAR(100), company VARCHAR(100), email VARCHAR(100), gross_budget NUMERIC(12,2));</p>
          <p>CREATE TABLE milestones (id VARCHAR(20) PRIMARY KEY, client_id VARCHAR(20) REFERENCES clients(id), title VARCHAR(150), amount NUMERIC(12,2), status VARCHAR(20), account_head VARCHAR(20));</p>

          <p className="text-purple-400 font-bold pt-2">-- Projects, Direct Expenses & Team Allocations</p>
          <p>CREATE TABLE projects (id VARCHAR(20) PRIMARY KEY, client_id VARCHAR(20), company_reserve_20 NUMERIC(12,2), net_pool NUMERIC(12,2));</p>
          <p>CREATE TABLE team_assignments (project_id VARCHAR(20), team_member_id VARCHAR(20), promised_amount NUMERIC(12,2), paid_amount NUMERIC(12,2));</p>

          <p className="text-purple-400 font-bold pt-2">-- Double-Entry Ledger Transactions</p>
          <p>CREATE TABLE ledger_transactions (id VARCHAR(20) PRIMARY KEY, txn_date DATE, account_head VARCHAR(20), flow VARCHAR(10), amount NUMERIC(12,2), description TEXT);</p>
        </div>
      </div>

    </div>
  );
};
