"use client"

import React, { useState } from "react"
import { Plus, X, Loader2, LayoutDashboard } from "lucide-react"
import { createBoard } from "@/app/actions"
import { useRouter } from "next/navigation"

export function CreateBoardDialog({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState("")
  const [isMaster, setIsMaster] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  if (!isAdmin) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || isPending) return

    setIsPending(true)
    const board = await createBoard(trimmed, isMaster)
    setIsPending(false)
    setName("")
    setIsMaster(false)
    setIsOpen(false)
    if (board) {
      router.push(`/?boardId=${board.id}`)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-dashed border-zinc-800 hover:border-zinc-700 transition-all"
        title="Create new team workspace"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>+ New Workspace</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Create Team Workspace</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Workspace Name</label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Frontend Team, QA & Testing, Operations..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-colors">
                <input
                  type="checkbox"
                  checked={isMaster}
                  onChange={(e) => setIsMaster(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded bg-zinc-900 border-zinc-700 text-purple-600 focus:ring-0 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-zinc-200 flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5 text-purple-400" /> Executive Rollup Workspace
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    If checked, this board will aggregate pinned tasks from all team boards
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || isPending}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
