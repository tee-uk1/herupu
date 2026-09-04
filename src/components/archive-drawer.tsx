"use client"

import React from "react"
import { Archive, X, RotateCcw, Trash2, Calendar } from "lucide-react"
import { TaskItem } from "./kanban-card"
import { unarchiveTask, deleteTask } from "@/app/actions"

export function ArchiveDrawer({
  isOpen,
  onClose,
  archivedTasks,
}: {
  isOpen: boolean
  onClose: () => void
  archivedTasks: TaskItem[]
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Archived Tasks</h2>
            <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
              {archivedTasks.length}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 divide-y divide-zinc-800/40">
          {archivedTasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">No archived tasks found.</div>
          ) : (
            archivedTasks.map((task) => (
              <div key={task.id} className="py-3 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-xs font-medium text-zinc-200 line-through text-zinc-400">{task.title}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">HERUPU-{task.id.slice(-4)} • {task.priority}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => unarchiveTask(task.id)}
                    className="p-1 text-zinc-400 hover:text-blue-400 hover:bg-zinc-800 rounded transition-colors"
                    title="Restore to Board"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Permanently delete this task?")) deleteTask(task.id)
                    }}
                    className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                    title="Permanently Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}