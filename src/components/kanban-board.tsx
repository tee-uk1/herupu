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

export type ColumnItem = {
  id: string
  name: string
  order: number
  tasks: TaskItem[]
}

function WorkflowColumn({
  column,
  isAdmin = false,
  children,
}: {
  column: ColumnItem
  isAdmin?: boolean
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(column.name)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSaveName = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === column.name) {
      setName(column.name)
      setIsEditing(false)
      return
    }
    await updateColumnName(column.id, trimmed)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    const msg =
      column.tasks.length > 0
        ? `Deleting "${column.name}" will also delete its ${column.tasks.length} task(s). Continue?`
        : `Delete column "${column.name}"?`
    if (confirm(msg)) {
      await deleteColumn(column.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 bg-zinc-900/70 border rounded-lg p-3 flex flex-col justify-between transition-colors ${
        isOver ? "border-blue-500/50 bg-zinc-900" : "border-zinc-800/80"
      }`}
    >
      <div className="flex flex-col gap-3">
        {/* Column Stage Header */}
        <div className="flex items-center justify-between px-1 relative">
          {isAdmin && isEditing ? (
            <div className="flex items-center gap-1.5 flex-1 mr-2">
              <input
                type="text"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName()
                  if (e.key === "Escape") {
                    setName(column.name)
                    setIsEditing(false)
                  }
                }}
                className="bg-zinc-950 border border-zinc-700 text-xs px-2 py-1 rounded text-zinc-100 outline-none w-full"
              />
              <button
                onClick={handleSaveName}
                className="p-1 hover:text-emerald-400 text-zinc-400"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setName(column.name)
                  setIsEditing(false)
                }}
                className="p-1 hover:text-zinc-200 text-zinc-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                if (isAdmin) setIsEditing(true)
              }}
              className={`flex items-center gap-2 flex-1 mr-2 overflow-hidden ${
                isAdmin ? "cursor-pointer group" : "cursor-default"
              }`}
            >
              <span
                className={`text-xs font-semibold tracking-wider uppercase truncate ${
                  isAdmin ? "group-hover:text-blue-400 transition-colors text-zinc-200" : "text-zinc-300"
                }`}
              >
                {column.name}
              </span>
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono shrink-0">
                {column.tasks.length}
              </span>
            </div>
          )}

          {/* Admin Action Menu */}
          {isAdmin && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded hover:bg-zinc-800 transition-colors"
                title="Manage Stage (Admin)"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-6 w-32 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl py-1 z-30 text-xs flex flex-col">
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      setIsEditing(true)
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-zinc-300 hover:bg-zinc-800 text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      handleDelete()
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-red-400 hover:bg-red-950/30 text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {children}
      </div>

      <InlineTaskCreator columnId={column.id} />
    </div>
  )
}

export function KanbanBoard({
  initialColumns,
  availableTags = [],
  isAdmin = false,
}: {
  initialColumns: ColumnItem[]
  availableTags?: TagItem[]
  isAdmin?: boolean
}) {
  const [columns, setColumns] = useState<ColumnItem[]>(initialColumns)
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null)
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null)
  const [mounted, setMounted] = useState(false)

  // Admin Add Column State
  const [isAddingCol, setIsAddingCol] = useState(false)
  const [newColName, setNewColName] = useState("")
  const [isSubmittingCol, setIsSubmittingCol] = useState(false)

  useEffect(() => {
    setColumns(initialColumns)
    if (selectedTask) {
      const refreshed = initialColumns
        .flatMap((c) => c.tasks)
        .find((t) => t.id === selectedTask.id)
      if (refreshed) setSelectedTask(refreshed)
    }
  }, [initialColumns])

  useEffect(() => {
    setMounted(true)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const findColumn = useCallback(
    (id: string) => {
      return (
        columns.find((col) => col.id === id) ||
        columns.find((col) => col.tasks.some((t) => t.id === id))
      )
    },
    [columns]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const activeId = String(active.id)
      const col = findColumn(activeId)
      const task = col?.tasks.find((t) => t.id === activeId)
      setActiveTask(task ?? null)
    },
    [findColumn]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = String(active.id)
      const overId = String(over.id)

      const sourceCol = findColumn(activeId)
      const targetCol = findColumn(overId)

      if (!sourceCol || !targetCol || sourceCol.id === targetCol.id) return

      setColumns((prev) => {
        const src = prev.find((c) => c.id === sourceCol.id)
        const tgt = prev.find((c) => c.id === targetCol.id)
        if (!src || !tgt) return prev

        const sourceTasks = [...src.tasks]
        const targetTasks = [...tgt.tasks]

        const activeIndex = sourceTasks.findIndex((t) => t.id === activeId)
        if (activeIndex === -1) return prev

        const [taskToMove] = sourceTasks.splice(activeIndex, 1)
        const updatedTask = { ...taskToMove, columnId: targetCol.id }

        const isOverColumn = tgt.id === overId
        if (isOverColumn) {
          targetTasks.push(updatedTask)
        } else {
          const overIndex = targetTasks.findIndex((t) => t.id === overId)
          if (overIndex >= 0) {
            targetTasks.splice(overIndex, 0, updatedTask)
          } else {
            targetTasks.push(updatedTask)
          }
        }

        return prev.map((col) => {
          if (col.id === sourceCol.id) return { ...col, tasks: sourceTasks }
          if (col.id === targetCol.id) return { ...col, tasks: targetTasks }
          return col
        })
      })
    },
    [findColumn]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveTask(null)

      if (!over) return

      const activeId = String(active.id)
      const overId = String(over.id)

      const currentColumn = findColumn(activeId)
      if (!currentColumn) return

      const oldIndex = currentColumn.tasks.findIndex((t) => t.id === activeId)
      const newIndex = currentColumn.tasks.findIndex((t) => t.id === overId)

      let finalTasks = currentColumn.tasks
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        finalTasks = arrayMove(currentColumn.tasks, oldIndex, newIndex)
        setColumns((prev) =>
          prev.map((col) =>
            col.id === currentColumn.id ? { ...col, tasks: finalTasks } : col
          )
        )
      }

      const taskIndex = finalTasks.findIndex((t) => t.id === activeId)
      if (taskIndex !== -1) {
        await updateTaskPosition(activeId, currentColumn.id, taskIndex)
      }
    },
    [findColumn]
  )

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newColName.trim()
    if (!trimmed || isSubmittingCol) return

    setIsSubmittingCol(true)
    await createColumn(trimmed)
    setNewColName("")
    setIsSubmittingCol(false)
    setIsAddingCol(false)
  }

  if (!mounted) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-6 items-start">
        {initialColumns.map((col) => (
          <div
            key={col.id}
            className="w-72 shrink-0 bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                {col.name}
              </span>
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                {col.tasks.length}
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <DndContext
        id="kanban-board-dnd"
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-6 items-start">
          {columns.map((column) => {
            const taskIds = column.tasks.map((t) => t.id)

            return (
              <WorkflowColumn key={column.id} column={column} isAdmin={isAdmin}>
                <SortableContext
                  id={column.id}
                  items={taskIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2 min-h-[160px] rounded-md p-1">
                    {column.tasks.map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        onTaskClick={(t) => setSelectedTask(t)}
                      />
                    ))}
                    {column.tasks.length === 0 && (
                      <div className="h-24 flex items-center justify-center border border-dashed border-zinc-800/80 rounded text-xs text-zinc-500 select-none">
                        Drop here
                      </div>
                    )}
                  </div>
                </SortableContext>
              </WorkflowColumn>
            )
          })}

          {/* Admin-only Add Column Button */}
          {isAdmin && (
            <div className="w-72 shrink-0">
              {isAddingCol ? (
                <form
                  onSubmit={handleCreateColumn}
                  className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-lg flex flex-col gap-2 shadow-lg"
                >
                  <input
                    type="text"
                    autoFocus
                    disabled={isSubmittingCol}
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    placeholder="New stage name..."
                    className="w-full bg-zinc-950 border border-zinc-700 text-xs px-2.5 py-1.5 rounded text-zinc-100 outline-none focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!newColName.trim() || isSubmittingCol}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      {isSubmittingCol && <Loader2 className="w-3 h-3 animate-spin" />}
                      Add Stage
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCol(false)
                        setNewColName("")
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingCol(true)}
                  className="w-full h-11 flex items-center justify-center gap-1.5 border border-dashed border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Stage</span>
                </button>
              )}
            </div>
          )}
        </div>

        <DragOverlay>
          {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>

      <TaskDetailDrawer
        task={selectedTask}
        columns={columns.map((c) => ({ id: c.id, name: c.name }))}
        availableTags={availableTags}
        onClose={() => setSelectedTask(null)}
      />
    </>
  )
}