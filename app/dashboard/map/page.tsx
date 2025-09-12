"use client"

import dynamic from "next/dynamic"
import { useEffect, useState, useRef } from "react"
import axios from "@/lib/axios"
import { useSearchParams } from "next/navigation"

interface Marche {
  id: number
  num_marche: string
  objet: string
  annee: number
  num_boite: string
  organisme: string
  type_communaute_publique: string
  latitude?: number | null
  longitude?: number | null
  created_at: string
}

const LeafletMap = dynamic(() => import("@/components/MapComponent"), {
  ssr: false,
})

export default function MapPage() {
  const [marches, setMarches] = useState<Marche[]>([])
  const [isMapSidebarOpen, setIsMapSidebarOpen] = useState(true)
  const [backendError, setBackendError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const mapRef = useRef<any>(null)

  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")

  const handleStartDrawing = () => {
    console.log("[v0] handleStartDrawing called in MapPage")
    if (mapRef.current && mapRef.current.activateGeometryDrawMode) {
      console.log("[v0] Calling activateGeometryDrawMode via ref")
      mapRef.current.activateGeometryDrawMode()
    } else {
      console.log("[v0] MapComponent ref or activateGeometryDrawMode not available")
      alert("Fonction de dessin non disponible")
    }
  }

  useEffect(() => {
    axios
      .get("/marches")
      .then((res) => {
        console.log("Marchés récupérés:", res.data)
        setBackendError(null)

        // Correction : si l'API renvoie { data: [...] }
        if (res.data && Array.isArray(res.data.data)) {
          setMarches(res.data.data)
        }
        // Si jamais c'est déjà un tableau
        else if (Array.isArray(res.data)) {
          setMarches(res.data)
        } else {
          console.error("Format inattendu de la réponse API:", res.data)
          setMarches([])
        }
      })
      .catch((err) => {
        console.error("Erreur chargement marchés", err)
        if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
          setBackendError("Backend non accessible sur http://localhost:5001. Veuillez démarrer votre serveur Express.")
        } else {
          setBackendError(`Erreur de connexion: ${err.message}`)
        }

        console.log("Utilisation de données d'exemple en attendant le backend...")
        setMarches([
          {
            id: 1,
            num_marche: "001/2024",
            objet: "Travaux de voirie - Exemple",
            annee: 2024,
            num_boite: "1",
            organisme: "Commune de Rabat",
            type_communaute_publique: "Commune",
            latitude: 34.0209,
            longitude: -6.8416,
            created_at: "2024-01-01",
          },
          {
            id: 2,
            num_marche: "002/2024",
            objet: "Fournitures bureau - Exemple",
            annee: 2024,
            num_boite: "2",
            organisme: "Préfecture de Casablanca",
            type_communaute_publique: "Préfecture",
            latitude: 33.5731,
            longitude: -7.5898,
            created_at: "2024-01-02",
          },
        ])
      })
  }, [])

  return (
    <div className="h-full flex flex-col">
      {backendError && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm">{backendError}</p>
              <p className="text-xs mt-1">Données d'exemple affichées. Fonctionnalités limitées.</p>
            </div>
          </div>
        </div>
      )}

      {/* Conteneur de la carte qui prend tout l'espace disponible */}
      <div className="flex-1 relative -m-4 md:-m-6">
        <LeafletMap
          ref={mapRef}
          marches={marches}
          initialPosition={lat && lng ? [Number.parseFloat(lat), Number.parseFloat(lng)] : null}
          isSidebarOpen={isMapSidebarOpen}
          onStartDrawing={handleStartDrawing}
        />
      </div>
    </div>
  )
}
