"use client";

import { useState, useEffect } from "react";
import { submitSubtaskSolution } from "@/lib/api/attempts";
import { saveSubtaskDraft, submitSubtaskFinal } from "../api/workspace";
import type { SubtaskResponse, AttachmentRequirement } from "@/types/problem";

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
  return allowedExts.includes(getFileExtension(file.name));
};

const getFileTypeLabel = (type: string): string => {
  switch (type) {
    case "PDF": return "PDF Documents";
    case "EXCEL": return "Excel Files (.xlsx, .xls)";
    case "GITHUB_LINK": return "GitHub Repository Link";
    case "PNG_JPG": return "Images (PNG, JPG)";
    default: return "File";
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
  parentFiles,
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
  }, [subtask.id, attemptId, existingFiles, requirements.length]);

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
        errors.push(`${file.name} is not a valid ${getFileTypeLabel(requirementType).toLowerCase()}.`);
      } else {
        validFiles.push(file);
      }
    });

    setRequirementStates(prev => ({
      ...prev,
      [requirementId]: {
        ...prev[requirementId],
        files: validFiles,
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

  // FIXED: Delete generic server file
  const handleDeleteServerFile = async (fileUrl: string) => {
    if (!submissionId) return;

    setIsDeletingFile(fileUrl);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/submissions/${submissionId}/files?fileUrl=${encodeURIComponent(fileUrl)}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to delete file");
      
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
      
      // Flatten specific requirement files for backend submission
      Object.values(requirementStates).forEach(state => {
        allFiles.push(...state.files);
      });

      if (action === "SAVE_DRAFT") {
        await saveSubtaskDraft(attemptId, subtask.id, description, deltaDescription, allFiles);
      } else {
        await submitSubtaskSolution(attemptId, subtask.id, description, deltaDescription, allFiles);
      }
      
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
  
  // FIXED: Logic to check if requirements are met (either new files in state OR existing server files exist)
  const allRequirementsFullfilled = requirements.length > 0 
    ? requirements.every(req => {
        const state = requirementStates[req.id];
        // If serverFiles exist, we assume they fulfilled previous requirements. 
        // (Since backend flattens them, this is the safest check)
        return (state && state.files.length > 0) || serverFiles.length > 0 || req.attachmentType === "GITHUB_LINK"; 
      })
    : true;

  const canSubmit = 
    description.trim().length > 0 && 
    allRequirementsFullfilled &&
    !hasRequirementErrors &&
    (!isForked || deltaDescription.trim().length > 0);

  if (isSubmitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-green-200 overflow-hidden">
        <div className="bg-green-50 px-8 py-4 border-b border-green-100 flex items-center gap-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="font-bold text-green-800">Module Submitted</h3>
        </div>

        <div className="p-8">
          <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Your Solution</h4>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {description}
          </div>
          
          {isForked && deltaDescription && (
             <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Changes From Parent Solution</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100">{deltaDescription}</p>
             </div>
          )}

          {serverFiles.length > 0 && (
             <div className="mt-6">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Attached Documents</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serverFiles.map((url, idx) => (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-secondary hover:border-secondary transition-all">
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-md">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Lock & Submit Module?</h2>
               <p className="text-gray-600 text-center text-sm">
                Once locked, you will not be able to edit this module's narrative or attachments.
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors">Go Back</button>
              <button onClick={() => executeAction("SUBMIT")} className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-accent transition-colors">Yes, Lock it</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Workspace Editor</h3>
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">Draft Mode</span>
        </div>

        <div className="p-8 space-y-6">
           {error && <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>}

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Solution Narrative <span className="text-red-500">*</span></label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-secondary text-sm"
              placeholder="Document your findings, code architecture, or research here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: "250px" }}
            />
          </div>

          {/* ALREADY UPLOADED FILES DISPLAY */}
          {serverFiles.length > 0 && (
             <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
              <h4 className="text-sm font-bold text-blue-900 mb-3">Previously Saved Documents</h4>
              <ul className="grid grid-cols-1 gap-2">
                {serverFiles.map((url, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg text-sm shadow-sm">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-secondary hover:underline">
                      {getFilenameFromUrl(url)}
                    </a>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteServerFile(url)}
                      disabled={isDeletingFile === url}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 disabled:opacity-50"
                    >
                      {isDeletingFile === url ? <span className="animate-pulse">...</span> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* REQUIREMENTS INPUTS */}
          {requirements.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4">Required Submissions <span className="text-red-500">*</span></h3>
              <div className="space-y-6">
                {requirements.map((req) => {
                  const state = requirementStates[req.id];
                  const hasError = requirementErrors[req.id];

                  return (
                    <div key={req.id} className={`border rounded-xl p-5 ${hasError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">{req.attachmentTitle}</h4>
                        <p className="text-xs text-gray-600 mt-1">Type: {getFileTypeLabel(req.attachmentType)}</p>
                      </div>

                      {hasError && <div className="p-3 rounded-lg bg-red-100 border border-red-300 text-red-700 text-sm mb-3">{hasError}</div>}

                      {req.attachmentType === "GITHUB_LINK" ? (
                        <input
                          type="url"
                          placeholder="https://github.com/username/repo"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-secondary"
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
                        <div className="h-[120px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-white hover:bg-gray-50 relative cursor-pointer">
                          <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => handleRequirementFileUpload(req.id, e.target.files, req.attachmentType)} 
                          />
                          <p className="text-sm font-medium text-gray-600">Drag & drop or click to upload</p>
                        </div>
                      )}

                      {/* SHOW LOCAL PENDING UPLOADS FOR THIS REQUIREMENT */}
                      {state && state.files.length > 0 && (
                        <ul className="mt-4 space-y-2">
                          {state.files.map((file, idx) => (
                            <li key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg text-sm shadow-sm">
                              <span className="truncate font-medium text-secondary">{file.name}</span>
                              <button 
                                type="button" 
                                onClick={() => removeRequirementLocalFile(req.id, idx)}
                                className="text-gray-400 hover:text-red-500 p-1.5"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
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

        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {!canSubmit ? <span className="text-red-500 font-medium">Please fill out all required fields.</span> : "Ensure your work is saved."}
          </p>
          <div className="flex gap-3">
             <button onClick={() => executeAction("SAVE_DRAFT")} disabled={isSaving || isSubmitting || !description.trim()} className="px-6 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50">
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button onClick={() => setShowConfirmModal(true)} disabled={isSubmitting || isSaving || !canSubmit} className="px-6 py-2 bg-secondary text-white rounded-lg text-sm hover:bg-accent disabled:opacity-50">
              {isSubmitting ? "Locking..." : "Lock & Submit"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}