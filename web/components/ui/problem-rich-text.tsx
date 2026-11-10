"use client";

import MarkdownViewer from "@/components/ui/markdown-viewer";

interface ProblemRichTextProps {
  content: string | undefined;
  className: string;
}

function getMarkdownSource(content: string): string {
  const trimmedContent = content.trim();
  if (!trimmedContent.startsWith("[") || !trimmedContent.endsWith("]")) {
    return content;
  }

  try {
    const parsed: unknown = JSON.parse(trimmedContent);
    if (!Array.isArray(parsed)) return content;

    return parsed
      .map((item) => `- ${String(item).replace(/\r?\n/g, "\n  ")}`)
      .join("\n");
  } catch (error) {
    if (error instanceof SyntaxError) return content;
    throw error;
  }
}

export default function ProblemRichText({
  content,
  className,
}: ProblemRichTextProps) {
  if (!content) return null;

  return (
    <MarkdownViewer
      content={getMarkdownSource(content)}
      className={`problem-rich-text ${className}`}
    />
  );
}
