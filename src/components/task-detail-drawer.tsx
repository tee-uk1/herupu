"use client"

import React, { useState, useEffect } from "react"
import { X, Trash2, Calendar, AlertCircle, ArrowUp, ArrowRight, ArrowDown } from "lucide-react"
import { TaskItem, TagItem } from "./kanban-card"
import { updateTaskDetails, deleteTask } from "@/app/actions"

const priorityOptions = [
  { value: "URGENT", label: "Urgent", icon: AlertCircle, color: "text-red-500" },
  { value: "HIGH", label: "High", icon: ArrowUp, color: "text-amber-500" },
  { value: "MEDIUM", label: "Medium", icon: ArrowRight, color: "text-blue-500" },
  { value: "LOW", label: "Low", icon: ArrowDown, color: "text-zinc-400" },
]

export function TaskDetailDrawer({
  task,
  columns,
  availableTags = [],
  onClose,
}: {
  task: TaskItem | null
  columns: { id: string; name: string }[]
  availableTags?: TagItem[]
  onClose: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM")
  const [columnId, setColumnId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setPriority(task.priority)
      setColumnId(task.columnId)
      setDueDate(
        task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
      )
      setSelectedTagIds(task.tags?.map((t) => t.id) || [])
    }
  }, [task])

  if (!task) return null

  const handleSave = async (overrides = {}) => {
    setSaving(true)
    await updateTaskDetails(task.id, {
      title,
      description: description || null,
      priority,
      columnId,
      dueDate: dueDate || null,
      tagIds: selectedTagIds,
      ...overrides,
    })
    setSaving(false)
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(task.id)
      onClose()
    }
  }

  const toggleTag = async (tagId: string) => {
    const nextTags = selectedTagIds.includes(tagId)
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId]
    setSelectedTagIds(nextTags)
    await handleSave({ tagIds: nextTags })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-zinc-900 border-l border-zinc-800 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 text-zinc-100">
        <div className="flex flex-col gap-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wide">
                HERUPU-{task.id.slice(-4)}
              </span>
              {saving && <span className="text-xs text-blue-400">Saving...</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDelete}
                className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Editable Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleSave()}
              className="text-xl font-bold bg-transparent border border-transparent hover:border-zinc-800 focus:border-blue-500 focus:bg-zinc-800/50 rounded-md px-2 py-1 w-full text-zinc-100 outline-none transition-all"
              placeholder="Task Title..."
            />
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 p-4 rounded-lg border border-zinc-800/60 text-xs">
            <div className="flex flex-col gap-1.5">
              <span className="text-zinc-400">Status</span>
              <select
                value={columnId}
                onChange={async (e) => {
                  setColumnId(e.target.value)
                  await handleSave({ columnId: e.target.value })
                }}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-100 outline-none focus:border-blue-500"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-zinc-400">Priority</span>
              <select
                value={priority}
                onChange={async (e) => {
                  const val = e.target.value as any
                  setPriority(val)
                  await handleSave({ priority: val })
                }}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-100 outline-none focus:border-blue-500"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5 col-span-2">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </span>
              <input
                type="date"
                value={dueDate}
                onChange={async (e) => {
                  setDueDate(e.target.value)
                  await handleSave({ dueDate: e.target.value || null })
                }}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-zinc-100 outline-none focus:border-blue-500 w-full"
              />
            </div>
          </div>

          {/* Tags */}
          {availableTags.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Tags
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const active = selectedTagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-all ${
                        active
                          ? "border-blue-400 scale-105"
                          : "border-zinc-800 opacity-60 hover:opacity-100"
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

          {/* Description */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Description
            </span>
            <textarea
              rows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => handleSave()}
              placeholder="Add task specifications, acceptance criteria, or notes..."
              className="bg-zinc-800/60 border border-zinc-700/80 rounded-lg p-3 text-xs text-zinc-100 leading-relaxed outline-none focus:border-blue-500 resize-y"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium text-zinc-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}