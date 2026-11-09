"use client";

import MDEditor from "@uiw/react-md-editor";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { MarkdownViewerProps } from "@/components/ui/markdown-viewer";

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "u"],
};

export default function MarkdownViewerContent({
  content,
}: MarkdownViewerProps) {
  return (
    <MDEditor.Markdown
      source={content}
      rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
    />
  );
}
