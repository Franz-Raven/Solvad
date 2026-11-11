"use client";

import dynamic from "next/dynamic";
import { useMarkdownColorMode } from "@/components/ui/use-markdown-color-mode";

export interface MarkdownViewerProps {
  content: string;
  className?: string;
}

const MarkdownContent = dynamic(
  () => import("@/components/ui/markdown-viewer-content"),
  { ssr: false }
);

export default function MarkdownViewer({
  content,
  className,
}: MarkdownViewerProps) {
  const colorMode = useMarkdownColorMode();

  return (
    <div data-color-mode={colorMode} className={className}>
      <MarkdownContent content={content} />
    </div>
  );
}
