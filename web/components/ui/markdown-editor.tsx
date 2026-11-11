"use client";

import dynamic from "next/dynamic";

export interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

const MarkdownEditorInput = dynamic<MarkdownEditorProps>(
  () => import("@/components/ui/markdown-editor-input"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-40 w-full animate-pulse rounded-lg border border-border bg-muted" />
    ),
  }
);

export default function MarkdownEditor(props: MarkdownEditorProps) {
  return <MarkdownEditorInput {...props} />;
}
