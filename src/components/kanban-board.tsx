"use client"

import React, { useState, useEffect, useCallback } from "react"
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
import { KanbanCard, TaskItem } from "./kanban-card"
import { updateTaskPosition } from "@/app/actions"

export type ColumnItem = {
  id: string
  name: string
  order: number
  tasks: TaskItem[]
}

function DroppableColumn({
  column,
  children,
}: {
  column: ColumnItem
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 bg-zinc-900/70 border rounded-lg p-3 flex flex-col gap-3 transition-colors ${
        isOver ? "border-blue-500/50 bg-zinc-900" : "border-zinc-800/80"
      }`}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-zinc-200">
          {column.name}
        </span>
        <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
          {column.tasks.length}
        </span>
      </div>
      {children}
    </div>
  )
}

export function KanbanBoard({ initialColumns }: { initialColumns: ColumnItem[] }) {
  const [columns, setColumns] = useState<ColumnItem[]>(initialColumns)
  const [activeTask, setActiveTask] = useState<TaskItem | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setColumns(initialColumns)
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

  if (!mounted) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {initialColumns.map((col) => (
          <div
            key={col.id}
            className="w-72 shrink-0 bg-zinc-900/70 border border-zinc-800/80 rounded-lg p-3 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-zinc-200">{col.name}</span>
              <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                {col.tasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2 min-h-[160px] p-1">
              {col.tasks.map((task) => (
                <KanbanCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <DndContext
      id="kanban-board-dnd"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 items-start">
        {columns.map((column) => {
          const taskIds = column.tasks.map((t) => t.id)

          return (
            <DroppableColumn key={column.id} column={column}>
              <SortableContext
                id={column.id}
                items={taskIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2 min-h-[160px] rounded-md p-1">
                  {column.tasks.map((task) => (
                    <KanbanCard key={task.id} task={task} />
                  ))}
                  {column.tasks.length === 0 && (
                    <div className="h-28 flex items-center justify-center border border-dashed border-zinc-800/80 rounded text-xs text-zinc-500 select-none">
                      Drop here
                    </div>
                  )}
                </div>
              </SortableContext>
            </DroppableColumn>
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? <KanbanCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  )
}