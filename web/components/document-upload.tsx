// components/document-upload.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { uploadFileToSupabase } from "@/lib/supabase";
import { registerDocument } from "@/lib/api/activity";

interface DocumentUploadProps {
  problemId: string;
  onUploadSuccess: () => void;
}

export default function DocumentUpload({ problemId, onUploadSuccess }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    try {
      // 1. Upload to Supabase bucket
      const publicUrl = await uploadFileToSupabase(file);

      // 2. Register file in backend & write log
      await registerDocument(problemId, {
        fileUrl: publicUrl,
        fileName: file.name,
      });

      setFile(null);
      onUploadSuccess(); // Trigger refetch of activity feed
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 bg-muted/30 p-4 rounded-xl border border-border mt-4">
      <input
        type="file"
        onChange={handleFileChange}
        disabled={isUploading}
        className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
      />
      <Button 
        onClick={handleUpload} 
        disabled={!file || isUploading}
        variant="secondary"
      >
        {isUploading ? "Uploading..." : "Upload Document"}
      </Button>
      {error && <p className="text-xs text-red-500 absolute mt-12">{error}</p>}
    </div>
  );
}