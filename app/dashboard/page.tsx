"use client"

import { useEffect, useState } from "react"
import axios from "@/lib/axios"
import { useRouter } from "next/navigation"
import { TrendingUp, FileText, MapPin, Folder } from "lucide-react"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const getCurrentDate = () => {
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" } as const
  return new Date().toLocaleDateString("fr-FR", options)
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [marches, setMarches] = useState<any[]>([])
  const [totalDossiers, setTotalDossiers] = useState(0)
  const [totalPieces, setTotalPieces] = useState(0)

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const userRes = await axios.get("/auth/currentUser")
        setUser(userRes.data)

        const marchesRes = await axios.get("/marches", {
          params: {
            limit: 1000, // Récupérer un grand nombre pour avoir toutes les données
          },
        })

        if (marchesRes.data && marchesRes.data.data) {
          setMarches(marchesRes.data.data)
        } else {
          console.warn("Structure de données inattendue:", marchesRes.data)
          setMarches([])
        }

        try {
          const dossiersRes = await axios.get("/docs/count")
          setTotalDossiers(dossiersRes.data.total || 0)
        } catch (err) {
          console.error("Erreur chargement total dossiers", err)
          setTotalDossiers(0)
        }

        try {
          const piecesRes = await axios.get("/pieces/count")
          setTotalPieces(piecesRes.data.total || 0)
        } catch (err) {
          console.error("Erreur chargement total pièces", err)
          setTotalPieces(0)
        }
      } catch (error) {
        console.error("Erreur initialisation dashboard:", error)
        if (error.response?.status === 401) {
          router.push("/login")
          return
        }
      } finally {
        setLoading(false)
      }
    }

    initializeDashboard()
  }, [router])

  if (loading) return <p className="p-4">Chargement...</p>

  const marchesArray = Array.isArray(marches) ? marches : []
  const totalMarches = marchesArray.length

  // Groupement par année
  const marchesParAnnee = Object.values(
    marchesArray.reduce((acc: any, m) => {
      const an = m.annee ?? "—"
      if (!acc[an]) acc[an] = { annee: an, count: 0 }
      acc[an].count += 1
      return acc
    }, {}),
  )

  // Répartition par type_communaute_publique
  const marchesParTypeCommunaute = Object.values(
    marchesArray.reduce((acc: any, m) => {
      const k = m.type_communaute_publique ?? "Non défini"
      if (!acc[k]) acc[k] = { type_communaute_publique: k, value: 0 }
      acc[k].value += 1
      return acc
    }, {}),
  )

  const latestYear = marchesArray.length ? Math.max(...marchesArray.map((m) => Number(m.annee) || 0)) : "—"
  const COLORS = ["#10b981", "#22d3ee", "#f59e0b", "#10b985", "#ef4444", "#8b5cf6"]

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex-1 flex flex-col">
        {/* Header de page */}
        <div className="flex items-center justify-between px-2 sm:px-4 md:px-6">
          <div className="py-4">
            <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Vue d&apos;ensemble de vos marchés publics — {getCurrentDate()}
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard/marches/ajouter")}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 transition"
            >
              <FileText className="h-4 w-4" />
              Nouveau marché
            </button>
            <button
              onClick={() => router.push("/dashboard/map")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
            >
              <MapPin className="h-4 w-4" />
              Voir la carte
            </button>
          </div>
        </div>

        {/* Cartes Statistiques */}
        <section className="px-2 sm:px-4 md:px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total des marchés</p>
              <p className="text-2xl font-bold">{totalMarches}</p>
              <p className="text-xs text-emerald-600 mt-1">+12% ce mois</p>
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Marchés géolocalisés</p>
              <p className="text-2xl font-bold">
                {marchesArray.filter((m) => m.latitude != null && m.longitude != null).length}
              </p>
              <p className="text-xs text-teal-600 mt-1">+8% ce mois</p>
            </div>
          </div>

          {/* Total Dossiers */}
          <div className="card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center">
              <Folder className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total des dossiers</p>
              <p className="text-2xl font-bold">{totalDossiers}</p>
              <p className="text-xs text-sky-600 mt-1">Mise à jour</p>
            </div>
          </div>

          {/* Total Pièces */}
          <div className="card p-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total des pièces</p>
              <p className="text-2xl font-bold">{totalPieces}</p>
              <p className="text-xs text-amber-600 mt-1">+2% ce mois</p>
            </div>
          </div>
        </section>

        {/* Graphiques */}
        <section className="px-2 sm:px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
          {/* Histogramme par année */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Marchés par année</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={marchesParAnnee as any[]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="annee" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Répartition par type_communaute_publique */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Répartition par type de communaute publique</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={marchesParTypeCommunaute as any[]}
                  dataKey="value"
                  nameKey="type_communaute_publique"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  label
                >
                  {(marchesParTypeCommunaute as any[]).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  )
}
