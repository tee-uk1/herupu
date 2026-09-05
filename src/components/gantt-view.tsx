"use client"

import React, { useMemo, useState } from "react"
import { Calendar, ChevronLeft, ChevronRight, Clock, AlertCircle } from "lucide-react"

interface TaskItem {
  id: string
  title: string
  priority: string
  startDate?: string | Date | null
  dueDate?: string | Date | null
  createdAt: string | Date
  assignedTo?: { name?: string | null; image?: string | null } | null
  column?: { name: string } | null
}

interface ColumnWithTasks {
  id: string
  name: string
  tasks: TaskItem[]
}

const PRIORITY_THEME: Record<string, { bar: string; text: string; dot: string }> = {
  URGENT: { bar: "bg-rose-500/30 border-rose-500/60 text-rose-200", text: "text-rose-400", dot: "bg-rose-500" },
  HIGH: { bar: "bg-amber-500/30 border-amber-500/60 text-amber-200", text: "text-amber-400", dot: "bg-amber-500" },
  MEDIUM: { bar: "bg-indigo-500/30 border-indigo-500/60 text-indigo-200", text: "text-indigo-400", dot: "bg-indigo-500" },
  LOW: { bar: "bg-emerald-500/30 border-emerald-500/60 text-emerald-200", text: "text-emerald-400", dot: "bg-emerald-500" },
}

export function GanttView({ columns = [] }: { columns: ColumnWithTasks[] }) {
  const [dayOffset, setDayOffset] = useState(0)
  const totalDays = 14

  // Flatten active tasks
  const allTasks = useMemo(() => {
    return columns.flatMap((col) =>
      (col.tasks || []).map((t) => ({
        ...t,
        columnName: col.name,
      }))
    )
  }, [columns])

  // Generate date timeline headers starting from today + dayOffset
  const timelineDates = useMemo(() => {
    const dates: Date[] = []
    const base = new Date()
    base.setHours(0, 0, 0, 0)
    base.setDate(base.getDate() + dayOffset)

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      dates.push(d)
    }
    return dates
  }, [dayOffset, totalDays])

  const windowStart = timelineDates[0]
  const windowEnd = timelineDates[timelineDates.length - 1]

  const calculateTaskPosition = (task: TaskItem) => {
    // Determine start & end bounds; fall back to createdAt -> +2 days if unset
    const created = new Date(task.createdAt)
    const rawStart = task.startDate ? new Date(task.startDate) : created
    const rawEnd = task.dueDate ? new Date(task.dueDate) : new Date(rawStart.getTime() + 2 * 24 * 60 * 60 * 1000)

    const start = rawStart < rawEnd ? rawStart : rawEnd
    const end = rawEnd >= rawStart ? rawEnd : rawStart

    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    const msPerDay = 1000 * 60 * 60 * 24
    const offsetDays = Math.max(0, (start.getTime() - windowStart.getTime()) / msPerDay)
    const durationDays = Math.max(1, (end.getTime() - start.getTime()) / msPerDay)

    // Check if task is outside current view window
    if (end < windowStart || start > windowEnd) {
      return null
    }

    const leftPercent = Math.min(100, Math.max(0, (offsetDays / totalDays) * 100))
    const widthPercent = Math.min(100 - leftPercent, Math.max(3.5, (durationDays / totalDays) * 100))

    return { leftPercent, widthPercent, start, end }
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0b0e] text-zinc-200">
      {/* Timeline Controls Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800/50 bg-[#090a0d]/60 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">Gantt Timeline</span>
          <span className="text-xs text-zinc-500 font-mono">({allTasks.length} tasks)</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDayOffset((prev) => prev - 7)}
            className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Previous week"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setDayOffset(0)}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-800 hover:bg-zinc-800/60 text-zinc-300 transition-colors"
          >
            Today
          </button>

          <button
            onClick={() => setDayOffset((prev) => prev + 7)}
            className="p-1.5 rounded-lg border border-zinc-800 hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Next week"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Gantt Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Task Names & Meta */}
        <div className="w-72 border-r border-zinc-800/60 flex flex-col shrink-0 bg-[#090a0d]/40">
          <div className="h-10 border-b border-zinc-800/60 px-4 flex items-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Task Name
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60">
            {allTasks.map((task) => {
              const theme = PRIORITY_THEME[task.priority] || PRIORITY_THEME.MEDIUM
              return (
                <div key={task.id} className="h-12 px-4 flex items-center justify-between hover:bg-zinc-900/40 transition-colors">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme.dot}`} />
                    <span className="text-xs font-medium text-zinc-200 truncate">{task.title}</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800/60 shrink-0">
                    {task.columnName}
                  </span>
                </div>
              )
            })}
            {allTasks.length === 0 && (
              <div className="p-6 text-center text-xs text-zinc-500">No tasks on this board yet.</div>
            )}
          </div>
        </div>

        {/* Right Side: Timeline Grid & Horizontal Bars */}
        <div className="flex-1 flex flex-col overflow-x-auto">
          {/* Day Headers */}
          <div className="h-10 border-b border-zinc-800/60 grid grid-cols-14 shrink-0 bg-[#090a0d]/60">
            {timelineDates.map((date, idx) => {
              const isToday = new Date().toDateString() === date.toDateString()
              return (
                <div
                  key={idx}
                  className={`border-r border-zinc-800/40 px-1 flex flex-col items-center justify-center text-center ${
                    isToday ? "bg-indigo-500/10" : ""
                  }`}
                >
                  <span className="text-[10px] font-mono uppercase text-zinc-500">
                    {date.toLocaleDateString("en-US", { weekday: "narrow" })}
                  </span>
                  <span className={`text-[11px] font-medium leading-none ${isToday ? "text-indigo-400 font-bold" : "text-zinc-300"}`}>
                    {date.getDate()}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Timeline Task Bars Canvas */}
          <div className="flex-1 overflow-y-auto relative divide-y divide-zinc-900/60">
            {/* Vertical grid lines background */}
            <div className="absolute inset-0 grid grid-cols-14 pointer-events-none">
              {timelineDates.map((date, idx) => {
                const isToday = new Date().toDateString() === date.toDateString()
                return (
                  <div
                    key={idx}
                    className={`border-r border-zinc-800/20 h-full ${isToday ? "bg-indigo-500/[0.03]" : ""}`}
                  />
                )
              })}
            </div>

            {/* Task Row Bars */}
            {allTasks.map((task) => {
              const pos = calculateTaskPosition(task)
              const theme = PRIORITY_THEME[task.priority] || PRIORITY_THEME.MEDIUM

              return (
                <div key={task.id} className="h-12 relative flex items-center px-1">
                  {pos ? (
                    <div
                      style={{
                        left: `${pos.leftPercent}%`,
                        width: `${pos.widthPercent}%`,
                      }}
                      title={`${task.title} (${pos.start.toLocaleDateString()} - ${pos.end.toLocaleDateString()})`}
                      className={`absolute h-7 rounded-lg border shadow-sm flex items-center px-2.5 transition-all truncate group cursor-pointer hover:brightness-110 ${theme.bar}`}
                    >
                      <span className="text-[11px] font-medium truncate leading-none">
                        {task.title}
                      </span>
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-600 italic pl-3 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-700" />
                      Outside current range
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}