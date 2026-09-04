"use client"

import React, { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { KanbanCard, TaskItem } from "./kanban-card"
import { Plus, MoreHorizontal, Edit2, Trash2 } from "lucide-react"
import { useRole } from "./role-context"
import { updateColumnName, deleteColumn } from "@/app/actions"

export type ColumnItem = {
  id: string
  name: string
  order: number
  tasks: TaskItem[]
}

function getColumnTone(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes("done") || lower.includes("shipped") || lower.includes("deployed")) {
    return {
      dot: "bg-emerald-400 shadow-emerald-500/40",
      pill: "text-emerald-300 bg-emerald-950/40 border-emerald-800/40",
    }
  }
  if (lower.includes("progress") || lower.includes("active") || lower.includes("dev")) {
    return {
      dot: "bg-amber-400 shadow-amber-500/40",
      pill: "text-amber-300 bg-amber-950/40 border-amber-800/40",
    }
  }
  if (lower.includes("triage") || lower.includes("urgent")) {
    return {
      dot: "bg-rose-400 shadow-rose-500/40",
      pill: "text-rose-300 bg-rose-950/40 border-rose-800/40",
    }
  }
  return {
    dot: "bg-indigo-400 shadow-indigo-500/40",
    pill: "text-indigo-300 bg-indigo-950/40 border-indigo-800/40",
  }
}

export function KanbanColumn({
  column,
  onTaskClick,
}: {
  column: ColumnItem
  onTaskClick?: (task: TaskItem) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "Column", column },
  })

  const { isAdmin } = useRole()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(column.name)
  const [menuOpen, setMenuOpen] = useState(false)

  const tone = getColumnTone(column.name)

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || name === column.name) {
      setIsEditing(false)
      return
    }
    await updateColumnName(column.id, name.trim())
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (confirm(`Delete column "${column.name}" and all its tasks?`)) {
      await deleteColumn(column.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 shrink-0 bg-[#0e1014]/60 backdrop-blur-md rounded-xl border transition-all duration-200 ${
        isOver
          ? "border-indigo-500/80 bg-[#12151c]/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
          : "border-white/[0.06] hover:border-white/[0.1] shadow-xs"
      }`}
    >
      {/* Column Header */}
      <div className="p-3.5 pb-2.5 flex items-center justify-between gap-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`w-2 h-2 rounded-full ${tone.dot} shadow-xs shrink-0`} />
          {isEditing ? (
            <form onSubmit={handleRename} className="flex-1">
              <input
                type="text"
                autoFocus
                value={name}
                onBlur={() => setIsEditing(false)}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/50 text-xs font-semibold text-zinc-100 px-2 py-1 rounded border border-indigo-500/50 outline-none"
              />
            </form>
          ) : (
            <span className="text-xs font-bold tracking-wider uppercase text-zinc-300 font-mono truncate">
              {column.name}
            </span>
          )}
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${tone.pill}`}>
            {column.tasks.length}
          </span>
        </div>

        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-zinc-500 hover:text-zinc-200 rounded-md hover:bg-white/[0.05] transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-6 w-32 bg-[#14171d] border border-white/[0.08] rounded-lg shadow-2xl p-1 z-30 flex flex-col gap-0.5 text-xs animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setIsEditing(true)
                    setMenuOpen(false)
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 text-zinc-300 hover:text-white hover:bg-white/[0.06] rounded transition-colors text-left"
                >
                  <Edit2 className="w-3 h-3 text-zinc-400" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    handleDelete()
                    setMenuOpen(false)
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 text-rose-400 hover:bg-rose-950/40 rounded transition-colors text-left"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 p-2.5 flex flex-col gap-2 min-h-[460px] overflow-y-auto">
        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onTaskClick={onTaskClick} />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/[0.05] rounded-lg p-6 text-zinc-600 text-xs">
            <span className="font-mono text-[11px] text-zinc-600">Drop here</span>
          </div>
        )}
      </div>
    </div>
  )
}