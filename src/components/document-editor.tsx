"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { useState, useEffect, useRef, useCallback } from "react"
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered,
  Quote,
  Check,
  Loader2,
  AlertCircle
} from "lucide-react"

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null

  const ActionButton = ({ onClick, isActive, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-md text-xs transition-all ${
        isActive 
          ? "bg-indigo-500/15 text-indigo-400 font-medium" 
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="flex items-center gap-0.5 p-1 mb-8 bg-zinc-900/80 border border-zinc-800/80 rounded-xl sticky top-4 z-20 backdrop-blur-xl shadow-xl shadow-black/40 w-fit">
      <ActionButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive("heading", { level: 1 })} title="Heading 1">
        <Heading1 className="w-3.5 h-3.5" />
      </ActionButton>
      <ActionButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive("heading", { level: 2 })} title="Heading 2">
        <Heading2 className="w-3.5 h-3.5" />
      </ActionButton>
      
      <div className="w-px h-3.5 bg-zinc-800 mx-1" />
      
      <ActionButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Bold">
        <Bold className="w-3.5 h-3.5" />
      </ActionButton>
      <ActionButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Italic">
        <Italic className="w-3.5 h-3.5" />
      </ActionButton>
      <ActionButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Strikethrough">
        <Strikethrough className="w-3.5 h-3.5" />
      </ActionButton>
      
      <div className="w-px h-3.5 bg-zinc-800 mx-1" />
      
      <ActionButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Bullet List">
        <List className="w-3.5 h-3.5" />
      </ActionButton>
      <ActionButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Numbered List">
        <ListOrdered className="w-3.5 h-3.5" />
      </ActionButton>
      <ActionButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Quote">
        <Quote className="w-3.5 h-3.5" />
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
  onSave: (title: string, content: string) => Promise<void> | void
}) {
  const [title, setTitle] = useState(initialTitle || "")
  const [status, setStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved")
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(false)
  const titleRef = useRef(title)
  titleRef.current = title

  const performSave = useCallback(async (newTitle: string, newContent: string) => {
    try {
      setStatus("saving")
      await onSave(newTitle, newContent)
      setStatus("saved")
      setLastSavedAt(new Date())
    } catch (err) {
      console.error("Failed to auto-save document:", err)
      setStatus("error")
    }
  }, [onSave])

  const triggerAutoSave = useCallback((newTitle: string, newContent: string) => {
    setStatus("unsaved")
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      performSave(newTitle, newContent)
    }, 800)
  }, [performSave])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start typing or use markdown shortcuts...",
        emptyEditorClass: "cursor-text before:content-[attr(data-placeholder)] before:absolute before:text-zinc-600 before:pointer-events-none",
      }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-indigo max-w-none focus:outline-none min-h-[500px] text-zinc-300 font-normal leading-relaxed selection:bg-indigo-500/30",
      },
    },
    onUpdate: ({ editor }) => {
      if (!isMountedRef.current) return
      triggerAutoSave(titleRef.current, editor.getHTML())
    },
  })

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    const currentHtml = editor ? editor.getHTML() : initialContent
    triggerAutoSave(val, currentHtml)
  }

  return (
    <div className="w-full max-w-3xl mx-auto py-10 px-6">
      {/* Sleek Minimal Auto-save Indicator */}
      <div className="flex items-center justify-end h-6 mb-6">
        {status === "saving" && (
          <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 font-medium">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving...
          </div>
        )}
        {status === "saved" && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
            <Check className="w-3 h-3 text-emerald-500" />
            {lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "Saved"}
          </div>
        )}
        {status === "unsaved" && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Unsaved
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-1.5 text-[11px] text-rose-400">
            <AlertCircle className="w-3 h-3" />
            Failed to save
          </div>
        )}
      </div>

      {/* Notion-style Page Title */}
      <input
        type="text"
        value={title}
        placeholder="Untitled Document"
        onChange={handleTitleChange}
        className="w-full bg-transparent text-4xl font-semibold tracking-tight text-zinc-100 placeholder:text-zinc-700 outline-none pb-2 border-b border-transparent focus:border-zinc-800/60 transition-colors"
      />
      
      {/* Floating Toolbar */}
      <MenuBar editor={editor} />
      
      {/* Document Content Canvas */}
      <div onClick={() => editor?.commands.focus()} className="cursor-text">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}