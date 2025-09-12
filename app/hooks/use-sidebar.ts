"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarState {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggle: () => void
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set: (partial: Partial<SidebarState>) => void, get: () => SidebarState) => ({
      isOpen: true,
      setIsOpen: (open: boolean) => {
        set({ isOpen: open })
        if (typeof window !== "undefined") {
          localStorage.setItem("sidebar-open", open.toString())
        }
      },
      toggle: () => {
        const newState = !get().isOpen
        set({ isOpen: newState })
        if (typeof window !== "undefined") {
          localStorage.setItem("sidebar-open", newState.toString())
        }
      },
    }),
    {
      name: "sidebar-state",
    },
  ),
)
