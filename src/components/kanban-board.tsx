"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { MoreHorizontal, Plus, Trash2, Edit2, Check, X, Loader2 } from "lucide-react"
import { KanbanCard, TaskItem, TagItem } from "./kanban-card"
import { TaskDetailDrawer } from "./task-detail-drawer"
import { InlineTaskCreator } from "./inline-task-creator"
import {
  updateTaskPosition,
  createColumn,
  updateColumnName,
  deleteColumn,
} from "@/app/actions"

export interface ColumnData {
  id: string
  name: string
  order: number
  tasks: TaskItem[]
}

interface KanbanBoardProps {
  initialColumns: ColumnData[]
  boardId?: string
  availableTags: TagItem[]
  availableUsers?: Array<{ id: string; name: string | null; email: string | null; image: string | null }>
  currentUserRole?: string
}

function getColumnPillTheme(name: string) {
  const n = name.toUpperCase()
  if (n.includes("HOW TO")) return { pill: "bg-sky-500/10 text-sky-300 border-sky-500/30", dot: "bg-sky-400" }
  if (n.includes("REQUESTS")) return { pill: "bg-rose-500/10 text-rose-300 border-rose-500/30", dot: "bg-rose-400" }
  if (n.includes("APPROVED")) return { pill: "bg-indigo-500/10 text-indigo-300 border-indigo-500/30", dot: "bg-indigo-400" }
  if (n.includes("DOING")) return { pill: "bg-orange-500/10 text-orange-300 border-orange-500/30", dot: "bg-orange-400" }
  if (n.includes("REVIEW")) return { pill: "bg-amber-500/10 text-amber-300 border-amber-500/30", dot: "bg-amber-400" }
  if (n.includes("DONE")) return { pill: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" }
  if (n.includes("STOP")) return { pill: "bg-rose-500/10 text-rose-300 border-rose-500/30", dot: "bg-rose-400" }
  if (n.includes("START")) return { pill: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" }
  if (n.includes("CONTINUE")) return { pill: "bg-sky-500/10 text-sky-300 border-sky-500/30", dot: "bg-sky-400" }
  if (n.includes("KAIZEN")) return { pill: "bg-purple-500/10 text-purple-300 border-purple-500/30", dot: "bg-purple-400" }
  return { pill: "bg-zinc-800 text-zinc-300 border-zinc-700/50", dot: "bg-zinc-400" }
}

function DroppableColumn({
  column,
  onTaskClick,
  onAddTask,
  onUpdateColumnName,
  onDeleteColumn,
  currentUserRole = "MEMBER",
}: {
  column: ColumnData
  onTaskClick: (task: TaskItem) => void
  onAddTask: (columnId: string, title: string) => Promise<void>
  onUpdateColumnName: (columnId: string, newName: string) => Promise<void>
  onDeleteColumn: (columnId: string) => Promise<void>
  currentUserRole?: string
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  })

  const [isEditing, setIsEditing] = useState(false)
  const [columnName, setColumnName] = useState(column.name)
  const [showOptions, setShowOptions] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showInlineCreator, setShowInlineCreator] = useState(false)

  const isAdmin = currentUserRole === "ADMIN"
  const theme = getColumnPillTheme(column.name)

  const handleSaveName = async () => {
    if (!columnName.trim() || columnName === column.name) {
      setIsEditing(false)
      setColumnName(column.name)
      return
    }
    await onUpdateColumnName(column.id, columnName.trim())
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (confirm(`Delete column "${column.name}" and all its tasks?`)) {
      setIsDeleting(true)
      await onDeleteColumn(column.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-80 shrink-0 h-full rounded-2xl bg-[#0e1017]/70 border transition-all duration-150 ${
        isOver
          ? "border-indigo-500/50 bg-[#12141f] shadow-lg shadow-indigo-500/5"
          : "border-white/[0.05]"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
          {isEditing && isAdmin ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName()
                  if (e.key === "Escape") {
                    setIsEditing(false)
                    setColumnName(column.name)
                  }
                }}
                autoFocus
                className="w-full bg-[#161822] text-xs px-2 py-0.5 rounded border border-indigo-500/40 text-zinc-100 focus:outline-none"
              />
              <button onClick={handleSaveName} className="p-1 hover:bg-white/[0.08] rounded text-emerald-400">
                <Check className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { setIsEditing(false); setColumnName(column.name) }} className="p-1 hover:bg-white/[0.08] rounded text-zinc-400">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 truncate">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide border flex items-center gap-1.5 shrink-0 ${theme.pill}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
                <span className="truncate">{column.name}</span>
              </span>
              <span className="text-[11px] font-mono text-zinc-500 shrink-0">
                {column.tasks.length}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 relative shrink-0">
          <button
            onClick={() => setShowInlineCreator(true)}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            title="Add Task"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {showOptions && (
                <div className="absolute right-0 top-7 w-32 bg-[#141620] border border-white/[0.08] rounded-xl shadow-xl py-1 z-30">
                  <button
                    onClick={() => { setIsEditing(true); setShowOptions(false) }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Rename
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Task List Canvas */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2.5 space-y-2.5">
        {showInlineCreator && (
          <InlineTaskCreator
            columnId={column.id}
            onCancel={() => setShowInlineCreator(false)}
            onTaskCreated={async (title) => {
              await onAddTask(column.id, title)
              setShowInlineCreator(false)
            }}
          />
        )}

        <SortableContext
          items={column.tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <KanbanCard key={task.id} task={task} onTaskClick={onTaskClick} />
          ))}
        </SortableContext>

        {column.tasks.length === 0 && !showInlineCreator && (
          <div className="h-20 flex items-center justify-center border border-dashed border-white/[0.04] rounded-xl text-[11px] text-zinc-600">
            No tasks
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanBoard({
  initialColumns,
  boardId,
  availableTags,
  availableUsers = [],
  currentUserRole = "MEMBER",
}: KanbanBoardProps) {
  const [columns, setColumns] = useState<ColumnData[]>(initialColumns)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [newColumnName, setNewColumnName] = useState("")
  const [isCreatingColumn, setIsCreatingColumn] = useState(false)
  const isAdmin = currentUserRole === "ADMIN"

  useEffect(() => {
    setColumns(initialColumns)
  }, [initialColumns])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const findColumnOfTask = useCallback(
    (taskId: string): ColumnData | undefined => {
      return columns.find((c) => c.tasks.some((t) => t.id === taskId))
    },
    [columns]
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeData = active.data.current

    if (activeData?.type === "task") {
      setActiveTask(activeData.task)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const fromCol = findColumnOfTask(activeId)
    let toCol = findColumnOfTask(overId)

    if (!toCol) {
      toCol = columns.find((c) => c.id === overId)
    }

    if (!fromCol || !toCol || fromCol.id === toCol.id) return

    setColumns((prevCols) => {
      const movingTask = fromCol.tasks.find((t) => t.id === activeId)
      if (!movingTask) return prevCols

      return prevCols.map((col) => {
        if (col.id === fromCol.id) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) }
        }
        if (col.id === toCol.id) {
          const overIdx = col.tasks.findIndex((t) => t.id === overId)
          const insertIdx = overIdx >= 0 ? overIdx : col.tasks.length
          const updated = [...col.tasks]
          updated.splice(insertIdx, 0, { ...movingTask, columnId: toCol.id })
          return { ...col, tasks: updated }
        }
        return col
      })
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const targetCol =
      findColumnOfTask(activeId) ||
      columns.find((c) => c.id === overId) ||
      findColumnOfTask(overId)

    if (!targetCol) return

    const oldIndex = targetCol.tasks.findIndex((t) => t.id === activeId)
    let newIndex = targetCol.tasks.findIndex((t) => t.id === overId)

    if (newIndex === -1) {
      newIndex = targetCol.tasks.length - 1
    }

    if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
      setColumns((prev) =>
        prev.map((c) => {
          if (c.id === targetCol.id) {
            return { ...c, tasks: arrayMove(c.tasks, oldIndex, newIndex) }
          }
          return c
        })
      )
    }

    const finalCol = findColumnOfTask(activeId)
    if (finalCol) {
      const finalIndex = finalCol.tasks.findIndex((t) => t.id === activeId)
      await updateTaskPosition(activeId, finalCol.id, Math.max(0, finalIndex))
    }
  }

  const handleAddTask = async (columnId: string, title: string) => {
    const tempId = `temp-${Date.now()}`
    const targetCol = columns.find((c) => c.id === columnId)
    const newTask: TaskItem = {
      id: tempId,
      title,
      description: null,
      priority: "MEDIUM",
      order: targetCol ? targetCol.tasks.length : 0,
      dueDate: null,
      isArchived: false,
      isPinnedToMaster: false,
      columnId,
      assignedToId: null,
      assignedTo: null,
      tags: [],
      subtasks: [],
      comments: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
      )
    )

    const created = await updateTaskPosition(tempId, columnId, newTask.order, title)
    if (created && created.id) {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? { ...col, tasks: col.tasks.map((t) => (t.id === tempId ? { ...t, id: created.id } : t)) }
            : col
        )
      )
    }
  }

  const handleCreateColumn = async () => {
    if (!newColumnName.trim() || !boardId) return
    setIsCreatingColumn(true)
    try {
      const created = await createColumn(boardId, newColumnName.trim(), columns.length)
      if (created) {
        setColumns((prev) => [...prev, { ...created, tasks: [] }])
      }
      setNewColumnName("")
    } finally {
      setIsCreatingColumn(false)
    }
  }

  const handleUpdateColumnName = async (columnId: string, newName: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === columnId ? { ...col, name: newName } : col))
    )
    await updateColumnName(columnId, newName)
  }

  const handleDeleteColumn = async (columnId: string) => {
    setColumns((prev) => prev.filter((col) => col.id !== columnId))
    await deleteColumn(columnId)
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0 min-w-0 overflow-hidden bg-[#08090d]">
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6" suppressHydrationWarning>
        <DndContext id="herupu-kanban-dnd"
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="inline-flex items-start gap-4 h-full min-h-full pb-4">
            {columns.map((column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                onTaskClick={(task) => {
                  setSelectedTask(task)
                  setIsDrawerOpen(true)
                }}
                onAddTask={handleAddTask}
                onUpdateColumnName={handleUpdateColumnName}
                onDeleteColumn={handleDeleteColumn}
                currentUserRole={currentUserRole}
              />
            ))}

            {/* Admin Add Column Capsule */}
            {isAdmin && boardId && (
              <div className="w-72 shrink-0 p-3 rounded-2xl bg-[#0e1017]/40 border border-dashed border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateColumn()}
                    placeholder="+ Add Column..."
                    className="flex-1 bg-[#141620] text-xs px-3 py-1.5 rounded-lg border border-white/[0.06] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
                  />
                  <button
                    onClick={handleCreateColumn}
                    disabled={isCreatingColumn || !newColumnName.trim()}
                    className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all"
                  >
                    {isCreatingColumn ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="w-76 rotate-2 shadow-2xl opacity-95">
                <KanbanCard task={activeTask} isOverlay />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Inspection & Edit Drawer */}
      <TaskDetailDrawer
        task={selectedTask}
        columns={columns.map(c => ({ id: c.id, name: c.name }))}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          setSelectedTask(null)
        }}
        onTaskUpdated={(updatedTask) => {
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)),
            }))
          )
        }}
        onTaskDeleted={(deletedTaskId) => {
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              tasks: col.tasks.filter((t) => t.id !== deletedTaskId),
            }))
          )
        }}
        availableTags={availableTags}
        availableUsers={availableUsers}
        currentUserRole={currentUserRole}
      />
    </div>
  )
}