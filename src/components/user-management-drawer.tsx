"use client"

import React, { useState } from "react"
import { Users, X, UserPlus, Shield, ShieldCheck, User as UserIcon, Loader2 } from "lucide-react"
import { UserItem } from "./kanban-card"
import { createUser, toggleUserRole } from "@/app/actions"

export function UserManagementDrawer({
  isOpen,
  onClose,
  users,
}: {
  isOpen: boolean
  onClose: () => void
  users: UserItem[]
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!isOpen) return null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await createUser({ name, email, password, role })
      setName("")
      setEmail("")
      setPassword("")
      setRole("MEMBER")
    } catch (err: any) {
      setError(err?.message || "Failed to create user.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-zinc-900 border-l border-zinc-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Team Directory ({users.length})</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Create User Form */}
          <form onSubmit={handleCreate} className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800 flex flex-col gap-3">
            <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-blue-400" /> Provision Team Member
            </span>

            {error && (
              <span className="text-[11px] text-red-400 bg-red-950/50 p-2 rounded border border-red-800">{error}</span>
            )}

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@herupu.local"
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Temporary Password"
                className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1.5 text-xs text-zinc-200 outline-none focus:border-blue-500"
              >
                <option value="MEMBER">Member Role</option>
                <option value="ADMIN">Admin Role</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              Create Account
            </button>
          </form>

          {/* User List */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-zinc-400">Existing Members</span>
            <div className="divide-y divide-zinc-800/60 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/40">
              {users.map((u) => (
                <div key={u.id} className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                        u.role === "ADMIN"
                          ? "bg-purple-950/60 text-purple-300 border-purple-700/60"
                          : "bg-blue-950/60 text-blue-300 border-blue-700/60"
                      }`}
                    >
                      {(u.name || u.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium text-zinc-200 truncate">{u.name || "No name"}</span>
                      <span className="text-[10px] text-zinc-500 truncate">{u.email}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleUserRole(u.id, u.role)}
                    className={`px-2 py-1 rounded text-[10px] font-medium border flex items-center gap-1 transition-colors ${
                      u.role === "ADMIN"
                        ? "bg-purple-950/60 text-purple-300 border-purple-800 hover:bg-purple-900/60"
                        : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
                    }`}
                    title="Click to toggle role"
                  >
                    {u.role === "ADMIN" ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-purple-400" /> Admin
                      </>
                    ) : (
                      <>
                        <UserIcon className="w-3 h-3 text-zinc-400" /> Member
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}