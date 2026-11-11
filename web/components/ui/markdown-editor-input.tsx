"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MarkdownEditorProps } from "@/components/ui/markdown-editor";
import { useMarkdownColorMode } from "@/components/ui/use-markdown-color-mode";

type Format = "bold" | "italic" | "underline";

/* ──────────────────────────────────────────────────────────────────────────
 * Markdown → tree
 *
 * Mirrors CommonMark's emphasis rules (the same rules MarkdownViewer /
 * ProblemRichText use), so the editor and the viewer always read a stored
 * string the same way, including nested and adjacent markers like
 * `***text***` or `**bold *both***`. `<u>…</u>` is treated as a paired tag.
 * ────────────────────────────────────────────────────────────────────────── */

type InlineTag = "strong" | "em" | "u";

interface Delimiter {
  kind: "delim";
  /** "*" for markdown emphasis; otherwise the inline HTML tag it pairs with */
  char: "*" | InlineTag;
  raw: string;
  count: number;
  canOpen: boolean;
  canClose: boolean;
}

/** Inline HTML tags the editor reads; <b>/<i> are treated as <strong>/<em>. */
const HTML_TAG_PATTERN = /^<(\/?)(strong|b|em|i|u)>/;
const HTML_TAG_KIND: Record<string, InlineTag> = { strong: "strong", b: "strong", em: "em", i: "em", u: "u" };

interface InlineElement {
  kind: "el";
  tag: InlineTag;
  children: InlineItem[];
}

type InlineItem = string | Delimiter | InlineElement;

const WHITESPACE = /\s/u;
const PUNCTUATION = /[\p{P}\p{S}]/u;
const ASCII_PUNCTUATION = /[!-/:-@[-`{-~]/;

function isDelimiter(item: InlineItem): item is Delimiter {
  return typeof item === "object" && item.kind === "delim";
}

function delimiterToText(item: InlineItem): InlineItem {
  return isDelimiter(item) ? (item.char === "*" ? "*".repeat(item.count) : item.raw) : item;
}

function tokenizeInline(source: string): InlineItem[] {
  const items: InlineItem[] = [];
  let text = "";
  const flush = () => {
    if (text) items.push(text);
    text = "";
  };

  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    const tagMatch = ch === "<" ? source.slice(i, i + 9).match(HTML_TAG_PATTERN) : null;

    if (ch === "\\" && i + 1 < source.length && ASCII_PUNCTUATION.test(source[i + 1])) {
      text += source[i + 1];
      i += 2;
    } else if (tagMatch) {
      const closing = tagMatch[1] === "/";
      flush();
      items.push({
        kind: "delim",
        char: HTML_TAG_KIND[tagMatch[2]],
        raw: tagMatch[0],
        count: 1,
        canOpen: !closing,
        canClose: closing,
      });
      i += tagMatch[0].length;
    } else if (ch === "*") {
      let end = i;
      while (source[end] === "*") end++;
      const before = i > 0 ? source[i - 1] : "";
      const after = end < source.length ? source[end] : "";
      const beforeIsSpace = before === "" || WHITESPACE.test(before);
      const afterIsSpace = after === "" || WHITESPACE.test(after);
      const leftFlanking = !afterIsSpace && (!PUNCTUATION.test(after) || beforeIsSpace || PUNCTUATION.test(before));
      const rightFlanking = !beforeIsSpace && (!PUNCTUATION.test(before) || afterIsSpace || PUNCTUATION.test(after));
      flush();
      const count = end - i;
      items.push({ kind: "delim", char: "*", raw: "*".repeat(count), count, canOpen: leftFlanking, canClose: rightFlanking });
      i = end;
    } else {
      text += ch;
      i++;
    }
  }
  flush();
  return items;
}

/** CommonMark "process emphasis", with `<u>`/`</u>` as an extra delimiter kind. */
function parseInline(source: string): InlineItem[] {
  let items = tokenizeInline(source);

  for (let c = 0; c < items.length; c++) {
    const closer = items[c];
    if (!isDelimiter(closer) || !closer.canClose || closer.count === 0) continue;

    let openerIndex = -1;
    for (let o = c - 1; o >= 0; o--) {
      const opener = items[o];
      if (!isDelimiter(opener) || opener.char !== closer.char || !opener.canOpen || opener.count === 0) continue;
      if (closer.char === "*") {
        // CommonMark "rule of 3", evaluated on the markers still unused, exactly as
        // micromark (the viewer's parser) does it, so both sides pair markers identically
        const bothSided = closer.canOpen || opener.canClose;
        if (bothSided && closer.count % 3 !== 0 && (opener.count + closer.count) % 3 === 0) continue;
      }
      openerIndex = o;
      break;
    }
    if (openerIndex < 0) continue;

    const opener = items[openerIndex] as Delimiter;
    let tag: InlineTag;
    let used: number;
    if (closer.char !== "*") {
      tag = closer.char;
      used = 1;
    } else {
      used = opener.count >= 2 && closer.count >= 2 ? 2 : 1;
      tag = used === 2 ? "strong" : "em";
    }

    const element: InlineElement = {
      kind: "el",
      tag,
      children: items.slice(openerIndex + 1, c).map(delimiterToText),
    };
    opener.count -= used;
    closer.count -= used;

    const keepOpener = opener.count > 0;
    items = [
      ...items.slice(0, openerIndex),
      ...(keepOpener ? [opener] : []),
      element,
      ...(closer.count > 0 ? [closer] : []),
      ...items.slice(c + 1),
    ];
    // Re-visit the closer if it has markers left, otherwise continue after the new element
    c = openerIndex + (keepOpener ? 1 : 0);
  }

  return items.map(delimiterToText);
}

function inlineItemsToNodes(items: InlineItem[]): Node[] {
  return items.flatMap((item): Node[] => {
    if (typeof item === "string") {
      return item.split("\n").flatMap((part, index) => {
        const nodes: Node[] = index > 0 ? [document.createElement("br")] : [];
        if (part) nodes.push(document.createTextNode(part));
        return nodes;
      });
    }
    if (item.kind === "el") {
      const element = document.createElement(item.tag);
      element.append(...inlineItemsToNodes(item.children));
      return [element];
    }
    return [document.createTextNode(item.raw)];
  });
}

function markdownToNodes(markdown: string): Node[] {
  // Emphasis can't span blank lines (paragraph breaks), so parse paragraph by paragraph
  const parts = markdown.replace(/\r\n?/g, "\n").split(/(\n{2,})/);
  return parts.flatMap((part, index) =>
    index % 2 === 1
      ? Array.from({ length: part.length }, () => document.createElement("br"))
      : inlineItemsToNodes(parseInline(part))
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Editor DOM → markdown
 *
 * Flattens the contentEditable DOM (whatever execCommand produced: <b>, <i>,
 * styled <span>s, nested or overlapping) into formatted runs, then emits
 * properly nested markers. Literal `\ * _ <` typed by the user are escaped
 * so they can never be mistaken for formatting.
 * ────────────────────────────────────────────────────────────────────────── */

interface TextRun {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

const NEWLINE_RUN: TextRun = { text: "\n", bold: false, italic: false, underline: false };
const BLOCK_TAGS = new Set(["div", "p", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"]);
const OPEN_ORDER: Format[] = ["underline", "bold", "italic"];
const OPEN_MARKER: Record<Format, string> = { underline: "<u>", bold: "**", italic: "*" };
const CLOSE_MARKER: Record<Format, string> = { underline: "</u>", bold: "**", italic: "*" };

function applyElementFormat(element: HTMLElement, format: Omit<TextRun, "text">): Omit<TextRun, "text"> {
  const tag = element.tagName.toLowerCase();
  let { bold, italic, underline } = format;
  if (tag === "strong" || tag === "b") bold = true;
  if (tag === "em" || tag === "i") italic = true;
  if (tag === "u") underline = true;

  const { fontWeight, fontStyle, textDecoration, textDecorationLine } = element.style;
  if (fontWeight) bold = fontWeight === "bold" || fontWeight === "bolder" || Number(fontWeight) >= 600;
  if (fontStyle) italic = fontStyle === "italic" || fontStyle === "oblique";
  if ((textDecorationLine || textDecoration).includes("underline")) underline = true;

  return { bold, italic, underline };
}

function collectRuns(root: HTMLElement): TextRun[] {
  const runs: TextRun[] = [];
  let pendingBreak = false;
  const lastIsNewline = () => runs.length === 0 || runs[runs.length - 1].text === "\n";

  const walk = (node: Node, format: Omit<TextRun, "text">) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent ?? "").replace(/ /g, " ");
      if (!text) return;
      if (pendingBreak) {
        runs.push(NEWLINE_RUN);
        pendingBreak = false;
      }
      // Pasted text can carry raw newlines (the editor uses white-space: pre-wrap)
      text.split(/\r\n?|\n/).forEach((line, index) => {
        if (index > 0) runs.push(NEWLINE_RUN);
        if (line) runs.push({ text: line, ...format });
      });
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as HTMLElement;
    const tag = element.tagName.toLowerCase();

    if (tag === "br") {
      // A trailing <br> only gives an empty block its height; it isn't a line break
      if (element === element.parentNode?.lastChild) return;
      if (pendingBreak) {
        runs.push(NEWLINE_RUN);
        pendingBreak = false;
      }
      runs.push(NEWLINE_RUN);
      return;
    }

    const isBlock = BLOCK_TAGS.has(tag);
    if (isBlock) {
      if (pendingBreak) runs.push(NEWLINE_RUN);
      else if (!lastIsNewline()) runs.push(NEWLINE_RUN);
      pendingBreak = false;
    }

    const childFormat = applyElementFormat(element, format);
    element.childNodes.forEach((child) => walk(child, childFormat));

    if (isBlock) pendingBreak = true;
  };

  root.childNodes.forEach((child) => walk(child, { bold: false, italic: false, underline: false }));
  return runs;
}

/** Bold/italic markers must hug non-space text (`**bold **` is not bold in CommonMark). */
function normalizeRuns(runs: TextRun[]): TextRun[] {
  const split: TextRun[] = [];
  for (const run of runs) {
    if (run.text === "\n" || !(run.bold || run.italic)) {
      split.push(run);
      continue;
    }
    const match = run.text.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const [, lead, core, trail] = match ?? ["", "", run.text, ""];
    const plainSpace = { bold: false, italic: false, underline: run.underline };
    if (lead) split.push({ text: lead, ...plainSpace });
    if (core) split.push({ ...run, text: core });
    if (trail) split.push({ text: trail, ...plainSpace });
  }

  const merged: TextRun[] = [];
  for (const run of split) {
    const last = merged[merged.length - 1];
    if (
      last && last.text !== "\n" && run.text !== "\n" &&
      last.bold === run.bold && last.italic === run.italic && last.underline === run.underline
    ) {
      merged[merged.length - 1] = { ...last, text: last.text + run.text };
    } else {
      merged.push(run);
    }
  }
  return merged;
}

function escapeMarkdownText(text: string): string {
  return text.replace(/[\\*_<]/g, "\\$&");
}

function lineToMarkdown(line: TextRun[], markers: { open: Record<Format, string>; close: Record<Format, string> }): string {
  let output = "";
  const open: Format[] = [];
  const closeDownTo = (depth: number) => {
    while (open.length > depth) output += markers.close[open.pop()!];
  };

  for (const run of line) {
    const firstStale = open.findIndex((format) => !run[format]);
    if (firstStale >= 0) closeDownTo(firstStale);
    for (const format of OPEN_ORDER) {
      if (run[format] && !open.includes(format)) {
        open.push(format);
        output += markers.open[format];
      }
    }
    output += escapeMarkdownText(run.text);
  }
  closeDownTo(0);
  return output;
}

/** Per-character formatting; bold/italic on whitespace is invisible, so it's ignored. */
function formatSignature(runs: TextRun[]): string {
  return runs
    .flatMap((run) =>
      Array.from(run.text, (ch) => {
        const visible = WHITESPACE.test(ch) ? "" : `${run.bold ? "B" : ""}${run.italic ? "I" : ""}`;
        return `${ch}${visible}${run.underline ? "U" : ""}`;
      })
    )
    .join("|");
}

function itemsToRuns(items: InlineItem[], format = { bold: false, italic: false, underline: false }): TextRun[] {
  return items.flatMap((item): TextRun[] => {
    if (typeof item === "string") return [{ text: item, ...format }];
    if (item.kind === "delim") return [{ text: item.raw, ...format }];
    return itemsToRuns(item.children, {
      bold: format.bold || item.tag === "strong",
      italic: format.italic || item.tag === "em",
      underline: format.underline || item.tag === "u",
    });
  });
}

const MARKDOWN_MARKERS = { open: OPEN_MARKER, close: CLOSE_MARKER };
const HTML_MARKERS = {
  open: { underline: "<u>", bold: "<strong>", italic: "<em>" } as Record<Format, string>,
  close: { underline: "</u>", bold: "</strong>", italic: "</em>" } as Record<Format, string>,
};

function runsToMarkdown(runs: TextRun[]): string {
  // Every line is self-contained: markers never cross a line break
  const lines: TextRun[][] = [[]];
  for (const run of normalizeRuns(runs)) {
    if (run.text === "\n") lines.push([]);
    else lines[lines.length - 1].push(run);
  }

  return lines
    .map((line) => {
      // Prefer plain markdown markers. CommonMark can't express some boundaries
      // (e.g. `word**"quote"**`), so if this line wouldn't read back exactly,
      // fall back to equivalent inline HTML tags, which the viewer also renders.
      const markdown = lineToMarkdown(line, MARKDOWN_MARKERS);
      if (formatSignature(itemsToRuns(parseInline(markdown))) === formatSignature(line)) return markdown;
      return lineToMarkdown(line, HTML_MARKERS);
    })
    .join("\n");
}

function serializeEditor(editor: HTMLElement): string {
  return runsToMarkdown(collectRuns(editor)).replace(/\n+$/, "");
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
