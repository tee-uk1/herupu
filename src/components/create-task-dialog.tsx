"use client"

import React, { useState } from "react"
import { Plus, X } from "lucide-react"
import { createTask } from "@/app/actions"

type ColumnOption = {
  id: string
  name: string
}

type TagOption = {
  id: string
  name: string
  color: string
}

export function CreateTaskDialog({
  columns,
  availableTags = [],
}: {
  columns: ColumnOption[]
  availableTags?: TagOption[]
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [columnId, setColumnId] = useState(columns[0]?.id || "")
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM")
  const [dueDate, setDueDate] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !columnId) return

    setLoading(true)
    await createTask({
      title: title.trim(),
      description: description.trim(),
      priority,
      columnId,
      dueDate: dueDate || undefined,
      tagIds: selectedTags,
    })

    setTitle("")
    setDescription("")
    setDueDate("")
    setSelectedTags([])
    setLoading(false)
    setOpen(false)
  }

  const toggleTag = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow transition-colors"
      >
        <Plus className="w-4 h-4" />
        New Task
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4 text-zinc-100 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-semibold text-sm">Create New Task</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-md px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Add details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-md px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Status (Column)</label>
                  <select
                    value={columnId}
                    onChange={(e) => setColumnId(e.target.value)}
                    className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-md px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-md px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-zinc-800/80 border border-zinc-700/80 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {availableTags.length > 0 && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => {
                      const active = selectedTags.includes(tag.id)
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${
                            active
                              ? "border-blue-400 scale-105"
                              : "border-zinc-700 opacity-60 hover:opacity-100"
                          }`}
                          style={{
                            backgroundColor: `${tag.color}25`,
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800 mt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-md text-zinc-400 hover:text-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="px-4 py-1.5 text-xs rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}