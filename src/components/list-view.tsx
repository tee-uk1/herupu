"use client"

import React from "react"
import { ColumnItem } from "./kanban-board"
import { TaskItem } from "./kanban-card"
import { AlertCircle, ArrowUp, ArrowRight, ArrowDown, Calendar, CheckSquare, MessageSquare, Globe2 } from "lucide-react"

const priorityConfig = {
  URGENT: { label: "Urgent", color: "text-red-500", icon: AlertCircle },
  HIGH: { label: "High", color: "text-amber-500", icon: ArrowUp },
  MEDIUM: { label: "Medium", color: "text-blue-500", icon: ArrowRight },
  LOW: { label: "Low", color: "text-zinc-400", icon: ArrowDown },
}

export function ListView({
  initialColumns,
  onTaskClick,
}: {
  initialColumns: ColumnItem[]
  onTaskClick?: (task: TaskItem) => void
}) {
  return (
    <div className="flex flex-col gap-6">
      {initialColumns.map((column) => (
        <div key={column.id} className="flex flex-col gap-2">
          {/* Section Header */}
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
              {column.name}
            </span>
            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full font-mono">
              {column.tasks.length}
            </span>
          </div>

          {/* Task Rows */}
          <div className="border border-zinc-800/80 rounded-lg overflow-hidden divide-y divide-zinc-800/60 bg-zinc-900/40">
            {column.tasks.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">No tasks in this stage</div>
            ) : (
              column.tasks.map((task) => {
                const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM
                const PriorityIcon = priority.icon
                const totalSubtasks = task.subtasks?.length ?? 0
                const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length ?? 0
                const commentCount = task.comments?.length ?? 0

                return (
                  <div
                    key={task.id}
                    onClick={() => onTaskClick?.(task)}
                    className="p-3 flex items-center justify-between gap-4 hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className={priority.color} title={priority.label}>
                        <PriorityIcon className="w-4 h-4 shrink-0" />
                      </span>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          {task.originBoardName && (
                            <span className="text-[10px] text-purple-400 bg-purple-950/50 border border-purple-800/60 px-1.5 py-0.2 rounded font-medium flex items-center gap-1 shrink-0">
                              <Globe2 className="w-2.5 h-2.5" />
                              {task.originBoardName}
                            </span>
                          )}
                          <span className="text-xs font-medium text-zinc-100 group-hover:text-blue-400 transition-colors truncate">
                            {task.title}
                          </span>
                          {task.isPinnedToMaster && (
                            <Globe2 className="w-3.5 h-3.5 text-purple-400 shrink-0" title="Synced to Master" />
                          )}
                        </div>

                        {task.description && (
                          <span className="text-[11px] text-zinc-400 truncate max-w-md">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-3 shrink-0">
                      {totalSubtasks > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                          <CheckSquare className="w-3 h-3 text-zinc-500" />
                          {completedSubtasks}/{totalSubtasks}
                        </span>
                      )}

                      {commentCount > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                          <MessageSquare className="w-3 h-3 text-zinc-500" />
                          {commentCount}
                        </span>
                      )}

                      {task.tags && task.tags.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1">
                          {task.tags.slice(0, 2).map((t) => (
                            <span
                              key={t.id}
                              className="text-[10px] px-1.5 py-0.5 rounded-full border border-white/10"
                              style={{ backgroundColor: `${t.color}20`, color: t.color }}
                            >
                              {t.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {task.dueDate && (
                        <span className="hidden md:flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}

                      {task.assignedTo ? (
                        <div
                          className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center text-[10px] font-bold"
                          title={`Assigned to ${task.assignedTo.name || task.assignedTo.email}`}
                        >
                          {(task.assignedTo.name || task.assignedTo.email).slice(0, 2).toUpperCase()}
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-[9px] text-zinc-600 font-mono">
                          -
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      ))}
    </div>
  )
}