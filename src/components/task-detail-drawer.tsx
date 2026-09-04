"use client"

import React, { useState, useEffect } from "react"
import { X, Trash2, Calendar, Tag as TagIcon, CheckSquare, Plus, Loader2 } from "lucide-react"
import { TaskItem, TagItem, SubtaskItem } from "./kanban-card"
import { updateTaskDetails, deleteTask, createSubtask, toggleSubtask, deleteSubtask } from "@/app/actions"

export function TaskDetailDrawer({
  task,
  columns,
  availableTags,
  onClose,
}: {
  task: TaskItem | null
  columns: { id: string; name: string }[]
  availableTags: TagItem[]
  onClose: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM")
  const [columnId, setColumnId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  
  // Subtasks local state
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setPriority(task.priority)
      setColumnId(task.columnId)
      setDueDate(
        task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""
      )
      setSelectedTagIds(task.tags ? task.tags.map((t) => t.id) : [])
      setSubtasks(task.subtasks || [])
    }
  }, [task])

  if (!task) return null

  const handleSave = async () => {
    setIsSaving(true)
    await updateTaskDetails(task.id, {
      title,
      description,
      priority,
      columnId,
      dueDate: dueDate || null,
      tagIds: selectedTagIds,
    })
    setIsSaving(false)
    onClose()
  }

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(task.id)
      onClose()
    }
  }

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newSubtaskTitle.trim()
    if (!trimmed || isAddingSubtask) return

    setIsAddingSubtask(true)
    const created = await createSubtask(task.id, trimmed)
    setSubtasks((prev) => [...prev, created])
    setNewSubtaskTitle("")
    setIsAddingSubtask(false)
  }

  const handleToggleSubtask = async (subtaskId: string, currentCompleted: boolean) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === subtaskId ? { ...s, isCompleted: !currentCompleted } : s))
    )
    await toggleSubtask(subtaskId, !currentCompleted)
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== subtaskId))
    await deleteSubtask(subtaskId)
  }

  const completedCount = subtasks.filter((s) => s.isCompleted).length

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">
              HERUPU-{task.id.slice(-4)}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-xs font-medium text-zinc-400">Task Details</span>
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
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Status</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              <span className="inline-flex items-center gap-1">
                <TagIcon className="w-3.5 h-3.5" /> Tags
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                      isSelected
                        ? "ring-1 ring-white/40 opacity-100 font-medium scale-105"
                        : "opacity-40 hover:opacity-80"
                    }`}
                    style={{
                      backgroundColor: `${tag.color}25`,
                      borderColor: `${tag.color}60`,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Subtasks / Checklist Section */}
          <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Checklist</span>
              </label>
              {subtasks.length > 0 && (
                <span className="text-[11px] font-mono text-zinc-500">
                  {completedCount}/{subtasks.length} done
                </span>
              )}
            </div>

            {/* Subtask list */}
            <div className="flex flex-col gap-1.5">
              {subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-zinc-950/60 rounded border border-zinc-800/80 hover:border-zinc-700 transition-colors group"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 overflow-hidden">
                    <input
                      type="checkbox"
                      checked={subtask.isCompleted}
                      onChange={() => handleToggleSubtask(subtask.id, subtask.isCompleted)}
                      className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span
                      className={`text-xs truncate transition-all ${
                        subtask.isCompleted
                          ? "line-through text-zinc-500 italic"
                          : "text-zinc-200"
                      }`}
                    >
                      {subtask.title}
                    </span>
                  </label>
                  <button
                    onClick={() => handleDeleteSubtask(subtask.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick add subtask form */}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-1">
              <input
                type="text"
                value={newSubtaskTitle}
                disabled={isAddingSubtask}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add checklist item..."
                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded px-2.5 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim() || isAddingSubtask}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 rounded text-xs font-medium transition-colors flex items-center gap-1"
              >
                {isAddingSubtask ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Add
              </button>
            </form>
          </div>

          {/* Description */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add detailed task notes or acceptance criteria..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
          >
            {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}