"use client"

import React from "react"
import { Search, X, Tag as TagIcon } from "lucide-react"
import { TagItem } from "./kanban-card"

export type FilterState = {
  search: string
  priorities: ("LOW" | "MEDIUM" | "HIGH" | "URGENT")[]
  tagIds: string[]
}

const priorities: { value: "LOW" | "MEDIUM" | "HIGH" | "URGENT"; label: string; color: string }[] = [
  { value: "URGENT", label: "Urgent", color: "text-red-400 border-red-800 bg-red-950/40" },
  { value: "HIGH", label: "High", color: "text-amber-400 border-amber-800 bg-amber-950/40" },
  { value: "MEDIUM", label: "Medium", color: "text-blue-400 border-blue-800 bg-blue-950/40" },
  { value: "LOW", label: "Low", color: "text-zinc-400 border-zinc-700 bg-zinc-800/40" },
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
    filters.search.length > 0 || filters.priorities.length > 0 || filters.tagIds.length > 0

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800/80 p-2.5 rounded-lg">
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
        {/* Search input */}
        <div className="relative flex items-center min-w-[180px] max-w-xs flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Filter by title, notes, ID..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder-zinc-500 outline-none focus:border-blue-500"
          />
        </div>

        {/* Priority Filters */}
        <div className="flex items-center gap-1">
          {priorities.map((p) => {
            const isSelected = filters.priorities.includes(p.value)
            return (
              <button
                key={p.value}
                onClick={() => togglePriority(p.value)}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition-all ${
                  isSelected
                    ? p.color
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Tag Filters */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-1 pl-2 border-l border-zinc-800/80">
            <TagIcon className="w-3 h-3 text-zinc-500 mr-0.5" />
            {availableTags.map((tag) => {
              const isSelected = filters.tagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                    isSelected
                      ? "ring-1 ring-white/40 opacity-100 font-medium scale-105"
                      : "opacity-40 hover:opacity-75"
                  }`}
                  style={{
                    backgroundColor: `${tag.color}25`,
                    borderColor: `${tag.color}60`,
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

      {/* Clear Filters Reset */}
      {hasActiveFilters && (
        <button
          onClick={() => onChange({ search: "", priorities: [], tagIds: [] })}
          className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-400 px-2 py-1 rounded hover:bg-zinc-800/50 transition-colors"
        >
          <X className="w-3 h-3" />
          <span>Clear</span>
        </button>
      )}
    </div>
  )
}