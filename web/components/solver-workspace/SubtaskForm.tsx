"use client";

import { useState } from "react";
import { saveSubtaskDraft, submitSubtaskFinal } from "@/lib/api/attempts";

interface Subtask {
  id: string;
  title: string;
  departmentFocus: string;
  description: string;
}

interface WorkspaceProps {
  attemptId: string;
  subtask: Subtask;
  existingDescription?: string;
  existingDelta?: string;
  isSubmitted?: boolean;
}

export function SubtaskForm({ 
  attemptId, 
  subtask, 
  existingDescription = "", 
  existingDelta = "",
  isSubmitted = false 
}: WorkspaceProps) {
  const [description, setDescription] = useState(existingDescription);
  const [deltaDescription, setDeltaDescription] = useState(existingDelta);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleAction = async (action: 'draft' | 'submit') => {
    try {
      setLoading(true);
      setStatusMsg(null);
      
      if (action === 'draft') {
        await saveSubtaskDraft(attemptId, subtask.id, description, deltaDescription, files);
        setStatusMsg({ type: 'success', text: "Draft saved successfully!" });
      } else {
        if (!confirm("Are you sure? Once submitted, this subtask cannot be edited.")) return;
        await submitSubtaskFinal(attemptId, subtask.id, description, deltaDescription, files);
        setStatusMsg({ type: 'success', text: "Subtask locked and submitted." });
        // Optionally trigger a parent refresh here
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || "An error occurred." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="text-xl font-bold text-gray-900">{subtask.title}</h3>
        {isSubmitted && (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full border border-green-200">
            Submitted
          </span>
        )}
      </div>

      <div className="bg-gradient-to-r from-accent/5 to-secondary/5 p-5 rounded-lg border border-gray-100 mb-8">
        <span className="inline-block px-2.5 py-1 bg-white border border-secondary/20 text-secondary text-[11px] font-bold tracking-wide uppercase rounded-full shadow-sm mb-3">
          {subtask.departmentFocus}
        </span>
        <p className="text-sm text-gray-700 leading-relaxed">{subtask.description}</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Your Solution Approach</label>
          <textarea
            disabled={isSubmitted || loading}
            rows={8}
            className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent bg-gray-50 text-gray-900 disabled:opacity-60 transition-all text-sm resize-none"
            placeholder="Document your findings, code structure, or methodology here..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">
            Delta Notes <span className="text-gray-400 font-normal">(Optional - only if building upon another solution)</span>
          </label>
          <input
            type="text"
            disabled={isSubmitted || loading}
            placeholder="e.g., 'Optimized the database queries from the parent solution'"
            className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-gray-50 text-gray-900 disabled:opacity-60 text-sm transition-all"
            value={deltaDescription}
            onChange={(e) => setDeltaDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Supporting Documents</label>
          <div className="flex items-center justify-center w-full">
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors ${isSubmitted || loading ? "opacity-60 pointer-events-none" : ""}`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                <p className="mb-1 text-sm text-gray-500"><span className="font-semibold text-accent">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">Cloudinary will process images, PDFs, or Docs</p>
              </div>
              <input 
                type="file" 
                multiple 
                disabled={isSubmitted || loading}
                className="hidden" 
                onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))}
              />
            </label>
          </div>
          {files.length > 0 && (
            <p className="text-xs text-accent mt-2 font-medium">{files.length} file(s) selected.</p>
          )}
        </div>

        {statusMsg && (
          <div className={`p-3 rounded-lg text-sm font-medium ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {statusMsg.text}
          </div>
        )}

        {!isSubmitted && (
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => handleAction('draft')}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              {loading ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={() => handleAction('submit')}
              disabled={loading || !description.trim()}
              className="flex-1 px-4 py-3 bg-secondary hover:bg-accent text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Lock & Submit Subtask"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}