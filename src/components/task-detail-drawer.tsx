"use client"

import React, { useState, useEffect } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { Priority } from "@prisma/client"
import { TaskItem } from "./kanban-card"
import { ColumnItem } from "./kanban-board"
import { updateTask, deleteTask, getAllTags, createTag } from "@/app/actions"
import { Button } from "./ui/button"
import {
  X,
  ChevronDown,
  Trash2,
  AlertCircle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Check,
  Loader2,
  Calendar,
  Tag as TagIcon,
  PlusCircle
} from "lucide-react"

type TaskDetailDrawerProps = {
  task: TaskItem | null
  onClose: () => void
  columns: ColumnItem[]
  onUpdateTask: (taskId: string, data: Partial<TaskItem>) => void
  onDeleteTask: (taskId: string) => void
}

const priorityIcons = {
  URGENT: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
  HIGH: <ArrowUp className="w-3.5 h-3.5 text-amber-500" />,
  MEDIUM: <ArrowRight className="w-3.5 h-3.5 text-blue-500" />,
  LOW: <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />,
}

const tagColors = [
  { value: "#3b82f6", label: "Blue" },
  { value: "#ef4444", label: "Red" },
  { value: "#22c55e", label: "Green" },
  { value: "#eab308", label: "Yellow" },
  { value: "#a855f7", label: "Purple" },
  { value: "#f97316", label: "Orange" },
  { value: "#ec4899", label: "Pink" },
]

export function TaskDetailDrawer({
  task,
  onClose,
  columns,
  onUpdateTask,
  onDeleteTask,
}: TaskDetailDrawerProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [availableTags, setAvailableTags] = useState<{ id: string; name: string; color: string }[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3b82f6")
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [prevTaskId, setPrevTaskId] = useState<string | null>(null)

  // Sync state when task changes (Derived state during render)
  if (task && task.id !== prevTaskId) {
    setPrevTaskId(task.id)
    setTitle(task.title)
    setDescription(task.description || "")
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "")
    setSelectedTagIds(task.tags?.map((t) => t.id) || [])
    setSaveStatus("idle")
    setErrorMessage(null)
    setIsConfirmingDelete(false)
  }

  // Fetch available tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      const res = await getAllTags()
      if (res.success && res.tags) {
        setAvailableTags(res.tags)
      }
    }
    fetchTags()
  }, [])

  if (!task) return null

  const handleSaveField = async (field: "title" | "description", value: string) => {
    const trimmedValue = value.trim()

    if (field === "title" && !trimmedValue) {
      setTitle(task.title)
      setErrorMessage("Title cannot be empty")
      setSaveStatus("error")
      return
    }

    const originalValue = field === "title" ? task.title : (task.description || "")
    if (trimmedValue === originalValue) return

    setSaveStatus("saving")
    setErrorMessage(null)

    onUpdateTask(task.id, { [field]: field === "description" ? (trimmedValue || null) : trimmedValue })

    try {
      const res = await updateTask(task.id, {
        [field]: field === "description" ? (trimmedValue || null) : trimmedValue,
      })

      if (res.success) {
        setSaveStatus("saved")
        setTimeout(() => {
          setSaveStatus((prev) => (prev === "saved" ? "idle" : prev))
        }, 2000)
      } else {
        setErrorMessage(res.error || "Failed to save")
        setSaveStatus("error")
        onUpdateTask(task.id, { [field]: originalValue })
        if (field === "title") setTitle(task.title)
        else setDescription(task.description || "")
      }
    } catch {
      setErrorMessage("Network error, failed to save")
      setSaveStatus("error")
      onUpdateTask(task.id, { [field]: originalValue })
      if (field === "title") setTitle(task.title)
      else setDescription(task.description || "")
    }
  }

  const handlePriorityChange = async (newPriority: Priority) => {
    if (newPriority === task.priority) return

    setSaveStatus("saving")
    onUpdateTask(task.id, { priority: newPriority })

    try {
      const res = await updateTask(task.id, { priority: newPriority })
      if (res.success) {
        setSaveStatus("saved")
        setTimeout(() => {
          setSaveStatus((prev) => (prev === "saved" ? "idle" : prev))
        }, 2000)
      } else {
        setErrorMessage(res.error || "Failed to update priority")
        setSaveStatus("error")
        onUpdateTask(task.id, { priority: task.priority })
      }
    } catch {
      setErrorMessage("Failed to update priority")
      setSaveStatus("error")
      onUpdateTask(task.id, { priority: task.priority })
    }
  }

  const handleColumnChange = async (newColumnId: string) => {
    if (newColumnId === task.columnId) return

    setSaveStatus("saving")
    onUpdateTask(task.id, { columnId: newColumnId })

    try {
      const res = await updateTask(task.id, { columnId: newColumnId })
      if (res.success) {
        setSaveStatus("saved")
        setTimeout(() => {
          setSaveStatus((prev) => (prev === "saved" ? "idle" : prev))
        }, 2000)
      } else {
        setErrorMessage(res.error || "Failed to move column")
        setSaveStatus("error")
        onUpdateTask(task.id, { columnId: task.columnId })
      }
    } catch {
      setErrorMessage("Failed to move column")
      setSaveStatus("error")
      onUpdateTask(task.id, { columnId: task.columnId })
    }
  }

  const handleDueDateChange = async (newDateStr: string) => {
    setDueDate(newDateStr)
    setSaveStatus("saving")

    const finalDate = newDateStr ? new Date(newDateStr) : null

    onUpdateTask(task.id, { dueDate: finalDate })

    try {
      const res = await updateTask(task.id, { dueDate: finalDate })
      if (res.success) {
        setSaveStatus("saved")
        setTimeout(() => {
          setSaveStatus((prev) => (prev === "saved" ? "idle" : prev))
        }, 2000)
      } else {
        setErrorMessage(res.error || "Failed to update due date")
        setSaveStatus("error")
        onUpdateTask(task.id, { dueDate: task.dueDate })
      }
    } catch {
      setErrorMessage("Failed to update due date")
      setSaveStatus("error")
      onUpdateTask(task.id, { dueDate: task.dueDate })
    }
  }

  const handleToggleTag = async (tagId: string) => {
    const isSelected = selectedTagIds.includes(tagId)
    const newTagIds = isSelected
      ? selectedTagIds.filter((id) => id !== tagId)
      : [...selectedTagIds, tagId]

    setSelectedTagIds(newTagIds)
    setSaveStatus("saving")

    const selectedTagsFull = availableTags.filter((t) => newTagIds.includes(t.id))

    onUpdateTask(task.id, { tags: selectedTagsFull })

    try {
      const res = await updateTask(task.id, { tagIds: newTagIds })
      if (res.success) {
        setSaveStatus("saved")
        setTimeout(() => {
          setSaveStatus((prev) => (prev === "saved" ? "idle" : prev))
        }, 2000)
      } else {
        setErrorMessage(res.error || "Failed to update tags")
        setSaveStatus("error")
        onUpdateTask(task.id, { tags: task.tags })
        setSelectedTagIds(task.tags?.map((t) => t.id) || [])
      }
    } catch {
      setErrorMessage("Failed to update tags")
      setSaveStatus("error")
      onUpdateTask(task.id, { tags: task.tags })
      setSelectedTagIds(task.tags?.map((t) => t.id) || [])
    }
  }

  const handleCreateTag = async () => {
    const name = newTagName.trim()
    if (!name) return

    setIsCreatingTag(true)
    try {
      const res = await createTag(name, newTagColor)
      if (res.success && res.tag) {
        const updatedAvailable = [...availableTags.filter((t) => t.id !== res.tag!.id), res.tag!]
        setAvailableTags(updatedAvailable)
        setNewTagName("")

        const newTagIds = [...selectedTagIds, res.tag!.id]
        setSelectedTagIds(newTagIds)
        setSaveStatus("saving")

        const selectedTagsFull = updatedAvailable.filter((t) => newTagIds.includes(t.id))
        onUpdateTask(task.id, { tags: selectedTagsFull })

        const updateRes = await updateTask(task.id, { tagIds: newTagIds })
        if (updateRes.success) {
          setSaveStatus("saved")
          setTimeout(() => {
            setSaveStatus((prev) => (prev === "saved" ? "idle" : prev))
          }, 2000)
        } else {
          setErrorMessage(updateRes.error || "Failed to link new tag")
          setSaveStatus("error")
        }
      }
    } catch {
      console.error("Failed to create tag")
    } finally {
      setIsCreatingTag(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setSaveStatus("saving")

    onDeleteTask(task.id)
    onClose()

    try {
      const res = await deleteTask(task.id)
      if (!res.success) {
        console.error("Delete failed on server:", res.error)
      }
    } catch (err) {
      console.error("Network error deleting task:", err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog.Root open={!!task} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity z-50 duration-200" />

        <Dialog.Popup className="fixed right-0 top-0 bottom-0 h-full w-full max-w-xl bg-zinc-900 border-l border-zinc-800/80 shadow-2xl z-50 outline-none flex flex-col transition-transform duration-250 data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full ease-out">
          {/* Header row */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80">
            <div className="flex items-center gap-3">
              {/* Status / Column Selector */}
              <div className="relative flex items-center">
                <select
                  value={task.columnId}
                  onChange={(e) => handleColumnChange(e.target.value)}
                  className="appearance-none bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/50 text-zinc-200 text-xs font-semibold pl-3 pr-8 py-1.5 rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-wider"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id} className="bg-zinc-900 text-zinc-300 normal-case">
                      {col.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 pointer-events-none" />
              </div>

              {/* Priority Selector */}
              <div className="relative flex items-center gap-2 bg-zinc-800/50 border border-zinc-800 pl-3 pr-2 py-1.5 rounded-full">
                {priorityIcons[task.priority]}
                <div className="relative flex items-center">
                  <select
                    value={task.priority}
                    onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                    className="appearance-none bg-transparent text-zinc-200 text-xs font-semibold pr-6 cursor-pointer focus:outline-none capitalize"
                  >
                    <option value="LOW" className="bg-zinc-900 text-zinc-400 normal-case">Low</option>
                    <option value="MEDIUM" className="bg-zinc-900 text-blue-400 normal-case">Medium</option>
                    <option value="HIGH" className="bg-zinc-900 text-amber-500 normal-case">High</option>
                    <option value="URGENT" className="bg-zinc-900 text-red-500 normal-case">Urgent</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-zinc-400 absolute right-0 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Saving status indicator */}
              <div className="mr-2">
                {saveStatus === "saving" && (
                  <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-zinc-500" />
                    <span>Saving...</span>
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="text-[11px] text-emerald-500 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Saved</span>
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="text-[11px] text-red-400 flex items-center gap-1" title={errorMessage || ""}>
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>Error</span>
                  </span>
                )}
              </div>

              {/* Inline Delete Button with Confirm state */}
              {isConfirmingDelete ? (
                <div className="flex items-center gap-1.5 bg-red-950/20 border border-red-900/40 p-1 rounded-lg">
                  <span className="text-[10px] text-red-400 px-1 font-semibold select-none">Delete?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    disabled={isDeleting}
                    className="bg-zinc-800 hover:bg-zinc-750 text-zinc-300 text-[10px] px-2 py-1 rounded cursor-pointer transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="p-1.5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                  title="Delete Task"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              )}

              {/* Close Drawer Button */}
              <Dialog.Close render={<Button type="button" variant="ghost" size="icon" className="cursor-pointer text-zinc-400 hover:text-zinc-200" />}>
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
            {errorMessage && saveStatus === "error" && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3.5 text-xs text-red-400 flex items-start gap-2.5">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold">Error saving changes</h4>
                  <p className="mt-0.5 text-red-400/80">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Title inline editor */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="drawer-task-title" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Task Title
              </label>
              <input
                id="drawer-task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleSaveField("title", title)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur()
                  }
                }}
                className="w-full bg-transparent border border-transparent hover:border-zinc-800 focus:border-zinc-700 focus:bg-zinc-950/40 rounded-lg px-2.5 py-1.5 -ml-2.5 text-xl font-bold text-zinc-100 placeholder-zinc-600 focus:outline-none transition-all"
                placeholder="Task title..."
              />
            </div>

            {/* Meta Parameters Panel (Due Date & Tags) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-800/15 border border-zinc-800/40 rounded-xl p-4 -ml-2.5">
              {/* Due Date field */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 select-none">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Due Date</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => handleDueDateChange(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800/80 focus:border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-200 text-xs focus:outline-none transition-colors cursor-pointer w-full"
                  />
                  {dueDate && (
                    <button
                      type="button"
                      onClick={() => handleDueDateChange("")}
                      className="text-[10px] bg-zinc-950 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-750 text-zinc-400 hover:text-zinc-200 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all"
                      title="Clear due date"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Tags display field */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 select-none">
                  <TagIcon className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Attached Tags</span>
                </span>
                <div className="flex flex-wrap gap-1 max-h-[50px] overflow-y-auto">
                  {task.tags && task.tags.length > 0 ? (
                    task.tags.map((tag) => (
                      <span
                        key={tag.id}
                        style={{
                          backgroundColor: tag.color.startsWith("#") ? `${tag.color}15` : undefined,
                          color: tag.color,
                          borderColor: tag.color.startsWith("#") ? `${tag.color}30` : undefined,
                        }}
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wide select-none"
                      >
                        {tag.name.toUpperCase()}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-zinc-500 italic select-none">No tags</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tag Manager selection lists & creator */}
            <div className="bg-zinc-800/10 border border-zinc-800/30 rounded-xl p-4 -ml-2.5 flex flex-col gap-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1 select-none">
                Manage Tags
              </span>

              {availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto pr-1">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTag(tag.id)}
                        style={{
                          backgroundColor: isSelected ? `${tag.color}25` : undefined,
                          color: isSelected ? tag.color : undefined,
                          borderColor: isSelected ? `${tag.color}50` : undefined,
                        }}
                        className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer ${
                          isSelected
                            ? ""
                            : "bg-zinc-950 border-zinc-850/80 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        {tag.name.toUpperCase()}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-[10px] text-zinc-500 italic select-none">No tags created in workspace yet.</p>
              )}

              {/* Create Tag Inline Form */}
              <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/40 pt-3 mt-0.5">
                <input
                  type="text"
                  placeholder="New tag..."
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  disabled={isCreatingTag}
                  className="bg-zinc-950 border border-zinc-850/80 focus:border-zinc-700 rounded px-2 py-1 text-zinc-200 text-xs focus:outline-none transition-colors w-28"
                />
                <select
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  disabled={isCreatingTag}
                  className="bg-zinc-950 border border-zinc-850/80 focus:border-zinc-700 rounded px-1.5 py-1 text-zinc-300 text-xs focus:outline-none cursor-pointer"
                >
                  {tagColors.map((col) => (
                    <option key={col.value} value={col.value} style={{ color: col.value }}>
                      {col.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCreateTag}
                  disabled={isCreatingTag || !newTagName.trim()}
                  className="text-[10px] bg-zinc-950 hover:bg-zinc-800 border border-zinc-850/80 px-2.5 py-1 rounded font-semibold text-zinc-300 cursor-pointer flex items-center gap-1 transition-colors"
                >
                  {isCreatingTag ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3 text-zinc-400" />}
                  <span>Create & Link</span>
                </button>
              </div>
            </div>

            {/* Description inline editor */}
            <div className="flex-1 flex flex-col gap-1.5 mt-2">
              <label htmlFor="drawer-task-desc" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Description
              </label>
              <textarea
                id="drawer-task-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleSaveField("description", description)}
                className="flex-1 w-full bg-transparent border border-transparent hover:border-zinc-800 focus:border-zinc-700 focus:bg-zinc-950/40 rounded-lg px-2.5 py-1.5 -ml-2.5 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none transition-all resize-none min-h-[160px] leading-relaxed"
                placeholder="Add a detailed description for this task..."
              />
            </div>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
