"use client"

import React, { useState, useMemo } from "react"
import { LayoutGrid, List } from "lucide-react"
import { KanbanBoard, ColumnItem } from "./kanban-board"
import { TaskListView } from "./task-list-view"
import { TaskDetailDrawer } from "./task-detail-drawer"
import { TaskItem, TagItem } from "./kanban-card"
import { WorkspaceFilterBar, FilterState } from "./workspace-filter-bar"

export function WorkspaceView({
  initialColumns,
  availableTags = [],
}: {
  initialColumns: ColumnItem[]
  availableTags?: TagItem[]
}) {
  const [view, setView] = useState<"board" | "list">("board")
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priorities: [],
    tagIds: [],
  })

  // Filter columns and their nested tasks reactively
  const filteredColumns = useMemo(() => {
    const query = filters.search.trim().toLowerCase()

    return initialColumns.map((col) => {
      const filteredTasks = col.tasks.filter((task) => {
        // 1. Search Query (Title, Description, HERUPU-ID)
        if (query) {
          const matchTitle = task.title.toLowerCase().includes(query)
          const matchDesc = task.description?.toLowerCase().includes(query)
          const matchId = `herupu-${task.id.slice(-4)}`.toLowerCase().includes(query)
          if (!matchTitle && !matchDesc && !matchId) return false
        }

        // 2. Priority Filter
        if (filters.priorities.length > 0) {
          if (!filters.priorities.includes(task.priority)) return false
        }

        // 3. Tag Filter
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
      {/* Top Bar: View Switcher & Live Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
      </div>

      <WorkspaceFilterBar
        filters={filters}
        onChange={setFilters}
        availableTags={availableTags}
      />

      {/* Render Selected View with Filtered Data */}
      {view === "board" ? (
        <KanbanBoard
          initialColumns={filteredColumns}
          availableTags={availableTags}
        />
      ) : (
        <TaskListView
          columns={filteredColumns}
          onTaskClick={(task) => setSelectedTask(task)}
        />
      )}

      {/* Slide-over Drawer for List View */}
      {view === "list" && (
        <TaskDetailDrawer
          task={selectedTask}
          columns={initialColumns.map((c) => ({ id: c.id, name: c.name }))}
          availableTags={availableTags}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}