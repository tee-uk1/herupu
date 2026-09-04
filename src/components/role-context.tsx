"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useSession } from "next-auth/react"

type RoleContextType = {
  isAdmin: boolean
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>
}

const RoleContext = createContext<RoleContextType>({
  isAdmin: false,
  setIsAdmin: () => {},
})

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const userRole = (session?.user as any)?.role
  const [isAdmin, setIsAdmin] = useState(userRole === "ADMIN")

  useEffect(() => {
    if (userRole) {
      setIsAdmin(userRole === "ADMIN")
    }
  }, [userRole])

  return (
    <RoleContext.Provider value={{ isAdmin, setIsAdmin }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}