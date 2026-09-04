"use client"

import React, { useState, useRef, useEffect } from "react"
import { Plus, X, Loader2 } from "lucide-react"
import { createTask } from "@/app/actions"

export function InlineTaskCreator({ columnId }: { columnId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = title.trim()
    if (!trimmed || isSubmitting) return

    setIsSubmitting(true)
    await createTask({
      title: trimmed,
      priority: "MEDIUM",
      columnId,
    })

    setTitle("")
    setIsSubmitting(false)
    // Keep focus ready for another task
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === "Escape") {
      setIsOpen(false)
      setTitle("")
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full mt-2 flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-md transition-all border border-transparent hover:border-zinc-800"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add task</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-col gap-2 bg-zinc-850 p-2.5 rounded-lg border border-zinc-700 shadow-md">
      <input
        ref={inputRef}
        type="text"
        value={title}
        disabled={isSubmitting}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="What needs to be done?..."
        className="bg-zinc-900 border border-zinc-700 focus:border-blue-500 rounded px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none w-full transition-all"
      />
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <button
            type="submit"
            disabled={!title.trim() || isSubmitting}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
          >
            {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              setTitle("")
            }}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <span className="text-[10px] text-zinc-500 font-mono">↵ Enter to add</span>
      </div>
    </form>
  )
}