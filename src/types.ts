export type AccountHead = 'UBL' | 'UMAR_CASH';

export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Partial';

export type ProjectStatus = 'Lead' | 'In Progress' | 'Review' | 'Completed' | 'On Hold';

export interface Milestone {
  id: string;
  title: string;
  amountPKR: number;
  status: PaymentStatus;
  receivedInAccount: AccountHead | null;
  dateReceived?: string;
  dueDate?: string;
  notes?: string;
}

export interface DirectExpense {
  id: string;
  title: string;
  category: 'Hosting/Domain' | 'Plugins/Licenses' | 'Third-Party API' | 'Subcontractor' | 'Design Assets' | 'Other';
  amountPKR: number;
  paidFromAccount: AccountHead;
  date: string;
  notes?: string;
}

export interface TeamAssignment {
  teamMemberId: string;
  teamMemberName: string;
  roleOnProject: string;
  promisedAmountPKR: number;
  paidAmountPKR: number;
}

export interface ProjectMilestoneDeadline {
  id: string;
  title: string;
  dueDate: string; // e.g. "2026-08-15"
  status: 'Pending' | 'Completed' | 'Overdue';
  description?: string;
  amountPKR?: number;
  assignedTeamMemberName?: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  companyName: string;
  projectTitle?: string;
  taskTitle: string;
  taskDetails: string;
  domainInfo: string; // e.g. "Fintech / Core Banking API", "Healthcare / EHR Encryption"
  assignedTeamMemberId: string;
  assignedTeamMemberName: string;
  amountPKR: number;
  paidAmountPKR: number;
  dueDate: string;
  status: 'Pending' | 'In Progress' | 'In Review' | 'Completed' | 'Blocked';
  completionPercentage?: number; // 0 - 100
  remarks?: string;
  issuesLog?: string;
  lastUpdated?: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  category: 'NDA' | 'Contract' | 'Brief' | 'Proposal' | 'Design Deliverable' | 'Invoice' | 'Other';
  fileType: 'pdf' | 'doc' | 'link' | 'image' | 'other';
  urlOrLink: string;
  fileName?: string;
  uploadedAt: string;
  notes?: string;
}

export interface Project {
  id: string;
  clientId: string;
  clientName: string;
  companyName: string;
  projectTitle: string;
  grossBudgetPKR: number;
  companyReservePKR: number; // Rule A: 20%
  directExpensesPKR: number; // Rule B: Sum of direct expenses
  netDistributablePoolPKR: number; // Rule B: Gross - Reserve - Direct Expenses
  status: ProjectStatus;
  startDate: string;
  deadline: string;
  teamAssignments: TeamAssignment[];
  directExpensesList: DirectExpense[];
  milestoneDeadlines?: ProjectMilestoneDeadline[];
  tasks?: ProjectTask[];
  documents?: ProjectDocument[];
  notes?: string;
}

export interface Client {
  id: string; // e.g. DS-CL-001
  name: string;
  company: string;
  email: string;
  phone: string;
  projectTitle: string;
  grossBudgetPKR: number;
  milestones: Milestone[];
  notes?: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'Active' | 'Inactive';
  defaultCutPercentage?: number;
  joinedDate?: string;
  
  // KYC & Personal Profile
  fatherName?: string;
  cnic?: string; // ID Card Number
  bankName?: string;
  bankAccountTitle?: string;
  bankAccountNumber?: string;
  iban?: string;
  emergencyContact?: string;
  password?: string;
  bankAccountDetails?: string;
  easypaisaNayapay?: string;
}

export interface TeamPayout {
  id: string;
  projectId: string;
  projectTitle: string;
  teamMemberId: string;
  teamMemberName: string;
  amountPKR: number;
  paidFromAccount: AccountHead;
  date: string;
  receiptRef: string;
  notes?: string;
}

export interface Purchase {
  id: string;
  date: string;
  itemName: string;
  category: 'SaaS Tool' | 'Domain/Hosting' | 'API License' | 'Hardware/Device' | 'Design Assets' | 'Other';
  vendor: string;
  amountPKR: number;
  paidVia: AccountHead;
  receiptRef?: string;
  notes?: string;
}

export interface GeneralExpense {
  id: string;
  date: string;
  description: string;
  category: 'Office Rent & Bills' | 'Meta/Google Ads' | 'Marketing' | 'Salaries/Perks' | 'Entertainment' | 'Misc';
  amountPKR: number;
  paidVia: AccountHead;
  approvedBy: string;
  notes?: string;
}

export interface LedgerTransaction {
  id: string;
  date: string;
  type: 'Client Inflow' | 'Team Payout' | 'Direct Project Expense' | 'Purchase' | 'General Expense';
  accountHead: AccountHead;
  flow: 'INFLOW' | 'OUTFLOW';
  amountPKR: number;
  referenceId: string;
  category: string;
  description: string;
}
