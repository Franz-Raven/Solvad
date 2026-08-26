"use client";

import { useState, useEffect, useRef } from "react";
import { UploadCloud, Trash2, FileText, CheckCircle2, AlertCircle, Info, FileCode } from "lucide-react";
import { saveSubtaskDraft, submitSubtaskFinal, deleteFileFromSubmission } from "../api/workspace";
import type { SubtaskResponse, AttachmentRequirement } from "@/types/problem";
import Portal from "@/components/portal";

interface SubtaskFormProps {
  attemptId: string;
  subtask: SubtaskResponse;
  existingDescription: string;
  existingDelta: string;
  existingFiles: string[];
  submissionId?: string;
  isSubmitted: boolean;
  isForked: boolean;
  parentDescription?: string; 
  parentFiles?: string[];     
  onSuccess: () => void;
}

interface RequirementUploadState {
  requirementId: string;
  files: File[];
  error: string | null;
}

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  "PDF": [".pdf"],
  "EXCEL": [".xlsx", ".xls"],
  "PNG_JPG": [".png", ".jpg", ".jpeg"],
};

const getFileExtension = (filename: string): string => {
  return "." + filename.split(".").pop()?.toLowerCase();
};

const validateFileType = (file: File, requirementType: string): boolean => {
  if (requirementType === "GITHUB_LINK") return true;
  const allowedExts = ALLOWED_EXTENSIONS[requirementType] || [];
  if (allowedExts.length === 0) return true; // Accept anything if no specific rule
  return allowedExts.includes(getFileExtension(file.name));
};

const getFileTypeLabel = (type: string): string => {
  switch (type) {
    case "PDF": return "PDF Documents (.pdf)";
    case "EXCEL": return "Excel Files (.xlsx, .xls)";
    case "GITHUB_LINK": return "GitHub Repository Link";
    case "PNG_JPG": return "Images (.png, .jpg, .jpeg)";
    default: return "Supported File";
  }
};

export function SubtaskForm({
  attemptId,
  subtask,
  existingDescription,
  existingDelta,
  existingFiles,
  submissionId,
  isSubmitted,
  isForked,
  parentDescription,
  onSuccess
}: SubtaskFormProps) {
  const [description, setDescription] = useState(existingDescription);
  const [deltaDescription, setDeltaDescription] = useState(existingDelta);
  
  // Generic unassigned files (for drag & drop outside requirements)
  const [files, setFiles] = useState<File[]>([]);
  
  // FLAT list of files already saved to the server
  const [serverFiles, setServerFiles] = useState<string[]>(existingFiles);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState<string | null>(null);

  const [requirementStates, setRequirementStates] = useState<Record<string, RequirementUploadState>>({});
  const [requirementErrors, setRequirementErrors] = useState<Record<string, string>>({});

  const requirements = (subtask.attachments || []) as AttachmentRequirement[];

  useEffect(() => {
    setDescription(existingDescription);
    setDeltaDescription(existingDelta);
    setServerFiles(existingFiles || []);
    setFiles([]);
    setError(null);
    setRequirementErrors({});

    const initialStates: Record<string, RequirementUploadState> = {};
    requirements.forEach(req => {
      initialStates[req.id] = {
        requirementId: req.id,
        files: [],
        error: null,
      };
    });
    setRequirementStates(initialStates);
  }, [subtask.id, attemptId, existingFiles, requirements.length, existingDescription, existingDelta]);

  useEffect(() => {
    if (showConfirmModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [showConfirmModal]);

  const getFilenameFromUrl = (url: string) => {
    try {
      const decoded = decodeURIComponent(url);
      const parts = decoded.split("/");
      return parts[parts.length - 1] || "Attachment";
    } catch {
      return "Attachment";
    }
  };

  const handleRequirementFileUpload = (requirementId: string, uploadedFiles: FileList | null, requirementType: string) => {
    if (!uploadedFiles) return;

    const fileArray = Array.from(uploadedFiles);
    const errors: string[] = [];
    const validFiles: File[] = [];

    fileArray.forEach(file => {
      if (!validateFileType(file, requirementType)) {
        errors.push(`${file.name} is an invalid format. Please upload ${getFileTypeLabel(requirementType)}.`);
      } else {
        validFiles.push(file);
      }
    });

    setRequirementStates(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        files: [...prev[requirementId].files, ...validFiles],
        error: errors.length > 0 ? errors[0] : null,
      }
    }));

    if (errors.length > 0) {
      setRequirementErrors(prev => ({ ...prev, [requirementId]: errors[0] }));
    } else {
      setRequirementErrors(prev => {
        const updated = { ...prev };
        delete updated[requirementId];
        return updated;
      });
    }
  };

  // 🚀 FIXED: Now uses the isolated API function instead of a hardcoded fetch
  const handleDeleteServerFile = async (fileUrl: string) => {
    if (!submissionId) return;

    setIsDeletingFile(fileUrl);
    try {
      await deleteFileFromSubmission(submissionId, fileUrl);
      setServerFiles(prev => prev.filter(f => f !== fileUrl));
      onSuccess(); 
    } catch (err: any) {
      setError(err.message || "Failed to delete file");
    } finally {
      setIsDeletingFile(null);
    }
  };

  const removeRequirementLocalFile = (requirementId: string, idx: number) => {
    setRequirementStates(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        files: prev[requirementId].files.filter((_, i) => i !== idx),
      }
    }));
  };

  const executeAction = async (action: "SAVE_DRAFT" | "SUBMIT") => {
    setShowConfirmModal(false);
    setError(null);
    
    if (action === "SAVE_DRAFT") setIsSaving(true);
    else setIsSubmitting(true);

    try {
      const allFiles: File[] = [...files];
      
      // 🚀 Flattens all specific requirement files into a single array for Spring Boot
      Object.values(requirementStates).forEach(state => {
        allFiles.push(...state.files);
      });

      if (action === "SAVE_DRAFT") {
        await saveSubtaskDraft(attemptId, subtask.id, description, deltaDescription, allFiles);
      } else {
        await submitSubtaskFinal(attemptId, subtask.id, description, deltaDescription, allFiles);
      }
      
      // Clear local state since files are now securely on the server
      setFiles([]); 
      setRequirementStates(prev => {
        const updated: Record<string, RequirementUploadState> = {};
        Object.entries(prev).forEach(([id, state]) => {
          updated[id] = { ...state, files: [], error: null };
        });
        return updated;
      });
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${action.toLowerCase()}`);
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  };

  const hasRequirementErrors = Object.keys(requirementErrors).length > 0;
  
  // Logic to check if requirements are met (either new files in state OR existing server files exist)
  const allRequirementsFullfilled = requirements.length > 0 
    ? requirements.every(req => {
        const state = requirementStates[req.id];
        return (state && state.files.length > 0) || serverFiles.length > 0 || req.attachmentType === "GITHUB_LINK"; 
      })
    : true;

  const canSubmit = 
    description.trim().length > 0 && 
    allRequirementsFullfilled &&
    !hasRequirementErrors &&
    (!isForked || deltaDescription.trim().length > 0);

  // ─── RENDER SUBMITTED (LOCKED) STATE ───────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden">
        <div className="bg-green-50/80 px-8 py-5 border-b border-green-100 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <h3 className="font-bold text-green-900">Module Locked & Submitted</h3>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Your Solution</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed shadow-sm">
              {description}
            </div>
          </div>
          
          {isForked && deltaDescription && (
             <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Changes From Parent Solution</h4>
                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 text-sm text-blue-900 leading-relaxed shadow-sm">
                  {deltaDescription}
                </div>
             </div>
          )}

          {serverFiles.length > 0 && (
             <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Attached Documents</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {serverFiles.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:text-secondary hover:border-secondary transition-all shadow-sm group">
                    <div className="bg-gray-50 text-gray-400 p-2.5 rounded-lg group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="truncate font-medium flex-1">{getFilenameFromUrl(url)}</span>
                  </a>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {showConfirmModal && (
        <Portal> {/* 🚀 ADD THIS PORTAL WRAPPER */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8">
                <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-5">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Lock & Submit Module?</h2>
                 <p className="text-gray-600 text-center text-sm leading-relaxed">
                  Once locked, you will not be able to edit this module's narrative or attachments.
                </p>
              </div>
              
              <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm">
                  Go Back
                </button>
                <button onClick={() => executeAction("SUBMIT")} className="flex-1 px-4 py-2.5 bg-secondary text-white font-semibold rounded-xl hover:bg-accent transition-colors shadow-sm text-sm">
                  Yes, Lock it
                </button>
              </div>
            </div>
          </div>
        </Portal> 
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-900 text-lg">Workspace Editor</h3>
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full border border-amber-200 uppercase tracking-wide">
            Draft Mode
          </span>
        </div>

        <div className="p-8 space-y-8">
           {error && (
             <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
               <p className="text-red-700 text-sm font-medium">{error}</p>
             </div>
           )}

          {/* Solution Narrative */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Solution Narrative <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-sm text-gray-800 placeholder:text-gray-400 resize-y"
              placeholder="Document your findings, code architecture, or research methodology here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: "250px" }}
            />
          </div>

          {/* Delta Description (If Forked) */}
          {isForked && (
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Changes from Original Solution <span className="text-red-500">*</span>
              </label>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mb-4">
                <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" /> Original Approach
                </p>
                <p className="text-sm text-blue-900/80 line-clamp-3 leading-relaxed">
                  {parentDescription || "No description provided in the original solution."}
                </p>
              </div>
              <textarea
                value={deltaDescription}
                onChange={(e) => setDeltaDescription(e.target.value)}
                rows={4}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-sm text-gray-800 placeholder:text-gray-400 resize-y"
                placeholder="Detail exactly what you improved, fixed, or changed from the original solution..."
              />
            </div>
          )}

          {/* Already Uploaded Files */}
          {serverFiles.length > 0 && (
             <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">Previously Saved Documents</label>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serverFiles.map((url, idx) => (
                  <li key={idx} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl text-sm shadow-sm group">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                        <FileText className="w-4 h-4" />
                      </div>
                      <a href={url} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-gray-700 group-hover:text-secondary transition-colors">
                        {getFilenameFromUrl(url)}
                      </a>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteServerFile(url)}
                      disabled={isDeletingFile === url}
                      className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      {isDeletingFile === url ? <span className="animate-pulse">...</span> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mapped Requirements Dropzones */}
          {requirements.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-bold text-gray-900">
                  Required Submissions <span className="text-red-500">*</span>
                </label>
              </div>

              <div className="space-y-6">
                {requirements.map((req) => {
                  const state = requirementStates[req.id];
                  const hasError = requirementErrors[req.id];

                  return (
                    <div key={req.id} className={`border rounded-2xl p-6 transition-colors ${hasError ? 'border-red-300 bg-red-50/50' : 'border-gray-200 bg-white'}`}>
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{req.attachmentTitle}</h4>
                          <p className="text-xs font-medium text-gray-500 mt-1 uppercase tracking-wider">
                            Format: {getFileTypeLabel(req.attachmentType)}
                          </p>
                        </div>
                        {req.attachmentType === "GITHUB_LINK" ? (
                          <div className="bg-gray-100 p-2 rounded-lg"><FileCode className="w-5 h-5 text-gray-500" /></div>
                        ) : (
                          <div className="bg-gray-100 p-2 rounded-lg"><UploadCloud className="w-5 h-5 text-gray-500" /></div>
                        )}
                      </div>

                      {hasError && (
                        <div className="p-3 mb-4 rounded-xl bg-red-100 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" /> {hasError}
                        </div>
                      )}

                      {req.attachmentType === "GITHUB_LINK" ? (
                        <input
                          type="url"
                          placeholder="https://github.com/username/repository"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                          onChange={(e) => {
                            if (e.target.value.trim()) {
                              setRequirementErrors(prev => {
                                const updated = { ...prev };
                                delete updated[req.id];
                                return updated;
                              });
                            }
                          }}
                        />
                      ) : (
                        <div className="relative">
                          <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={(e) => handleRequirementFileUpload(req.id, e.target.files, req.attachmentType)} 
                          />
                          <div className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-8 bg-gray-50 hover:bg-white hover:border-secondary transition-all">
                            <p className="text-sm font-semibold text-gray-600">Drag & drop or click to upload</p>
                          </div>
                        </div>
                      )}

                      {/* Local Uploaded Files Queue */}
                      {state && state.files.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {state.files.map((file, idx) => (
                            <li key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl text-sm shadow-sm">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-green-50 p-1.5 rounded text-green-600"><CheckCircle2 className="w-4 h-4" /></div>
                                <span className="truncate font-medium text-gray-700">{file.name}</span>
                                <span className="text-xs text-gray-400">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => removeRequirementLocalFile(req.id, idx)}
                                className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <p className="text-sm font-medium text-gray-600">
            {!canSubmit && <span className="text-red-500 flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> Please fill out all required fields.</span>}
          </p>
          <div className="flex gap-3">
             <button 
                onClick={() => executeAction("SAVE_DRAFT")} 
                disabled={isSaving || isSubmitting || !description.trim()} 
                className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 shadow-sm text-sm"
              >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button 
              onClick={() => setShowConfirmModal(true)} 
              disabled={isSubmitting || isSaving || !canSubmit} 
              className="px-6 py-2.5 bg-secondary text-white font-semibold rounded-xl hover:bg-accent transition-colors disabled:opacity-50 shadow-sm text-sm flex items-center gap-2"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {isSubmitting ? "Locking..." : "Lock & Submit"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}