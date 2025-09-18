"use client"
import { useEffect, useRef, useState } from "react"
import axios from "@/lib/axios"
import {
  Home,
  Plus,
  MapPin,
  Search,
  X,
  MoreVertical,
  Edit,
  Eye,
  Trash2,
  Grid3X3,
  Table,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface Marche {
  id: number
  num_marche: string
  objet: string
  annee: number
  num_boite?: string
  organisme?: string
  type_communaute_publique?: string
  longitude?: number | null
  latitude?: number | null
}

interface PaginationData {
  data: Marche[]
  page: number
  limit: number
  totalPages: number
  totalItems: number
}

export default function MarchesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [marches, setMarches] = useState<Marche[]>([])
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedMarche, setSelectedMarche] = useState<Marche | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [marcheToDelete, setMarcheToDelete] = useState<Marche | null>(null)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(25)
  const [filters, setFilters] = useState({
    num_marche: "",
    objet: "",
    organisme: "",
    annee: "",
    num_boite: "",
    type: "", // correspond à type_communaute_publique côté backend
  })

  const searchCardRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown !== null) {
        const target = event.target as Element
        if (!target.closest(".dropdown-container")) {
          setOpenDropdown(null)
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [openDropdown])

  useEffect(() => {
    if (!showSearch) return

    const onDocClick = (e: MouseEvent) => {
      if (searchCardRef.current && !searchCardRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSearch(false)
    }

    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onEsc)

    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onEsc)
    }
  }, [showSearch])

  useEffect(() => {
    const initializePage = async () => {
      console.log("Initializing marches page...")
      try {
        const userRes = await axios.get("/auth/currentUser")
        console.log("User authenticated:", userRes.data)
        setUser(userRes.data)
        console.log("Loading marches...")
        await fetchMarches()
        console.log("Marches loaded successfully")
      } catch (error) {
  console.error("Error initializing page:", error)
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    router.push("/login")
    return
  }
} finally {
        console.log("Setting loading to false")
        setLoading(false)
      }
    }
    initializePage()
  }, [])

  const fetchMarches = async (page: number = currentPage) => {
    try {
      console.log("Fetching marches with filters:", filters, "page:", page)
      const params: Record<string, string | number> = {
        page,
        limit: itemsPerPage,
      }
      Object.entries(filters).forEach(([key, value]) => {
        const v = (value ?? "").toString().trim()
        if (v !== "") {
          if (key === "annee") {
            const n = Number(v)
            if (!isNaN(n)) params[key] = n
          } else if (key === "type") {
            params["type"] = v
          } else {
            params[key] = v
          }
        }
      })
      const res = await axios.get("/marches", { params })
      const paginationData: PaginationData = res.data
      console.log(
        "Marches fetched:",
        paginationData.data.length,
        "items, page",
        paginationData.page,
        "of",
        paginationData.totalPages,
      )
      setMarches(Array.isArray(paginationData.data) ? paginationData.data : [])
      setCurrentPage(paginationData.page || 1)
      setTotalPages(paginationData.totalPages || 1)
      setTotalItems(paginationData.totalItems || 0)
    } catch (error: unknown) {
      console.error("Erreur chargement marchés", error)
      setMarches([])
      setTotalItems(0)
      setTotalPages(1)
      setCurrentPage(1)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      fetchMarches(newPage)
    }
  }

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1)
    }
  }

  const handleLocaliser = (marche: Marche) => {
    console.log("handleLocaliser called with marche:", marche.id)
    setOpenDropdown(null) // Close dropdown
    if (marche.latitude && marche.longitude) {
      router.push(`/dashboard/map?lat=${marche.latitude}&lng=${marche.longitude}`)
    } else {
      alert("Coordonnées indisponibles pour ce marché")
    }
  }

  const handleDetails = (marche: Marche) => {
    console.log("handleDetails called with marche:", marche.id)
    console.log("Navigating to:", `/dashboard/marches/${marche.id}`)
    setOpenDropdown(null) // Close dropdown
    router.push(`/dashboard/marches/${marche.id}`)
    console.log("Navigation completed")
  }

  const handleModifier = (marche: Marche) => {
    console.log("handleModifier called with marche:", marche.id)
    setOpenDropdown(null) // Close dropdown
    router.push(`/dashboard/marches/${marche.id}/modifier`)
  }

  const handleDelete = async () => {
    if (!marcheToDelete) return

    try {
      await axios.delete(`/marches/${marcheToDelete.id}`)
      setMarches(marches.filter((m) => m.id !== marcheToDelete.id))
      setDeleteConfirmOpen(false)
      setMarcheToDelete(null)
    } catch (error: unknown) {
      console.error("Erreur lors de la suppression:", error)
      alert("Erreur lors de la suppression du marché")
    }
  }

  const openDeleteConfirm = (marche: Marche) => {
    setMarcheToDelete(marche)
    setDeleteConfirmOpen(true)
    setOpenDropdown(null)
  }

  const handleEditSuccess = () => {
    fetchMarches() // Recharger la liste après modification
  }

  useEffect(() => {
    const detectSidebarState = () => {
      const sidebarState = localStorage.getItem("sidebar-open")
      if (sidebarState !== null) {
        setSidebarOpen(sidebarState === "true")
      } else {
        setSidebarOpen(window.innerWidth >= 1024)
      }
    }

    detectSidebarState()

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "sidebar-open") {
        setSidebarOpen(e.newValue === "true")
      }
    }

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen text-gray-500">Chargement...</div>
  }
    
  return (
      <div className="flex min-h-screen" style={{ backgroundColor: "var(--muted-bg)" }}>
        <main
          className="flex-1 transition-all duration-300"
          style={{
            marginLeft: sidebarOpen ? "1rem" : "1rem",
            paddingTop: "0px", // espace pour le header fixe
            paddingBottom: totalPages > 1 ? "80px" : "10px", // espace pour la pagination
          }}
        >
          {/* Sticky header unique */}
          <div className="sticky top-0 z-200 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 ">
            <div className="p-0 py-4 max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              {/* Partie gauche : breadcrumb + description + titre */}
              <div className="flex-1 flex flex-col gap-2">
  <nav
    className="text-sm flex items-center gap-2"
    style={{ color: "var(--foreground)" }}
  >
    <span
      className="hover:opacity-80 cursor-pointer flex items-center"
      onClick={() => router.push("/dashboard")}
    >
      <Home size={18} strokeWidth={2} />
    </span>
    <span className="mx-2">/</span>
    <span className="font-medium text-emerald-600">Marchés</span>
  </nav>

                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                    Gestion des marchés ({totalItems})
                  </h1>
                  
                  <button
                    onClick={() => setShowSearch((s) => !s)}
                    className="p-2 rounded-full shadow hover:opacity-80 transition bg-white dark:bg-slate-800"
                    aria-label="Recherche multi-champs"
                    title="Recherche multi-champs"
                  >
                    <Search size={20} style={{ color: "var(--foreground)" }} />
                  </button>
                </div>
              </div>

              {/* Partie droite : boutons et contrôle de vue */}
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-slate-800">
                  <button
                    onClick={() => setViewMode("cards")}
                    className={`p-2 rounded-md transition`}
                    style={{
                      backgroundColor: viewMode === "cards" ? "#10b981" : "transparent",
                      color: viewMode === "cards" ? "white" : "var(--foreground)",
                      opacity: viewMode === "cards" ? 1 : 0.6,
                    }}
                    title="Vue en cartes"
                  >
                    <Grid3X3 size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded-md transition`}
                    style={{
                      backgroundColor: viewMode === "table" ? "#10b981" : "transparent",
                      color: viewMode === "table" ? "white" : "var(--foreground)",
                      opacity: viewMode === "table" ? 1 : 0.6,
                    }}
                    title="Vue en tableau"
                  >
                    <Table size={18} />
                  </button>
                </div>

                <button
                  onClick={() => router.push("/dashboard/marches/ajouter")}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg shadow transition text-white hover:opacity-90 bg-emerald-600"
                >
                  <Plus size={18} />
                  Ajouter
                </button>
              </div>
            </div>
          </div>

    
          <div className="p-6 max-w-6xl mx-auto">
            {marches.length === 0 ? (
              <p className="text-center py-10" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                Aucun marché trouvé.
              </p>
            ) : (
              <>
                {viewMode === "cards" ? (
                  <div className="space-y-3">
                    {marches.map((marche) => (
                      <div
                        key={marche.id}
                        className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition bg-white dark:bg-slate-800"
                      >
                        <div className="flex flex-col gap-1">
                          <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>
                            {marche.objet}
                          </h2>
                          <p className="text-sm" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                            <span className="font-medium">{marche.num_marche}</span> • {marche.organisme || "—"}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                              Année {marche.annee}
                            </span>
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                              {marche.type_communaute_publique || "—"}
                            </span>
                            {marche.num_boite && (
                              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                                Boîte {marche.num_boite}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs mt-1 ${marche.latitude && marche.longitude ? "" : "text-red-500"}`}
                            style={{
                              color: marche.latitude && marche.longitude ? "var(--foreground)" : "#ef4444",
                              opacity: marche.latitude && marche.longitude ? 0.7 : 1,
                            }}
                          >
                            {marche.latitude && marche.longitude
                              ? `Les coordonnées : ${marche.latitude}, ${marche.longitude}`
                              : "Coordonnées non définies"}
                          </p>
                        </div>
                        <div className="relative dropdown-container">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === marche.id ? null : marche.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                          >
                            <MoreVertical size={18} style={{ color: "var(--foreground)", opacity: 0.7 }} />
                          </button>
                          {openDropdown === marche.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 bg-white dark:bg-slate-800">
                              <button
                                onClick={() => handleLocaliser(marche)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                                style={{ color: "var(--foreground)" }}
                              >
                                <MapPin size={16} />
                                Localiser
                              </button>
                              <button
                                onClick={() => handleDetails(marche)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                                style={{ color: "var(--foreground)" }}
                              >
                                <Eye size={16} />
                                Détails
                              </button>
                              <button
                                onClick={() => handleModifier(marche)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                                style={{ color: "var(--foreground)" }}
                              >
                                <Edit size={16} />
                                Modifier
                              </button>
                              <button
                                onClick={() => openDeleteConfirm(marche)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                              >
                                <Trash2 size={16} />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden bg-white dark:bg-slate-800">
                    <div className="overflow-x-auto">
                      <table className="w-full table-fixed">
                        <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-700">
                          <tr>
                            <th className="w-24 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Numéro
                            </th>
                            <th className="w-48 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Objet
                            </th>
                            <th className="w-32 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Organisme
                            </th>
                            <th className="w-20 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Année
                            </th>
                            <th className="w-20 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Boîte
                            </th>
                            <th className="w-32 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Type
                            </th>
                            <th className="w-28 px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Coordonnées
                            </th>
                            <th className="w-20 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {marches.map((marche) => (
                            <tr key={marche.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                              <td
                                className="px-4 py-3 text-sm font-medium truncate"
                                style={{ color: "var(--foreground)" }}
                              >
                                {marche.num_marche}
                              </td>
                              <td
                                className="px-4 py-3 text-sm truncate"
                                title={marche.objet}
                                style={{ color: "var(--foreground)" }}
                              >
                                {marche.objet}
                              </td>
                              <td
                                className="px-4 py-3 text-sm truncate"
                                title={marche.organisme || "—"}
                                style={{ color: "var(--foreground)", opacity: 0.7 }}
                              >
                                {marche.organisme || "—"}
                              </td>
                              <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                                {marche.annee}
                              </td>
                              <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                                {marche.num_boite || "—"}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 truncate">
                                  {marche.type_communaute_publique || "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {marche.latitude && marche.longitude ? (
                                  <span className="text-green-600">✓ Définies</span>
                                ) : (
                                  <span className="text-red-500">✗ Non définies</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right text-sm">
                                <div className="relative dropdown-container">
                                  <button
                                    onClick={() => setOpenDropdown(openDropdown === marche.id ? null : marche.id)}
                                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                                  >
                                    <MoreVertical size={16} style={{ color: "var(--foreground)", opacity: 0.7 }} />
                                  </button>
                                  {openDropdown === marche.id && (
                                    <div className="absolute right-0 top-full mt-1 w-48 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 bg-white dark:bg-slate-800">
                                      <button
                                        onClick={() => handleLocaliser(marche)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                                        style={{ color: "var(--foreground)" }}
                                      >
                                        <MapPin size={16} />
                                        Localiser
                                      </button>
                                      <button
                                        onClick={() => handleDetails(marche)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                                        style={{ color: "var(--foreground)" }}
                                      >
                                        <Eye size={16} />
                                        Détails
                                      </button>
                                      <button
                                        onClick={() => handleModifier(marche)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                                        style={{ color: "var(--foreground)" }}
                                      >
                                        <Edit size={16} />
                                        Modifier
                                      </button>
                                      <button
                                        onClick={() => openDeleteConfirm(marche)}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                                      >
                                        <Trash2 size={16} />
                                        Supprimer
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>

        {totalPages > 1 && (
  <div
    className="fixed bottom-0 z-20 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 w-full"
    style={{
      backgroundColor: "var(--muted-bg)",
    }}
  >
    <div className="flex items-center justify-between py-2">
      {/* Gauche : infos */}
      <div
        className="text-sm"
        style={{
          color: "var(--foreground)",
          opacity: 0.7,
          paddingLeft: sidebarOpen ? "1rem" : "4rem", // <-- bouge uniquement la gauche
          transition: "padding-left 0.3s ease",
        }}
      >
        Affichage de {(currentPage - 1) * itemsPerPage + 1} à{" "}
        {Math.min(currentPage * itemsPerPage, totalItems)} sur {totalItems} marchés
      </div>

      {/* Droite : pagination (statique, toujours collée à droite) */}
      <div className="flex items-center gap-2 pr-2">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition ${
            currentPage === 1
              ? "border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50"
              : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
          style={{ color: "var(--foreground)" }}
        >
          <ChevronLeft size={16} />
          Précédent
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className="px-3 py-2 text-sm rounded-lg transition"
                style={{
                  backgroundColor: currentPage === pageNum ? "#10b981" : "transparent",
                  color: currentPage === pageNum ? "white" : "var(--foreground)",
                }}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`flex items-center gap-1 px-3 py-2 text-sm rounded-lg border transition ${
            currentPage === totalPages
              ? "border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50"
              : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700"
          }`}
          style={{ color: "var(--foreground)" }}
        >
          Suivant
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  </div>
)}



        {showSearch && (
          <div
            ref={searchCardRef}
            className="absolute top-10 right-6 z-30 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 w-[350px] bg-white/95 dark:bg-slate-900/95"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold" style={{ color: "var(--foreground)" }}>
                Recherche
              </div>
              <button
                onClick={() => setShowSearch(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" style={{ color: "var(--foreground)", opacity: 0.7 }} />
              </button>
            </div>
            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-6">
                <label className="text-xs" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                  Numéro marché
                </label>
                <input
                  type="text"
                  value={filters.num_marche}
                  onChange={(e) => setFilters({ ...filters, num_marche: e.target.value })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800"
                  style={{ color: "var(--foreground)" }}
                  placeholder="ex: 12/2023"
                />
              </div>
              <div className="col-span-6">
                <label className="text-xs" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                  Objet
                </label>
                <input
                  type="text"
                  value={filters.objet}
                  onChange={(e) => setFilters({ ...filters, objet: e.target.value })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800"
                  style={{ color: "var(--foreground)" }}
                  placeholder="ex: Travaux voirie"
                />
              </div>
              <div className="col-span-6">
                <label className="text-xs" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                  Organisme
                </label>
                <input
                  type="text"
                  value={filters.organisme}
                  onChange={(e) => setFilters({ ...filters, organisme: e.target.value })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800"
                  style={{ color: "var(--foreground)" }}
                  placeholder="ex: Commune"
                />
              </div>
              <div className="col-span-3">
                <label className="text-xs" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                  Année
                </label>
                <input
                  type="number"
                  value={filters.annee}
                  onChange={(e) => setFilters({ ...filters, annee: e.target.value })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800"
                  style={{ color: "var(--foreground)" }}
                  placeholder="2024"
                />
              </div>
              <div className="col-span-3">
                <label className="text-xs" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                  Boîte
                </label>
                <input
                  type="text"
                  value={filters.num_boite}
                  onChange={(e) => setFilters({ ...filters, num_boite: e.target.value })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800"
                  style={{ color: "var(--foreground)" }}
                  placeholder="ex: 12"
                />
              </div>
              <div className="col-span-6">
                <label className="text-xs" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                  Type
                </label>
                <input
                  type="text"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-800"
                  style={{ color: "var(--foreground)" }}
                  placeholder="ex: RH/Finance"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setFilters({
                    num_marche: "",
                    objet: "",
                    organisme: "",
                    annee: "",
                    num_boite: "",
                    type: "",
                  })
                  setCurrentPage(1)
                  setTimeout(() => fetchMarches(1), 0)
                }}
                className="text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                style={{ color: "var(--foreground)" }}
              >
                Réinitialiser
              </button>
              <button
                onClick={() => {
                  setCurrentPage(1)
                  fetchMarches(1)
                }}
                className="text-xs px-3 py-2 rounded-lg text-white hover:opacity-90 bg-emerald-600"
              >
                Appliquer
              </button>
            </div>
          </div>
        )}

        {deleteConfirmOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl shadow-xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900">
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                Confirmer la suppression
              </h3>
              <p className="mb-4" style={{ color: "var(--foreground)", opacity: 0.7 }}>
                Êtes-vous sûr de vouloir supprimer le marché "<span className="font-medium">{marcheToDelete?.objet}</span>
                " ?
                <br />
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                  style={{ color: "var(--foreground)" }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm transition"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }
