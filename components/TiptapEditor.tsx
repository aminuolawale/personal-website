"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Typography from "@tiptap/extension-typography";
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Minus, Undo, Redo, Link2, Link2Off,
  Heading1, Heading2, Heading3, Terminal,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const BTN =
  "p-2 rounded text-[#edd382]/60 hover:text-[#fc9e4f] hover:bg-[#fc9e4f]/10 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed";
const BTN_ACTIVE = "text-[#fc9e4f] bg-[#fc9e4f]/15";

export default function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
      Link.configure({ openOnClick: false }),
      Typography,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "tiptap-editor min-h-[480px] p-6 focus:outline-none",
      },
    },
  });

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

  return (
    <div className="border border-[#f2f3ae]/15 rounded-sm flex flex-col bg-[#020122]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-[#f2f3ae]/10 bg-[#f2f3ae]/[0.02]">
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

        <div className="w-px h-4 bg-[#f2f3ae]/15 mx-1" />

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

        <div className="w-px h-4 bg-[#f2f3ae]/15 mx-1" />

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

        <div className="w-px h-4 bg-[#f2f3ae]/15 mx-1" />

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

        <div className="w-px h-4 bg-[#f2f3ae]/15 mx-1" />

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
