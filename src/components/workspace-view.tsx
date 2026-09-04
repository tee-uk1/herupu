"use client"

import React, { useState, useMemo } from "react"
import { KanbanBoard, ColumnItem } from "./kanban-board"
import { ListView } from "./list-view"
import { WorkspaceFilterBar, FilterState } from "./workspace-filter-bar"
import { TaskDetailDrawer } from "./task-detail-drawer"
import { ActivityLogDrawer, ActivityItem } from "./activity-log-drawer"
import { ArchiveDrawer } from "./archive-drawer"
import { UserManagementDrawer } from "./user-management-drawer"
import { useRole } from "./role-context"
import { TaskItem, TagItem, UserItem } from "./kanban-card"
import { LayoutGrid, List, History, Archive, Users } from "lucide-react"
import { useSession } from "next-auth/react"

export function WorkspaceView({
  initialColumns,
  availableTags = [],
  availableUsers = [],
  activities = [],
  archivedTasks = [],
  currentUserRole = "MEMBER",
}: {
  initialColumns: ColumnItem[]
  availableTags?: TagItem[]
  availableUsers?: UserItem[]
  activities?: ActivityItem[]
  archivedTasks?: TaskItem[]
  currentUserRole?: string
}) {
  const { data: session } = useSession()
  const { isAdmin: contextAdmin } = useRole()
  const isAdmin = currentUserRole === "ADMIN" || contextAdmin

  const [view, setView] = useState<"board" | "list">("board")
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [isActivityOpen, setIsActivityOpen] = useState(false)
  const [isArchiveOpen, setIsArchiveOpen] = useState(false)
  const [isUsersOpen, setIsUsersOpen] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    priorities: [],
    tagIds: [],
    assignedToMe: false,
  })

  const filteredColumns = useMemo(() => {
    return initialColumns.map((col) => ({
      ...col,
      tasks: col.tasks.filter((task) => {
        if (filters.assignedToMe && task.assignedToId !== session?.user?.id) {
          return false
        }
        if (filters.search) {
          const q = filters.search.toLowerCase()
          const matchTitle = task.title.toLowerCase().includes(q)
          const matchDesc = task.description?.toLowerCase().includes(q)
          const matchId = task.id.toLowerCase().includes(q)
          if (!matchTitle && !matchDesc && !matchId) return false
        }
        if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
          return false
        }
        if (filters.tagIds.length > 0) {
          const taskTagIds = task.tags?.map((t) => t.id) || []
          const hasTag = filters.tagIds.some((id) => taskTagIds.includes(id))
          if (!hasTag) return false
        }
        return true
      }),
    }))
  }, [initialColumns, filters, session])

  const allColumnsForSelect = initialColumns.map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <WorkspaceFilterBar
          filters={filters}
          onChange={setFilters}
          availableTags={availableTags}
        />

        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          {isAdmin && (
            <button
              onClick={() => setIsUsersOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-800/80 bg-purple-950/40 hover:bg-purple-900/50 text-purple-300 text-xs font-medium transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Team Directory</span>
            </button>
          )}

          <button
            onClick={() => setIsArchiveOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
          >
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span>Archive</span>
            {archivedTasks && archivedTasks.length > 0 && (
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.2 rounded-full font-mono text-zinc-300">
                {archivedTasks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsActivityOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-xs transition-colors"
          >
            <History className="w-3.5 h-3.5 text-blue-400" />
            <span>Activity</span>
          </button>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                view === "board" ? "bg-zinc-800 text-zinc-100 shadow-xs" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                view === "list" ? "bg-zinc-800 text-zinc-100 shadow-xs" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>
        </div>
      </div>

      {view === "board" ? (
        <KanbanBoard initialColumns={filteredColumns} onTaskClick={setSelectedTask} />
      ) : (
        <ListView initialColumns={filteredColumns} onTaskClick={setSelectedTask} />
      )}

      <TaskDetailDrawer
        task={selectedTask}
        columns={allColumnsForSelect}
        availableTags={availableTags}
        availableUsers={availableUsers}
        onClose={() => setSelectedTask(null)}
      />

      <ActivityLogDrawer
        isOpen={isActivityOpen}
        onClose={() => setIsActivityOpen(false)}
        activities={activities}
      />

      <ArchiveDrawer
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        archivedTasks={archivedTasks}
      />

      <UserManagementDrawer
        isOpen={isUsersOpen}
        onClose={() => setIsUsersOpen(false)}
        users={availableUsers}
      />
    </div>
  )
}