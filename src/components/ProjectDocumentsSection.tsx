import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Eye, 
  Search, 
  FileCheck, 
  Lock, 
  Download, 
  X, 
  FileSpreadsheet, 
  Image as ImageIcon,
  FolderOpen,
  FileCode,
  Sparkles
} from 'lucide-react';
import { Project, ProjectDocument } from '../types';

interface ProjectDocumentsSectionProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onUpdateProject: (updatedProject: Project) => void;
}

export const ProjectDocumentsSection: React.FC<ProjectDocumentsSectionProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onUpdateProject,
}) => {
  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Document Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<ProjectDocument['category']>('NDA');
  const [docSourceType, setDocSourceType] = useState<'upload' | 'link'>('link');
  const [docUrlOrLink, setDocUrlOrLink] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [docNotes, setDocNotes] = useState('');

  // Selected File Data URL for local uploads
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);

  // Filter & Search States
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);

  if (!activeProject) {
    return <div className="p-8 text-center text-slate-500">No project selected.</div>;
  }

  const documents = activeProject.documents || [];

  // File Upload Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFileName(file.name);
      if (!docTitle) {
        setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }

      // Convert to Data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFileDataUrl(result);
        setDocUrlOrLink(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add Document Submit Handler
  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;

    let finalFileType: ProjectDocument['fileType'] = 'other';
    if (docSourceType === 'link') {
      finalFileType = 'link';
    } else if (docFileName) {
      const ext = docFileName.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') finalFileType = 'pdf';
      else if (['doc', 'docx'].includes(ext || '')) finalFileType = 'doc';
      else if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext || '')) finalFileType = 'image';
      else finalFileType = 'pdf';
    }

    const newDoc: ProjectDocument = {
      id: `DOC-${Date.now()}`,
      projectId: activeProject.id,
      title: docTitle.trim(),
      category: docCategory,
      fileType: finalFileType,
      urlOrLink: docUrlOrLink || fileDataUrl || '#',
      fileName: docFileName || docTitle,
      uploadedAt: new Date().toISOString().split('T')[0],
      notes: docNotes.trim(),
    };

    const updatedDocs = [...documents, newDoc];
    onUpdateProject({
      ...activeProject,
      documents: updatedDocs,
    });

    // Reset Form
    setDocTitle('');
    setDocCategory('NDA');
    setDocSourceType('link');
    setDocUrlOrLink('');
    setDocFileName('');
    setDocNotes('');
    setFileDataUrl(null);
    setShowAddModal(false);
  };

  // Delete Document
  const handleDeleteDocument = (docId: string) => {
    const updatedDocs = documents.filter((d) => d.id !== docId);
    onUpdateProject({
      ...activeProject,
      documents: updatedDocs,
    });
    if (previewDoc?.id === docId) setPreviewDoc(null);
  };

  // Category Colors
  const getCategoryBadge = (cat: ProjectDocument['category']) => {
    switch (cat) {
      case 'NDA':
        return {
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <Lock className="w-3 h-3 text-purple-600" />,
        };
      case 'Contract':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: <FileCheck className="w-3 h-3 text-emerald-600" />,
        };
      case 'Brief':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: <FileText className="w-3 h-3 text-blue-600" />,
        };
      case 'Proposal':
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-200',
          icon: <Sparkles className="w-3 h-3 text-amber-600" />,
        };
      case 'Design Deliverable':
        return {
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: <ImageIcon className="w-3 h-3 text-indigo-600" />,
        };
      case 'Invoice':
        return {
          bg: 'bg-teal-100 text-teal-800 border-teal-200',
          icon: <FileSpreadsheet className="w-3 h-3 text-teal-600" />,
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-800 border-slate-200',
          icon: <FileCode className="w-3 h-3 text-slate-600" />,
        };
    }
  };

  // Filtered Documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesCat = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Category counts
  const categoryCounts = {
    All: documents.length,
    NDA: documents.filter((d) => d.category === 'NDA').length,
    Contract: documents.filter((d) => d.category === 'Contract').length,
    Brief: documents.filter((d) => d.category === 'Brief').length,
    Proposal: documents.filter((d) => d.category === 'Proposal').length,
    'Design Deliverable': documents.filter((d) => d.category === 'Design Deliverable').length,
    Invoice: documents.filter((d) => d.category === 'Invoice').length,
    Other: documents.filter((d) => d.category === 'Other').length,
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold text-slate-900">Project Documents & Legal Vault</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 rounded-full">
              {documents.length} Files Linked
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Central repository for NDAs, Master Service Contracts, Briefs, Design System Tokens, & Invoices for {activeProject.companyName}.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-700">Project:</label>
            <select
              value={selectedProjectId}
              onChange={(e) => onSelectProject(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 text-xs font-bold rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.companyName} - {p.projectTitle}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add / Link Document</span>
          </button>
        </div>
      </div>

      {/* Filter Category Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['All', 'NDA', 'Contract', 'Brief', 'Proposal', 'Design Deliverable', 'Invoice', 'Other'].map((cat) => {
            const count = categoryCounts[cat as keyof typeof categoryCounts] || 0;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-purple-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive ? 'bg-purple-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Document Grid Cards */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No Documents Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'No documents match your current filter or search query.'
              : 'Upload or attach Google Drive, Dropbox, Figma, or PDF document links for this project.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Project Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => {
            const catBadge = getCategoryBadge(doc.category);
            return (
              <div
                key={doc.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-purple-300 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Category & Date Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border flex items-center space-x-1.5 ${catBadge.bg}`}
                    >
                      {catBadge.icon}
                      <span>{doc.category}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{doc.uploadedAt}</span>
                  </div>

                  {/* Document Title & File Name */}
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition line-clamp-2">
                    {doc.title}
                  </h4>

                  {doc.fileName && (
                    <p className="text-xs text-slate-500 font-mono mt-1 truncate flex items-center space-x-1">
                      <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{doc.fileName}</span>
                    </p>
                  )}

                  {doc.notes && (
                    <p className="text-xs text-slate-600 mt-2.5 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                      "{doc.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition flex items-center space-x-1"
                      title="Quick Preview Details"
                    >
                      <Eye className="w-3 h-3 text-slate-600" />
                      <span>Preview</span>
                    </button>

                    <a
                      href={doc.urlOrLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-lg transition flex items-center space-x-1 border border-purple-200"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition hover:bg-rose-50 rounded-lg"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Add / Link Document */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Upload or Link Project Document</h3>
                <p className="text-xs text-slate-500 mt-0.5">Attach NDA, Contract, Brief, or Drive URL for {activeProject.companyName}</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Services Agreement v2 (Signed)"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Document Category *</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="NDA">NDA (Non-Disclosure)</option>
                    <option value="Contract">Master Contract</option>
                    <option value="Brief">Project Brief / Scope</option>
                    <option value="Proposal">Commercial Proposal</option>
                    <option value="Design Deliverable">Design Deliverable (Figma)</option>
                    <option value="Invoice">Invoice / Receipt</option>
                    <option value="Other">Other Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Attachment Type</label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setDocSourceType('link')}
                      className={`py-1 text-xs font-bold rounded-md transition ${
                        docSourceType === 'link' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Cloud Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocSourceType('upload')}
                      className={`py-1 text-xs font-bold rounded-md transition ${
                        docSourceType === 'upload' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      File Upload
                    </button>
                  </div>
                </div>
              </div>

              {docSourceType === 'link' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">URL or Cloud Drive Link *</label>
                  <div className="relative">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="url"
                      required={docSourceType === 'link'}
                      placeholder="https://drive.google.com/... or https://figma.com/..."
                      value={docUrlOrLink}
                      onChange={(e) => setDocUrlOrLink(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Paste Google Drive, Dropbox, Notion, or Figma share link.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Local File (PDF, DOC, PNG)</label>
                  <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-xl p-4 text-center cursor-pointer transition bg-slate-50 relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud className="w-8 h-8 text-purple-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-slate-700">
                      {docFileName ? docFileName : 'Click or Drag File to Upload'}
                    </p>
                    <p className="text-[10px] text-slate-400">Supports PDF, DOC, DOCX, PNG, JPG (Max 10MB)</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Legal Remarks</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Signed on 2nd July 2026. Covers non-compete & IP transfer clauses."
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
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
                  className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm"
                >
                  Save & Attach Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">{previewDoc.title}</h3>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Category</p>
                  <p className="font-bold text-slate-800">{previewDoc.category}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Upload Date</p>
                  <p className="font-bold text-slate-800">{previewDoc.uploadedAt}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">File Format</p>
                  <p className="font-bold uppercase text-purple-700">{previewDoc.fileType}</p>
                </div>
              </div>

              {previewDoc.fileName && (
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">File Name</p>
                  <p className="font-mono text-slate-700 bg-slate-100 p-2 rounded-lg truncate mt-0.5">
                    {previewDoc.fileName}
                  </p>
                </div>
              )}

              {previewDoc.notes && (
                <div>
                  <p className="text-[10px] text-slate-400 font-semibold">Notes / Legal Summary</p>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 mt-0.5">
                    {previewDoc.notes}
                  </p>
                </div>
              )}

              <div>
                <p className="text-[10px] text-slate-400 font-semibold mb-1">Attached URL / Data Source</p>
                <a
                  href={previewDoc.urlOrLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg font-mono text-[11px] truncate w-full hover:bg-purple-100 transition border border-purple-200"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{previewDoc.urlOrLink}</span>
                </a>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close Preview
              </button>
              <a
                href={previewDoc.urlOrLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg inline-flex items-center space-x-1"
              >
                <span>Open Full Document</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
