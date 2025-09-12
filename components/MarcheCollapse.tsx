"use client"
import { ChevronDown, ChevronUp, Hash, Building2, CalendarDays, FolderKanban, Landmark, Type } from "lucide-react"

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

interface MarcheCollapseProps {
  marche: Marche
  isOpen: boolean
  onToggle: () => void
  onViewOnMap: () => void
}

const MarcheCollapse = ({ marche, isOpen, onToggle, onViewOnMap }: MarcheCollapseProps) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header - toujours visible */}
      <div className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-semibold text-sm text-gray-900">{marche.num_marche}</div>
            <div className="text-xs text-gray-600 truncate">{marche.objet}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewOnMap()
              }}
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Voir
            </button>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </div>
      </div>

      {/* Contenu détaillé - affiché seulement si ouvert */}
      {isOpen && (
        <div className="p-3 bg-white border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Hash className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">Marché:</span>
              <span className="font-medium">{marche.num_marche}</span>
            </div>

            <div className="flex items-center gap-2">
              <CalendarDays className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">Année:</span>
              <span className="font-medium">{marche.annee}</span>
            </div>

            <div className="flex items-center gap-2">
              <FolderKanban className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">Boîte:</span>
              <span className="font-medium">{marche.num_boite}</span>
            </div>

            <div className="flex items-center gap-2">
              <Building2 className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">Organisme:</span>
              <span className="font-medium truncate">{marche.organisme}</span>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <Type className="w-3 h-3 text-gray-400" />
              <span className="text-gray-600">Type:</span>
              <span className="font-medium">{marche.type_communaute_publique}</span>
            </div>

            <div className="col-span-2 flex items-start gap-2">
              <Landmark className="w-3 h-3 text-gray-400 mt-0.5" />
              <div>
                <span className="text-gray-600">Objet:</span>
                <p className="font-medium text-gray-900 mt-1">{marche.objet}</p>
              </div>
            </div>

            {marche.latitude && marche.longitude && (
              <div className="col-span-2 text-xs text-gray-500">
                Coordonnées: {marche.latitude.toFixed(4)}, {marche.longitude.toFixed(4)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default MarcheCollapse
