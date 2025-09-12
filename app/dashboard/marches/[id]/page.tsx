"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import axios from "@/lib/axios"
import UploadModal from "@/components/UploadModal"
import EditPieceModal from "@/components/EditPieceModal"
import PreviewModal from "@/components/PreviewModal"
import {
  Folder,
  FolderOpen,
  FileIcon,
  PlusSquare,
  FilePlus,
  Edit,
  Trash,
  ChevronRight,
  ChevronDown,
  Eye,
  Download,
  Building2,
  Calendar,
  MapPin,
  Archive,
  AlertCircle,
  Wifi,
} from "lucide-react"

// === Types ===
interface Marche {
  id: number
  num_marche: string
  objet: string
  annee: number
  organisme?: string | null
  localisation?: string | null
  type_communaute_publique?: string | null
}

interface Piece {
  id: number
  nom: string
  fichier_path: string
  type_piece: string
  description: string
  nombre_pieces: number
  created_at: string
  hierarchie_id: number
}

interface Doc {
  id: number
  nom: string
  id_parent: number | null
  marche_id: number
  children?: Doc[]
  pieces?: Piece[]
}

// === Transforme la liste plate en arbre ===
const buildTree = (docs: Doc[]): Doc[] => {
  const map: Record<number, Doc> = {}
  const roots: Doc[] = []

  docs.forEach((doc) => {
    map[doc.id] = { ...doc, children: [], pieces: doc.pieces || [] }
  })

  docs.forEach((doc) => {
    if (doc.id_parent) {
      map[doc.id_parent]?.children?.push(map[doc.id])
    } else {
      roots.push(map[doc.id])
    }
  })

  return roots
}

// === Modals "confirm / saisie simple" ===
function InputModal({
  open,
  title,
  placeholder,
  defaultValue,
  onClose,
  onSubmit,
}: {
  open: boolean
  title: string
  placeholder: string
  defaultValue?: string
  onClose: () => void
  onSubmit: (v: string) => void
}) {
  const [value, setValue] = useState(defaultValue || "")
  useEffect(() => {
    setValue(defaultValue || "")
  }, [defaultValue, open])
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 w-96 max-w-[90vw]">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">{title}</h2>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-6 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring--[var(--brand)]"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              if (value.trim()) onSubmit(value.trim())
              onClose()
            }}
            className="px-4 py-2 rounded-lg bg-[var(--brand)] text-white hover:bg-[var(--brand)] transition-colors"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  )
}

function ConfirmModal({
  open,
  message,
  onClose,
  onConfirm,
}: { open: boolean; message: string; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl p-6 w-96 max-w-[90vw]">
        <p className="mb-6 text-gray-900 text-lg">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

// === Arborescence récursive ===
function DocTree({
  nodes,
  openFolders,
  toggleFolder,
  onAddFolder,
  onAddPiece,
  onRenameFolder,
  onDeleteFolder,
  onEditPiece,
  onDeletePiece,
  onPreviewFile,
}: {
  nodes: Doc[]
  openFolders: Record<number, boolean>
  toggleFolder: (id: number) => void
  onAddFolder: (parentId: number | null) => void
  onAddPiece: (parentId: number) => void
  onRenameFolder: (id: number, oldName: string) => void
  onDeleteFolder: (id: number) => void
  onEditPiece: (piece: Piece) => void
  onDeletePiece: (pieceId: number) => void
  onPreviewFile: (fileUrl: string, fileName: string) => void
}) {
  const apiBase = "http://localhost:5001"

  const handleDownload = async (piece: Piece) => {
    try {
      const fileUrl = piece.fichier_path
        ? piece.fichier_path.startsWith("http")
          ? piece.fichier_path
          : `${apiBase}${piece.fichier_path}`
        : null

      if (!fileUrl) return

      const response = await fetch(fileUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = piece.nom
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
      alert("Erreur lors du téléchargement du fichier")
    }
  }

  const countPiecesInFolder = (node: Doc): number => {
    let count = node.pieces?.length || 0
    if (node.children) {
      node.children.forEach((child) => {
        count += countPiecesInFolder(child)
      })
    }
    return count
  }

  return (
    <div className="space-y-2">
      {nodes.map((node) => {
        const totalPieces = countPiecesInFolder(node)

        return (
          <div key={node.id} className="group">
            <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:shadow-md transition-all duration-200 group-hover:border-emerald-200">
              <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleFolder(node.id)}>
                <div className="flex items-center gap-2">
                  {openFolders[node.id] ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  {openFolders[node.id] ? (
                    <FolderOpen className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Folder className="w-5 h-5 text-emerald-600" />
                  )}
                </div>
                <span className="font-medium text-gray-900 text-lg">{node.nom}</span>
                {totalPieces > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-medium">
                    {totalPieces} pièce{totalPieces > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  title="Nouveau dossier"
                  onClick={() => onAddFolder(node.id)}
                  className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                >
                  <PlusSquare className="w-4 h-4" />
                </button>
                <button
                  title="Ajouter une pièce"
                  onClick={() => onAddPiece(node.id)}
                  className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                >
                  <FilePlus className="w-4 h-4" />
                </button>
                <button
                  title="Renommer"
                  onClick={() => onRenameFolder(node.id, node.nom)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  title="Supprimer"
                  onClick={() => onDeleteFolder(node.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                >
                  <Trash className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Contenu du dossier */}
            {openFolders[node.id] && (
              <div className="ml-8 mt-3 space-y-3">
                {/* Sous-dossiers */}
                {node.children && node.children.length > 0 && (
                  <DocTree
                    nodes={node.children}
                    openFolders={openFolders}
                    toggleFolder={toggleFolder}
                    onAddFolder={onAddFolder}
                    onAddPiece={onAddPiece}
                    onRenameFolder={onRenameFolder}
                    onDeleteFolder={onDeleteFolder}
                    onEditPiece={onEditPiece}
                    onDeletePiece={onDeletePiece}
                    onPreviewFile={onPreviewFile}
                  />
                )}

                {node.pieces?.map((piece) => {
                  const fileUrl = piece.fichier_path
                    ? piece.fichier_path.startsWith("http")
                      ? piece.fichier_path
                      : `${apiBase}${piece.fichier_path}`
                    : null

                  return (
                    <div
                      key={piece.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <FileIcon className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-gray-900 text-lg truncate">{piece.nom}</h4>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${
                                  piece.type_piece === "originale"
                                    ? "bg-emerald-100 border-emerald-200 text-emerald-700"
                                    : "bg-[var(--brand)] border-[var(--brand)] text-[var(--brand)]"
                                }`}
                              >
                                {piece.type_piece}
                              </span>
                            </div>

                            {piece.description && <p className="text-gray-600 mb-2 text-sm">{piece.description}</p>}

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Archive className="w-3 h-3" />
                                {piece.nombre_pieces} pièce{piece.nombre_pieces > 1 ? "s" : ""}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(piece.created_at).toLocaleDateString("fr-FR")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {fileUrl && (
                            <button
                              onClick={() => onPreviewFile(fileUrl, piece.nom)}
                              title="Voir"
                              className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {fileUrl && (
                            <button
                              onClick={() => handleDownload(piece)}
                              title="Télécharger"
                              className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            title="Modifier"
                            onClick={() => onEditPiece(piece)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            title="Supprimer"
                            onClick={() => onDeletePiece(piece.id)}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// === Page principale ===
export default function MarcheDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [marche, setMarche] = useState<Marche | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [openFolders, setOpenFolders] = useState<Record<number, boolean>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [modalParent, setModalParent] = useState<number | null>(null)
  const [renameModal, setRenameModal] = useState<{ open: boolean; docId?: number; oldName?: string }>({ open: false })
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; docId?: number }>({ open: false })
  const [previewModal, setPreviewModal] = useState<{ open: boolean; fileUrl: string | null; fileName: string }>({
    open: false,
    fileUrl: null,
    fileName: "",
  })
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadParent, setUploadParent] = useState<number | null>(null)
  const [editingPiece, setEditingPiece] = useState<Piece | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchMarche()
      fetchDocs()
    }
  }, [id])

  const fetchMarche = async () => {
    try {
      console.log(" Fetching marche data for ID:", id)
      const res = await axios.get(`/marches/${id}`)
      console.log("Marche data received:", res.data)
      setMarche(res.data)
      setError(null)
    } catch (e: any) {
      console.error(" Erreur fetchMarche:", e)
      if (e.code === "ERR_NETWORK" || e.message === "Network Error") {
        setError(
          "Impossible de se connecter au serveur. Vérifiez que votre backend est démarré sur http://localhost:5001",
        )
      } else {
        setError(`Erreur lors du chargement du marché: ${e.response?.data?.message || e.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchDocs = async () => {
    try {
      console.log(" Fetching docs and pieces for marche ID:", id)
      const [docsRes, piecesRes] = await Promise.all([axios.get(`/docs/tree/${id}`), axios.get(`/pieces/marche/${id}`)])
      console.log("Docs received:", docsRes.data)
      console.log(" Pieces received:", piecesRes.data)

      const docsData: Doc[] = docsRes.data
      const pieces: Piece[] = piecesRes.data

      const docsWithPieces = docsData.map((doc) => ({
        ...doc,
        pieces: pieces.filter((p) => p.hierarchie_id === doc.id),
      }))

      setDocs(buildTree(docsWithPieces))
      setError(null)
    } catch (e: any) {
      console.error("Erreur fetchDocs:", e)
      if (e.code === "ERR_NETWORK" || e.message === "Network Error") {
        setError("Impossible de se connecter au serveur pour charger les documents")
      } else {
        setError(`Erreur lors du chargement des documents: ${e.response?.data?.message || e.message}`)
      }
    }
  }

  const toggleFolder = (folderId: number) => setOpenFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }))

  const openNewFolderModal = (parentId: number | null) => {
    setModalParent(parentId)
    setModalOpen(true)
  }

  const handleCreateFolder = async (value: string) => {
    try {
      await axios.post("/docs", { nom: value, id_parent: modalParent, marche_id: id })
      await fetchDocs()
      if (modalParent) setOpenFolders((prev) => ({ ...prev, [modalParent]: true }))
    } catch (e: any) {
      alert(e.response?.data?.message || "Erreur création dossier")
    }
  }

  const openRename = (docId: number, oldName: string) => setRenameModal({ open: true, docId, oldName })

  const handleRenameFolder = async (newName: string) => {
    if (!renameModal.docId) return
    try {
      await axios.put(`/docs/${renameModal.docId}`, { nom: newName })
      await fetchDocs()
    } catch (e: any) {
      alert(e.response?.data?.message || "Erreur renommage")
    } finally {
      setRenameModal({ open: false })
    }
  }

  const openDelete = (docId: number) => setConfirmModal({ open: true, docId })

  const handleDeleteFolder = async () => {
    if (!confirmModal.docId) return
    try {
      await axios.delete(`/docs/${confirmModal.docId}`)
      await fetchDocs()
    } catch (e: any) {
      alert(e.response?.data?.message || "Erreur suppression")
    } finally {
      setConfirmModal({ open: false })
    }
  }

  const openUploadForFolder = (parentId: number) => {
    setUploadParent(parentId)
    setUploadOpen(true)
  }

  const handleDeletePiece = async (pieceId: number) => {
    if (!confirm("Supprimer définitivement cette pièce ?")) return
    try {
      await axios.delete(`/pieces/${pieceId}`)
      await fetchDocs()
    } catch (e) {
      console.error(e)
      alert("Erreur lors de la suppression de la pièce")
    }
  }

  const handlePreviewFile = (fileUrl: string, fileName: string) => {
    setPreviewModal({ open: true, fileUrl, fileName })
  }

  const countFolders = (nodes: Doc[]): number => {
    let count = nodes.length
    nodes.forEach((node) => {
      if (node.children) {
        count += countFolders(node.children)
      }
    })
    return count
  }

  const countAllPieces = (nodes: Doc[]): number => {
    let count = 0
    nodes.forEach((node) => {
      count += node.pieces?.length || 0
      if (node.children) {
        count += countAllPieces(node.children)
      }
    })
    return count
  }

  const totalFolders = countFolders(docs)
  const totalPieces = countAllPieces(docs)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Chargement du marché...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">Erreur de connexion</h2>
            <p className="text-red-700 mb-4">{error}</p>

            <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
              <h3 className="font-medium mb-2 flex items-center gap-2 text-gray-800">
                <Wifi className="w-4 h-4" />
                Pour résoudre ce problème :
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Vérifiez que votre serveur backend est démarré</li>
                <li>Confirmez qu'il écoute sur http://localhost:5001</li>
                <li>Vérifiez que les routes /api/marches et /api/docs sont disponibles</li>
              </ol>
            </div>
          </div>

          <button
            onClick={() => {
              setError(null)
              setLoading(true)
              fetchMarche()
              fetchDocs()
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!marche) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-600">Marché non trouvé</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      <InputModal
        open={modalOpen}
        title="Nouveau dossier"
        placeholder="Nom du dossier"
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateFolder}
      />
      <InputModal
        open={renameModal.open}
        title="Renommer le dossier"
        placeholder="Nouveau nom"
        defaultValue={renameModal.oldName}
        onClose={() => setRenameModal({ open: false })}
        onSubmit={handleRenameFolder}
      />
      <ConfirmModal
        open={confirmModal.open}
        message="Voulez-vous vraiment supprimer ce dossier ?"
        onClose={() => setConfirmModal({ open: false })}
        onConfirm={handleDeleteFolder}
      />

      <PreviewModal
        open={previewModal.open}
        fileUrl={previewModal.fileUrl}
        fileName={previewModal.fileName}
        onClose={() => setPreviewModal({ open: false, fileUrl: null, fileName: "" })}
      />

      <UploadModal
        open={uploadOpen}
        parentId={uploadParent}
        marcheId={String(id)}
        onClose={() => setUploadOpen(false)}
        onUploaded={fetchDocs}
      />

      <EditPieceModal
        open={!!editingPiece}
        piece={
          editingPiece
            ? {
                id: editingPiece.id,
                description: editingPiece.description,
                type_piece: editingPiece.type_piece as any,
                nombre_pieces: editingPiece.nombre_pieces,
              }
            : null
        }
        onClose={() => setEditingPiece(null)}
        onUpdated={fetchDocs}
      />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Marché #{marche.num_marche}</h1>
              <p className="text-xl text-gray-600">{marche.objet}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Année</p>
                <p className="font-semibold text-gray-900">{marche.annee}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Organisme</p>
                <p className="font-semibold text-gray-900">{marche.organisme || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Type Communauté</p>
                <p className="font-semibold text-gray-900">{marche.type_communaute_publique || "—"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-100 rounded-lg">
              <Folder className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Dossiers</p>
                <p className="font-semibold text-gray-900">
                  {totalFolders} dossier{totalFolders > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <Archive className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm text-emerald-700">Total des pièces</p>
                <p className="font-semibold text-emerald-900">
                  {totalPieces} pièce{totalPieces > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">Gestion des documents</h2>
          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              onClick={() => openNewFolderModal(null)}
              title="Nouveau dossier à la racine"
            >
              <PlusSquare className="w-4 h-4" />
              Nouveau dossier
            </button>
          </div>
        </div>

        {/* Arborescence */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          {docs.length === 0 ? (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Aucun dossier pour ce marché</p>
              <p className="text-gray-500 text-sm">Commencez par créer un nouveau dossier</p>
            </div>
          ) : (
            <DocTree
              nodes={docs}
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              onAddFolder={openNewFolderModal}
              onAddPiece={openUploadForFolder}
              onRenameFolder={openRename}
              onDeleteFolder={openDelete}
              onEditPiece={(p) => setEditingPiece(p)}
              onDeletePiece={handleDeletePiece}
              onPreviewFile={handlePreviewFile}
            />
          )}
        </div>
      </div>
    </div>
  )
}
