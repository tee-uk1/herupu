"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Priority } from "@prisma/client"

export async function updateTaskPosition(
  taskId: string,
  newColumnId: string,
  newOrder: number
) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        columnId: newColumnId,
        order: newOrder,
      },
    })
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to update task position:", error)
    return { success: false, error }
  }
}

export async function createTask(formData: {
  title: string
  description?: string
  priority: Priority
  columnId: string
  dueDate?: string
  tagIds?: string[]
}) {
  try {
    const highestTask = await prisma.task.findFirst({
      where: { columnId: formData.columnId },
      orderBy: { order: "desc" },
    })

    const nextOrder = highestTask ? highestTask.order + 1 : 0

    await prisma.task.create({
      data: {
        title: formData.title,
        description: formData.description || null,
        priority: formData.priority,
        columnId: formData.columnId,
        order: nextOrder,
        dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
        tags: formData.tagIds && formData.tagIds.length > 0
          ? { connect: formData.tagIds.map((id) => ({ id })) }
          : undefined,
      },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to create task:", error)
    return { success: false, error }
  }
}

export async function updateTaskDetails(
  taskId: string,
  data: {
    title?: string
    description?: string | null
    priority?: Priority
    columnId?: string
    dueDate?: string | null
    tagIds?: string[]
  }
) {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        title: data.title,
        description: data.description,
        priority: data.priority,
        columnId: data.columnId,
        dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : undefined,
        tags: data.tagIds
          ? {
              set: data.tagIds.map((id) => ({ id })),
            }
          : undefined,
      },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to update task details:", error)
    return { success: false, error }
  }
}

export async function deleteTask(taskId: string) {
  try {
    await prisma.task.delete({
      where: { id: taskId },
    })
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete task:", error)
    return { success: false, error }
  }
}