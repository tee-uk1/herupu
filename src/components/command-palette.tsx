"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { Search, LayoutGrid, List, Plus, CheckSquare, ArrowRight, CornerDownLeft } from "lucide-react"
import { TaskItem } from "./kanban-card"

type ActionItem = {
  id: string
  title: string
  subtitle?: string
  icon: React.ReactNode
  onSelect: () => void
}

export function CommandPalette({
  isOpen,
  onClose,
  tasks,
  onSelectTask,
  onSwitchView,
  onOpenCreateTask,
}: {
  isOpen: boolean
  onClose: () => void
  tasks: TaskItem[]
  onSelectTask: (task: TaskItem) => void
  onSwitchView: (view: "board" | "list") => void
  onOpenCreateTask: () => void
}) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Build combined items: Quick Actions + Matching Tasks
  const items: ActionItem[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    const actions: ActionItem[] = [
      {
        id: "action-new-task",
        title: "Create New Task",
        subtitle: "Add a task to the project",
        icon: <Plus className="w-4 h-4 text-blue-400" />,
        onSelect: () => {
          onClose()
          onOpenCreateTask()
        },
      },
      {
        id: "action-switch-board",
        title: "Switch to Board View",
        subtitle: "Kanban drag-and-drop columns",
        icon: <LayoutGrid className="w-4 h-4 text-amber-400" />,
        onSelect: () => {
          onClose()
          onSwitchView("board")
        },
      },
      {
        id: "action-switch-list",
        title: "Switch to List View",
        subtitle: "Compact grouped table",
        icon: <List className="w-4 h-4 text-emerald-400" />,
        onSelect: () => {
          onClose()
          onSwitchView("list")
        },
      },
    ]

    const filteredActions = actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(q))
    )

    const matchingTasks: ActionItem[] = tasks
      .filter((t) => {
        if (!q) return true
        const matchTitle = t.title.toLowerCase().includes(q)
        const matchDesc = t.description?.toLowerCase().includes(q)
        const matchId = `herupu-${t.id.slice(-4)}`.toLowerCase().includes(q)
        return matchTitle || matchDesc || matchId
      })
      .slice(0, 8)
      .map((t) => ({
        id: `task-${t.id}`,
        title: t.title,
        subtitle: `HERUPU-${t.id.slice(-4)} • ${t.priority}`,
        icon: <CheckSquare className="w-4 h-4 text-zinc-400" />,
        onSelect: () => {
          onClose()
          onSelectTask(t)
        },
      }))

    return [...filteredActions, ...matchingTasks]
  }, [query, tasks, onClose, onSelectTask, onSwitchView, onOpenCreateTask])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % (items.length || 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + items.length) % (items.length || 1))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (items[selectedIndex]) {
        items[selectedIndex].onSelect()
      }
    } else if (e.key === "Escape") {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-zinc-800 gap-3">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search tasks..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 outline-none"
          />
          <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-zinc-800/40">
          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500">
              No matching commands or tasks found
            </div>
          ) : (
            items.map((item, index) => {
              const isSelected = index === selectedIndex
              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-xs ${
                    isSelected ? "bg-blue-600/20 text-blue-100 border border-blue-500/30" : "text-zinc-300 hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="shrink-0">{item.icon}</span>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium truncate">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-[11px] text-zinc-500 truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-2" />
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-950/60 border-t border-zinc-800 text-[10px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">↑↓</kbd> to navigate</span>
            <span><kbd className="font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-300">↵</kbd> to select</span>
          </div>
          <span>Command Palette</span>
        </div>
      </div>
    </div>
  )
}