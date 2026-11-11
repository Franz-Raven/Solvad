"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarkdownEditorProps } from "@/components/ui/markdown-editor";
import { useMarkdownColorMode } from "@/components/ui/use-markdown-color-mode";

type Format = "bold" | "italic" | "underline";

function createInlineNodes(source: string): Node[] {
  const nodes: Node[] = [];
  const tokenPattern = /\*\*|\*|<\/?u>/g;
  let position = 0;

  while (position < source.length) {
    tokenPattern.lastIndex = position;
    const token = tokenPattern.exec(source);

    if (!token) {
      nodes.push(document.createTextNode(source.slice(position)));
      break;
    }

    if (token.index > position) {
      nodes.push(document.createTextNode(source.slice(position, token.index)));
    }

    const marker = token[0];
    const closingMarker = marker === "<u>" ? "</u>" : marker;
    const contentStart = token.index + marker.length;
    const closingIndex = source.indexOf(closingMarker, contentStart);

    if (closingIndex < 0) {
      nodes.push(document.createTextNode(marker));
      position = contentStart;
      continue;
    }

    const element = document.createElement(
      marker === "**" ? "strong" : marker === "*" ? "em" : "u"
    );
    element.append(...createInlineNodes(source.slice(contentStart, closingIndex)));
    nodes.push(element);
    position = closingIndex + closingMarker.length;
  }

  return nodes;
}

function markdownToNodes(markdown: string): Node[] {
  const lines = markdown.split("\n");
  return lines.flatMap((line, index) => {
    const lineNodes = createInlineNodes(line);
    return index < lines.length - 1
      ? [...lineNodes, document.createElement("br")]
      : lineNodes;
  });
}

function nodesToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as HTMLElement;
  const content = Array.from(element.childNodes, nodesToMarkdown).join("");

  switch (element.tagName.toLowerCase()) {
    case "strong":
    case "b":
      return `**${content}**`;
    case "em":
    case "i":
      return `*${content}*`;
    case "u":
      return `<u>${content}</u>`;
    case "br":
      return "\n";
    case "div":
    case "p":
      return `${content}\n`;
    default:
      return content;
  }
}

function serializeEditor(editor: HTMLElement): string {
  return Array.from(editor.childNodes, nodesToMarkdown)
    .join("")
    .replace(/\n+$/, "");
}

export default function MarkdownEditorInput({
  value,
  onChange,
  id,
  name,
  placeholder,
  className,
  minHeight = 160,
}: MarkdownEditorProps) {
  const colorMode = useMarkdownColorMode();
  const editorRef = useRef<HTMLDivElement>(null);
  const lastEmittedValue = useRef<string | null>(null);
  const [activeFormats, setActiveFormats] = useState<Record<Format, boolean>>({
    bold: false,
    italic: false,
    underline: false,
  });

  const updateActiveFormats = useCallback(() => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.anchorNode || !editor.contains(selection.anchorNode)) {
      setActiveFormats({ bold: false, italic: false, underline: false });
      return;
    }

    setActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
    });
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === lastEmittedValue.current) return;

    editor.replaceChildren(...markdownToNodes(value));
    lastEmittedValue.current = value;
  }, [value]);

  useEffect(() => {
    document.addEventListener("selectionchange", updateActiveFormats);
    return () => document.removeEventListener("selectionchange", updateActiveFormats);
  }, [updateActiveFormats]);

  const emitMarkdown = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const markdown = serializeEditor(editor);
    lastEmittedValue.current = markdown;
    onChange(markdown);
  };

  const applyFormat = (format: Format) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(format, false);
    emitMarkdown();
    updateActiveFormats();
  };

  const formatButtonClass = (format: Format) =>
    `rounded px-2 py-1 text-sm text-foreground ${
      activeFormats[format]
        ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
        : "hover:bg-muted"
    }`;

  return (
    <div
      data-color-mode={colorMode}
      className={`markdown-editor w-full overflow-hidden rounded-lg border border-border bg-background ${className ?? ""}`}
    >
      <div className="flex items-center gap-1 border-b border-border p-1">
        <button
          type="button"
          aria-label="Bold"
          title="Bold"
          aria-pressed={activeFormats.bold}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyFormat("bold")}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          className={`${formatButtonClass("bold")} font-bold`}
        >
          B
        </button>
        <button
          type="button"
          aria-label="Italic"
          title="Italic"
          aria-pressed={activeFormats.italic}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyFormat("italic")}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          className={`${formatButtonClass("italic")} italic`}
        >
          I
        </button>
        <button
          type="button"
          aria-label="Underline"
          title="Underline"
          aria-pressed={activeFormats.underline}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => applyFormat("underline")}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          className={`${formatButtonClass("underline")} underline`}
        >
          U
        </button>
      </div>
      <div
        ref={editorRef}
        id={id}
        role="textbox"
        aria-label={name ?? "Markdown editor"}
        aria-multiline="true"
        data-placeholder={placeholder}
        contentEditable
        suppressContentEditableWarning
        onInput={emitMarkdown}
        onInputCapture={updateActiveFormats}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onBlur={emitMarkdown}
        className="markdown-editor-content w-full overflow-y-auto px-4 py-3 text-foreground outline-none"
        style={{ minHeight }}
      />
    </div>
  );
}
