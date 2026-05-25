"use client";

import { useState, useRef, useEffect } from "react";
import { submitProposal } from "@/lib/api/attempts";

interface SubmitProposalModalProps {
  problemId: string;
  subtaskId: string;          // ADD — required now
  parentAttemptId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubmitProposalModal({
  problemId,
  subtaskId,
  parentAttemptId,
  onClose,
  onSuccess,
}: SubmitProposalModalProps) {
  const [proposedApproach, setProposedApproach] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose, loading]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(files.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitProposal(problemId, proposedApproach, subtaskId, parentAttemptId, files);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to submit proposal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Submit Solution Proposal</h2>
              <p className="text-sm text-gray-500">The Seeker will review your approach before generating a workspace.</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {parentAttemptId && (
            <div className="mb-6 font-medium text-accent bg-accent/10 px-4 py-3 rounded-lg border border-accent/20 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              You are proposing to fork and build upon an existing solution attempt.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form id="proposal-form" onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Proposed Approach <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={8}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400 resize-y text-sm"
                placeholder="Describe how you plan to approach this sub-problem..."
                value={proposedApproach}
                onChange={(e) => setProposedApproach(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Supporting Documents <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 hover:border-gray-400 transition-colors cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                <svg className="mx-auto h-8 w-8 text-gray-400 group-hover:text-secondary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600 font-medium">Click to upload or drag and drop</p>
                <p className="mt-1 text-xs text-gray-500">PDF, DOCX, JPG, PNG up to 10MB</p>
              </div>

              {files.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {files.map((file, idx) => (
                    <li key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg text-sm shadow-sm">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <svg className="w-5 h-5 text-secondary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <a href={URL.createObjectURL(file)} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-secondary hover:text-accent hover:underline transition-colors">
                          {file.name}
                        </a>
                        <span className="text-gray-400 text-xs flex-shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(idx); }} className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-xl flex-shrink-0">
          <button type="button" onClick={onClose} disabled={loading} className="px-6 py-2.5 border border-gray-300 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm disabled:opacity-50">
            Cancel
          </button>
          <button
            type="submit"
            form="proposal-form"
            disabled={loading || !proposedApproach.trim()}
            className="px-6 py-2.5 bg-secondary hover:bg-accent text-white font-semibold rounded-lg transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm min-w-[160px]"
          >
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
            ) : "Submit Proposal"}
          </button>
        </div>
      </div>
    </div>
  );
}