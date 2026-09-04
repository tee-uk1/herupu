"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Priority } from "@prisma/client"

export async function updateTaskPosition(
  taskId: string,
  newColumnId: string,
  newOrder: number
) {
  await prisma.task.update({
    where: { id: taskId },
    data: {
      columnId: newColumnId,
      order: newOrder,
    },
  })
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
  })

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

  revalidatePath("/")
  return updated
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({
    where: { id: taskId },
  })
  revalidatePath("/")
}

export async function createSubtask(taskId: string, title: string) {
  const subtask = await prisma.subtask.create({
    data: {
      title,
      taskId,
    },
  })
  revalidatePath("/")
  return subtask
}

export async function toggleSubtask(subtaskId: string, isCompleted: boolean) {
  const subtask = await prisma.subtask.update({
    where: { id: subtaskId },
    data: { isCompleted },
  })
  revalidatePath("/")
  return subtask
}

export async function deleteSubtask(subtaskId: string) {
  await prisma.subtask.delete({
    where: { id: subtaskId },
  })
  revalidatePath("/")
}