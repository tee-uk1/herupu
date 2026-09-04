"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered,
  Quote
} from "lucide-react"

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null

  const ActionButton = ({ onClick, isActive, children }: any) => (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-md transition-colors ${
        isActive 
          ? "bg-indigo-500/20 text-indigo-400" 
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="flex items-center gap-1 p-1.5 mb-6 bg-zinc-950/60 border border-zinc-800/80 rounded-lg sticky top-4 z-10 backdrop-blur-sm w-fit">
      <ActionButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })}>
        <Heading1 className="w-4 h-4" />
      </ActionButton>
      <ActionButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })}>
        <Heading2 className="w-4 h-4" />
      </ActionButton>
      
      <div className="w-px h-4 bg-zinc-800 mx-1" />
      
      <ActionButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")}>
        <Bold className="w-4 h-4" />
      </ActionButton>
      <ActionButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")}>
        <Italic className="w-4 h-4" />
      </ActionButton>
      <ActionButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")}>
        <Strikethrough className="w-4 h-4" />
      </ActionButton>
      
      <div className="w-px h-4 bg-zinc-800 mx-1" />
      
      <ActionButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")}>
        <List className="w-4 h-4" />
      </ActionButton>
      <ActionButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")}>
        <ListOrdered className="w-4 h-4" />
      </ActionButton>
      <ActionButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")}>
        <Quote className="w-4 h-4" />
      </ActionButton>
    </div>
  )
}

export function DocumentEditor({ 
  initialTitle,
  initialContent, 
  onSave 
}: { 
  initialTitle: string
  initialContent: string
  onSave: (title: string, content: string) => void 
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Type '/' for commands, or start writing...",
        emptyEditorClass: "cursor-text before:content-[attr(data-placeholder)] before:absolute before:text-zinc-600 before:pointer-events-none",
      }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-indigo max-w-none focus:outline-none min-h-[300px]",
      },
    },
    onUpdate: ({ editor }) => {
      // Auto-save logic could go here
    },
  })

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-12 bg-[#0c0d10]">
      <input
        type="text"
        defaultValue={initialTitle}
        placeholder="Untitled Document"
        onChange={(e) => {
          if (editor) onSave(e.target.value, editor.getHTML())
        }}
        className="w-full bg-transparent text-4xl font-bold text-zinc-100 placeholder:text-zinc-700 outline-none mb-4"
      />
      
      <MenuBar editor={editor} />
      
      <div onClick={() => editor?.commands.focus()} className="cursor-text">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}