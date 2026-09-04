"use client"

import React from "react"
import { X, History, ArrowRightCircle, PlusCircle, CheckCircle2, Trash2, Edit3, FolderPlus } from "lucide-react"

export type ActivityItem = {
  id: string
  action: string
  details: string
  createdAt: string | Date
}

const actionIcons: Record<string, React.ReactNode> = {
  TASK_CREATED: <PlusCircle className="w-4 h-4 text-blue-400" />,
  TASK_MOVED: <ArrowRightCircle className="w-4 h-4 text-purple-400" />,
  TASK_UPDATED: <Edit3 className="w-4 h-4 text-amber-400" />,
  TASK_DELETED: <Trash2 className="w-4 h-4 text-red-400" />,
  SUBTASK_CREATED: <PlusCircle className="w-4 h-4 text-teal-400" />,
  SUBTASK_TOGGLED: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  SUBTASK_DELETED: <Trash2 className="w-4 h-4 text-zinc-500" />,
  COLUMN_CREATED: <FolderPlus className="w-4 h-4 text-indigo-400" />,
  COLUMN_RENAMED: <Edit3 className="w-4 h-4 text-zinc-400" />,
  COLUMN_DELETED: <Trash2 className="w-4 h-4 text-red-500" />,
}

function formatRelativeTime(dateInput: string | Date) {
  const date = new Date(dateInput)
  const diffInSec = Math.floor((Date.now() - date.getTime()) / 1000)

  if (diffInSec < 60) return "just now"
  const diffInMin = Math.floor(diffInSec / 60)
  if (diffInMin < 60) return `${diffInMin}m ago`
  const diffInHours = Math.floor(diffInMin / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function ActivityLogDrawer({
  isOpen,
  onClose,
  activities,
}: {
  isOpen: boolean
  onClose: () => void
  activities: ActivityItem[]
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Activity Log</h2>
            <span className="text-[11px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
              {activities.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 divide-y divide-zinc-800/40">
          {activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500">
              No recent activity recorded yet.
            </div>
          ) : (
            activities.map((item) => (
              <div key={item.id} className="py-3 flex items-start gap-3">
                <span className="mt-0.5 shrink-0">
                  {actionIcons[item.action] || <History className="w-4 h-4 text-zinc-400" />}
                </span>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-xs text-zinc-200 leading-snug break-words">
                    {item.details}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}