import { prisma } from "@/lib/prisma"
import { WorkspaceView } from "@/components/workspace-view"
import { GanttView } from "@/components/gantt-view"
import { DocumentEditor } from "@/components/document-editor"
import { Sidebar } from "@/components/sidebar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Kanban, FileText, Plus, ChevronRight, CalendarRange, Layers, Trash2 } from "lucide-react"
import { createDocument, updateDocument, deleteDocument } from "@/app/actions"
import { UserProfileButton } from "@/components/user-profile-button"

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ boardId?: string; docId?: string; view?: string }>
}) {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const resolvedParams = await searchParams
  const isAdmin = session.user.role === "ADMIN"
  const currentView = resolvedParams.view || "board"
  const isEverything = resolvedParams.boardId === "everything"

  let workspace = await prisma.workspace.findFirst({
    where: { name: "The Job Hackers" },
    include: {
      boards: {
        orderBy: { createdAt: "asc" },
        include: {
          documents: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  })

  if (!workspace) {
    workspace = await prisma.workspace.findFirst({
      orderBy: { createdAt: "desc" },
      include: {
        boards: {
          orderBy: { createdAt: "asc" },
          include: {
            documents: { orderBy: { createdAt: "asc" } },
          },
        },
      },
    })
  }

  if (!workspace || workspace.boards.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#08090d] text-zinc-500 font-mono text-xs tracking-wider uppercase">
        Workspace initializing...
      </div>
    )
  }

  const requestedBoardId = resolvedParams.boardId
  const currentBoard = isEverything
    ? null
    : workspace.boards.find((b) => b.id === requestedBoardId) ||
      workspace.boards.find((b) => b.isMaster) ||
      workspace.boards[0]

  const activeDocId = resolvedParams.docId
  const activeDoc = activeDocId && currentBoard
    ? currentBoard.documents.find((d) => d.id === activeDocId)
    : null

  let columns: any[] = []

  // Context 1: GLOBAL EVERYTHING BOARD (aggregates 100% of tasks)
  if (isEverything) {
    const allTasks = await prisma.task.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: "desc" },
      include: {
        tags: true,
        assignedTo: true,
        subtasks: { orderBy: { createdAt: "asc" } },
        comments: { orderBy: { createdAt: "asc" } },
        attachments: { orderBy: { createdAt: "desc" } },
        column: { include: { board: true } },
      },
    })

    const statusBuckets = [
      { id: "everything-howto", name: "HOW TO", order: 0 },
      { id: "everything-requests", name: "REQUESTS (NOT READY)", order: 1 },
      { id: "everything-approved", name: "APPROVED (READY)", order: 2 },
      { id: "everything-doing", name: "DOING", order: 3 },
      { id: "everything-review", name: "REVIEW", order: 4 },
      { id: "everything-done", name: "DONE", order: 5 },
    ]

    columns = statusBuckets.map((bucket) => ({
      ...bucket,
      tasks: allTasks.filter((t) => {
        const colName = (t.column?.name || "").toUpperCase()
        if (bucket.id === "everything-howto") return colName.includes("HOW TO")
        if (bucket.id === "everything-requests") return colName.includes("REQUEST") || colName.includes("STOP")
        if (bucket.id === "everything-approved") return colName.includes("APPROVED") || colName.includes("READY") || colName.includes("START")
        if (bucket.id === "everything-doing") return colName.includes("DOING") || colName.includes("PROGRESS") || colName.includes("KAIZEN")
        if (bucket.id === "everything-review") return colName.includes("REVIEW")
        if (bucket.id === "everything-done") return colName.includes("DONE") || colName.includes("CONTINUE")
        return true
      }),
    }))
  } else if (currentBoard) {
    // Context 2 & 3: Board Columns
    const rawColumns = await prisma.column.findMany({
      where: { boardId: currentBoard.id },
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
            attachments: { orderBy: { createdAt: "desc" } },
            column: { include: { board: true } },
          },
        },
      },
    })

    if (currentBoard.isMaster) {
      // Context 2: MAIN BOARD
      // Native tasks created on the Main Board + tasks ELEVATED from any other board
      const elevatedTasks = await prisma.task.findMany({
        where: {
          isArchived: false,
          isPinnedToMaster: true,
          column: { boardId: { not: currentBoard.id } },
        },
        include: {
          tags: true,
          assignedTo: true,
          subtasks: { orderBy: { createdAt: "asc" } },
          comments: { orderBy: { createdAt: "asc" } },
          attachments: { orderBy: { createdAt: "desc" } },
          column: { include: { board: true } },
        },
      })

      columns = rawColumns.map((col) => {
        const matchingElevated = elevatedTasks.filter((t) => {
          const taskCol = (t.column?.name || "").toUpperCase()
          const masterCol = col.name.toUpperCase()
          return (
            taskCol === masterCol ||
            masterCol.includes(taskCol) ||
            taskCol.includes(masterCol)
          )
        })

        return {
          ...col,
          tasks: [...col.tasks, ...matchingElevated],
        }
      })
    } else {
      // Context 3: INDIVIDUAL WORKING GROUP BOARDS
      // Isolated purely to the tasks created on this specific board
      columns = rawColumns
    }
  }

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } })
  const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } })
  const activityLogs = await prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 40 })
  const archivedTasks = await prisma.task.findMany({
    where: { isArchived: true },
    include: {
      tags: true,
      assignedTo: true,
      subtasks: { orderBy: { createdAt: "asc" } },
      comments: { orderBy: { createdAt: "asc" } },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  })

  async function handleCreateDocHeader() {
    "use server"
    if (!currentBoard || !isAdmin) return
    const newDoc = await createDocument("Untitled Document", {
      boardId: currentBoard.id,
      workspaceId: workspace?.id,
    })
    redirect(`/?boardId=${currentBoard.id}&docId=${newDoc.id}`)
  }

  async function handleSaveDoc(title: string, content: string) {
    "use server"
    if (!activeDocId) return
    await updateDocument(activeDocId, { title, content })
  }

  async function handleDeleteDocHeader() {
    "use server"
    if (!activeDocId || !isAdmin || !currentBoard) return
    await deleteDocument(activeDocId)
    redirect(`/?boardId=${currentBoard.id}`)
  }

  const activeBoardParam = isEverything ? "everything" : (currentBoard?.id || "")

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08090d] text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      <Sidebar
        workspace={workspace}
        boards={workspace.boards}
        currentBoardId={activeBoardParam}
        activeDocId={activeDocId}
        currentUserRole={session.user.role || "MEMBER"}
      />

      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 h-13 border-b border-white/[0.06] bg-[#090a0f]/70 backdrop-blur-xl shrink-0 z-10">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-2 shrink-0">
              {isEverything ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium text-xs">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Global Everything</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs tracking-wide text-zinc-200 uppercase">
                    {currentBoard?.name}
                  </span>
                  {currentBoard?.isMaster && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded">
                      Master Aggregator
                    </span>
                  )}
                </div>
              )}
            </div>

            <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />

            {/* Pill Tabs */}
            <div className="flex items-center gap-1 bg-[#12141c]/80 p-1 rounded-xl border border-white/[0.06] shadow-inner">
              <Link
                href={`/?boardId=${activeBoardParam}&view=board`}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  !activeDocId && currentView === "board"
                    ? "bg-zinc-800/90 text-white shadow-sm border border-white/[0.08]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                }`}
              >
                <Kanban className={`w-3.5 h-3.5 ${!activeDocId && currentView === "board" ? "text-indigo-400" : "text-zinc-500"}`} />
                Board
              </Link>

              <Link
                href={`/?boardId=${activeBoardParam}&view=gantt`}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
                  !activeDocId && currentView === "gantt"
                    ? "bg-zinc-800/90 text-white shadow-sm border border-white/[0.08]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                }`}
              >
                <CalendarRange className={`w-3.5 h-3.5 ${!activeDocId && currentView === "gantt" ? "text-indigo-400" : "text-zinc-500"}`} />
                Timeline
              </Link>

              {/* Doc Tabs */}
              {currentBoard?.documents.map((doc: any) => {
                const isSelected = activeDocId === doc.id
                return (
                  <Link
                    key={doc.id}
                    href={`/?boardId=${currentBoard.id}&docId=${doc.id}`}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all max-w-[170px] truncate shrink-0 ${
                      isSelected
                        ? "bg-zinc-800/90 text-white shadow-sm border border-white/[0.08]"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                    }`}
                  >
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-indigo-400" : "text-zinc-500"}`} />
                    <span className="truncate">{doc.title || "Untitled"}</span>
                  </Link>
                )
              })}

              {isAdmin && !isEverything && (
                <form action={handleCreateDocHeader} className="shrink-0">
                  <button
                    type="submit"
                    title="Add Document"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Doc</span>
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 ml-4">
            {activeDoc && isAdmin && (
              <form action={handleDeleteDocHeader}>
                <button
                  type="submit"
                  title="Delete Document"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </form>
            )}
            <UserProfileButton user={session.user} />
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 flex flex-col h-full w-full min-h-0 min-w-0 overflow-hidden bg-[#08090d]">
          {activeDoc ? (
            <div className="h-full overflow-y-auto p-8 max-w-4xl mx-auto">
              <DocumentEditor
                key={activeDoc.id}
                initialTitle={activeDoc.title}
                initialContent={activeDoc.content}
                onSave={handleSaveDoc}
              />
            </div>
          ) : currentView === "gantt" ? (
            <GanttView key={activeBoardParam + "-gantt"} columns={columns as any} />
          ) : (
            <WorkspaceView
              key={activeBoardParam + "-board"}
              boardId={currentBoard?.id}
              initialColumns={columns as any}
              availableTags={tags as any}
              availableUsers={users as any}
              activities={activityLogs as any}
              archivedTasks={archivedTasks as any}
              currentUserRole={session.user.role || "MEMBER"}
            />
          )}
        </main>
      </div>
    </div>
  )
}