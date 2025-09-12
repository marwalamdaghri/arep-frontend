"use client"

import { useEffect, useState } from "react"
import axios from "@/lib/axios"
import UploadModal from "@/components/UploadModal"
import EditPieceModal, { type EditPiece } from "@/components/EditPieceModal"
import {
  X,
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
  Search,
  Pencil,
} from "lucide-react"

// ==== Types ====
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

// ==== Utils ====
const buildTree = (docs: Doc[]): Doc[] => {
  const map: Record<number, Doc> = {}
  const roots: Doc[] = []
  docs.forEach((d) => (map[d.id] = { ...d, children: [], pieces: d.pieces || [] }))
  docs.forEach((d) => {
    if (d.id_parent) map[d.id_parent]?.children?.push(map[d.id])
    else roots.push(map[d.id])
  })
  return roots
}

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

// ==== Arbre récursif ====
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
  previewFile,
  setPreviewFile,
  onSelectPiece,
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
  previewFile: string | null
  setPreviewFile: (file: string | null) => void
  onSelectPiece: (p: Piece) => void
}) {
  return (
    <ul className="pl-2">
      {nodes.map((node) => (
        <li key={node.id} className="my-1">
          {/* Ligne dossier */}
          <div className="flex items-center justify-between rounded px-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleFolder(node.id)}>
              {openFolders[node.id] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {openFolders[node.id] ? (
                <FolderOpen className="w-5 h-5 text-yellow-500" />
              ) : (
                <Folder className="w-5 h-5 text-yellow-500" />
              )}
              <span className="font-medium">{node.nom}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                title="Nouveau dossier"
                onClick={() => onAddFolder(node.id)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <PlusSquare className="w-4 h-4" />
              </button>
              <button
                title="Ajouter une pièce"
                onClick={() => onAddPiece(node.id)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FilePlus className="w-4 h-4" />
              </button>
              <button
                title="Renommer"
                onClick={() => onRenameFolder(node.id, node.nom)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                title="Supprimer"
                onClick={() => onDeleteFolder(node.id)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Trash className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>

          {/* Contenu du dossier */}
          {openFolders[node.id] && (
            <div className="pl-6">
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
                  previewFile={previewFile}
                  setPreviewFile={setPreviewFile}
                  onSelectPiece={onSelectPiece}
                />
              )}

              {/* Pièces */}
              {node.pieces?.map((piece) => {
                const fileUrl = piece.fichier_path
                  ? piece.fichier_path.startsWith("http")
                    ? piece.fichier_path
                    : `${apiBase}${piece.fichier_path}`
                  : null

                return (
                  <div
                    key={piece.id}
                    className="ml-6 mt-1 flex flex-col rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-2 shadow-sm cursor-pointer"
                    onClick={() => onSelectPiece(piece)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3">
                        <FileIcon className="w-4 h-4 mt-1 text-gray-500" />
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 dark:text-gray-100">{piece.nom}</span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                piece.type_piece === "originale"
                                  ? "border-emerald-500 text-emerald-600"
                                  : "border-indigo-500 text-indigo-600"
                              }`}
                            >
                              {piece.type_piece}
                            </span>
                          </div>

                          {piece.description && (
                            <span className="text-xs text-gray-500 italic">{piece.description}</span>
                          )}
                          <span className="text-xs text-gray-600">Nombre de pièces : {piece.nombre_pieces}</span>
                          <span className="text-[10px] text-gray-400">
                            Ajoutée le {new Date(piece.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {fileUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectPiece(piece)
                              setPreviewFile(fileUrl)
                            }}
                            title="Voir"
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditPiece(piece)
                          }}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          title="Supprimer"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeletePiece(piece.id)
                          }}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

// ==== Modales simples ====
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
      <div className="rounded-lg shadow-lg p-6 w-96 bg-white dark:bg-gray-800">
        <h2 className="text-lg font-semibold mb-4">{title}</h2>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-4 dark:bg-gray-700 dark:text-white"
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">
            Annuler
          </button>
          <button
            onClick={() => {
              if (value.trim()) onSubmit(value.trim())
              onClose()
            }}
            className="px-4 py-2 rounded text-white bg-[var(--brand)]"
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
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]">
      <div className="rounded-lg shadow-lg p-6 w-96 bg-white dark:bg-gray-800">
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="px-4 py-2 rounded text-white bg-red-600"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}

// ==== Modale principale ====
export default function DossiersModal({
  isOpen,
  onClose,
  marcheId,
  numMarche,
  onStartDrawing,
}: {
  isOpen: boolean
  onClose: () => void
  marcheId: number
  numMarche?: string
  onStartDrawing?: () => void
}) {
  const [docs, setDocs] = useState<Doc[]>([])
  const [openFolders, setOpenFolders] = useState<Record<number, boolean>>({})
  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null)

  // Modales
  const [modalOpen, setModalOpen] = useState(false)
  const [modalParent, setModalParent] = useState<number | null>(null)
  const [renameModal, setRenameModal] = useState<{ open: boolean; docId?: number; oldName?: string }>({ open: false })
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; docId?: number }>({ open: false })

  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadParent, setUploadParent] = useState<number | null>(null)
  const [editingPiece, setEditingPiece] = useState<Piece | null>(null)

  const [q, setQ] = useState("")

  useEffect(() => {
    if (!isOpen || !marcheId) return
    fetchDocs()
  }, [isOpen, marcheId])

  const fetchDocs = async () => {
    try {
      const [docsRes, piecesRes] = await Promise.all([
        axios.get(`/docs/tree/${marcheId}`),
        axios.get(`/pieces/marche/${marcheId}`),
      ])
      const docsData: Doc[] = docsRes.data
      const pieces: Piece[] = piecesRes.data
      const docsWithPieces = docsData.map((doc) => ({
        ...doc,
        pieces: pieces.filter((p) => p.hierarchie_id === doc.id),
      }))
      setDocs(buildTree(docsWithPieces))
    } catch (e) {
      console.error("Erreur fetchDocs:", e)
    }
  }

  // Dossiers
  const toggleFolder = (id: number) => setOpenFolders((p) => ({ ...p, [id]: !p[id] }))
  const openNewFolderModal = (parentId: number | null) => {
    setModalParent(parentId)
    setModalOpen(true)
  }
  const handleCreateFolder = async (value: string) => {
    try {
      await axios.post("/docs", { nom: value, id_parent: modalParent, marche_id: marcheId })
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

  // Pièces
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
      alert("Erreur suppression pièce")
    }
  }

  // Recherche
  const filterTree = (nodes: Doc[]): Doc[] => {
    if (!q.trim()) return nodes
    const match = (s: string | undefined) => (s || "").toLowerCase().includes(q.toLowerCase())
    const dfs = (list: Doc[]): Doc[] => {
      const out: Doc[] = []
      for (const n of list) {
        const children = n.children ? dfs(n.children) : []
        const pieces = (n.pieces || []).filter((p) => match(p.nom))
        const keep = match(n.nom) || children.length > 0 || pieces.length > 0
        if (keep) out.push({ ...n, children, pieces })
      }
      return out
    }
    return dfs(nodes)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl 
 w-[95%] max-w-5xl h-[90%] max-h-[90vh] flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">
              Gestion des Documents - Marché {numMarche ? `#${numMarche}` : `ID ${marcheId}`}
            </span>
            <div className="ml-4 relative">
              <Search className="absolute left-1 top-2 w-4 h-4 text-gray-400" />
              <input
                placeholder="Rechercher …"
                className="pl-6 pr-1 py-1 rounded-lg border bg-white dark:bg-gray-800 
             max-w-full w-[150px] sm:w-[200px] md:w-[250px]"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2">
          {/* Colonne gauche */}
          <div className="border-r flex flex-col">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="text-sm font-medium">Documents</div>
              <div className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors">
                <button
                  title="nouveau dossier"
                  onClick={() => openNewFolderModal(null)}
                  className="p-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <PlusSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-3">
              <DocTree
                nodes={filterTree(docs)}
                openFolders={openFolders}
                toggleFolder={toggleFolder}
                onAddFolder={openNewFolderModal}
                onAddPiece={openUploadForFolder}
                onRenameFolder={openRename}
                onDeleteFolder={openDelete}
                onEditPiece={(p) => setEditingPiece(p)}
                onDeletePiece={handleDeletePiece}
                previewFile={previewFile}
                setPreviewFile={setPreviewFile}
                onSelectPiece={(p) => {
                  setSelectedPiece(p)
                  setPreviewFile(null)
                }}
              />
            </div>
          </div>
          {/* Colonne droite */}
          <div className="p-4 md:p-6 min-h-[300px] flex flex-col">
            {!selectedPiece ? (
              <div className="h-full grid place-items-center text-gray-500 text-center">
                <div className="text-5xl mb-4">📄</div>
                <div>Sélectionnez un document pour voir ses détails</div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <div className="flex items-center gap-3">
                    <FileIcon className="w-6 h-6 text-gray-500" />
                    <h2 className="text-xl font-semibold">{selectedPiece.nom}</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-6 mt-4 text-sm"></div>
                </div>

                <div className="flex-1 border rounded-lg overflow-hidden relative">
                  {!previewFile ? (
                    <div className="h-full grid place-items-center text-gray-500 text-center p-8">
                      <div className="text-5xl mb-4"></div>
                      <div>Aperçu du document {selectedPiece.nom}</div>
                    </div>
                  ) : (
                    <>
                      <iframe src={previewFile} title="Aperçu" className="w-full h-full min-h-[250px]" />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modales */}
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

        <UploadModal
          open={uploadOpen}
          parentId={uploadParent}
          marcheId={String(marcheId)}
          onClose={() => setUploadOpen(false)}
          onUploaded={fetchDocs}
        />
        <EditPieceModal
          open={!!editingPiece}
          piece={
            editingPiece
              ? ({
                  id: editingPiece.id,
                  description: editingPiece.description,
                  type_piece: editingPiece.type_piece as any,
                  nombre_pieces: editingPiece.nombre_pieces,
                } as EditPiece)
              : null
          }
          onClose={() => setEditingPiece(null)}
          onUpdated={fetchDocs}
        />
        <button
          onClick={() => {
            console.log("[v0] Dessiner Géométrie button clicked in DossiersModal")
            if (onStartDrawing) {
              console.log("[v0] Calling onStartDrawing function")
              onStartDrawing()
              onClose()
            } else {
              console.log("[v0] onStartDrawing function not available")
              alert("Fonction de dessin non disponible")
            }
          }}
          className="w-full px-3 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--foreground)] transition flex items-center justify-center gap-2"
        >
          <Pencil className="w-4 h-4" />
          Dessiner géométrie
        </button>
      </div>
    </div>
  )
}
