"use client"

import React, { useState, useMemo, useEffect } from "react"
import { LayoutGrid, List, Command, History, Shield, ShieldAlert } from "lucide-react"
import { KanbanBoard, ColumnItem } from "./kanban-board"
import { TaskListView } from "./task-list-view"
import { TaskDetailDrawer } from "./task-detail-drawer"
import { TaskItem, TagItem } from "./kanban-card"
import { WorkspaceFilterBar, FilterState } from "./workspace-filter-bar"
import { CommandPalette } from "./command-palette"
import { ActivityLogDrawer, ActivityItem } from "./activity-log-drawer"

export function WorkspaceView({
  initialColumns,
  availableTags = [],
  activities = [],
}: {
  initialColumns: ColumnItem[]
  availableTags?: TagItem[]
  activities?: ActivityItem[]
}) {
  const [view, setView] = useState<"board" | "list">("board")
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [isPaletteOpen, setIsPaletteOpen] = useState(false)
  const [isActivityOpen, setIsActivityOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(true) // Defaults to Admin for your account
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priorities: [],
    tagIds: [],
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const allTasks = useMemo(() => {
    return initialColumns.flatMap((col) => col.tasks)
  }, [initialColumns])

  const filteredColumns = useMemo(() => {
    const query = filters.search.trim().toLowerCase()

    return initialColumns.map((col) => {
      const filteredTasks = col.tasks.filter((task) => {
        if (query) {
          const matchTitle = task.title.toLowerCase().includes(query)
          const matchDesc = task.description?.toLowerCase().includes(query)
          const matchId = `herupu-${task.id.slice(-4)}`.toLowerCase().includes(query)
          if (!matchTitle && !matchDesc && !matchId) return false
        }

        if (filters.priorities.length > 0) {
          if (!filters.priorities.includes(task.priority)) return false
        }

        if (filters.tagIds.length > 0) {
          const taskTagIds = task.tags?.map((t) => t.id) || []
          const hasMatchingTag = filters.tagIds.some((id) => taskTagIds.includes(id))
          if (!hasMatchingTag) return false
        }

        return true
      })

      return {
        ...col,
        tasks: filteredTasks,
      }
    })
  }, [initialColumns, filters])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 w-fit">
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === "board"
                  ? "bg-zinc-800 text-zinc-100 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>

            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === "list"
                  ? "bg-zinc-800 text-zinc-100 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* Admin Role Toggle Badge */}
          <button
            onClick={() => setIsAdmin((prev) => !prev)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isAdmin
                ? "bg-purple-950/40 border-purple-800/60 text-purple-300 hover:bg-purple-900/40"
                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
            }`}
            title="Click to toggle between Admin and Member mode"
          >
            {isAdmin ? <Shield className="w-3.5 h-3.5 text-purple-400" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            <span>{isAdmin ? "Admin Mode" : "Member Mode"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsActivityOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity</span>
          </button>

          <button
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
          >
            <Command className="w-3.5 h-3.5" />
            <span>Quick Actions</span>
            <kbd className="ml-1 text-[10px] font-mono bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-400">
              Ctrl+K
            </kbd>
          </button>
        </div>
      </div>

      <WorkspaceFilterBar
        filters={filters}
        onChange={setFilters}
        availableTags={availableTags}
      />

      {view === "board" ? (
        <KanbanBoard
          initialColumns={filteredColumns}
          availableTags={availableTags}
          isAdmin={isAdmin}
        />
      ) : (
        <TaskListView
          columns={filteredColumns}
          onTaskClick={(task) => setSelectedTask(task)}
        />
      )}

      <TaskDetailDrawer
        task={selectedTask}
        columns={initialColumns.map((c) => ({ id: c.id, name: c.name }))}
        availableTags={availableTags}
        onClose={() => setSelectedTask(null)}
      />

      <CommandPalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        tasks={allTasks}
        onSelectTask={(task) => setSelectedTask(task)}
        onSwitchView={(v) => setView(v)}
        onOpenCreateTask={() => {
          const btn = document.getElementById("header-create-task-btn")
          btn?.click()
        }}
      />

      <ActivityLogDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        activities={activities}
      />
    </div>
  )
}