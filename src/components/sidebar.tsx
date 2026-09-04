"use client"

import React, { useState } from "react"
import Link from "next/link"
import {
  Home,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Layers,
  Inbox,
  Shield,
  Briefcase,
} from "lucide-react"
import { CreateBoardDialog } from "./create-board-dialog"

type WorkspaceNav = {
  id: string
  name: string
  isMaster: boolean
}

export function Sidebar({
  boards,
  currentBoardId,
  organizationName = "Engineering Org",
  isAdmin = false,
}: {
  boards: WorkspaceNav[]
  currentBoardId: string
  organizationName?: string
  isAdmin?: boolean
}) {
  const [workspacesOpen, setWorkspacesOpen] = useState(true)
  const masterWorkspaces = boards.filter((b) => b.isMaster)
  const teamWorkspaces = boards.filter((b) => !b.isMaster)

  return (
    <aside className="w-64 bg-[#0c0d0f] border-r border-zinc-800/60 flex shrink-0 select-none flex-col h-screen sticky top-0 font-sans">
      {/* HERUPU Brand & Workspace Header */}
      <div className="h-14 px-4 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-950/40 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <span className="font-extrabold text-xs tracking-tighter">H</span>
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wider uppercase text-zinc-100">
                HERUPU
              </span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-indigo-950/70 border border-indigo-700/50 text-indigo-300">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 truncate leading-none mt-0.5">
              {organizationName}
            </span>
          </div>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer shrink-0" />
      </div>

      {/* Navigation Body */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-5 text-xs">
        {/* Quick Launch */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 cursor-pointer transition-colors group">
            <div className="flex items-center gap-2.5">
              <Home className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              <span className="font-medium">Home Overview</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 cursor-pointer transition-colors group">
            <div className="flex items-center gap-2.5">
              <Inbox className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
              <span className="font-medium">Inbox & Notifications</span>
            </div>
          </div>
        </div>

        {/* Team Workspaces Hierarchy */}
        <div className="flex flex-col gap-1">
          <div
            onClick={() => setWorkspacesOpen(!workspacesOpen)}
            className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold tracking-widest text-zinc-400 uppercase cursor-pointer hover:text-zinc-300 transition-colors"
          >
            <div className="flex items-center gap-1.5">
              {workspacesOpen ? (
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-zinc-400" />
              )}
              <span>Team Workspaces</span>
            </div>
            {isAdmin && (
              <span className="text-[9px] text-purple-400 font-mono tracking-normal lowercase flex items-center gap-0.5">
                <Shield className="w-2.5 h-2.5" /> admin
              </span>
            )}
          </div>

          {workspacesOpen && (
            <div className="flex flex-col gap-1 mt-1">
              {/* Executive / Rollup Section */}
              {masterWorkspaces.length > 0 && (
                <div className="flex flex-col gap-0.5 mb-1.5">
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-purple-400/90">
                    <Layers className="w-3 h-3 text-purple-400" />
                    <span>Executive Rollups</span>
                  </div>
                  {masterWorkspaces.map((w) => {
                    const isActive = w.id === currentBoardId
                    return (
                      <Link
                        key={w.id}
                        href={`/?boardId=${w.id}`}
                        className={`group flex items-center justify-between px-2.5 py-1.5 ml-1.5 rounded-md transition-all ${
                          isActive
                            ? "bg-purple-950/40 text-purple-200 border border-purple-800/60 font-medium shadow-xs"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <LayoutDashboard
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? "text-purple-400" : "text-zinc-400 group-hover:text-purple-400"
                            }`}
                          />
                          <span className="truncate">{w.name}</span>
                        </div>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-purple-900/40 text-purple-300">
                          master
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )}

              {/* Team Workspace Folders */}
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-wider text-zinc-400">
                  <Briefcase className="w-3 h-3 text-zinc-400" />
                  <span>Workspaces</span>
                </div>
                {teamWorkspaces.map((w) => {
                  const isActive = w.id === currentBoardId
                  return (
                    <Link
                      key={w.id}
                      href={`/?boardId=${w.id}`}
                      className={`group flex items-center gap-2 px-2.5 py-1.5 ml-1.5 rounded-md transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-blue-950/50 to-indigo-950/30 text-zinc-100 border border-blue-800/50 font-medium shadow-xs"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50"
                      }`}
                    >
                      {isActive ? (
                        <FolderOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      ) : (
                        <Folder className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-400 shrink-0 transition-colors" />
                      )}
                      <span className="truncate">{w.name}</span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Admin Quick Add */}
        {isAdmin && (
          <div className="px-1.5 pt-1">
            <CreateBoardDialog isAdmin={isAdmin} />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-zinc-800/60 bg-zinc-950/50 flex items-center justify-between text-[10px] text-zinc-400 font-mono">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-400">HERUPU Core</span>
        </div>
        <span className="bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-400">
          50 Team Seats
        </span>
      </div>
    </aside>
  )
}