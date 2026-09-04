"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AlertCircle, ArrowUp, ArrowRight, ArrowDown, Calendar } from "lucide-react"

export type TagItem = {
  id: string
  name: string
  color: string
}

export type TaskItem = {
  id: string
  title: string
  description: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  dueDate?: string | Date | null
  tags?: TagItem[]
  order: number
  columnId: string
}

const priorityIcons = {
  URGENT: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
  HIGH: <ArrowUp className="w-3.5 h-3.5 text-amber-500" />,
  MEDIUM: <ArrowRight className="w-3.5 h-3.5 text-blue-500" />,
  LOW: <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />,
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
    disabled: isOverlay,
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  const due = formatDueDate(task.dueDate)

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-24 rounded-md border border-dashed border-zinc-700 bg-zinc-900/40 opacity-40"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onTaskClick && onTaskClick(task)}
      className={`group bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-lg p-3 flex flex-col gap-2.5 select-none touch-none cursor-pointer transition-all shadow-sm ${
        isOverlay ? "shadow-2xl ring-2 ring-blue-500/50 rotate-1 bg-zinc-850 cursor-grabbing" : ""
      }`}
    >
      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {task.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10"
              style={{ backgroundColor: `${tag.color}25`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <span className="text-sm font-medium text-zinc-100 group-hover:text-blue-400 transition-colors leading-snug">
        {task.title}
      </span>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Meta Row */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400">
          {priorityIcons[task.priority]}
          <span className="capitalize text-[11px] font-medium">
            {task.priority.toLowerCase()}
          </span>
        </div>

        {due && (
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[11px] font-mono ${due.className}`}>
            <Calendar className="w-3 h-3" />
            <span>{due.text}</span>
          </div>
        )}
      </div>
    </div>
  )
}