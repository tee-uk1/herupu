"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AlertCircle, ArrowUp, ArrowRight, ArrowDown, Calendar, CheckSquare, MessageSquare } from "lucide-react"

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
  author: string
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
}

const priorityConfig = {
  URGENT: { label: "Urgent", color: "text-red-500", icon: AlertCircle },
  HIGH: { label: "High", color: "text-amber-500", icon: ArrowUp },
  MEDIUM: { label: "Medium", color: "text-blue-500", icon: ArrowRight },
  LOW: { label: "Low", color: "text-zinc-400", icon: ArrowDown },
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
      ? "text-red-400 bg-red-950/40 border-red-900/60"
      : isSoon
      ? "text-amber-400 bg-amber-950/40 border-amber-900/60"
      : "text-zinc-400 bg-zinc-800/80 border-zinc-700/60",
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
      className={`p-3 bg-zinc-800/90 rounded-md border text-sm cursor-grab active:cursor-grabbing hover:border-zinc-600 transition-all select-none flex flex-col gap-2 ${
        isDragging ? "opacity-30 border-dashed border-blue-500" : "border-zinc-700/80"
      } ${isOverlay ? "shadow-2xl ring-2 ring-blue-500/50 rotate-1 cursor-grabbing bg-zinc-800" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-zinc-100 leading-snug">{task.title}</span>
        <span className={priority.color} title={priority.label}>
          <PriorityIcon className="w-4 h-4 shrink-0 mt-0.5" />
        </span>
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
          <div className="h-1 w-full bg-zinc-700/60 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progressPercent === 100 ? "bg-emerald-500" : "bg-blue-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 mt-auto border-t border-zinc-700/40">
        <div className="flex flex-wrap items-center gap-1.5">
          {task.tags?.map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-white/10"
              style={{ backgroundColor: `${tag.color}25`, color: tag.color }}
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
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono shrink-0 ml-auto ${dueDateInfo.className}`}
          >
            <Calendar className="w-2.5 h-2.5" />
            {dueDateInfo.text}
          </span>
        )}
      </div>
    </div>
  )
}