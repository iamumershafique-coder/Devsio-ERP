import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Filter, 
  Flag, 
  User, 
  Building2, 
  X,
  FileText
} from 'lucide-react';
import { Project, ProjectMilestoneDeadline, TeamMember } from '../types';
import { formatPKR } from '../utils/financialCalculations';

interface ProjectMilestoneCalendarProps {
  projects: Project[];
  teamMembers: TeamMember[];
  onUpdateProject: (updatedProject: Project) => void;
  selectedProjectId?: string;
}

export const ProjectMilestoneCalendar: React.FC<ProjectMilestoneCalendarProps> = ({
  projects,
  teamMembers,
  onUpdateProject,
  selectedProjectId: initialSelectedProjectId,
}) => {
  // Navigation State (Default to August 2026 based on dataset)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 1)); // August 2026
  const [filterProjectId, setFilterProjectId] = useState<string>(initialSelectedProjectId || 'ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Pending' | 'Completed' | 'Overdue'>('ALL');

  // Selected Day Modal Inspector State
  const [selectedDayDateStr, setSelectedDayDateStr] = useState<string | null>(null);

  // Add Milestone Deadline Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addProjectId, setAddProjectId] = useState<string>(projects[0]?.id || '');
  const [addTitle, setAddTitle] = useState<string>('');
  const [addDueDate, setAddDueDate] = useState<string>('2026-08-15');
  const [addAmountPKR, setAddAmountPKR] = useState<number>(50000);
  const [addAssignedMember, setAddAssignedMember] = useState<string>(teamMembers[0]?.name || '');
  const [addDescription, setAddDescription] = useState<string>('');

  // Today reference date for comparison (August 9, 2026)
  const todayStr = '2026-08-09';

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date(2026, 7, 1));
  };

  // Filter projects list
  const activeProjects = filterProjectId === 'ALL' 
    ? projects 
    : projects.filter((p) => p.id === filterProjectId);

  // Flatten all deadline items from active projects
  interface FlattenedDeadline {
    id: string;
    projectId: string;
    projectTitle: string;
    companyName: string;
    type: 'MILESTONE' | 'PROJECT_FINAL';
    title: string;
    dueDate: string;
    status: 'Pending' | 'Completed' | 'Overdue';
    amountPKR?: number;
    assignedTeamMemberName?: string;
    description?: string;
    rawMilestoneObj?: ProjectMilestoneDeadline;
  }

  const allDeadlines: FlattenedDeadline[] = [];

  activeProjects.forEach((proj) => {
    // 1. Add overall project final deadline
    if (proj.deadline) {
      allDeadlines.push({
        id: `PRJ-FINAL-${proj.id}`,
        projectId: proj.id,
        projectTitle: proj.projectTitle,
        companyName: proj.companyName,
        type: 'PROJECT_FINAL',
        title: `Project Final Launch: ${proj.projectTitle}`,
        dueDate: proj.deadline,
        status: proj.status === 'Completed' ? 'Completed' : (proj.deadline < todayStr ? 'Overdue' : 'Pending'),
        amountPKR: proj.grossBudgetPKR,
        description: `Final project delivery deadline for ${proj.companyName}`,
      });
    }

    // 2. Add milestone deadlines
    if (proj.milestoneDeadlines) {
      proj.milestoneDeadlines.forEach((ms) => {
        // Calculate status dynamically if pending and past today
        let computedStatus = ms.status;
        if (computedStatus === 'Pending' && ms.dueDate < todayStr) {
          computedStatus = 'Overdue';
        }

        if (filterStatus === 'ALL' || filterStatus === computedStatus) {
          allDeadlines.push({
            id: ms.id,
            projectId: proj.id,
            projectTitle: proj.projectTitle,
            companyName: proj.companyName,
            type: 'MILESTONE',
            title: ms.title,
            dueDate: ms.dueDate,
            status: computedStatus,
            amountPKR: ms.amountPKR,
            assignedTeamMemberName: ms.assignedTeamMemberName,
            description: ms.description,
            rawMilestoneObj: ms,
          });
        }
      });
    }
  });

  // Calendar Days Calculation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDayOfMonth.getDate();

  // Calendar Grid Array
  const calendarCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month padding days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevDate = new Date(year, month - 1, day);
    const dateStr = prevDate.toISOString().split('T')[0];
    calendarCells.push({ dateStr, dayNum: day, isCurrentMonth: false });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarCells.push({ dateStr: dStr, dayNum: day, isCurrentMonth: true });
  }

  // Next month padding days to complete 35 or 42 grid cells
  const remainingCells = (calendarCells.length > 35 ? 42 : 35) - calendarCells.length;
  for (let day = 1; day <= remainingCells; day++) {
    const nextDate = new Date(year, month + 1, day);
    const dateStr = nextDate.toISOString().split('T')[0];
    calendarCells.push({ dateStr, dayNum: day, isCurrentMonth: false });
  }

  // Handle Toggle Milestone Status
  const handleToggleMilestoneStatus = (projectId: string, milestoneId: string) => {
    const targetProject = projects.find((p) => p.id === projectId);
    if (!targetProject || !targetProject.milestoneDeadlines) return;

    const updatedMilestones = targetProject.milestoneDeadlines.map((ms) => {
      if (ms.id === milestoneId) {
        const nextStatus = ms.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...ms, status: nextStatus };
      }
      return ms;
    });

    onUpdateProject({
      ...targetProject,
      milestoneDeadlines: updatedMilestones,
    });
  };

  // Handle Add New Milestone Deadline
  const handleAddMilestoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProject = projects.find((p) => p.id === addProjectId);
    if (!targetProject) return;

    const newMsDeadline: ProjectMilestoneDeadline = {
      id: `MSD-${Date.now().toString().slice(-6)}`,
      title: addTitle,
      dueDate: addDueDate,
      status: 'Pending',
      amountPKR: addAmountPKR,
      assignedTeamMemberName: addAssignedMember,
      description: addDescription,
    };

    const updatedMilestones = [...(targetProject.milestoneDeadlines || []), newMsDeadline];

    onUpdateProject({
      ...targetProject,
      milestoneDeadlines: updatedMilestones,
    });

    setShowAddModal(false);
    setAddTitle('');
    setAddDescription('');
  };

  // Month Name Header
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // Upcoming items sorted chronologically
  const upcomingDeadlines = [...allDeadlines]
    .filter((d) => d.status !== 'Completed')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Top Header & Toolbar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#00D2FF]/20 text-[#00D2FF] rounded-xl">
              <CalendarIcon className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Project Milestone & Deadline Calendar
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Track deliverable schedules, milestone target dates, and final release deadlines
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none pr-2"
            >
              <option value="ALL">All Agency Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none px-2"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Add Deadline Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Milestone Deadline</span>
          </button>
        </div>
      </div>

      {/* Grid: Main Calendar (8 cols) + Agenda Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Calendar View (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          
          {/* Calendar Month Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{monthName}</h3>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-full uppercase tracking-wider">
                Active Cycle
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleGoToToday}
                className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 mr-2"
              >
                Today
              </button>
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-amber-600">Sat</div>
            <div className="text-rose-600">Sun</div>
          </div>

          {/* 7-Column Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr;
              const itemsForDay = allDeadlines.filter((d) => d.dueDate === cell.dateStr);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDayDateStr(cell.dateStr)}
                  className={`min-h-[90px] p-1.5 rounded-xl border transition flex flex-col justify-between cursor-pointer group ${
                    cell.isCurrentMonth
                      ? isToday
                        ? 'bg-blue-50/70 border-blue-400 shadow-sm'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-xs'
                      : 'bg-slate-50/50 border-transparent text-slate-300 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold ${
                        isToday
                          ? 'w-5 h-5 bg-[#2563EB] text-white rounded-full flex items-center justify-center text-[10px]'
                          : cell.isCurrentMonth
                          ? 'text-slate-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {itemsForDay.length > 0 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-900 text-white rounded-full">
                        {itemsForDay.length}
                      </span>
                    )}
                  </div>

                  {/* Badges preview inside day cell */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {itemsForDay.slice(0, 2).map((item) => {
                      const isCompleted = item.status === 'Completed';
                      const isOverdue = item.status === 'Overdue';
                      const isFinal = item.type === 'PROJECT_FINAL';

                      return (
                        <div
                          key={item.id}
                          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded truncate border leading-tight ${
                            isCompleted
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : isOverdue
                              ? 'bg-rose-50 text-rose-800 border-rose-200 font-bold'
                              : isFinal
                              ? 'bg-indigo-50 text-indigo-900 border-indigo-200 font-bold'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}
                        >
                          {item.title}
                        </div>
                      );
                    })}

                    {itemsForDay.length > 2 && (
                      <p className="text-[8px] text-slate-400 font-bold text-center">
                        +{itemsForDay.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Color Legend */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-[10px] text-slate-500 font-semibold border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Completed Deliverable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Upcoming Pending Milestone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span>Overdue Deadline</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span>Project Final Release</span>
            </div>
          </div>
        </div>

        {/* Upcoming Deadlines Agenda Sidebar (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Agenda Summary Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Upcoming Milestones</span>
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next 30 Days</span>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center italic">No upcoming deadlines found.</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingDeadlines.map((item) => {
                  const isOverdue = item.status === 'Overdue';
                  const isToday = item.dueDate === todayStr;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                        isOverdue
                          ? 'bg-rose-50/60 border-rose-200'
                          : isToday
                          ? 'bg-blue-50/60 border-blue-200'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate max-w-[170px]">
                          {item.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                            isOverdue
                              ? 'bg-rose-600 text-white'
                              : isToday
                              ? 'bg-blue-600 text-white'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : isToday ? 'Due Today' : item.dueDate}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="truncate max-w-[150px] font-medium">{item.projectTitle}</span>
                        {item.amountPKR && (
                          <span className="font-mono font-bold text-slate-700">{formatPKR(item.amountPKR)}</span>
                        )}
                      </div>

                      {item.assignedTeamMemberName && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Assigned: {item.assignedTeamMemberName}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Schedule Statistics Widget */}
          <div className="bg-[#0A192F] text-white rounded-2xl p-5 border border-slate-800 space-y-3">
            <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Milestone Health KPI</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] text-emerald-400 font-bold uppercase">Completed</p>
                <p className="text-xl font-mono font-bold text-emerald-400 mt-0.5">
                  {allDeadlines.filter((d) => d.status === 'Completed').length}
                </p>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-[10px] text-rose-400 font-bold uppercase">Overdue</p>
                <p className="text-xl font-mono font-bold text-rose-400 mt-0.5">
                  {allDeadlines.filter((d) => d.status === 'Overdue').length}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-white/60 pt-1">
              All project timelines synced with Devsio 20% Cut & Net Distributable Pool system.
            </p>
          </div>

        </div>

      </div>

      {/* Selected Day Inspector Modal */}
      {selectedDayDateStr && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Deliverables Due: {selectedDayDateStr}
                </h3>
                <p className="text-xs text-slate-500">Detailed list of milestones scheduled for this date</p>
              </div>
              <button
                onClick={() => setSelectedDayDateStr(null)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {allDeadlines.filter((d) => d.dueDate === selectedDayDateStr).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">
                No milestone deliverables or project deadlines scheduled for this date.
              </p>
            ) : (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {allDeadlines
                  .filter((d) => d.dueDate === selectedDayDateStr)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                            item.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 font-medium">{item.projectTitle}</p>

                      {item.description && (
                        <p className="text-[10px] text-slate-500 bg-white p-2 rounded-lg border border-slate-200/60">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                        <span>Assigned: {item.assignedTeamMemberName || 'Team Lead'}</span>
                        {item.amountPKR && (
                          <span className="font-mono font-bold text-slate-900">{formatPKR(item.amountPKR)}</span>
                        )}
                      </div>

                      {item.rawMilestoneObj && (
                        <div className="pt-2 border-t border-slate-200 flex justify-end">
                          <button
                            onClick={() => {
                              handleToggleMilestoneStatus(item.projectId, item.rawMilestoneObj!.id);
                            }}
                            className={`px-3 py-1 text-[10px] font-bold rounded-lg transition ${
                              item.status === 'Completed'
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {item.status === 'Completed' ? 'Mark as Pending' : 'Mark as Completed'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedDayDateStr(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Milestone Deadline Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Project Milestone Deadline</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMilestoneSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Project</label>
                <select
                  value={addProjectId}
                  onChange={(e) => setAddProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.projectTitle} ({p.companyName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Milestone Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beta Version Launch & Testing"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={addDueDate}
                    onChange={(e) => setAddDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Amount (PKR)</label>
                  <input
                    type="number"
                    required
                    value={addAmountPKR}
                    onChange={(e) => setAddAmountPKR(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Team Member</label>
                <select
                  value={addAssignedMember}
                  onChange={(e) => setAddAssignedMember(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {teamMembers.map((tm) => (
                    <option key={tm.id} value={tm.name}>
                      {tm.name} ({tm.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deliverable Notes / Description</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding deliverables, acceptance criteria..."
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#2563EB] hover:bg-blue-600 rounded-lg shadow-sm"
                >
                  Save Milestone Deadline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
