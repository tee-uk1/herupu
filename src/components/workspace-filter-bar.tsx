"use client"

import React from "react"
import { Search, X, Tag as TagIcon, UserCheck, SlidersHorizontal } from "lucide-react"
import { TagItem } from "./kanban-card"

export type FilterState = {
  search: string
  priorities: ("LOW" | "MEDIUM" | "HIGH" | "URGENT")[]
  tagIds: string[]
  assignedToMe?: boolean
}

const priorities: { value: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; label: string; activeColor: string }[] = [
  { value: "URGENT", label: "Urgent", activeColor: "text-rose-300 border-rose-700/60 bg-rose-950/40 shadow-xs shadow-rose-900/30" },
  { value: "HIGH", label: "High", activeColor: "text-amber-300 border-amber-700/60 bg-amber-950/40 shadow-xs shadow-amber-900/30" },
  { value: "MEDIUM", label: "Medium", activeColor: "text-indigo-300 border-indigo-700/60 bg-indigo-950/40 shadow-xs shadow-indigo-900/30" },
  { value: "LOW", label: "Low", activeColor: "text-zinc-300 border-zinc-600/60 bg-zinc-800/60" },
]

export function WorkspaceFilterBar({
  filters,
  onChange,
  availableTags = [],
}: {
  filters: FilterState
  onChange: (filters: FilterState) => void
  availableTags?: TagItem[]
}) {
  const togglePriority = (p: "LOW" | "MEDIUM" | "HIGH" | "URGENT") => {
    const next = filters.priorities.includes(p)
      ? filters.priorities.filter((x) => x !== p)
      : [...filters.priorities, p]
    onChange({ ...filters, priorities: next })
  }

  const toggleTag = (tagId: string) => {
    const next = filters.tagIds.includes(tagId)
      ? filters.tagIds.filter((x) => x !== tagId)
      : [...filters.tagIds, tagId]
    onChange({ ...filters, tagIds: next })
  }

  const hasActiveFilters =
    filters.search.length > 0 ||
    filters.priorities.length > 0 ||
    filters.tagIds.length > 0 ||
    Boolean(filters.assignedToMe)

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#0e1014]/60 backdrop-blur-md border border-white/[0.06] p-2 rounded-xl shadow-xs">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
        {/* Search */}
        <div className="relative flex items-center min-w-[200px] max-w-sm flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search tasks, notes, HERUPU-ID..."
            className="w-full bg-black/40 border border-white/[0.06] focus:border-indigo-500/60 rounded-lg pl-8 pr-12 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition-all focus:ring-1 focus:ring-indigo-500/30"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-zinc-500 bg-white/[0.05] border border-white/[0.08] px-1 py-0.2 rounded pointer-events-none">
            ⌘K
          </kbd>
        </div>

        {/* My Tasks Toggle */}
        <button
          onClick={() => onChange({ ...filters, assignedToMe: !filters.assignedToMe })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            filters.assignedToMe
              ? "bg-indigo-950/60 border-indigo-500 text-indigo-200 shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/30"
              : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>My Tasks</span>
        </button>

        {/* Priorities */}
        <div className="flex items-center gap-1 bg-black/30 border border-white/[0.05] p-0.5 rounded-lg">
          {priorities.map((p) => {
            const isSelected = filters.priorities.includes(p.value)
            return (
              <button
                key={p.value}
                onClick={() => togglePriority(p.value)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                  isSelected
                    ? p.activeColor
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Tags */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-1 pl-2 border-l border-white/[0.06]">
            <TagIcon className="w-3 h-3 text-zinc-500 mr-0.5" />
            {availableTags.map((tag) => {
              const isSelected = filters.tagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all font-medium ${
                    isSelected
                      ? "ring-1 ring-white/50 opacity-100 scale-105 shadow-xs"
                      : "opacity-40 hover:opacity-80"
                  }`}
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: `${tag.color}45`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <button
          onClick={() => onChange({ search: "", priorities: [], tagIds: [], assignedToMe: false })}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-rose-400 px-2 py-1 rounded hover:bg-rose-950/20 transition-colors"
        >
          <X className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  )
}