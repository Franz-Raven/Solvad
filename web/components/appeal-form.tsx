"use client";

import { useState } from "react";
import { submitAppeal } from "@/lib/api/appeals";

interface AppealFormProps {
  problemId: string;
  onSuccess: (message: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function AppealForm({
  problemId,
  onSuccess,
  onCancel,
  isLoading = false,
}: AppealFormProps) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError("Please enter your approach");
      return;
    }

    if (message.length > 1000) {
      setError("Message must be 1000 characters or less");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await submitAppeal(problemId, message.trim());
      onSuccess(message);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit appeal");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          Your Approach
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setError("");
          }}
          placeholder="Explain your approach to solving this problem. Be as detailed as possible to help us understand your thought process."
          maxLength={1000}
          className="w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
          rows={6}
          disabled={submitting || isLoading}
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">
            {message.length}/1000 characters
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting || isLoading}
          className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || isLoading || !message.trim()}
          className="flex-1 px-4 py-2.5 bg-accent hover:bg-secondary text-white font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting Appeal...
            </>
          ) : (
            "Submit Appeal"
          )}
        </button>
      </div>
    </form>
  );
}
