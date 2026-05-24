"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";

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
  isSubmitted?: boolean;
}

export function SubtaskForm({ attemptId, subtask, existingDescription = "", isSubmitted = false }: WorkspaceProps) {
  const [description, setDescription] = useState(existingDescription);
  const [deltaDescription, setDeltaDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const handleSave = async (isDraft: boolean) => {
    try {
      setLoading(true);
      setStatusMsg("");
      
      const formData = new FormData();
      formData.append("description", description);
      if (deltaDescription) formData.append("deltaDescription", deltaDescription);
      files.forEach(file => formData.append("files", file));

      const endpoint = `/attempts/${attemptId}/subtasks/${subtask.id}/${isDraft ? 'draft' : 'submit'}`;
      
      await apiRequest(endpoint, {
        method: isDraft ? "PUT" : "POST",
        body: formData,
      });

      setStatusMsg(isDraft ? "Draft saved successfully." : "Subtask submitted permanently.");
    } catch (err: any) {
      setStatusMsg(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-inter bg-white border border-gray-300 p-6 mb-6">
      <h3 className="text-xl font-bold text-gray-900 mb-2">{subtask.title}</h3>
      <div className="bg-gray-100 p-4 border border-gray-200 mb-6 text-gray-800 text-sm">
        <span className="font-bold">Focus:</span> {subtask.departmentFocus}
        <p className="mt-2">{subtask.description}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Your Solution</label>
          <textarea
            disabled={isSubmitted || loading}
            rows={6}
            className="w-full p-2 border border-gray-300 focus:outline-none focus:border-gray-900 bg-white text-gray-900 disabled:bg-gray-100"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Delta/Change Notes (Optional)</label>
          <input
            type="text"
            disabled={isSubmitted || loading}
            className="w-full p-2 border border-gray-300 focus:outline-none focus:border-gray-900 bg-white text-gray-900 disabled:bg-gray-100"
            value={deltaDescription}
            onChange={(e) => setDeltaDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Supporting Documents</label>
          <input
            type="file"
            multiple
            disabled={isSubmitted || loading}
            onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))}
            className="block w-full text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-bold file:bg-gray-900 file:text-white hover:file:bg-black transition-colors"
          />
        </div>

        {statusMsg && (
          <div className="p-2 text-sm font-bold border border-gray-300 bg-gray-100 text-gray-900">
            {statusMsg}
          </div>
        )}

        {!isSubmitted && (
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => handleSave(true)}
              disabled={loading}
              className="px-4 py-2 border border-gray-900 text-gray-900 font-bold hover:bg-gray-100 transition-colors"
            >
              {loading ? "Saving..." : "Save Draft"}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={loading || !description.trim()}
              className="px-4 py-2 bg-gray-900 text-white font-bold hover:bg-black transition-colors"
            >
              {loading ? "Submitting..." : "Lock & Submit"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}