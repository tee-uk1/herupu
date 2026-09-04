"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Priority } from "@prisma/client"

async function recordActivity(action: string, details: string) {
  const project = await prisma.project.findFirst()
  if (!project) return
  await prisma.activityLog.create({
    data: {
      action,
      details,
      projectId: project.id,
    },
  })
}

export async function updateTaskPosition(
  taskId: string,
  newColumnId: string,
  newOrder: number
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { column: true },
  })

  const newColumn = await prisma.column.findUnique({
    where: { id: newColumnId },
  })

  await prisma.task.update({
    where: { id: taskId },
    data: {
      columnId: newColumnId,
      order: newOrder,
    },
  })

  if (task && newColumn && task.columnId !== newColumnId) {
    await recordActivity(
      "TASK_MOVED",
      `Moved "${task.title}" to ${newColumn.name}`
    )
  }

  revalidatePath("/")
}

export async function createTask(data: {
  title: string
  description?: string
  priority?: Priority
  columnId: string
  dueDate?: string | null
  tagIds?: string[]
}) {
  const count = await prisma.task.count({
    where: { columnId: data.columnId },
  })

  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority ?? "MEDIUM",
      columnId: data.columnId,
      order: count,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      tags: data.tagIds && data.tagIds.length > 0
        ? { connect: data.tagIds.map((id) => ({ id })) }
        : undefined,
    },
    include: { column: true },
  })

  await recordActivity(
    "TASK_CREATED",
    `Created "${task.title}" in ${task.column.name}`
  )

  revalidatePath("/")
  return task
}

export async function updateTaskDetails(
  taskId: string,
  data: {
    title?: string
    description?: string
    priority?: Priority
    columnId?: string
    dueDate?: string | null
    tagIds?: string[]
  }
) {
  const updatePayload: any = {}

  if (data.title !== undefined) updatePayload.title = data.title
  if (data.description !== undefined) updatePayload.description = data.description
  if (data.priority !== undefined) updatePayload.priority = data.priority
  if (data.columnId !== undefined) updatePayload.columnId = data.columnId
  if (data.dueDate !== undefined) {
    updatePayload.dueDate = data.dueDate ? new Date(data.dueDate) : null
  }
  if (data.tagIds !== undefined) {
    updatePayload.tags = {
      set: data.tagIds.map((id) => ({ id })),
    }
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: updatePayload,
  })

  await recordActivity(
    "TASK_UPDATED",
    `Updated details for "${updated.title}"`
  )

  revalidatePath("/")
  return updated
}

export async function deleteTask(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  await prisma.task.delete({
    where: { id: taskId },
  })
  if (task) {
    await recordActivity("TASK_DELETED", `Deleted task "${task.title}"`)
  }
  revalidatePath("/")
}

export async function createSubtask(taskId: string, title: string) {
  const subtask = await prisma.subtask.create({
    data: {
      title,
      taskId,
    },
    include: { task: true },
  })
  await recordActivity(
    "SUBTASK_CREATED",
    `Added checklist item "${title}" to "${subtask.task.title}"`
  )
  revalidatePath("/")
  return subtask
}

export async function toggleSubtask(subtaskId: string, isCompleted: boolean) {
  const subtask = await prisma.subtask.update({
    where: { id: subtaskId },
    data: { isCompleted },
    include: { task: true },
  })
  await recordActivity(
    "SUBTASK_TOGGLED",
    `${isCompleted ? "Completed" : "Reopened"} checklist item "${subtask.title}"`
  )
  revalidatePath("/")
  return subtask
}

export async function deleteSubtask(subtaskId: string) {
  const subtask = await prisma.subtask.findUnique({ where: { id: subtaskId } })
  await prisma.subtask.delete({
    where: { id: subtaskId },
  })
  if (subtask) {
    await recordActivity("SUBTASK_DELETED", `Removed checklist item "${subtask.title}"`)
  }
  revalidatePath("/")
}

export async function createColumn(name: string) {
  const project = await prisma.project.findFirst()
  if (!project) return

  const count = await prisma.column.count({
    where: { projectId: project.id },
  })

  const newColumn = await prisma.column.create({
    data: {
      name,
      order: count,
      projectId: project.id,
    },
  })

  await recordActivity("COLUMN_CREATED", `Added column "${name}"`)
  revalidatePath("/")
  return newColumn
}

export async function updateColumnName(columnId: string, name: string) {
  const updated = await prisma.column.update({
    where: { id: columnId },
    data: { name },
  })
  await recordActivity("COLUMN_RENAMED", `Renamed column to "${name}"`)
  revalidatePath("/")
  return updated
}

export async function deleteColumn(columnId: string) {
  const column = await prisma.column.findUnique({ where: { id: columnId } })
  await prisma.column.delete({
    where: { id: columnId },
  })
  if (column) {
    await recordActivity("COLUMN_DELETED", `Deleted column "${column.name}"`)
  }
  revalidatePath("/")
}