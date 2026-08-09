import React, { useState } from 'react';
import { Project, ProjectStatus } from '../types';
import { formatPKR } from '../utils/financialCalculations';
import { 
  Building2, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  CheckCircle2, 
  GripVertical,
  Briefcase,
  AlertCircle,
  Eye,
  ArrowRight,
  ShieldCheck,
  Tag
} from 'lucide-react';

interface ProjectKanbanBoardProps {
  projects: Project[];
  onUpdateProjectStatus: (project: Project, newStatus: ProjectStatus) => void;
  onSelectProjectForCosting: (projectId: string) => void;
}

const KANBAN_STAGES: {
  id: ProjectStatus;
  title: string;
  subtitle: string;
  badgeBg: string;
  headerBorder: string;
}[] = [
  {
    id: 'Lead',
    title: 'Lead / Booking',
    subtitle: 'Initial Discovery & Proposals',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-200',
    headerBorder: 'border-amber-400',
  },
  {
    id: 'In Progress',
    title: 'In Progress',
    subtitle: 'Active Design & Development',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-200',
    headerBorder: 'border-blue-500',
  },
  {
    id: 'Review',
    title: 'Review / QA',
    subtitle: 'UAT & Client Sign-off',
    badgeBg: 'bg-purple-100 text-purple-900 border-purple-200',
    headerBorder: 'border-purple-500',
  },
  {
    id: 'Completed',
    title: 'Completed',
    subtitle: 'Live Release & Handover',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    headerBorder: 'border-emerald-500',
  },
  {
    id: 'On Hold',
    title: 'On Hold',
    subtitle: 'Paused / Awaiting Input',
    badgeBg: 'bg-slate-200 text-slate-800 border-slate-300',
    headerBorder: 'border-slate-400',
  },
];

export const ProjectKanbanBoard: React.FC<ProjectKanbanBoardProps> = ({
  projects,
  onUpdateProjectStatus,
  onSelectProjectForCosting,
}) => {
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<ProjectStatus | null>(null);

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('text/plain', projectId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedProjectId(projectId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: ProjectStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: ProjectStatus) => {
    e.preventDefault();
    if (dragOverStageId === stageId) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetStage: ProjectStatus) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('text/plain') || draggedProjectId;
    if (projectId) {
      const targetProject = projects.find((p) => p.id === projectId);
      if (targetProject && targetProject.status !== targetStage) {
        onUpdateProjectStatus(targetProject, targetStage);
      }
    }
    setDraggedProjectId(null);
    setDragOverStageId(null);
  };

  // Summary Metrics
  const totalGrossValue = projects.reduce((acc, p) => acc + p.grossBudgetPKR, 0);

  return (
    <div className="space-y-4">
      {/* Kanban Sub-Header & Instructions */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-[#00D2FF]" />
              <span>Project Lifecycle Kanban Pipeline</span>
            </h2>
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#00D2FF]/20 text-[#00D2FF] border border-[#00D2FF]/30 rounded-full uppercase">
              Drag & Drop Enabled
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Drag project cards between stages to seamlessly update operational status and sync agency financials.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Pipeline Value</span>
            <span className="font-mono font-bold text-[#00D2FF] text-sm">{formatPKR(totalGrossValue)}</span>
          </div>
          <div className="bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Projects</span>
            <span className="font-mono font-bold text-white text-sm">{projects.length} Active</span>
          </div>
        </div>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
        {KANBAN_STAGES.map((stage) => {
          const stageProjects = projects.filter((p) => (p.status || 'In Progress') === stage.id);
          const stageGross = stageProjects.reduce((acc, p) => acc + p.grossBudgetPKR, 0);
          const isDragTarget = dragOverStageId === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={(e) => handleDragLeave(e, stage.id)}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`flex flex-col rounded-2xl border transition-all duration-200 min-h-[500px] ${
                isDragTarget
                  ? 'bg-blue-50/80 border-blue-400 shadow-lg scale-[1.01]'
                  : 'bg-slate-100/70 border-slate-200/80'
              }`}
            >
              {/* Column Header */}
              <div
                className={`p-3.5 bg-white rounded-t-2xl border-b border-slate-200 border-t-4 ${stage.headerBorder} flex flex-col space-y-1`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <h3 className="text-xs font-bold text-slate-900">{stage.title}</h3>
                    <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${stage.badgeBg}`}>
                      {stageProjects.length}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>{stage.subtitle}</span>
                  <span className="font-mono font-bold text-slate-700">{formatPKR(stageGross)}</span>
                </div>
              </div>

              {/* Column Droppable Area */}
              <div className="p-2.5 flex-1 space-y-3 overflow-y-auto">
                {stageProjects.length === 0 ? (
                  <div className="py-12 px-3 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-[11px] font-semibold text-slate-400">No Projects in {stage.title}</p>
                    <p className="text-[10px] text-slate-400/80 mt-1">Drag cards here to update stage</p>
                  </div>
                ) : (
                  stageProjects.map((proj) => {
                    const isDraggingThis = draggedProjectId === proj.id;
                    const teamCount = proj.teamAssignments?.length || 0;
                    const pendingMilestones = proj.milestoneDeadlines?.filter((m) => m.status === 'Pending').length || 0;

                    return (
                      <div
                        key={proj.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, proj.id)}
                        className={`bg-white rounded-xl p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-md transition cursor-grab active:cursor-grabbing space-y-3 group ${
                          isDraggingThis ? 'opacity-40 border-dashed border-blue-400' : ''
                        }`}
                      >
                        {/* Drag Handle & Title */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center space-x-1.5">
                            <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                            <div>
                              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                                {proj.id}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 mt-1 leading-snug line-clamp-2">
                                {proj.companyName}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{proj.projectTitle}</p>
                            </div>
                          </div>
                        </div>

                        {/* Financial Mini Summary */}
                        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Gross Budget</span>
                            <span className="font-mono font-bold text-slate-900">{formatPKR(proj.grossBudgetPKR)}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5 border-t border-slate-200/50">
                            <span>Devsio 20% Cut:</span>
                            <span className="font-mono font-semibold text-emerald-700">
                              {formatPKR(proj.companyReservePKR || proj.grossBudgetPKR * 0.20)}
                            </span>
                          </div>
                        </div>

                        {/* Team & Milestone Metrics */}
                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 font-medium">
                          <div className="flex items-center space-x-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                            <Users className="w-3 h-3 text-blue-600 shrink-0" />
                            <span>{teamCount} Assigned</span>
                          </div>
                          <div className="flex items-center space-x-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{pendingMilestones} Pending MS</span>
                          </div>
                        </div>

                        {/* Deadline */}
                        {proj.deadline && (
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>Due: {proj.deadline}</span>
                            </div>
                          </div>
                        )}

                        {/* Stage Selector Dropdown + Inspect Button */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <select
                            value={proj.status || 'In Progress'}
                            onChange={(e) => onUpdateProjectStatus(proj, e.target.value as ProjectStatus)}
                            className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 py-1 px-1.5 rounded border border-slate-200 focus:outline-none"
                            title="Move Stage"
                          >
                            {KANBAN_STAGES.map((s) => (
                              <option key={s.id} value={s.id}>
                                Stage: {s.title}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => onSelectProjectForCosting(proj.id)}
                            className="flex items-center space-x-1 px-2 py-1 bg-[#2563EB] hover:bg-blue-600 text-white text-[10px] font-bold rounded shadow-2xs transition"
                            title="Inspect Financial Costing Waterfall"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Costing</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
