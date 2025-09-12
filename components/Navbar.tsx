"use client"

import { Bell, User, Sun, Moon, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import axios from "@/lib/axios"

interface UserType {
  id: number
  name: string
  email: string
  role?: string
}

export default function Navbar({ isOpen }: { isOpen: boolean }) {
  const [user, setUser] = useState<UserType | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchUser()
    setNotificationCount(3) // exemple statique
  }, [])

  const fetchUser = async () => {
    try {
      const res = await axios.get("/auth/currentUser")
      setUser(res.data)
    } catch (err) {
      console.error("Utilisateur non connecté", err)
      router.push("/login")
    }
  }

  const getCurrentDate = () =>
    new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout")
      router.push("/login")
    } catch (err) {
      console.error("Erreur lors de la déconnexion", err)
    }
  }

  // ----------------------
  // Skeleton si user null
  // ----------------------
  if (!user) {
    return (
      <header className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-b border-gray-400 dark:border-gray-800 sticky top-0 z-40">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="animate-pulse h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="flex items-center gap-3">
            <div className="animate-pulse h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="animate-pulse h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </header>
    )
  }

  // ----------------------
  // Navbar avec user
  // ----------------------
  return (
    <header className="bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="pl-4 sm:pl-6 pr-4 sm:pr-6 w-full">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Date */}
          <div className="flex items-center gap-6"></div>

          {/* Actions (notifications, thème, user) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <button
              className="relative p-2 rounded-full text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4 text-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Dark / Light mode */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2 rounded-full text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label="Basculer thème"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
            )}

            {/* User dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 text-sm rounded-full focus:outline-none group"
                id="user-menu"
                aria-haspopup="true"
                aria-expanded={showMenu}
              >
                <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                  <User className="h-5 w-5" />
                </div>
                {isOpen && (
                  <>
                    <span className="hidden md:inline-block font-medium text-gray-700 dark:text-gray-200">
                      {user.name}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-gray-500 transition-transform ${showMenu ? "rotate-180" : ""}`}
                    />
                  </>
                )}
              </button>

              {showMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-lg focus:outline-none z-50"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                >
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="py-1" role="none">
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
                      role="menuitem"
                    >
                      Mon profil
                    </a>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
                      role="menuitem"
                    >
                      Paramètres
                    </a>
                  </div>
                  <div className="py-1" role="none">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      role="menuitem"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
