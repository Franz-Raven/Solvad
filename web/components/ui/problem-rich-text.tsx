"use client";

import MarkdownViewer from "@/components/ui/markdown-viewer";

interface ProblemRichTextProps {
  content: string | null | undefined;
  className: string;
  /** Render single newlines as line breaks instead of collapsing them into spaces. */
  preserveLineBreaks?: boolean;
}

function toHardLineBreaks(markdown: string): string {
  return markdown.replace(/\r\n/g, "\n").replace(/([^\n])\n(?!\n)/g, "$1  \n");
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
  preserveLineBreaks = false,
}: ProblemRichTextProps) {
  if (!content) return null;

  const source = getMarkdownSource(content);

  return (
    <MarkdownViewer
      content={preserveLineBreaks ? toHardLineBreaks(source) : source}
      className={`problem-rich-text ${className}`}
    />
  );
}
