import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { UserProfileButton } from "@/components/user-profile-button"
import { prisma } from "@/lib/prisma"
import { ColumnItem } from "@/components/kanban-board"
import { WorkspaceView } from "@/components/workspace-view"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { CreateBoardDialog } from "@/components/create-board-dialog"
import { ActivityItem } from "@/components/activity-log-drawer"
import { TaskItem } from "@/components/kanban-card"
import { LayoutDashboard, Users, Layers } from "lucide-react"
import Link from "next/link"

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
  let boards = await prisma.board.findMany({
    orderBy: { createdAt: "asc" },
  })

  // Auto-seed if database has no boards yet
  if (boards.length === 0) {
    const ws = await prisma.workspace.create({
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
    boards = ws.boards
  }

  const currentBoardId = resolvedParams.boardId || boards[0]?.id

  const archivedTasks = await prisma.task.findMany({ where: { isArchived: true }, orderBy: { updatedAt: 'desc' } })
  const [currentBoard, tags, activities, allPinnedTasks] = await Promise.all([
    prisma.board.findUnique({
      where: { id: currentBoardId },
      include: {
        columns: { orderBy: { order: "asc" },
          include: {
            tasks: {
              where: { isArchived: false }, orderBy: { order: "asc" },
              include: {
                tags: true,
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
    // Fetch all pinned tasks from other boards for rollup
    prisma.task.findMany({
      where: { isPinnedToMaster: true, isArchived: false },
      include: {
        tags: true,
        subtasks: { orderBy: { createdAt: "asc" } },
        comments: { orderBy: { createdAt: "asc" } },
        column: { include: { board: true } },
      },
    }),
  ])

  // Rollup logic: If current board is Master, merge pinned tasks into corresponding columns
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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8 flex flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Herupu</h1>
            <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
              Workspaces
            </span>
          </div>

          {/* Board Selector Tabs */}
          <div className="flex items-center gap-1 mt-2">
            {boards.map((b) => {
              const isActive = b.id === currentBoardId
              return (
                <Link
                  key={b.id}
                  href={`/?boardId=${b.id}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? b.isMaster
                        ? "bg-purple-900/40 text-purple-200 border border-purple-700/60 shadow-xs"
                        : "bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-xs"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  }`}
                >
                  {b.isMaster ? (
                    <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" />
                  ) : (
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span>{b.name}</span>
                  {b.isMaster && (
                    <span className="text-[9px] uppercase tracking-wider bg-purple-500/20 text-purple-300 px-1 rounded">
                      Rollup
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
            <CreateBoardDialog />
        </div>

        <div className="flex items-center gap-3">
          <CreateTaskDialog
          columns={columns.map((c) => ({ id: c.id, name: c.name }))}
          availableTags={tags}
          />
          <UserProfileButton user={session.user as any} />
        </div>
      </header>

      <section>
        <WorkspaceView
          initialColumns={columns}
          availableTags={tags}
          activities={activities as unknown as ActivityItem[]}
          archivedTasks={archivedTasks as unknown as TaskItem[]}
        />
      </section>
    </main>
  )
}




