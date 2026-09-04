"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Priority, Role } from "@prisma/client"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"

async function getActor() {
  const session = await auth()
  return {
    id: session?.user?.id,
    name: session?.user?.name || "System",
    role: (session?.user as any)?.role || "MEMBER",
  }
}

async function recordActivity(action: string, details: string) {
  const actor = await getActor()
  await prisma.activityLog.create({
    data: { action, details: `${actor.name}: ${details}` },
  })
}

export async function togglePinToMaster(taskId: string, isPinnedToMaster: boolean) {
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { isPinnedToMaster },
    include: { column: { include: { board: true } } },
  })

  await recordActivity(
    "TASK_SYNC_TOGGLED",
    `${isPinnedToMaster ? "Pinned" : "Unpinned"} "${updated.title}" ${isPinnedToMaster ? "to" : "from"} Central Master Board`
  )
  revalidatePath("/")
  return updated
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
    await recordActivity("TASK_MOVED", `Moved "${task.title}" to ${newColumn.name}`)
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
  assignedToId?: string | null
  isPinnedToMaster?: boolean
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
      assignedToId: data.assignedToId || null,
      isPinnedToMaster: data.isPinnedToMaster ?? false,
      tags: data.tagIds && data.tagIds.length > 0
        ? { connect: data.tagIds.map((id) => ({ id })) }
        : undefined,
    },
    include: { column: true },
  })

  await recordActivity("TASK_CREATED", `Created "${task.title}" in ${task.column.name}`)
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
    assignedToId?: string | null
    isPinnedToMaster?: boolean
  }
) {
  const updatePayload: any = {}

  if (data.title !== undefined) updatePayload.title = data.title
  if (data.description !== undefined) updatePayload.description = data.description
  if (data.priority !== undefined) updatePayload.priority = data.priority
  if (data.columnId !== undefined && data.columnId !== "") {
    updatePayload.columnId = data.columnId
  }
  if (data.assignedToId !== undefined) {
    updatePayload.assignedToId = data.assignedToId || null
  }
  if (data.isPinnedToMaster !== undefined) {
    updatePayload.isPinnedToMaster = data.isPinnedToMaster
  }
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

  await recordActivity("TASK_UPDATED", `Updated details for "${updated.title}"`)
  revalidatePath("/")
  return updated
}

export async function archiveTask(taskId: string) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { isArchived: true },
  })
  await recordActivity("TASK_ARCHIVED", `Archived task "${task.title}"`)
  revalidatePath("/")
}

export async function unarchiveTask(taskId: string) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { isArchived: false },
  })
  await recordActivity("TASK_RESTORED", `Restored task "${task.title}" from archive`)
  revalidatePath("/")
}

export async function deleteTask(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  await prisma.task.delete({ where: { id: taskId } })
  if (task) {
    await recordActivity("TASK_DELETED", `Deleted task "${task.title}"`)
  }
  revalidatePath("/")
}

export async function createSubtask(taskId: string, title: string) {
  const subtask = await prisma.subtask.create({
    data: { title, taskId },
    include: { task: true },
  })
  await recordActivity("SUBTASK_CREATED", `Added checklist item "${title}" to "${subtask.task.title}"`)
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
  await prisma.subtask.delete({ where: { id: subtaskId } })
  if (subtask) {
    await recordActivity("SUBTASK_DELETED", `Removed checklist item "${subtask.title}"`)
  }
  revalidatePath("/")
}

export async function createComment(taskId: string, content: string) {
  const actor = await getActor()
  const comment = await prisma.comment.create({
    data: {
      content,
      authorId: actor.id,
      authorName: actor.name,
      taskId,
    },
    include: { task: true },
  })

  await recordActivity("COMMENT_ADDED", `Commented on "${comment.task.title}"`)
  revalidatePath("/")
  return comment
}

export async function deleteComment(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { task: true },
  })

  await prisma.comment.delete({ where: { id: commentId } })

  if (comment) {
    await recordActivity("COMMENT_DELETED", `Removed comment from "${comment.task.title}"`)
  }
  revalidatePath("/")
}

export async function createTag(name: string, color: string = "#3b82f6") {
  const tag = await prisma.tag.create({
    data: { name, color },
  })
  revalidatePath("/")
  return tag
}

export async function deleteTag(tagId: string) {
  await prisma.tag.delete({ where: { id: tagId } })
  revalidatePath("/")
}

export async function createColumn(name: string, boardId: string) {
  const count = await prisma.column.count({ where: { boardId } })
  const newColumn = await prisma.column.create({
    data: { name, order: count, boardId },
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
  await prisma.column.delete({ where: { id: columnId } })
  if (column) {
    await recordActivity("COLUMN_DELETED", `Deleted column "${column.name}"`)
  }
  revalidatePath("/")
}

export async function createBoard(name: string, isMaster: boolean = false) {
  const workspace = await prisma.workspace.findFirst()
  if (!workspace) return

  const defaultCols = isMaster
    ? [{ name: "To Do", order: 0 }, { name: "In Progress", order: 1 }, { name: "Done", order: 2 }]
    : [{ name: "Backlog", order: 0 }, { name: "In Progress", order: 1 }, { name: "Done", order: 2 }]

  const board = await prisma.board.create({
    data: {
      name,
      isMaster,
      workspaceId: workspace.id,
      columns: { create: defaultCols },
    },
  })

  await recordActivity("BOARD_CREATED", `Created new ${isMaster ? "Rollup" : "Team"} board "${name}"`)
  revalidatePath("/")
  return board
}

// User Management Actions (Admin Only)
export async function createUser(data: { name: string; email: string; password: string; role: Role }) {
  const actor = await getActor()
  if (actor.role !== "ADMIN") throw new Error("Unauthorized")

  const passwordHash = await bcrypt.hash(data.password, 10)
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
    },
  })

  await recordActivity("USER_CREATED", `Provisioned ${data.role} account for "${data.name}" (${data.email})`)
  revalidatePath("/")
  return user
}

export async function toggleUserRole(userId: string, currentRole: Role) {
  const actor = await getActor()
  if (actor.role !== "ADMIN") throw new Error("Unauthorized")

  const newRole: Role = currentRole === "ADMIN" ? "MEMBER" : "ADMIN"
  const user = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  })

  await recordActivity("ROLE_CHANGED", `Changed role for "${user.name}" to ${newRole}`)
  revalidatePath("/")
  return user
}