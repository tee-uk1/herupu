"use client"

import React, { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ShieldCheck, User, Lock, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (res?.error) {
      setError("Invalid email or password.")
      setLoading(false)
    } else {
      router.push("/")
      router.refresh()
    }
  }

  const fillCredentials = (role: "admin" | "member") => {
    if (role === "admin") {
      setEmail("admin@herupu.local")
      setPassword("admin123")
    } else {
      setEmail("member@herupu.local")
      setPassword("member123")
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-100">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-1.5">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
            H
          </div>
          <h1 className="text-lg font-bold tracking-tight text-zinc-100">Sign in to Herupu</h1>
          <p className="text-xs text-zinc-400">Collaborative team workspace</p>
        </div>

        {error && (
          <div className="p-2.5 rounded bg-red-950/60 border border-red-800/80 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Email</label>
            <div className="relative flex items-center">
              <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@team.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-1 w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Sign In
          </button>
        </form>

        <div className="pt-2 border-t border-zinc-800 flex flex-col gap-2">
          <span className="text-[10px] text-zinc-500 text-center uppercase tracking-wider font-semibold">
            Quick Fill Demo Accounts
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("admin")}
              className="px-2.5 py-1.5 rounded border border-purple-800/60 bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 text-xs font-medium flex items-center justify-center gap-1"
            >
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("member")}
              className="px-2.5 py-1.5 rounded border border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 text-xs font-medium flex items-center justify-center gap-1"
            >
              <User className="w-3 h-3 text-zinc-400" />
              Member
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}