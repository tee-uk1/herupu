"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

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
    return { success: false, error: "Database update failed" }
  }
}