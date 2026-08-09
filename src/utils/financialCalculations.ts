import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Client, Project, TeamMember, Purchase, GeneralExpense, LedgerTransaction, TeamPayout, Milestone } from '../types';

/**
 * Currency Formatter for PKR
 */
export function formatPKR(amount: number): string {
  if (isNaN(amount)) return 'PKR 0';
  return 'PKR ' + Math.round(amount).toLocaleString('en-PK');
}

/**
 * Rule A: 20% Devsio Company Reserve Cut
 */
export function calculateCompanyReserve(grossBudgetPKR: number): number {
  return Math.round(grossBudgetPKR * 0.20);
}

/**
 * Rule B: Net Distributable Pool
 * Net Pool = (Gross Budget - 20% Reserve) - Direct Expenses
 */
export function calculateNetDistributablePool(grossBudgetPKR: number, directExpensesPKR: number): number {
  const reserve = calculateCompanyReserve(grossBudgetPKR);
  return Math.max(0, Math.round(grossBudgetPKR - reserve - directExpensesPKR));
}

/**
 * Executive Financial Metrics Calculator
 */
export interface ExecutiveKPIs {
  totalGrossSales: number;
  totalCashCollected: number;
  totalPendingReceivables: number;
  totalCompanyReserve: number;
  totalTeamPromised: number;
  totalTeamPaid: number;
  totalTeamPendingPayables: number;
  totalDirectProjectExpenses: number;
  totalPurchases: number;
  totalGeneralExpenses: number;
  totalOperatingExpenses: number;
  ublBankBalance: number;
  umarCashBalance: number;
  netAgencyLiquidity: number;
}

export function calculateExecutiveKPIs(
  clients: Client[],
  projects: Project[],
  teamMembers: TeamMember[],
  purchases: Purchase[],
  expenses: GeneralExpense[],
  ledger: LedgerTransaction[],
  payouts: TeamPayout[]
): ExecutiveKPIs {
  // 1. Total Gross Sales from Projects / Clients
  const totalGrossSales = projects.reduce((acc, p) => acc + (p.grossBudgetPKR || 0), 0);

  // 2. Total Cash Collected from Milestones
  let totalCashCollected = 0;
  clients.forEach((client) => {
    client.milestones.forEach((m) => {
      if (m.status === 'Paid') {
        totalCashCollected += m.amountPKR || 0;
      }
    });
  });

  // 3. Pending Client Receivables
  const totalPendingReceivables = Math.max(0, totalGrossSales - totalCashCollected);

  // 4. 20% Company Reserve
  const totalCompanyReserve = projects.reduce((acc, p) => acc + calculateCompanyReserve(p.grossBudgetPKR || 0), 0);

  // 5. Team Promised vs Paid
  let totalTeamPromised = 0;
  let totalTeamPaid = 0;
  projects.forEach((p) => {
    p.teamAssignments.forEach((ta) => {
      totalTeamPromised += ta.promisedAmountPKR || 0;
      totalTeamPaid += ta.paidAmountPKR || 0;
    });
  });
  const totalTeamPendingPayables = Math.max(0, totalTeamPromised - totalTeamPaid);

  // 6. Direct Project Expenses
  const totalDirectProjectExpenses = projects.reduce((acc, p) => acc + (p.directExpensesPKR || 0), 0);

  // Purchases & Operating Expenses
  const totalPurchases = purchases.reduce((acc, p) => acc + (p.amountPKR || 0), 0);
  const totalGeneralExpenses = expenses.reduce((acc, e) => acc + (e.amountPKR || 0), 0);
  const totalOperatingExpenses = totalDirectProjectExpenses + totalPurchases + totalGeneralExpenses;

  // Account Head Balances from Ledger
  let ublInflow = 0;
  let ublOutflow = 0;
  let umarInflow = 0;
  let umarOutflow = 0;

  ledger.forEach((txn) => {
    if (txn.accountHead === 'UBL') {
      if (txn.flow === 'INFLOW') ublInflow += txn.amountPKR;
      else ublOutflow += txn.amountPKR;
    } else if (txn.accountHead === 'UMAR_CASH') {
      if (txn.flow === 'INFLOW') umarInflow += txn.amountPKR;
      else umarOutflow += txn.amountPKR;
    }
  });

  const ublBankBalance = ublInflow - ublOutflow;
  const umarCashBalance = umarInflow - umarOutflow;
  const netAgencyLiquidity = ublBankBalance + umarCashBalance;

  return {
    totalGrossSales,
    totalCashCollected,
    totalPendingReceivables,
    totalCompanyReserve,
    totalTeamPromised,
    totalTeamPaid,
    totalTeamPendingPayables,
    totalDirectProjectExpenses,
    totalPurchases,
    totalGeneralExpenses,
    totalOperatingExpenses,
    ublBankBalance,
    umarCashBalance,
    netAgencyLiquidity,
  };
}

/**
 * CSV Export Utility
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell ?? '').replace(/"/g, '""');
          return `"${cellStr}"`;
        })
        .join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * PDF Export Utility for Devsio Financial Statement & Reports
 */
export function generateFinancialPDFReport(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  summaryInfo?: { label: string; value: string }[]
) {
  const doc = new jsPDF();

  // Primary Header Banner (#0A192F)
  doc.setFillColor(10, 25, 47); // Dark Navy
  doc.rect(0, 0, 210, 32, 'F');

  // Brand Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DEVSIO SERVICES', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Internal Agency Financial & ERP Control Report', 14, 22);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-PK')} | devsioservices.com`, 140, 22);

  // Title Section
  doc.setTextColor(15, 23, 42); // Slate dark
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(subtitle, 14, 48);

  // Summary Metrics Box if provided
  let startY = 54;
  if (summaryInfo && summaryInfo.length > 0) {
    doc.setFillColor(248, 250, 252); // Light Grey
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, 52, 182, 16, 2, 2, 'FD');

    doc.setFontSize(9);
    let xPos = 18;
    summaryInfo.forEach((item) => {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(10, 25, 47);
      doc.text(`${item.label}: `, xPos, 62);
      const labelWidth = doc.getTextWidth(`${item.label}: `);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(37, 99, 235);
      doc.text(item.value, xPos + labelWidth, 62);

      xPos += 60;
    });
    startY = 74;
  }

  // Data Table via autoTable
  autoTable(doc, {
    startY: startY,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [10, 25, 47], // #0A192F
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  // Footer Branding
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Devsio Services ERP - Confidential - Page ${i} of ${pageCount}`, 14, 288);
  }

  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_devsio.pdf`);
}

/**
 * PDF Client Invoice Generator
 */
export function generateClientInvoicePDF(
  client: Client,
  milestone?: Milestone,
  invoiceNumber: string = `INV-${Date.now().toString().slice(-6)}`,
  issueDate: string = new Date().toISOString().split('T')[0],
  dueDate: string = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
) {
  const doc = new jsPDF();

  // Dark Navy Header Banner (#0A192F)
  doc.setFillColor(10, 25, 47);
  doc.rect(0, 0, 210, 38, 'F');

  // Brand Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('DEVSIO SERVICES', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 210, 255); // Cyan #00D2FF
  doc.text('OFFICIAL CLIENT INVOICE & MILESTONE BILLING', 14, 26);
  doc.setTextColor(255, 255, 255);
  doc.text('Lahore Tech Hub, Gulberg III | info@devsioservices.com', 14, 32);

  // Invoice Title Right Aligned
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 196, 18, { align: 'right' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`# ${invoiceNumber}`, 196, 26, { align: 'right' });

  // Bill To & Dates Section
  doc.setTextColor(15, 23, 42); // Slate dark
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 46, 88, 36, 2, 2, 'FD');
  doc.roundedRect(108, 46, 88, 36, 2, 2, 'FD');

  // Billed To Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 25, 47);
  doc.text('BILLED TO:', 18, 54);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text(client.company, 18, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Attn: ${client.name}`, 18, 68);
  doc.text(`Email: ${client.email}`, 18, 74);
  doc.text(`Phone: ${client.phone}`, 18, 80);

  // Invoice Meta Info
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(10, 25, 47);
  doc.text('INVOICE DETAILS:', 112, 54);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Issue Date: ${issueDate}`, 112, 62);
  doc.text(`Payment Due: ${dueDate}`, 112, 68);
  doc.text(`Project Code: ${client.id}`, 112, 74);
  doc.text(`Payment Status: ${milestone ? milestone.status : 'Pending Billing'}`, 112, 80);

  // Line Items Table
  const tableHeaders = ['Item / Service Description', 'Project Scope', 'Amount (PKR)'];
  const tableRows: (string | number)[][] = [];

  if (milestone) {
    tableRows.push([
      `${milestone.title}`,
      `${client.projectTitle} (Milestone Deliverable)`,
      formatPKR(milestone.amountPKR),
    ]);
  } else {
    client.milestones.forEach((m) => {
      tableRows.push([m.title, client.projectTitle, formatPKR(m.amountPKR)]);
    });
  }

  const invoiceTotal = milestone
    ? milestone.amountPKR
    : client.grossBudgetPKR;

  autoTable(doc, {
    startY: 90,
    head: [tableHeaders],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [10, 25, 47],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9.5,
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 55 },
      2: { cellWidth: 37, halign: 'right' },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 130;

  // Total Summary Block
  doc.setFillColor(10, 25, 47);
  doc.roundedRect(120, finalY + 8, 76, 20, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL AMOUNT DUE:', 124, finalY + 18);
  doc.setTextColor(0, 210, 255);
  doc.setFontSize(11);
  doc.text(formatPKR(invoiceTotal), 192, finalY + 18, { align: 'right' });

  // Official Bank Payment Details
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, finalY + 34, 182, 38, 2, 2, 'FD');

  doc.setTextColor(10, 25, 47);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL PAYMENT BANK ACCOUNTS:', 18, finalY + 42);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.setFont('helvetica', 'bold');
  doc.text('1. Devsio Corporate UBL Bank:', 18, finalY + 50);
  doc.setFont('helvetica', 'normal');
  doc.text('Account Title: Devsio Services (SMC-Pvt) Ltd | Account #: 0109-284716291 | IBAN: PK36UBL00000109284716291', 18, 56 + finalY);

  doc.setFont('helvetica', 'bold');
  doc.text('2. CEO Umar Cash Head:', 18, finalY + 62);
  doc.setFont('helvetica', 'normal');
  doc.text('Account Title: Umar Shafique | Account #: 0300-8472910 | Bank: JazzCash / Nayapay / Direct Transfer', 18, finalY + 68);

  // Footer Signature & Terms
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Thank you for partnering with Devsio Services! Electronic Invoice generated by Devsio ERP System.', 14, 282);

  doc.save(`Devsio_Invoice_${client.company.replace(/\s+/g, '_')}_${invoiceNumber}.pdf`);
}

/**
 * JSON Data Export / Backup Utility
 */
export function exportERPBackupJSON(data: Record<string, any>) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `devsio_erp_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

