"use client"

import { useState, useEffect } from "react"
import { supabase } from "./supabase"

export type AppUser = {
  id: string
  email: string
  owner: "emin" | "emre" | "tuna"
  isAdmin: boolean
}

function emailToAppUser(id: string, email: string): AppUser {
  const lower = email.toLowerCase()
  const isEmin = lower.startsWith("emin")
  const isTuna = lower.startsWith("tuna")
  return {
    id,
    email,
    owner: isEmin ? "emin" : isTuna ? "tuna" : "emre",
    isAdmin: isEmin,
  }
}

export function useCurrentUser() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user
      if (u?.email) setUser(emailToAppUser(u.id, u.email))
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const u = session?.user
      setUser(u?.email ? emailToAppUser(u.id, u.email) : null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

export async function signOut() {
  await supabase.auth.signOut()
}
