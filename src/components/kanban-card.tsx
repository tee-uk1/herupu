"use client"

import React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { AlertCircle, ArrowUp, ArrowRight, ArrowDown } from "lucide-react"

export type TaskItem = {
  id: string
  title: string
  description: string | null
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  order: number
  columnId: string
}

const priorityIcons = {
  URGENT: <AlertCircle className="w-3.5 h-3.5 text-red-500" />,
  HIGH: <ArrowUp className="w-3.5 h-3.5 text-amber-500" />,
  MEDIUM: <ArrowRight className="w-3.5 h-3.5 text-blue-500" />,
  LOW: <ArrowDown className="w-3.5 h-3.5 text-zinc-400" />,
}

export function KanbanCard({
  task,
  isOverlay = false,
}: {
  task: TaskItem
  isOverlay?: boolean
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
    data: {
      type: "Task",
      task,
    },
    disabled: isOverlay,
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="h-20 rounded-md border border-dashed border-zinc-700 bg-zinc-900/40 opacity-40"
      />
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700/60 rounded-md p-3 flex flex-col gap-2 select-none touch-none cursor-grab active:cursor-grabbing transition-colors ${
        isOverlay ? "shadow-2xl ring-2 ring-blue-500/50 rotate-1 bg-zinc-800" : ""
      }`}
    >
      <span className="text-sm font-medium text-zinc-100 leading-snug">
        {task.title}
      </span>
      {task.description && (
        <p className="text-xs text-zinc-400 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center gap-1.5 pt-1 text-xs text-zinc-400">
        {priorityIcons[task.priority]}
        <span className="capitalize text-[11px] font-medium">
          {task.priority.toLowerCase()}
        </span>
      </div>
    </div>
  )
}