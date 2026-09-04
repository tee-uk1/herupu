import { prisma } from "@/lib/prisma"
import { ColumnItem } from "@/components/kanban-board"
import { WorkspaceView } from "@/components/workspace-view"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { ActivityItem } from "@/components/activity-log-drawer"
import { TaskItem, UserItem } from "@/components/kanban-card"
import { Sidebar } from "@/components/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { UserProfileButton } from "@/components/user-profile-button"
import { FolderOpen, ChevronRight, Layers } from "lucide-react"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ boardId?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const resolvedParams = await searchParams
  let workspace = await prisma.workspace.findFirst({
    include: { boards: { orderBy: { createdAt: "asc" } } },
  })

  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: "Engineering Org",
        boards: {
          create: [
            {
              name: "Central Master Board",
              isMaster: true,
              columns: {
                create: [
                  { name: "To Do", order: 0 },
                  { name: "In Progress", order: 1 },
                  { name: "Done", order: 2 },
                ],
              },
            },
            {
              name: "Frontend Team",
              isMaster: false,
              columns: {
                create: [
                  { name: "Backlog", order: 0 },
                  { name: "Active Sprint", order: 1 },
                  { name: "Shipped", order: 2 },
                ],
              },
            },
            {
              name: "Backend Team",
              isMaster: false,
              columns: {
                create: [
                  { name: "Triage", order: 0 },
                  { name: "In Development", order: 1 },
                  { name: "Deployed", order: 2 },
                ],
              },
            },
          ],
        },
      },
      include: { boards: true },
    })
  }

  const boards = workspace.boards
  const currentBoardId = resolvedParams.boardId || boards[0]?.id
  const currentBoardObj = boards.find((b) => b.id === currentBoardId) || boards[0]

  const archivedTasks = await prisma.task.findMany({
    where: { isArchived: true },
    orderBy: { updatedAt: "desc" },
    include: { tags: true, assignedTo: true },
  })

  const [currentBoard, tags, activities, allPinnedTasks, users] = await Promise.all([
    prisma.board.findUnique({
      where: { id: currentBoardId },
      include: {
        columns: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              where: { isArchived: false },
              orderBy: { order: "asc" },
              include: {
                tags: true,
                assignedTo: true,
                subtasks: { orderBy: { createdAt: "asc" } },
                comments: { orderBy: { createdAt: "asc" } },
              },
            },
          },
        },
      },
    }),
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.task.findMany({
      where: { isPinnedToMaster: true, isArchived: false },
      include: {
        tags: true,
        assignedTo: true,
        subtasks: { orderBy: { createdAt: "asc" } },
        comments: { orderBy: { createdAt: "asc" } },
        column: { include: { board: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
  ])

  let columns: ColumnItem[] = (currentBoard?.columns as unknown as ColumnItem[]) ?? []

  if (currentBoard?.isMaster && columns.length > 0) {
    const firstCol = columns[0]
    const otherBoardPinnedTasks = allPinnedTasks
      .filter((t) => t.column.boardId !== currentBoard.id)
      .map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        order: t.order,
        columnId: firstCol.id,
        dueDate: t.dueDate,
        tags: t.tags,
        assignedToId: t.assignedToId,
        assignedTo: t.assignedTo,
        subtasks: t.subtasks,
        comments: t.comments,
        isPinnedToMaster: t.isPinnedToMaster,
        originBoardName: t.column.board.name,
      }))

    columns = columns.map((col, idx) => {
      if (idx === 0) {
        return {
          ...col,
          tasks: [...col.tasks, ...otherBoardPinnedTasks],
        }
      }
      return col
    })
  }

  const isAdmin = (session?.user as any)?.role === "ADMIN"

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 flex relative overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* Left Sidebar */}
      <Sidebar
        boards={boards.map((b) => ({ id: b.id, name: b.name, isMaster: b.isMaster }))}
        currentBoardId={currentBoardId}
        organizationName={workspace.name}
        isAdmin={isAdmin}
      />

      {/* Ambient Background Glow */}
      <div className="pointer-events-none fixed top-0 right-1/4 w-[600px] h-[350px] bg-gradient-to-b from-indigo-600/10 via-purple-600/5 to-transparent blur-[120px] -z-0" />
      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-14 px-8 border-b border-zinc-800/60 flex items-center justify-between gap-4 shrink-0 bg-[#0c0d0f]/80 backdrop-blur-md sticky top-0 z-20">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs min-w-0">
            <span className="font-semibold text-zinc-400">Team Workspaces</span>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              {currentBoardObj?.isMaster ? (
                <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              ) : (
                <FolderOpen className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              <span className="font-bold text-zinc-100 truncate">
                {currentBoardObj?.name}
              </span>
            </div>
            {currentBoardObj?.isMaster && (
              <span className="text-[10px] tracking-wider uppercase bg-purple-950/60 border border-purple-800/60 text-purple-300 px-1.5 py-0.5 rounded font-mono ml-1 shrink-0">
                Rollup
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <CreateTaskDialog
              columns={columns.map((c) => ({ id: c.id, name: c.name }))}
              availableTags={tags}
            />
            <UserProfileButton user={session.user as any} />
          </div>
        </header>

        {/* Board / List Body */}
        <main className="flex-1 p-8 overflow-y-auto">
          <WorkspaceView
            initialColumns={columns}
            availableTags={tags}
            availableUsers={users as unknown as UserItem[]}
            activities={activities as unknown as ActivityItem[]}
            archivedTasks={archivedTasks as unknown as TaskItem[]}
            currentUserRole={(session.user as any)?.role || "MEMBER"}
          />
        </main>
      </div>
    </div>
  )
}
