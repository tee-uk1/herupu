"use client"

import React from "react"
import { AlertCircle, ArrowUp, ArrowRight, ArrowDown, Calendar, Plus } from "lucide-react"
import { TaskItem, TagItem } from "./kanban-card"
import { ColumnItem } from "./kanban-board"
import { InlineTaskCreator } from "./inline-task-creator"

const priorityIcons = {
  URGENT: <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />,
  HIGH: <ArrowUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
  MEDIUM: <ArrowRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />,
  LOW: <ArrowDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />,
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

export function TaskListView({
  columns,
  onTaskClick,
}: {
  columns: ColumnItem[]
  onTaskClick: (task: TaskItem) => void
}) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl">
      {columns.map((column) => (
        <div key={column.id} className="flex flex-col bg-zinc-900/40 border border-zinc-800/80 rounded-lg overflow-hidden">
          {/* Group Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-200 tracking-wide uppercase">
                {column.name}
              </span>
              <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                {column.tasks.length}
              </span>
            </div>
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-[11px] font-medium text-zinc-500 border-b border-zinc-800/60 bg-zinc-950/30">
            <div className="col-span-6">Name</div>
            <div className="col-span-3">Tags</div>
            <div className="col-span-1 text-center">Priority</div>
            <div className="col-span-2 text-right">Due Date</div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-zinc-800/50">
            {column.tasks.map((task) => {
              const due = formatDueDate(task.dueDate)

              return (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="grid grid-cols-12 gap-2 items-center px-4 py-2.5 hover:bg-zinc-800/40 cursor-pointer transition-colors text-xs group"
                >
                  {/* Name & ID */}
                  <div className="col-span-6 flex items-center gap-2 overflow-hidden">
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                      HERUPU-{task.id.slice(-4)}
                    </span>
                    <span className="text-zinc-200 font-medium truncate group-hover:text-blue-400 transition-colors">
                      {task.title}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="col-span-3 flex flex-wrap gap-1 overflow-hidden">
                    {task.tags && task.tags.length > 0 ? (
                      task.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10 shrink-0"
                          style={{ backgroundColor: `${tag.color}25`, color: tag.color }}
                        >
                          {tag.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-600 text-[11px]">—</span>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="col-span-1 flex items-center justify-center">
                    <span title={task.priority}>
                      {priorityIcons[task.priority]}
                    </span>
                  </div>

                  {/* Due Date */}
                  <div className="col-span-2 flex justify-end">
                    {due ? (
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono ${due.className}`}>
                        <Calendar className="w-3 h-3" />
                        {due.text}
                      </span>
                    ) : (
                      <span className="text-zinc-600 text-[11px]">—</span>
                    )}
                  </div>
                </div>
              )
            })}

            {column.tasks.length === 0 && (
              <div className="px-4 py-3 text-xs text-zinc-500 italic">
                No tasks in this status
              </div>
            )}
          </div>

          {/* Quick-add in List Row */}
          <div className="p-2 border-t border-zinc-800/40 bg-zinc-950/20">
            <InlineTaskCreator columnId={column.id} />
          </div>
        </div>
      ))}
    </div>
  )
}