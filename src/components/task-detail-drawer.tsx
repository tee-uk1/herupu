"use client"

import React, { useState, useEffect } from "react"
import { X, Trash2, Calendar, Tag as TagIcon, CheckSquare, Plus, Loader2, MessageSquare, Send, Globe2, Archive, UserCheck } from "lucide-react"
import { TaskItem, TagItem, SubtaskItem, CommentItem, UserItem } from "./kanban-card"
import { updateTaskDetails, deleteTask, archiveTask, createSubtask, toggleSubtask, deleteSubtask, createComment, deleteComment, createTag } from "@/app/actions"
import { useSession } from "next-auth/react"

function formatRelativeTime(dateInput: string | Date) {
  const date = new Date(dateInput)
  const diffInSec = Math.floor((Date.now() - date.getTime()) / 1000)

  if (diffInSec < 60) return "just now"
  const diffInMin = Math.floor(diffInSec / 60)
  if (diffInMin < 60) return `${diffInMin}m ago`
  const diffInHours = Math.floor(diffInMin / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function TaskDetailDrawer({
  task,
  columns,
  availableTags,
  availableUsers = [],
  onClose,
}: {
  task: TaskItem | null
  columns: { id: string; name: string }[]
  availableTags: TagItem[]
  availableUsers?: UserItem[]
  onClose: () => void
}) {
  const { data: session } = useSession()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM")
  const [columnId, setColumnId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [assignedToId, setAssignedToId] = useState<string>("")
  const [isPinnedToMaster, setIsPinnedToMaster] = useState(false)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [isAddingSubtask, setIsAddingSubtask] = useState(false)

  const [comments, setComments] = useState<CommentItem[]>([])
  const [newCommentContent, setNewCommentContent] = useState("")
  const [isPostingComment, setIsPostingComment] = useState(false)

  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setPriority(task.priority)
      setColumnId(task.columnId)
      setAssignedToId(task.assignedToId || "")
      setIsPinnedToMaster(task.isPinnedToMaster || false)
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")
      setSelectedTagIds(task.tags ? task.tags.map((t) => t.id) : [])
      setSubtasks(task.subtasks || [])
      setComments(task.comments || [])
    }
  }, [task])

  if (!task) return null

  const handleSave = async () => {
    setIsSaving(true)
    await updateTaskDetails(task.id, {
      title,
      description,
      priority,
      columnId: task.originBoardName ? task.columnId : columnId,
      dueDate: dueDate || null,
      assignedToId: assignedToId || null,
      tagIds: selectedTagIds,
      isPinnedToMaster,
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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newCommentContent.trim()
    if (!trimmed || isPostingComment) return

    setIsPostingComment(true)
    const created = await createComment(task.id, trimmed)
    setComments((prev) => [
      ...prev,
      {
        id: created.id,
        content: created.content,
        authorName: session?.user?.name || "Member",
        createdAt: created.createdAt,
      },
    ])
    setNewCommentContent("")
    setIsPostingComment(false)
  }

  const handleDeleteComment = async (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId))
    await deleteComment(commentId)
  }

  const completedCount = subtasks.filter((s) => s.isCompleted).length

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500">HERUPU-{task.id.slice(-4)}</span>
            <span className="text-zinc-600">/</span>
            <span className="text-xs font-medium text-zinc-400">Task Details</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await archiveTask(task.id)
                onClose()
              }}
              className="p-1.5 text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 rounded transition-colors"
              title="Archive Task"
            >
              <Archive className="w-4 h-4" />
            </button>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Rollup Pin Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-950/20 border border-purple-900/40">
            <div className="flex items-center gap-2.5">
              <Globe2 className="w-4 h-4 text-purple-400" />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-purple-200">Rollup to Central Master Board</span>
                <span className="text-[11px] text-zinc-400">Makes this task visible in the executive rollup</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isPinnedToMaster}
              onChange={(e) => setIsPinnedToMaster(e.target.checked)}
              className="w-4 h-4 rounded bg-zinc-950 border-purple-700 text-purple-600 focus:ring-0 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Status</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
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
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Assignee</label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                <option value="">Unassigned</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Due Date with Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Due Date
              </label>
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setDueDate(new Date().toISOString().split("T")[0])}
                  className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date()
                    d.setDate(d.getDate() + 1)
                    setDueDate(d.toISOString().split("T")[0])
                  }}
                  className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date()
                    d.setDate(d.getDate() + 7)
                    setDueDate(d.toISOString().split("T")[0])
                  }}
                  className="px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                >
                  +1 Wk
                </button>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate("")}
                    className="px-1.5 py-0.5 rounded bg-zinc-800/60 hover:bg-red-950/50 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-blue-500 [color-scheme:dark]"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1">
                <TagIcon className="w-3.5 h-3.5" /> Tags
              </label>
              <button
                type="button"
                onClick={async () => {
                  const name = prompt("Enter tag name:")
                  if (!name?.trim()) return
                  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]
                  const color = colors[Math.floor(Math.random() * colors.length)]
                  await createTag(name.trim(), color)
                }}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-normal"
              >
                + New Tag
              </button>
            </div>
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

          {/* Checklist */}
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
                      className="w-3.5 h-3.5 rounded bg-zinc-900 border-zinc-700 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                    <span
                      className={`text-xs truncate transition-all ${
                        subtask.isCompleted ? "line-through text-zinc-500 italic" : "text-zinc-200"
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
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task notes or acceptance criteria..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Discussion */}
          <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Discussion</span>
              </label>
              <span className="text-[11px] font-mono text-zinc-500">{comments.length}</span>
            </div>

            <div className="flex flex-col gap-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-950/70 border border-zinc-800/80 group"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center text-[10px] font-semibold shrink-0">
                    {comment.authorName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-zinc-300">{comment.authorName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-0.5"
                          title="Delete Comment"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-200 mt-1 whitespace-pre-wrap leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-2">
              <textarea
                rows={2}
                value={newCommentContent}
                disabled={isPostingComment}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-all resize-none"
              />
              <button
                type="submit"
                disabled={!newCommentContent.trim() || isPostingComment}
                className="self-end px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                {isPostingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                Comment
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-800 bg-zinc-900/50">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}