"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AlertCircle, ArrowUp, ArrowRight, ArrowDown, Calendar, CheckSquare, MessageSquare, Globe2 } from "lucide-react"

export type UserItem = {
  id: string
  name: string | null
  email: string
  role: "ADMIN" | "MEMBER"
}

export type TagItem = {
  id: string
  name: string
  color: string
}

export type SubtaskItem = {
  id: string
  title: string
  isCompleted: boolean
}

export type CommentItem = {
  id: string
  content: string
  authorName: string
  authorId?: string | null
  createdAt: string | Date
}

export type TaskItem = {
  id: string
  title: string
  description: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  order: number
  columnId: string
  dueDate?: string | Date | null
  tags?: TagItem[]
  subtasks?: SubtaskItem[]
  comments?: CommentItem[]
  assignedToId?: string | null
  assignedTo?: UserItem | null
  isPinnedToMaster?: boolean
  originBoardName?: string
}

const priorityConfig = {
  URGENT: { label: "Urgent", color: "text-red-400", bg: "bg-red-950/40 border-red-800/60", icon: AlertCircle },
  HIGH: { label: "High", color: "text-amber-400", bg: "bg-amber-950/40 border-amber-800/60", icon: ArrowUp },
  MEDIUM: { label: "Medium", color: "text-blue-400", bg: "bg-blue-950/40 border-blue-800/60", icon: ArrowRight },
  LOW: { label: "Low", color: "text-zinc-400", bg: "bg-zinc-800/40 border-zinc-700/60", icon: ArrowDown },
}

function formatDueDate(dueDateInput: string | Date | null | undefined) {
  if (!dueDateInput) return null
  const date = new Date(dueDateInput)
  const now = new Date()
  const isOverdue = date < now
  const isSoon = date.getTime() - now.getTime() < 48 * 60 * 60 * 1000 && !isOverdue

  const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

  return {
    text: formatted,
    className: isOverdue
      ? "text-red-400 bg-red-950/60 border-red-800/80 font-semibold animate-pulse"
      : isSoon
      ? "text-amber-300 bg-amber-950/50 border-amber-700/60 font-medium"
      : "text-zinc-400 bg-zinc-800/60 border-zinc-700/50",
  }
}

export function KanbanCard({
  task,
  isOverlay = false,
  onTaskClick,
}: {
  task: TaskItem
  isOverlay?: boolean
  onTaskClick?: (task: TaskItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "Task", task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM
  const PriorityIcon = priority.icon
  const dueDateInfo = formatDueDate(task.dueDate)

  const totalSubtasks = task.subtasks?.length ?? 0
  const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length ?? 0
  const progressPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0
  const commentCount = task.comments?.length ?? 0

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick?.(task)}
      className={`group p-3.5 bg-zinc-900/70 hover:bg-zinc-900 border rounded-lg text-sm cursor-grab active:cursor-grabbing transition-all select-none flex flex-col gap-2.5 shadow-xs hover:shadow-lg hover:border-zinc-700/80 ${
        isDragging ? "opacity-30 border-dashed border-indigo-500 scale-95" : "border-zinc-800/70"
      } ${isOverlay ? "shadow-2xl ring-2 ring-indigo-500/50 rotate-1 cursor-grabbing bg-zinc-900 border-zinc-700" : ""}`}
    >
      {task.originBoardName && (
        <div className="flex items-center gap-1 text-[9px] text-purple-300 bg-purple-950/50 border border-purple-800/50 px-1.5 py-0.5 rounded w-fit font-mono font-medium">
          <Globe2 className="w-2.5 h-2.5 text-purple-400" />
          <span>{task.originBoardName}</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-zinc-100 group-hover:text-white leading-snug tracking-tight">
          {task.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {task.isPinnedToMaster && (
            <Globe2 className="w-3.5 h-3.5 text-purple-400" title="Rollup Synced" />
          )}
          <span className={`p-0.5 rounded ${priority.bg} ${priority.color}`} title={priority.label}>
            <PriorityIcon className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {task.description && (
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {totalSubtasks > 0 && (
        <div className="flex flex-col gap-1 pt-0.5">
          <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
            <span className="flex items-center gap-1">
              <CheckSquare className="w-3 h-3 text-zinc-400" />
              {completedSubtasks}/{totalSubtasks}
            </span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercent === 100 ? "bg-emerald-500" : "bg-indigo-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 mt-auto border-t border-zinc-800/60">
        <div className="flex flex-wrap items-center gap-1.5">
          {task.assignedTo && (
            <div
              className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-700 to-indigo-600 text-white border border-indigo-400/40 flex items-center justify-center text-[9px] font-bold shadow-xs"
              title={`Assigned to ${task.assignedTo.name || task.assignedTo.email}`}
            >
              {(task.assignedTo.name || task.assignedTo.email).slice(0, 2).toUpperCase()}
            </div>
          )}

          {task.tags?.map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md border"
              style={{
                backgroundColor: `${tag.color}15`,
                borderColor: `${tag.color}35`,
                color: tag.color,
              }}
            >
              {tag.name}
            </span>
          ))}

          {commentCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400">
              <MessageSquare className="w-3 h-3" />
              {commentCount}
            </span>
          )}
        </div>

        {dueDateInfo && (
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-mono shrink-0 ml-auto ${dueDateInfo.className}`}
          >
            <Calendar className="w-2.5 h-2.5" />
            {dueDateInfo.text}
          </span>
        )}
      </div>
    </div>
  )
}