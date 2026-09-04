"use client"

import React from "react"
import { Search, X, Filter } from "lucide-react"
import { TagItem } from "./kanban-card"

export type FilterState = {
  search: string
  priorities: string[]
  tagIds: string[]
}

const priorityOptions = [
  { value: "URGENT", label: "Urgent", color: "border-red-500/40 text-red-400 bg-red-950/20" },
  { value: "HIGH", label: "High", color: "border-amber-500/40 text-amber-400 bg-amber-950/20" },
  { value: "MEDIUM", label: "Medium", color: "border-blue-500/40 text-blue-400 bg-blue-950/20" },
  { value: "LOW", label: "Low", color: "border-zinc-500/40 text-zinc-400 bg-zinc-800/40" },
]

export function WorkspaceFilterBar({
  filters,
  onChange,
  availableTags,
}: {
  filters: FilterState
  onChange: (filters: FilterState) => void
  availableTags: TagItem[]
}) {
  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.priorities.length > 0 ||
    filters.tagIds.length > 0

  const togglePriority = (p: string) => {
    const next = filters.priorities.includes(p)
      ? filters.priorities.filter((item) => item !== p)
      : [...filters.priorities, p]
    onChange({ ...filters, priorities: next })
  }

  const toggleTag = (id: string) => {
    const next = filters.tagIds.includes(id)
      ? filters.tagIds.filter((item) => item !== id)
      : [...filters.tagIds, id]
    onChange({ ...filters, tagIds: next })
  }

  const handleReset = () => {
    onChange({ search: "", priorities: [], tagIds: [] })
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/80 text-xs">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Filter tasks by name or ID..."
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-blue-500 rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: "" })}
            className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="h-4 w-px bg-zinc-800 hidden sm:block" />

      {/* Priority Filters */}
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-500 text-[11px] font-medium mr-1 hidden md:inline">Priority:</span>
        {priorityOptions.map((opt) => {
          const active = filters.priorities.includes(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => togglePriority(opt.value)}
              className={`px-2 py-1 rounded text-[11px] font-medium border transition-all ${
                active
                  ? `${opt.color} ring-1 ring-white/20`
                  : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 bg-zinc-950/40"
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Tag Filters */}
      {availableTags.length > 0 && (
        <>
          <div className="h-4 w-px bg-zinc-800 hidden md:block" />
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-zinc-500 text-[11px] font-medium mr-1 hidden md:inline">Tags:</span>
            {availableTags.map((tag) => {
              const active = filters.tagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                    active ? "ring-2 ring-white/30 scale-105" : "opacity-60 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: `${tag.color}20`,
                    borderColor: `${tag.color}50`,
                    color: tag.color,
                  }}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Reset Button */}
      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="ml-auto flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded transition-colors"
        >
          <X className="w-3 h-3" />
          Reset
        </button>
      )}
    </div>
  )
}