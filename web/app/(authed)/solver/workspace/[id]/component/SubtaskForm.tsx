"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, Info, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { saveSubtaskDraft, submitSubtaskFinal, submitFullAttempt } from "../api/workspace";
import type { SubtaskResponse } from "@/types/problem";
import Portal from "@/components/portal";

interface SubtaskFormProps {
  attemptId: string;
  subtask: SubtaskResponse;
  existingDescription: string;
  existingDelta: string;
  isSubmitted: boolean;
  isForked: boolean;
  parentDescription?: string; 
  onDirtyStateChange?: (isDirty: boolean) => void; 
}

export function SubtaskForm({
  attemptId,
  subtask,
  existingDescription,
  existingDelta,
  isSubmitted,
  isForked,
  parentDescription,
  onDirtyStateChange,
}: SubtaskFormProps) {
  const router = useRouter();
  const [description, setDescription] = useState(existingDescription);
  const [deltaDescription, setDeltaDescription] = useState(existingDelta);
  
  const [lastSavedDesc, setLastSavedDesc] = useState(existingDescription);
  const [lastSavedDelta, setLastSavedDelta] = useState(existingDelta);
  
  const [saveStatus, setSaveStatus] = useState<"IDLE" | "SAVING" | "SAVED" | "ERROR">("IDLE");
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 🚀 Added state for the Original Approach toggle
  const [showFullOriginal, setShowFullOriginal] = useState(false);

  // 🚀 Added refs to calculate dynamic textarea heights
  const narrativeRef = useRef<HTMLTextAreaElement>(null);
  const deltaRef = useRef<HTMLTextAreaElement>(null);

  const hasUnsavedChanges = description !== lastSavedDesc || deltaDescription !== lastSavedDelta;

  // ─── DYNAMIC TEXTAREA AUTO-RESIZE ───
  const adjustTextareaHeight = (element: HTMLTextAreaElement | null) => {
    if (element) {
      element.style.height = "auto";
      element.style.height = `${element.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight(narrativeRef.current);
  }, [description]);

  useEffect(() => {
    adjustTextareaHeight(deltaRef.current);
  }, [deltaDescription]);

  // ─── NOTIFY PARENT PAGE OF DIRTY STATE ───
  useEffect(() => {
    if (onDirtyStateChange) {
      onDirtyStateChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onDirtyStateChange]);

  // ─── 1. AUTO-SAVE EVERY 30 SECONDS ───
  useEffect(() => {
    const timer = setInterval(() => {
      if (hasUnsavedChanges && !isSubmitting && saveStatus !== "SAVING") {
        handleSaveDraft(true);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [description, deltaDescription, lastSavedDesc, lastSavedDelta, isSubmitting, saveStatus]);

  // ─── 2. STRICT WARNING ON TAB CLOSE/REFRESH ───
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes in your workspace. Are you sure you want to leave?";
        return e.returnValue; 
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ─── 3. CLEAR "SAVED" STATUS ON TYPING ───
  useEffect(() => {
    if (hasUnsavedChanges && saveStatus === "SAVED") {
      setSaveStatus("IDLE");
    }
  }, [hasUnsavedChanges, saveStatus]);

  useEffect(() => {
    if (showConfirmModal) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [showConfirmModal]);

  const handleSaveDraft = async (isAuto = false) => {
    if (!hasUnsavedChanges && isAuto) return;
    
    setSaveStatus("SAVING");
    try {
      await saveSubtaskDraft(attemptId, subtask.id, description, deltaDescription, []);
      setLastSavedDesc(description);
      setLastSavedDelta(deltaDescription);
      setLastSavedTime(new Date());
      setSaveStatus("SAVED");
    } catch (err: any) {
      console.error("Failed to save draft:", err);
      setSaveStatus("ERROR");
    }
  };

  const handleDirectSubmit = async () => {
    setShowConfirmModal(false);
    setError(null);
    setIsSubmitting(true);

    try {
      if (onDirtyStateChange) onDirtyStateChange(false); // Clear dirty state before navigation
      await submitSubtaskFinal(attemptId, subtask.id, description, deltaDescription, []);
      await submitFullAttempt(attemptId);
      router.push("/solver/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to submit project.");
      setIsSubmitting(false);
    }
  };

  const canSubmit = description.trim().length > 0 && (!isForked || deltaDescription.trim().length > 0);

  // ─── RENDER SUBMITTED (LOCKED) STATE ───────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-emerald-100 overflow-hidden">
        <div className="bg-emerald-50/80 px-8 py-5 border-b border-emerald-100 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          <h3 className="font-bold text-emerald-900">Project Successfully Submitted</h3>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Your Solution</h4>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed shadow-sm">
              {description}
            </div>
          </div>
          
          {isForked && deltaDescription && (
             <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Changes From Original Solution</h4>
                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 text-sm font-medium text-blue-900 leading-relaxed shadow-sm">
                  {deltaDescription}
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
        <Portal>
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="p-8">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-emerald-100 shadow-sm">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">Submit Final Project?</h2>
                 <p className="text-slate-500 font-medium text-center text-sm leading-relaxed">
                  Are you ready to submit your solution to the Seeker? You will not be able to edit this narrative once submitted.
                </p>
              </div>
              
              <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex gap-3">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors shadow-sm text-sm cursor-pointer">
                  Go Back
                </button>
                <button onClick={handleDirectSubmit} className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition-colors shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] text-sm flex justify-center items-center gap-2 cursor-pointer active:scale-[0.98]">
                  Yes, Submit Now
                </button>
              </div>
            </div>
          </div>
        </Portal> 
      )}

      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden relative">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-lg">Workspace Editor</h3>
          <div className="flex items-center gap-3">
            {saveStatus === "SAVING" && <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider animate-pulse">Saving draft...</span>}
            {saveStatus === "SAVED" && lastSavedTime && <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Draft saved at {lastSavedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
            {hasUnsavedChanges && saveStatus === "IDLE" && <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Unsaved changes</span>}
            {saveStatus === "ERROR" && <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Failed to save</span>}
          </div>
        </div>

        <div className="p-8 space-y-8">
           {error && (
             <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
               <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
               <p className="text-rose-800 text-sm font-bold">{error}</p>
             </div>
           )}

          {/* Solution Narrative */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
              Solution Narrative <span className="text-rose-500">*</span>
            </label>
            <textarea
              ref={narrativeRef}
              className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-colors text-sm font-medium text-slate-900 placeholder:text-slate-400 overflow-hidden resize-none"
              placeholder="Document your findings, code architecture, or research methodology here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ minHeight: "400px" }} // 🚀 Increased initial size
            />
          </div>

          {/* Delta Description (If Forked) */}
          {isForked && (
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 pl-1">
                Changes from Original Solution <span className="text-rose-500">*</span>
              </label>
              
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 mb-4 transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Original Approach
                  </p>
                  
                  {/* 🚀 New See More / See Less Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowFullOriginal(!showFullOriginal)}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {showFullOriginal ? (
                      <>See Less <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>See Full Approach <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                </div>
                
                <p className={`text-sm font-medium text-blue-900/80 leading-relaxed transition-all duration-300 ${showFullOriginal ? "whitespace-pre-wrap" : "line-clamp-3"}`}>
                  {parentDescription || "No description provided in the original solution."}
                </p>
              </div>

              <textarea
                ref={deltaRef}
                value={deltaDescription}
                onChange={(e) => setDeltaDescription(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-colors text-sm font-medium text-slate-900 placeholder:text-slate-400 overflow-hidden resize-none"
                placeholder="Detail exactly what you improved, fixed, or changed from the original solution..."
                style={{ minHeight: "250px" }} // 🚀 Increased initial size
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <p className="text-sm font-medium text-slate-600">
            {!canSubmit && <span className="text-rose-500 flex items-center gap-1.5 font-bold"><AlertCircle className="w-4 h-4"/> Please fill out all required fields.</span>}
          </p>
          <div className="flex gap-3">
             <button 
                onClick={() => handleSaveDraft(false)} 
                disabled={isSubmitting || saveStatus === "SAVING" || (!hasUnsavedChanges && saveStatus === "SAVED")} 
                className="px-6 py-3.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-sm text-sm cursor-pointer active:scale-[0.98]"
              >
              {saveStatus === "SAVING" ? "Saving..." : "Save Draft"}
            </button>
            <button 
              onClick={() => setShowConfirmModal(true)} 
              disabled={isSubmitting || !canSubmit} 
              className="px-8 py-3.5 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.23)] text-sm flex items-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? "Submitting..." : "Submit Project"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}