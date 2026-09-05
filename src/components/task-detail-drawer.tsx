"use client"

import React, { useEffect,  useState  } from "react"
import {
  X,
  Calendar,
  Tag as TagIcon,
  UserCheck,
  CheckSquare,
  MessageSquare,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  Table,
  Presentation,
  Folder,
  Link2,
  HardDrive,
} from "lucide-react"
import { TaskItem, TagItem, UserItem, TaskAttachmentItem } from "./kanban-card"
import {
  updateTaskDetails,
  deleteTask,
  toggleSubtask,
  addSubtask,
  deleteSubtask,
  addComment,
  archiveTask,
  addGoogleDriveAttachment,
  deleteAttachment,
} from "@/app/actions"
import { useSession } from "next-auth/react"

export function TaskDetailDrawer({
  task,
  columns = [],
  availableTags,
  availableUsers = [],
  onClose,
}: {
  task: TaskItem | null
  columns?: { id: string; name: string }[]
  availableTags: TagItem[]
  availableUsers?: UserItem[]
  onClose: () => void
}) {
  const { data: session } = useSession()
  const [newSubtask, setNewSubtask] = useState("")
  const [newComment, setNewComment] = useState("")

  // Drive Attachment Form State
  const [isAddingDrive, setIsAddingDrive] = useState(false)
  const [driveUrl, setDriveUrl] = useState("")
  const [driveName, setDriveName] = useState("")
  const [isAttaching, setIsAttaching] = useState(false)

    useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  if (!task) return null

  const handleAddDrive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!driveUrl.trim() || isAttaching) return
    setIsAttaching(true)
    try {
      await addGoogleDriveAttachment(task.id, driveUrl.trim(), driveName.trim())
      setDriveUrl("")
      setDriveName("")
      setIsAddingDrive(false)
    } finally {
      setIsAttaching(false)
    }
  }

  const getDriveIcon = (type: string) => {
    switch (type) {
      case "DOC":
        return <FileText className="w-3.5 h-3.5 text-blue-400" />
      case "SHEET":
        return <Table className="w-3.5 h-3.5 text-emerald-400" />
      case "SLIDES":
        return <Presentation className="w-3.5 h-3.5 text-amber-400" />
      case "FOLDER":
        return <Folder className="w-3.5 h-3.5 text-yellow-400" />
      default:
        return <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0c0d10] border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 text-xs">
        {/* Header */}
        <div className="h-14 px-6 border-b border-zinc-800/80 flex items-center justify-between shrink-0 bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-zinc-500 uppercase">Task Detail</span>
            <span className="text-zinc-600">/</span>
            <span className="font-mono text-[11px] text-zinc-300 font-semibold">{task.id.slice(-6)}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded-md hover:bg-zinc-800/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Title */}
          <div>
            <input
              type="text"
              defaultValue={task.title}
              onBlur={(e) => updateTaskDetails(task.id, { title: e.target.value })}
              className="w-full bg-transparent text-lg font-bold text-zinc-100 outline-none border-b border-transparent focus:border-indigo-500 pb-1"
            />
          </div>

          {/* Core Properties Grid */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-zinc-950/60 border border-zinc-800/80">
            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">Status</span>
              <select
                defaultValue={task.columnId}
                onChange={(e) => updateTaskDetails(task.id, { columnId: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none"
              >
                {columns?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">Priority</span>
              <select
                defaultValue={task.priority}
                onChange={(e) => updateTaskDetails(task.id, { priority: e.target.value as any })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">Assignee</span>
              <select
                defaultValue={task.assignedToId || ""}
                onChange={(e) => updateTaskDetails(task.id, { assignedToId: e.target.value || null })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none"
              >
                <option value="">Unassigned</option>
                {availableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name || u.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[11px] text-zinc-400 block mb-1">Due Date</span>
              <input
                type="date"
                defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                onChange={(e) => updateTaskDetails(task.id, { dueDate: e.target.value ? new Date(e.target.value) : null })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-200 outline-none"
              >
              </input>
            </div>
          </div>

          {/* Google Drive & Workspace Attachments */}
          <div className="flex flex-col gap-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                <span>Google Drive & Docs</span>
                {task.attachments && task.attachments.length > 0 && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    ({task.attachments.length})
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={() => setIsAddingDrive(!isAddingDrive)}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Link Doc / Sheet</span>
              </button>
            </div>

            {isAddingDrive && (
              <form onSubmit={handleAddDrive} className="p-3 bg-zinc-950 border border-indigo-500/30 rounded-lg flex flex-col gap-2">
                <input
                  type="url"
                  required
                  autoFocus
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="Paste Google Doc, Sheet, Slides, or Drive link..."
                  className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-indigo-500"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={driveName}
                    onChange={(e) => setDriveName(e.target.value)}
                    placeholder="Document title (optional)..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-zinc-100 outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!driveUrl.trim() || isAttaching}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded transition-colors"
                  >
                    {isAttaching ? "Linking..." : "Attach"}
                  </button>
                </div>
              </form>
            )}

            <div className="flex flex-col gap-1.5">
              {task.attachments && task.attachments.length > 0 ? (
                task.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/80 hover:border-zinc-700/80 group transition-all"
                  >
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 min-w-0 flex-1 hover:text-white"
                    >
                      {getDriveIcon(att.fileType)}
                      <span className="font-medium text-zinc-200 truncate">{att.name}</span>
                      <ExternalLink className="w-3 h-3 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </a>
                    <button
                      onClick={() => deleteAttachment(att.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-rose-950/30"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                !isAddingDrive && (
                  <p className="text-[11px] text-zinc-500 italic">No Google Drive files linked yet.</p>
                )
              )}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <span className="font-semibold text-zinc-300">Description & Context</span>
            <textarea
              defaultValue={task.description || ""}
              onBlur={(e) => updateTaskDetails(task.id, { description: e.target.value })}
              placeholder="Add comprehensive notes, requirements, or links..."
              rows={4}
              className="w-full bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-3 text-zinc-200 outline-none focus:border-indigo-500/80 leading-relaxed resize-none"
            />
          </div>

          {/* Subtasks */}
          <div className="flex flex-col gap-2">
            <span className="font-semibold text-zinc-300">Checklist & Subtasks</span>
            <div className="flex flex-col gap-1">
              {task.subtasks?.map((st) => (
                <div key={st.id} className="flex items-center justify-between group py-1 px-2 hover:bg-zinc-950 rounded">
                  <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={st.isCompleted}
                      onChange={() => toggleSubtask(st.id, !st.isCompleted)}
                      className="rounded bg-zinc-900 border-zinc-700 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <span className={`truncate ${st.isCompleted ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                      {st.title}
                    </span>
                  </label>
                  <button
                    onClick={() => deleteSubtask(st.id)}
                    className="text-zinc-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newSubtask.trim()) return
                await addSubtask(task.id, newSubtask.trim())
                setNewSubtask("")
              }}
              className="flex items-center gap-1.5 mt-1"
            >
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add subtask item..."
                className="flex-1 bg-zinc-950 border border-zinc-800/80 rounded px-2.5 py-1 text-zinc-200 outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!newSubtask.trim()}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 rounded font-medium transition-colors"
              >
                Add
              </button>
            </form>
          </div>

          {/* Activity / Comments */}
          <div className="flex flex-col gap-2 pt-2 border-t border-zinc-800/60">
            <span className="font-semibold text-zinc-300">Comments & Collaboration</span>
            <div className="flex flex-col gap-2.5 max-h-56 overflow-y-auto pr-1">
              {task.comments?.map((c) => (
                <div key={c.id} className="p-2.5 bg-zinc-950/60 border border-zinc-800/60 rounded-lg flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span className="font-semibold text-zinc-300">{c.authorName}</span>
                    <span>{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!newComment.trim()) return
                await addComment(task.id, newComment.trim())
                setNewComment("")
              }}
              className="flex flex-col gap-2 mt-2"
            >
              <textarea
                rows={2}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Leave an update or note..."
                className="bg-zinc-950 border border-zinc-800/80 rounded p-2 text-zinc-200 outline-none focus:border-indigo-500 resize-none"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="self-end px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded font-medium transition-colors"
              >
                Comment
              </button>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/40 flex items-center justify-between">
          <button
            onClick={async () => {
              if (confirm("Archive this task?")) {
                await archiveTask(task.id)
                onClose()
              }
            }}
            className="text-zinc-400 hover:text-amber-300 transition-colors"
          >
            Archive Task
          </button>
          <button
            onClick={async () => {
              if (confirm("Permanently delete this task?")) {
                await deleteTask(task.id)
                onClose()
              }
            }}
            className="text-zinc-500 hover:text-rose-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}