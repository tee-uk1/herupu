"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { 
  Kanban,
  FileText, 
  Plus, 
  Layers,
  Trash2,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  RotateCcw
} from "lucide-react"
import { createDocument, deleteDocument } from "@/app/actions"

export function Sidebar({
  workspace,
  boards = [],
  currentBoardId,
  activeDocId,
  currentUserRole = "MEMBER",
}: {
  workspace: any
  boards: any[]
  currentBoardId?: string
  activeDocId?: string
  currentUserRole?: string
}) {
  const router = useRouter()
  const isAdmin = currentUserRole === "ADMIN"
  const isEverythingActive = currentBoardId === "everything" && !activeDocId

  const [workingGroupsOpen, setWorkingGroupsOpen] = useState(true)
  const [triageOpen, setTriageOpen] = useState(true)

  const handleCreateDoc = async (boardId: string) => {
    if (!isAdmin) return
    const doc = await createDocument("Untitled Document", {
      boardId,
      workspaceId: workspace.id,
    })
    router.push(`/?boardId=${boardId}&docId=${doc.id}`)
    router.refresh()
  }

  const handleDeleteDoc = async (e: React.MouseEvent, docId: string, boardId: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAdmin) return

    if (confirm("Delete this document?")) {
      await deleteDocument(docId)
      if (activeDocId === docId) {
        router.push(`/?boardId=${boardId}`)
      }
      router.refresh()
    }
  }

  const workingGroupBoards = boards.filter(
    (b) => b.name !== "Retro Board" && b.name !== "Off-Board Lists"
  )
  const triageBoards = boards.filter(
    (b) => b.name === "Retro Board" || b.name === "Off-Board Lists"
  )

  const renderBoardItem = (board: any, dotColor = "bg-zinc-600") => {
    const isBoardActive = board.id === currentBoardId && !activeDocId

    return (
      <div key={board.id} className="space-y-0.5">
        <div className="group flex items-center justify-between rounded-lg transition-all">
          <Link
            href={`/?boardId=${board.id}`}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium flex-1 truncate transition-all ${
              isBoardActive
                ? "bg-white/[0.08] text-white shadow-sm border border-white/[0.06]"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isBoardActive ? "bg-indigo-400 ring-2 ring-indigo-500/20" : dotColor}`} />
            <span className="truncate">{board.name}</span>
          </Link>

          {isAdmin && (
            <button
              onClick={() => handleCreateDoc(board.id)}
              title="Add Document"
              className="opacity-0 group-hover:opacity-100 p-1 mr-1 hover:bg-white/[0.08] rounded-md text-zinc-400 hover:text-white transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {board.documents && board.documents.length > 0 && (
          <div className="pl-3.5 ml-2.5 space-y-0.5 border-l border-white/[0.06] my-1">
            {board.documents.map((doc: any) => {
              const isDocActive = activeDocId === doc.id
              return (
                <div
                  key={doc.id}
                  className={`group/doc flex items-center justify-between px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    isDocActive
                      ? "bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
                  }`}
                >
                  <Link
                    href={`/?boardId=${board.id}&docId=${doc.id}`}
                    className="flex items-center gap-2 truncate flex-1"
                  >
                    <FileText className={`w-3 h-3 shrink-0 ${isDocActive ? "text-indigo-400" : "text-zinc-500"}`} />
                    <span className="truncate">{doc.title || "Untitled"}</span>
                  </Link>

                  {isAdmin && (
                    <button
                      onClick={(e) => handleDeleteDoc(e, doc.id, board.id)}
                      title="Delete Document"
                      className="opacity-0 group-hover/doc:opacity-100 p-1 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-all text-zinc-500 shrink-0 ml-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className="w-64 border-r border-white/[0.06] bg-[#090a0f] flex flex-col h-full shrink-0 select-none text-zinc-300">
      {/* Workspace Branding Header */}
      <div className="h-13 border-b border-white/[0.06] px-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5 truncate">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xs font-bold text-white shadow-sm shadow-indigo-500/30">
            {workspace?.name?.slice(0, 1) || "J"}
          </div>
          <div className="truncate flex flex-col">
            <span className="font-semibold text-xs text-zinc-200 tracking-tight truncate">
              {workspace?.name || "The Job Hackers"}
            </span>
            <span className="text-[9px] text-zinc-500 font-mono tracking-wider uppercase">Workspace</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
        {/* Everything View */}
        <div>
          <Link
            href="/?boardId=everything"
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isEverythingActive
                ? "bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold shadow-sm"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03]"
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${isEverythingActive ? "text-indigo-400" : "text-zinc-500"}`} />
            <span>Everything</span>
          </Link>
        </div>

        {/* Working Groups Folder */}
        <div className="border-t border-white/[0.05] pt-3">
          <button
            onClick={() => setWorkingGroupsOpen(!workingGroupsOpen)}
            className="w-full flex items-center justify-between px-2 mb-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase hover:text-zinc-300 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              {workingGroupsOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400/80" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-zinc-600" />
              )}
              Working Groups ({workingGroupBoards.length})
            </span>
            {workingGroupsOpen ? (
              <ChevronDown className="w-3 h-3 text-zinc-600" />
            ) : (
              <ChevronRight className="w-3 h-3 text-zinc-600" />
            )}
          </button>

          {workingGroupsOpen && (
            <div className="space-y-0.5">
              {workingGroupBoards.map((board) => renderBoardItem(board, "bg-indigo-500/40"))}
            </div>
          )}
        </div>

        {/* Retro & Off-Board Folder */}
        {triageBoards.length > 0 && (
          <div className="border-t border-white/[0.05] pt-3">
            <button
              onClick={() => setTriageOpen(!triageOpen)}
              className="w-full flex items-center justify-between px-2 mb-2 text-[10px] font-semibold tracking-wider text-zinc-500 uppercase hover:text-zinc-300 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-amber-500/80" />
                Triage & Retro
              </span>
              {triageOpen ? (
                <ChevronDown className="w-3 h-3 text-zinc-600" />
              ) : (
                <ChevronRight className="w-3 h-3 text-zinc-600" />
              )}
            </button>

            {triageOpen && (
              <div className="space-y-0.5">
                {triageBoards.map((board) =>
                  renderBoardItem(
                    board,
                    board.name === "Retro Board" ? "bg-amber-400" : "bg-rose-400"
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}