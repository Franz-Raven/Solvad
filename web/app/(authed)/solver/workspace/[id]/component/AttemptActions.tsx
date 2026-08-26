"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { useRouter } from "next/navigation";

export function AttemptActions({ attemptId }: { attemptId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFinalize = async () => {
    try {
      setLoading(true);
      await apiRequest(`/attempts/${attemptId}/complete`, { method: "POST" });
      router.push("/solver/dashboard");
    } catch (err: any) {
      alert(`Finalization failed: ${err.message}`);
      setLoading(false);
    }
  };

  const handleAbandon = async () => {
    if (!confirm("Are you sure you want to abandon this attempt?")) return;
    try {
      setLoading(true);
      await apiRequest(`/attempts/${attemptId}/abandon`, { method: "DELETE" });
      router.push("/solver/dashboard");
    } catch (err: any) {
      alert(`Abandon failed: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="font-inter flex gap-4 mt-6 p-4 bg-gray-100 border border-gray-300">
      <button 
        onClick={handleAbandon} 
        disabled={loading}
        className="px-4 py-2 border border-gray-900 text-gray-900 font-bold hover:bg-gray-200 transition-colors"
      >
        Abandon Attempt
      </button>
      <button 
        onClick={handleFinalize} 
        disabled={loading}
        className="px-4 py-2 bg-gray-900 text-white font-bold hover:bg-black transition-colors"
      >
        Finalize Entire Attempt
      </button>
    </div>
  );
}