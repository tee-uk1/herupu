"use client"

import React from "react"
import { signOut } from "next-auth/react"
import { LogOut, ShieldCheck, User } from "lucide-react"

export function UserProfileButton({
  user,
}: {
  user: { name?: string | null; email?: string | null; role?: string }
}) {
  const isAdmin = user.role === "ADMIN"

  return (
    <div className="flex items-center gap-2 pl-3 border-l border-zinc-800">
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
            isAdmin
              ? "bg-purple-950/60 text-purple-300 border-purple-700/60"
              : "bg-blue-950/60 text-blue-300 border-blue-700/60"
          }`}
        >
          {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-medium text-zinc-200 leading-none">{user.name}</span>
          <span className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center gap-1">
            {isAdmin ? (
              <span className="text-purple-400 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> Admin
              </span>
            ) : (
              <span className="text-zinc-400 flex items-center gap-0.5">
                <User className="w-2.5 h-2.5" /> Member
              </span>
            )}
          </span>
        </div>
      </div>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/80 rounded transition-colors ml-1"
        title="Sign Out"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}