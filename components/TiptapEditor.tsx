"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import { useEffect } from "react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Typography from "@tiptap/extension-typography";
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Minus, Undo, Redo, Link2, Link2Off,
  Heading1, Heading2, Heading3, Terminal, Image as ImageIcon,
  Sigma, SquareSigma,
} from "lucide-react";

const ImageBlock = Node.create({
  name: "imageBlock",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
      },
      alt: {
        default: "",
        parseHTML: (element) => element.getAttribute("alt") ?? "",
      },
      title: {
        default: "",
        parseHTML: (element) => element.getAttribute("title") ?? "",
      },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "img",
      mergeAttributes(HTMLAttributes, {
        "data-editor-image": "true",
        class: "editor-rich-image",
      }),
    ];
  },
});

const LatexInline = Node.create({
  name: "latexInline",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex") ?? element.textContent ?? "",
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-latex-formula][data-display="inline"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = node.attrs.latex ?? "";
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-latex-formula": "true",
        "data-display": "inline",
        "data-latex": latex,
        class: "latex-formula latex-formula-inline",
      }),
      latex,
    ];
  },
});

const LatexBlock = Node.create({
  name: "latexBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-latex") ?? element.textContent ?? "",
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-latex-formula][data-display="block"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const latex = node.attrs.latex ?? "";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-latex-formula": "true",
        "data-display": "block",
        "data-latex": latex,
        class: "latex-formula latex-formula-block",
      }),
      latex,
    ];
  },
});

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const BTN =
  "p-1.5 sm:p-2 rounded text-muted/60 hover:text-accent hover:bg-accent/10 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed";
const BTN_ACTIVE = "text-accent bg-accent/15";

export default function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
      Link.configure({ openOnClick: false }),
      Typography,
      ImageBlock,
      LatexInline,
      LatexBlock,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "tiptap-editor min-h-[280px] sm:min-h-[420px] p-4 sm:p-6 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() === content) return;
    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const insertImage = () => {
    const src = window.prompt("Image URL");
    if (!src?.trim()) return;
    const alt = window.prompt("Alt text", "") ?? "";
    const title = window.prompt("Caption/title", "") ?? "";
    editor
      .chain()
      .focus()
      .insertContent({ type: "imageBlock", attrs: { src: src.trim(), alt, title } })
      .run();
  };

  const insertLatex = (display: "inline" | "block") => {
    const latex = window.prompt(
      display === "inline" ? "Inline LaTeX" : "Block LaTeX",
      display === "inline" ? "E = mc^2" : "\\int_0^\\infty e^{-x}\\,dx = 1"
    );
    if (!latex?.trim()) return;
    editor
      .chain()
      .focus()
      .insertContent({
        type: display === "inline" ? "latexInline" : "latexBlock",
        attrs: { latex: latex.trim() },
      })
      .run();
  };

  return (
    <div className="border border-surface/15 rounded-sm flex flex-col bg-base min-w-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-surface/10 bg-surface/[0.02]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`${BTN} ${editor.isActive("heading", { level: 1 }) ? BTN_ACTIVE : ""}`}
          title="Heading 1"
        >
          <Heading1 size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`${BTN} ${editor.isActive("heading", { level: 2 }) ? BTN_ACTIVE : ""}`}
          title="Heading 2"
        >
          <Heading2 size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`${BTN} ${editor.isActive("heading", { level: 3 }) ? BTN_ACTIVE : ""}`}
          title="Heading 3"
        >
          <Heading3 size={15} />
        </button>

        <div className="w-px h-4 bg-surface/15 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`${BTN} ${editor.isActive("bold") ? BTN_ACTIVE : ""}`}
          title="Bold"
        >
          <Bold size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`${BTN} ${editor.isActive("italic") ? BTN_ACTIVE : ""}`}
          title="Italic"
        >
          <Italic size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`${BTN} ${editor.isActive("strike") ? BTN_ACTIVE : ""}`}
          title="Strikethrough"
        >
          <Strikethrough size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`${BTN} ${editor.isActive("code") ? BTN_ACTIVE : ""}`}
          title="Inline code"
        >
          <Code size={15} />
        </button>

        <div className="w-px h-4 bg-surface/15 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`${BTN} ${editor.isActive("bulletList") ? BTN_ACTIVE : ""}`}
          title="Bullet list"
        >
          <List size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`${BTN} ${editor.isActive("orderedList") ? BTN_ACTIVE : ""}`}
          title="Ordered list"
        >
          <ListOrdered size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`${BTN} ${editor.isActive("blockquote") ? BTN_ACTIVE : ""}`}
          title="Blockquote"
        >
          <Quote size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`${BTN} ${editor.isActive("codeBlock") ? BTN_ACTIVE : ""}`}
          title="Code block"
        >
          <Terminal size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={BTN}
          title="Horizontal rule"
        >
          <Minus size={15} />
        </button>

        <div className="w-px h-4 bg-surface/15 mx-1" />

        <button
          type="button"
          onClick={setLink}
          className={`${BTN} ${editor.isActive("link") ? BTN_ACTIVE : ""}`}
          title="Set link"
        >
          <Link2 size={15} />
        </button>
        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className={BTN}
            title="Remove link"
          >
            <Link2Off size={15} />
          </button>
        )}

        <div className="w-px h-4 bg-surface/15 mx-1" />

        <button
          type="button"
          onClick={insertImage}
          className={BTN}
          title="Insert image"
        >
          <ImageIcon size={15} />
        </button>
        <button
          type="button"
          onClick={() => insertLatex("inline")}
          className={BTN}
          title="Inline LaTeX"
        >
          <Sigma size={15} />
        </button>
        <button
          type="button"
          onClick={() => insertLatex("block")}
          className={BTN}
          title="Block LaTeX"
        >
          <SquareSigma size={15} />
        </button>

        <div className="w-px h-4 bg-surface/15 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={BTN}
          title="Undo"
        >
          <Undo size={15} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={BTN}
          title="Redo"
        >
          <Redo size={15} />
        </button>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />
    </div>
  );
}
