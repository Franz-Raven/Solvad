"use client";

import { useState, useEffect } from "react";
import { saveSubtaskDraft, submitSubtaskSolution } from "@/lib/api/attempts";
import type { SubtaskResponse } from "@/types/problem";

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
  const [files, setFiles] = useState<File[]>([]);
  const [serverFiles, setServerFiles] = useState<string[]>(existingFiles);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeletingFile, setIsDeletingFile] = useState<string | null>(null);

  useEffect(() => {
    setDescription(existingDescription);
    setDeltaDescription(existingDelta);
    setServerFiles(existingFiles);
    setFiles([]);
    setError(null);
  }, [subtask.id, attemptId, existingDescription, existingDelta, existingFiles]);

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

  const executeAction = async (action: "SAVE_DRAFT" | "SUBMIT") => {
    setShowConfirmModal(false);
    setError(null);
    
    if (action === "SAVE_DRAFT") setIsSaving(true);
    else setIsSubmitting(true);

    try {
      if (action === "SAVE_DRAFT") {
        await saveSubtaskDraft(attemptId, subtask.id, description, deltaDescription, files);
      } else {
        await submitSubtaskSolution(attemptId, subtask.id, description, deltaDescription, files);
      }
      setFiles([]); 
      onSuccess();
    } catch (err: any) {
      setError(err.message || `Failed to ${action.toLowerCase()}`);
    } finally {
      setIsSaving(false);
      setIsSubmitting(false);
    }
  };

  const removeLocalFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  // Validation Logic
  const hasFiles = files.length > 0 || serverFiles.length > 0;
  
  // To submit, they must have a narrative, files, and (if forked) a completed delta log
  const canSubmit = 
    description.trim().length > 0 && 
    hasFiles && 
    (!isForked || deltaDescription.trim().length > 0);

  // ─── SUBMITTED VIEW ───
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
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-secondary hover:border-secondary hover:shadow-md transition-all group"
                   >
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-md group-hover:bg-secondary/10 group-hover:text-secondary transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                    </div>
                    <span className="truncate font-medium flex-1">
                      {getFilenameFromUrl(url)}
                    </span>
                  </a>
                 ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── DRAFT / ACTIVE EDITOR VIEW ───
  return (
    <>
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">Lock & Submit Module?</h2>
               <p className="text-gray-600 text-center text-sm">
                Are you sure you want to submit?
                Once locked, you will not be able to edit this specific module's narrative or attachments.
              </p>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Go Back
              </button>
              <button
                onClick={() => executeAction("SUBMIT")}
                className="flex-1 px-4 py-2.5 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
              >
                Yes, Lock it
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative">
        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h3 className="font-bold text-gray-900">Workspace Editor</h3>
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            Draft Mode
          </span>
        </div>

        <div className="p-8 space-y-6">
           {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {isForked && (parentDescription || (parentFiles && parentFiles.length > 0)) && (
            <div className="mb-6 p-5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Original Solution Reference</h4>
              </div>
              
              {parentDescription && (
                <div className="bg-white border border-slate-200 rounded-lg p-4 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed max-h-[200px] overflow-y-auto mb-3">
                  {parentDescription}
                </div>
              )}

              {parentFiles && parentFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {parentFiles.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:text-accent hover:border-accent transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      {getFilenameFromUrl(url)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">Solution Narrative <span className="text-red-500">*</span></label>
            <textarea
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-sm text-gray-900 placeholder:text-gray-400 min-h-[250px]"
              placeholder="Document your findings, code architecture, or research here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={`grid grid-cols-1 ${isForked ? 'md:grid-cols-2' : ''} gap-6`}>
            
            {/* MANDATORY DELTA LOG */}
            {isForked && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  What Changed From Parent solution <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-sm text-gray-900 placeholder:text-gray-400 min-h-[120px]"
                  placeholder="Detail the specific modifications, additions, or improvements you made..."
                  value={deltaDescription}
                  onChange={(e) => setDeltaDescription(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Supporting Documents <span className="text-red-500">*</span>
              </label>
              
              <div className="h-[120px] border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
                 <input 
                    type="file" 
                    multiple 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }} 
                  />
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <p className="text-sm font-medium text-gray-600">Drag & drop files to attach</p>
              </div>

              {(files.length > 0 || serverFiles.length > 0) && (
                <ul className="mt-4 space-y-2">
                  {serverFiles.map((url, idx) => (
                    <li key={`server-${idx}`} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg text-sm shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <svg className="w-5 h-5 text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-secondary hover:text-accent hover:underline transition-colors">
                          {getFilenameFromUrl(url)}
                        </a>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteServerFile(url)}
                        disabled={isDeletingFile === url}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                         {isDeletingFile === url ? (
                           <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        )}
                      </button>
                    </li>
                  ))}

                  {files.map((file, idx) => (
                    <li key={`local-${idx}`} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg text-sm shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <svg className="w-5 h-5 text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        <a href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-secondary hover:text-accent hover:underline transition-colors">
                          {file.name}
                        </a>
                        <span className="text-gray-400 text-xs flex-shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeLocalFile(idx)}
                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              
            </div>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {!hasFiles || !description.trim() || (isForked && !deltaDescription.trim()) ? (
              <span className="text-red-500 font-medium">Please fill out all required fields and attach at least one document.</span>
            ) : (
              "Ensure your work is saved before switching modules."
            )}
          </p>
          <div className="flex gap-3">
             <button
              onClick={() => executeAction("SAVE_DRAFT")}
              disabled={isSaving || isSubmitting || !description.trim()}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50 shadow-sm"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting || isSaving || !canSubmit}
              className="px-6 py-2.5 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-all text-sm disabled:opacity-50 shadow-sm flex items-center gap-2"
            >
              {isSubmitting ? "Locking..." : "Lock & Submit"}
              {!isSubmitting && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}