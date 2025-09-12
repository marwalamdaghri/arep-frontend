
import {
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Pencil,
  X,
  Hash,
  Building2,
  CalendarDays,
  FolderKanban,
  Landmark,
  Type,
  Layers,
  Search,
  List,
} from "lucide-react"
import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react"
import { MapContainer, TileLayer, Marker, FeatureGroup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import axios from "@/lib/axios";

import L from "leaflet"
import DossiersModal from "@/components/DossiersModal"
import clsx from "clsx"
import "leaflet-draw/dist/leaflet.draw.css"
import { EditControl } from "react-leaflet-draw"
import * as turf from "@turf/turf"
import "leaflet-draw"
import MarkerClusterGroup from "react-leaflet-cluster"
import MapClickHandler from "@/components/MapClickHandler" // Import MapClickHandler
import FlyToPosition from "@/components/FlyToPosition" // Import FlyToPosition

// Icônes personnalisées pour différents types d'organismes
const createCustomIcon = (organismeType: string) => {
  // Déterminer la couleur en fonction du type d'organisme
  let iconColor = "green" // Couleur par défaut

  if (organismeType.includes("Commune")) iconColor = "green"
  else if (organismeType.includes("Région")) iconColor = "orange"
  else if (organismeType.includes("Préfecture")) iconColor = "red"
  else if (organismeType.includes("Ministère")) iconColor = "purple"
  else if (organismeType.includes("Établissement")) iconColor = "cadetblue"

  // Créer une icône SVG personnalisée
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <path fill="${iconColor}" d="M16 2C10.48 2 6 6.48 6 12c0 8.5 10 18 10 18s10-9.5 10-18c0-5.52-4.48-10-10-10zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
      <circle fill="white" cx="16" cy="12" r="3"/>
    </svg>`

  return L.divIcon({
    html: svgIcon,
    className: "custom-marker-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

// Icône par défaut personnalisée (si aucune donnée d'organisme)
const DefaultCustomIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <path fill="#369c40ff" d="M16 2C10.48 2 6 6.48 6 12c0 8.5 10 18 10 18s10-9.5 10-18c0-5.52-4.48-10-10-10zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
      <circle fill="white" cx="16" cy="12" r="3"/>
    </svg>`,
  className: "custom-marker-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

// Interfaces pour les types
interface ClusterPopupProps {
  count: number
  position: [number, number]
  onViewMarches: () => void
}

interface ClusterPopupData {
  count: number
  position: [number, number]
}

// Fonction pour créer un icône de cluster personnalisé (corrigée)
const createClusterCustomIcon = (cluster: any) => {
  const count = cluster.getChildCount()
  let size: "small" | "medium" | "large" = "medium"

  if (count < 10) {
    size = "small"
  } else if (count > 50) {
    size = "large"
  }

  const colors = {
    small: { bg: "rgba(101, 163, 13, 0.6)", text: "white" },
    medium: { bg: "rgba(234, 88, 12, 0.7)", text: "white" },
    large: { bg: "rgba(220, 38, 38, 0.8)", text: "white" },
  }

  const options = colors[size]

  return L.divIcon({
    html: `<div style="background-color: ${options.bg}; color: ${options.text}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);">
            <span>${count}</span>
          </div>`,
    className: "custom-marker-cluster",
    iconSize: L.point(40, 40, true),
  })
}

//  Composant pour le popup de cluster amélioré
const ClusterPopup = ({ count, position, onViewMarches }: ClusterPopupProps) => (
  <div className="p-3">
    <h3 className="font-bold text-lg mb-2">Groupe de marchés</h3>
    <p className="mb-3">
      Ce cluster contient <strong>{count}</strong> marché(s)
    </p>
    <button
      onClick={onViewMarches}
      className="w-full bg-[var(--primary)] hover:bg-[var(--primary)] text-white py-2 px-4 rounded-md transition-colors"
    >
      Voir les marchés
    </button>
  </div>
)

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

interface GeometryData {
  id?: number
  marche_id: number
  geometry: any
  created_at?: string
}

// Ajoutez ces nouvelles props à l'interface existante
interface MapProps {
  initialPosition?: [number, number] | null
  isSidebarOpen: boolean
  marches?: Marche[] // Added default empty array
  selectionMode?: boolean
  onCoordinateSelect?: (lat: number, lng: number) => void
  onStartDrawing?: () => void // Added onStartDrawing prop
}

const MapComponent = forwardRef(
  (
    {
      initialPosition,
      isSidebarOpen,
      marches = [],
      selectionMode = false,
      onCoordinateSelect,
      onStartDrawing,
    }: MapProps,
    ref,
  ) => {
    const [filteredMarches, setFilteredMarches] = useState<Marche[]>(Array.isArray(marches) ? marches : [])
    const [selectedMarche, setSelectedMarche] = useState<Marche | null>(null)
    const [mapStyle, setMapStyle] = useState<"street" | "satellite" | "dark">("street")
    const [flyToPos, setFlyToPos] = useState<[number, number] | null>(initialPosition || null)
    const [showStyleMenu, setShowStyleMenu] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [showDossiers, setShowDossiers] = useState(false)
    const [drawEnabled, setDrawEnabled] = useState(false)
    const [polygonBounds, setPolygonBounds] = useState<L.LatLngBounds | null>(null)
    const [polygonMarches, setPolygonMarches] = useState<Marche[]>([])
    const [showPolygonModal, setShowPolygonModal] = useState(false)
    const [filteredByPolygon, setFilteredByPolygon] = useState(false)
    const [clusterPopupData, setClusterPopupData] = useState<ClusterPopupData | null>(null)
    const [openCollapses, setOpenCollapses] = useState<Record<number, boolean>>({})
    const [isSelectionMode, setSelectionMode] = useState(selectionMode)
    const [showPolygonResults, setShowPolygonResults] = useState(false)
    const [showPolygonResultsOnMap, setShowPolygonResultsOnMap] = useState(false)
    const [polygonFilter, setPolygonFilter] = useState("")

    const [drawMode, setDrawMode] = useState<"search" | "geometry">("search")
    const [geometryDrawEnabled, setGeometryDrawEnabled] = useState(false)
    const [savedGeometries, setSavedGeometries] = useState<GeometryData[]>([])
    const [showGeometryModal, setShowGeometryModal] = useState(false)

    // Filtres multi-champs
    const [filters, setFilters] = useState({
      num_marche: "",
      objet: "",
      organisme: "",
      annee: "",
      num_boite: "",
      type: "",
    })

    const [showMarcheDetails, setShowMarcheDetails] = useState(false)

    const filteredPolygonMarches = polygonMarches.filter((marche) => {
      if (!polygonFilter) return true
      const searchTerm = polygonFilter.toLowerCase()
      return (
        marche.num_marche.toLowerCase().includes(searchTerm) ||
        marche.objet.toLowerCase().includes(searchTerm) ||
        marche.organisme.toLowerCase().includes(searchTerm)
      )
    })

    const searchCardRef = useRef<HTMLDivElement>(null)
    const featureGroupRef = useRef<L.FeatureGroup>(null)
    const mapRef = useRef<L.Map>(null)
    const drawRef = useRef<any>(null)

    // Ajoutez ce useEffect pour détecter si on est en mode sélection
    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search)
      const from = urlParams.get("from")

      if (from === "add-marche") {
        setSelectionMode(true)
      }
    }, [])
    useEffect(() => {
      if (!showPolygonResultsOnMap) {
        setFilteredByPolygon(false)
      }
    }, [showPolygonResultsOnMap])

    // Charger les données initiales
    useEffect(() => {
      console.log("MapComponent received marches:", marches)
      console.log("Is marches an array?", Array.isArray(marches))

      if (Array.isArray(marches)) {
        setFilteredMarches(marches)
      } else {
        console.error("Marches prop is not an array:", marches)
        setFilteredMarches([])
      }
    }, [marches])

    // CORRECTION: Fonction pour gérer les clics sur la carte en mode sélection
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isSelectionMode) {
        const { lat, lng } = e.latlng

        console.log("Coordonnées sélectionnées:", lat, lng)

        // Store coordinates with more reliable method
        const coordsData = {
          latitude: lat,
          longitude: lng,
          timestamp: Date.now(), // Add timestamp for debugging
        }

        localStorage.setItem("selectedCoords", JSON.stringify(coordsData))
        console.log("Coords sauvegardées :", lat, lng)

        // Dispatch custom event to notify other components
        window.dispatchEvent(
          new CustomEvent("coordsSelected", {
            detail: coordsData,
          }),
        )

        // Add visual feedback
        if (onCoordinateSelect) {
          onCoordinateSelect(lat, lng)
        }

        // Redirect back with a small delay to ensure data is saved
        setTimeout(() => {
          window.history.back()
        }, 200)
      }
    }

    // Active automatiquement le curseur polygon quand drawEnabled = true
    useEffect(() => {
      if (drawEnabled && featureGroupRef.current) {
        const map = (featureGroupRef.current as any)._map
        if (map) {
          drawRef.current = new (L as any).Draw.Polygon(map)
          drawRef.current.enable()
        }
      }
    }, [drawEnabled])

    useEffect(() => {
      if (geometryDrawEnabled && drawMode === "geometry") {
        console.log("[v0] Geometry draw mode activated, enabling draw cursor")
        // Le curseur sera activé automatiquement par EditControl
      }
    }, [geometryDrawEnabled, drawMode])

    // Layers
    const tileLayers = {
      street: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "&copy; OpenStreetMap contributors",
        preview: "/images/street.jpg",
      },
      satellite: {
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "Tiles © Esri & Contributors",
        preview: "/images/satellite.jpg",
      },
      dark: {
        url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
        attribution: "&copy; Stadia Maps",
        preview: "/images/dark.jpg",
      },
    } as const

    useEffect(() => {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = ""
      }
    }, [])

    // Fermer recherche au clic extérieur / Echap
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

    const [showScrollTop, setShowScrollTop] = useState(false)

    useEffect(() => {
      const handleScroll = () => {
        setShowScrollTop(window.scrollY > 200)
      }
      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }

    //  CORRECTION: Fonction pour afficher uniquement les marchés du polygone sur la carte
    const handleVoirSurCarte = () => {
      if (mapRef.current && polygonBounds) {
        mapRef.current.fitBounds(polygonBounds, { padding: [50, 50] })
        setFilteredByPolygon(true)
        setShowPolygonResultsOnMap(true)
        setShowPolygonModal(false)
        setShowPolygonResults(false)
      }
    }

    // Fonction pour basculer l'état d'ouverture d'un collapse
    const toggleCollapse = (marcheId: number) => {
      setOpenCollapses((prev) => ({
        ...prev,
        [marcheId]: !prev[marcheId],
      }))
    }

    // Fonction pour voir un marché sur la carte
    const handleViewOnMap = (marche: Marche) => {
      if (marche.latitude && marche.longitude) {
        setFlyToPos([marche.latitude, marche.longitude])
        setSelectedMarche(marche)
        setShowPolygonModal(false)
        setShowPolygonResults(false)

        // Si on est en mode affichage des résultats de polygone,
        // on désactive ce mode pour ne voir que le marché sélectionné
        if (showPolygonResultsOnMap) {
          setFilteredByPolygon(false)
          setShowPolygonResultsOnMap(false)
        }
      }
    }

    const saveGeometryToDatabase = async (geojson: any, marcheId: number) => {
      try {
        console.log(" Saving geometry to database for marche:", marcheId)
        const response = await axios.post("/marche-geometries/add", {
          marche_id: marcheId,
          geometry: geojson.geometry,
        })

        if (response.data) {
          const savedGeometry = response.data
          setSavedGeometries((prev) => [...prev, savedGeometry])
          alert("Géométrie enregistrée avec succès !")
          return savedGeometry
        } else {
          throw new Error("Erreur lors de la sauvegarde")
        }
      } catch (error) {
        console.error("Erreur:", error)
        alert("Erreur lors de la sauvegarde de la géométrie")
      }
    }

    const loadGeometriesForMarche = async (marcheId: number) => {
      try {
        const response = await fetch(`/api/marche-geometries/${marcheId}`)
        if (response.ok) {
          const geometries = await response.json()
          setSavedGeometries(geometries)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des géométries:", error)
      }
    }

    useEffect(() => {
      if (selectedMarche) {
        loadGeometriesForMarche(selectedMarche.id)
      }
    }, [selectedMarche])

    //  Modified function to handle both search and geometry drawing modes
    const activateDrawMode = () => {
      setShowSearch(false) // Fermer le panneau de recherche
      if (drawMode === "search") {
        setDrawEnabled(true) // Activer le mode dessin pour recherche
      } else {
        setGeometryDrawEnabled(true) // Activer le mode dessin pour géométries
      }
    }

    const activateGeometryDrawMode = () => {
      console.log("[v0] activateGeometryDrawMode called")
      console.log("[v0] selectedMarche:", selectedMarche)
      if (!selectedMarche) {
        console.log("[v0] No marche selected in activateGeometryDrawMode")
        alert("Veuillez d'abord sélectionner un marché sur la carte")
        return
      }
      console.log("[v0] Setting draw mode to geometry")
      setDrawMode("geometry")
      console.log("[v0] Setting geometry draw enabled to true")
      setGeometryDrawEnabled(true)
      setShowSearch(false)
      setShowMarcheDetails(false) // Close popup but keep marche selected
    }

    useImperativeHandle(ref, () => ({
      activateGeometryDrawMode,
      setSelectedMarche,
      flyToPosition: (lat: number, lng: number) => {
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 15)
        }
      },
    }))

    return (
      <div className={clsx("w-full h-full transition-all duration-300")}>
        {/* Indicateur visuel en mode sélection */}
        {isSelectionMode && (
          <div
            className="absolute top-0 left-0 right-0 bg-white/30 backdrop-blur-md
 text-black text-center p-2 z-50"
          >
            <p className="font-bold">Mode sélection de coordonnées</p>
            <p className="text-sm">Cliquez sur la carte pour sélectionner un emplacement</p>
          </div>
        )}

        <MapContainer
          ref={mapRef}
          center={initialPosition || [34.0333, -5.0]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
          className="z-0"
        >
          <TileLayer url={tileLayers[mapStyle].url} attribution={tileLayers[mapStyle].attribution} />

          {/* ✅ Ajoutez ce composant pour gérer les clics */}
          {isSelectionMode && <MapClickHandler onMapClick={handleMapClick} />}

          {/* ✅ Bloc de dessin du polygone pour recherche */}
          {drawEnabled && drawMode === "search" && (
            <FeatureGroup ref={featureGroupRef}>
              <EditControl
                position="topright"
                draw={{
                  rectangle: false,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: false,
                  polygon: true,
                }}
                edit={{ remove: true }}
                onCreated={(e: any) => {
                  if (e.layerType === "polygon") {
                    const polygonLayer = e.layer as L.Polygon
                    const polygon = polygonLayer.toGeoJSON()
                    const bounds = polygonLayer.getBounds()

                    // ✅ Optimisation bbox
                    const bbox = turf.bbox(polygon)
                    const marchesInside = filteredMarches.filter((m) => {
                      if (m.latitude == null || m.longitude == null) return false
                      if (
                        m.longitude < bbox[0] ||
                        m.longitude > bbox[2] ||
                        m.latitude < bbox[1] ||
                        m.latitude > bbox[3]
                      )
                        return false
                      return turf.booleanPointInPolygon(turf.point([m.longitude, m.latitude]), polygon)
                    })

                    setPolygonMarches(marchesInside)
                    setPolygonBounds(bounds)
                    setDrawEnabled(false)
                    setShowPolygonModal(true)
                    setOpenCollapses({}) // Réinitialiser les collapses ouverts

                    if (drawRef.current) (drawRef.current as any).disable()
                  }
                }}
              />
            </FeatureGroup>
          )}

          {geometryDrawEnabled && drawMode === "geometry" && selectedMarche && (
            <FeatureGroup>
              <EditControl
                position="topright"
                draw={{
                  rectangle: false,
                  circle: false,
                  circlemarker: false,
                  marker: false,
                  polyline: true, // pour tracer routes
                  polygon: true, // pour tracer polygones
                }}
                edit={{ remove: true }}
                onCreated={async (e: any) => {
                  const layer = e.layer
                  const geojson = layer.toGeoJSON()

                  // Sauvegarder en base de données
                  await saveGeometryToDatabase(geojson, selectedMarche.id)

                  setGeometryDrawEnabled(false)
                  setDrawMode("search") // Retour au mode recherche par défaut
                }}
              />
            </FeatureGroup>
          )}

          {/* Markers unifiés (polygon ou global selon flag) avec clusters améliorés */}
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            showCoverageOnHover={false}
            spiderfyOnMaxZoom={true}
            maxClusterRadius={50}
          >
            {Array.isArray(marches) &&
              marches.map(
                (m) =>
                  m.latitude != null &&
                  m.longitude != null && (
                    <Marker
                      key={m.id}
                      position={[m.latitude, m.longitude]}
                      icon={createCustomIcon(m.organisme)}
                      eventHandlers={{
                        click: () => {
                          setSelectedMarche(m)
                          setShowMarcheDetails(true)
                          setFlyToPos([m.latitude!, m.longitude!])
                        },
                      }}
                    />
                  ),
              )}
          </MarkerClusterGroup>

          <FlyToPosition position={flyToPos} />
        </MapContainer>

        {/* Panneau de recherche */}
        {showSearch && (
          <div
            ref={searchCardRef}
            className="absolute top-10 right-6 z-20 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 w-[350px] max-h-[80vh] flex flex-col"
          >
            {/*  Header */}
            <div className="flex items-center justify-between p-3 border-b">
              <div className="font-semibold text-gray-700">Recherche</div>
              <button
                onClick={() => setShowSearch(false)}
                className="p-1 rounded-full hover:bg-gray-100"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/*  Zone scrollable (filtres + résultats) */}
            <div className="p-4 flex-1 overflow-y-auto">
              {/* Champs filtre */}
              <div className="grid grid-cols-6 gap-3">
                <div className="col-span-6">
                  <label className="text-xs text-gray-500">Numéro marché</label>
                  <input
                    type="text"
                    value={filters.num_marche}
                    onChange={(e) => setFilters({ ...filters, num_marche: e.target.value })}
                    className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                    placeholder="ex: 12/2023"
                  />
                </div>

                <div className="col-span-6">
                  <label className="text-xs text-gray-500">Objet</label>
                  <input
                    type="text"
                    value={filters.objet}
                    onChange={(e) => setFilters({ ...filters, objet: e.target.value })}
                    className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                    placeholder="ex: Travaux voirie"
                  />
                </div>

                <div className="col-span-6">
                  <label className="text-xs text-gray-500">Organisme</label>
                  <input
                    type="text"
                    value={filters.organisme}
                    onChange={(e) => setFilters({ ...filters, organisme: e.target.value })}
                    className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                    placeholder="ex: Commune"
                  />
                </div>

                <div className="col-span-3">
                  <label className="text-xs text-gray-500">Année</label>
                  <input
                    type="number"
                    value={filters.annee}
                    onChange={(e) => setFilters({ ...filters, annee: e.target.value })}
                    className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                    placeholder="2024"
                  />
                </div>

                <div className="col-span-3">
                  <label className="text-xs text-gray-500">Boîte</label>
                  <input
                    type="text"
                    value={filters.num_boite}
                    onChange={(e) => setFilters({ ...filters, num_boite: e.target.value })}
                    className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                    placeholder="ex: 12"
                  />
                </div>

                <div className="col-span-6">
                  <label className="text-xs text-gray-500">Type</label>
                  <input
                    type="text"
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                    placeholder="ex: RH/Finance"
                  />
                </div>
              </div>

              {/* Résultats polygone */}
              {polygonMarches.length > 0 && (
                <div className="mt-4 border-t pt-2 text-sm">
                  <div className="font-semibold mb-1">Marchés dans la zone :</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {polygonMarches.map((m) => (
                      <li key={m.id} className="truncate">
                        {m.num_marche} – {m.objet}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ✅ Footer (toujours visible en bas) */}
            <div className="p-3 border-t flex items-center justify-end gap-2">
              <button
                onClick={() =>
                  setFilters({ num_marche: "", objet: "", organisme: "", annee: "", num_boite: "", type: "" })
                }
                className="text-xs px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors font-medium"
              >
                Réinitialiser
              </button>

              <button
                onClick={() => {
                  console.log("Search filters applied:", filters)
                }}
                className="text-xs px-3 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--foreground)]"
              >
                Appliquer
              </button>

              <button
                onClick={activateDrawMode}
                className="text-xs px-3 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--foreground)]"
                aria-label="Recherche par polygone"
                title="Recherche par polygone"
              >
                par zone
              </button>
            </div>
          </div>
        )}

        {/* Boutons haut centre : toggle recherche + menu styles + liste résultats polygone */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 flex flex-col gap-3">
          <button
            onClick={() => {
              console.log("[v0] Search button clicked")
              setShowSearch((s) => {
                console.log("[v0] Current showSearch state:", s)
                console.log("[v0] Setting showSearch to:", !s)
                return !s
              })
            }}
            className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105"
            aria-label="Recherche"
            title="Recherche multi-champs"
          >
            <Search size={20} className="text-gray-700" />
          </button>

          <button
            onClick={() => {
              console.log("[v0] Geometry draw button clicked")
              console.log("[v0] Selected marche:", selectedMarche)
              if (!selectedMarche) {
                console.log("[v0] No marche selected, showing alert")
                alert("Veuillez d'abord sélectionner un marché sur la carte")
                return
              }
              console.log("[v0] Activating geometry draw mode")
              activateGeometryDrawMode()
            }}
            className={`bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 ${
              !selectedMarche ? "opacity-50 cursor-not-allowed" : ""
            }`}
            aria-label="Dessiner géométrie"
            title="Dessiner route ou polygone pour le marché sélectionné"
            disabled={!selectedMarche}
          >
            <Pencil size={20} className="text-gray-700" />
          </button>

          <div className="relative">
            <button
              onClick={() => {
                console.log("[v0] Style menu button clicked")
                setShowStyleMenu((prev) => {
                  console.log("[v0] Current showStyleMenu state:", prev)
                  console.log("[v0] Setting showStyleMenu to:", !prev)
                  return !prev
                })
              }}
              className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105"
              aria-label="Changer de fond de carte"
              title="Fond de carte"
            >
              <Layers size={20} className="text-gray-700" />
            </button>
            {showStyleMenu && (
              <div className="absolute left-16 top-0 bg-white rounded-xl shadow-2xl p-2 flex flex-col gap-2 border border-gray-200 min-w-[160px]">
                {Object.entries(tileLayers).map(([key, layer]) => (
                  <button
                    key={key}
                    onClick={() => {
                      console.log("[v0] Map style button clicked:", key)
                      setMapStyle(key as typeof mapStyle)
                      setShowStyleMenu(false)
                    }}
                    className={`flex items-center gap-3 rounded-lg border-2 overflow-hidden px-3 py-2 transition-all duration-200 ${
                      mapStyle === key ? "border-[var(--brand)] shadow-lg" : "border-transparent hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={layer.preview || "/placeholder.svg"}
                      alt={key}
                      className="w-12 h-8 object-cover rounded"
                    />
                    <div className="text-sm capitalize font-medium truncate">{key}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bouton pour afficher les résultats de recherche par polygone */}
          {polygonMarches.length > 0 && (
            <button
              onClick={() => {
                console.log("[v0] Polygon results button clicked")
                console.log("[v0] Polygon marches count:", polygonMarches.length)
                setShowPolygonResults(true)
              }}
              className="bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 relative"
              aria-label="Afficher les résultats de la zone"
              title="Résultats de la zone"
            >
              <List size={20} className="text-gray-700" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center font-bold shadow-md">
                {polygonMarches.length}
              </span>
            </button>
          )}
        </div>

        {/* Détails marché */}
        {selectedMarche && showMarcheDetails && (
          <div className="absolute top-0 right-0 z-20 w-80 h-full bg-white/80 backdrop-blur-4xl shadow-2xl border-l border-gray-200 dark:border-gray-700 rounded-l-2xl animate-sladeIn overflow-y-auto">
            <div className="bg-[var(--primary)] text-white px-4 py-3 flex justify-between items-center">
              <h2 className="text-sm font-semibold truncate">{selectedMarche.objet}</h2>
              <button
                onClick={() => setShowMarcheDetails(false)}
                className="text-white hover:text-red-300 transition"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-[var(--foreground)] text-sm">
              <div className="flex items-center gap-2">
                <Hash className="text-[var(--primary)]" />
                <span>
                  <b>Numéro :</b> {selectedMarche.num_marche}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="text-[var(--ring)]" />
                <span>
                  <b>Année :</b> {selectedMarche.annee}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FolderKanban className="text-[var(--ring)]" />
                <span>
                  <b>Boîte :</b> {selectedMarche.num_boite}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="text-[var(--ring)]" />
                <span>
                  <b>Organisme :</b> {selectedMarche.organisme}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Type className="text-[var(--ring)]" />
                <span>
                  <b>Type :</b> {selectedMarche.type_communaute_publique}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Landmark className="text-[var(--ring)]" />
                <span>
                  <b>Créé le :</b> {selectedMarche.created_at}
                </span>
              </div>
              {savedGeometries.length > 0 && (
                <div className="border-t pt-3 mt-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--primary)]" />
                    Géométries ({savedGeometries.length})
                  </h3>
                  <div className="space-y-2">
                    {savedGeometries.map((geom, index) => (
                      <div key={geom.id || index} className="text-xs bg-gray-100 p-2 rounded">
                        <span className="font-medium">
                          {geom.geometry.type === "LineString" && `Route #${index + 1}`}
                          {geom.geometry.type === "Polygon" && `Polygone #${index + 1}`}
                          {geom.geometry.type === "Point" && `Point #${index + 1}`}
                          {geom.geometry.type !== "LineString" &&
                          geom.geometry.type !== "Polygon" &&
                          geom.geometry.type !== "Point" &&
                          `Géométrie #${index + 1}`}
                        </span>
                        {geom.created_at && (
                          <div className="text-gray-500 mt-1">
                            Créé le: {new Date(geom.created_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="px-5 pb-3 space-y-2">
                <button
                  onClick={activateGeometryDrawMode}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--foreground)] transition flex items-center justify-center gap-2"
                >
                  <Pencil className="w-4 h-4" />
                  Dessiner géométrie
                </button>

                <button
                  onClick={() => setShowDossiers(true)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--ring)] text-white hover:bg-[var(--foreground)] transition"
                >
                  Dossiers
                </button>
              </div>
            </div>
          </div>
        )}

        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-5 right-6 z-50 p-3 rounded-full bg-[var(--primary)] text-white shadow-lg hover:bg-[var(--ring)] transition"
            aria-label="Remonter en haut"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}

        {selectedMarche && (
          <DossiersModal
            isOpen={showDossiers}
            onClose={() => setShowDossiers(false)}
            marcheId={selectedMarche.id}
            numMarche={selectedMarche.num_marche}
            onStartDrawing={onStartDrawing} // Pass onStartDrawing prop to DossiersModal
          />
        )}
        {/* Modal résultats polygone avec design professionnel et effet blur */}
        {(showPolygonModal || showPolygonResults) && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-gray-100">
              {/* Header avec gradient */}
              <div className="bg-gradient-to-r from-[var(--brand)]/70 to-[var(--brand-600)]/70 text-white p-2 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold">Marchés trouvés</h2>
                  <p className="text-white/80 text-xs mt-1">
                    {polygonMarches.length} résultat(s) dans la zone sélectionnée
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowPolygonModal(false)
                    setShowPolygonResults(false)
                    setFilteredByPolygon(false)
                    setShowPolygonResultsOnMap(false)
                  }}
                  className="p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Barre de filtre */}
              <div className="p-3 border-b border-gray-200 flex items-center gap-2 bg-gray-50">
                <input
                  type="text"
                  placeholder="Filtrer par numéro, objet ou organisme..."
                  value={polygonFilter}
                  onChange={(e) => setPolygonFilter(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
                />
                {polygonFilter && (
                  <button onClick={() => setPolygonFilter("")} className="text-gray-500 hover:text-gray-700 text-sm">
                    Réinitialiser
                  </button>
                )}
              </div>

              {/* Contenu scrollable */}
              <div className="overflow-y-auto max-h-[60vh]">
                {filteredPolygonMarches.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg">Aucun marché trouvé</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredPolygonMarches.map((marche, index) => (
                      <div key={marche.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <button
                          onClick={() => toggleCollapse(marche.id)}
                          className="w-full flex justify-between items-start text-left"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="bg-[var(--brand)] text-white text-xs px-2 py-1 rounded-full font-medium">
                                #{index + 1}
                              </span>
                              <h3 className="font-semibold text-gray-900 truncate">{marche.num_marche}</h3>
                            </div>
                            <p className="text-gray-600 text-sm line-clamp-2">{marche.objet}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {marche.annee}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {marche.organisme}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0">
                            {openCollapses[marche.id] ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </button>

                        {openCollapses[marche.id] && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <FolderKanban className="text-[var(--brand)] w-4 h-4" />
                                <span>
                                  <b>Boîte :</b> {marche.num_boite}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Type className="text-[var(--brand)] w-4 h-4" />
                                <span>
                                  <b>Type :</b> {marche.type_communaute_publique}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleViewOnMap(marche)}
                              className="w-full mt-3 px-4 py-2 rounded-lg bg-[var(--brand)]/70 text-white hover:bg-[var(--brand-600)] transition-colors font-medium shadow-sm"
                            >
                              Voir sur la carte
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer avec actions */}
              <div className="p-2 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                <div className="text-xs text-gray-600">
                  {polygonMarches.length > 0 && `${polygonMarches.length} marché(s) sélectionné(s)`}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowPolygonModal(false)
                      setShowPolygonResults(false)
                      setFilteredByPolygon(false)
                      setShowPolygonResultsOnMap(false)
                    }}
                    className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors font-medium"
                  >
                    Fermer
                  </button>
                  {polygonMarches.length > 0 && (
                    <button
                      onClick={handleVoirSurCarte}
                      className="px-4 py-1.5 text-sm rounded-lg bg-[var(--brand)]/70 text-white hover:bg-[var(--brand-600)] transition-colors font-medium shadow-sm"
                    >
                      Voir sur la carte
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

export default MapComponent