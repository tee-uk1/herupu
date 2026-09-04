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