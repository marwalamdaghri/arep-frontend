"use client"

import { useState } from "react"
import axios from "@/lib/axios"

interface UploadModalProps {
  open: boolean
  parentId: number | null // id du dossier (hierarchie_id)
  marcheId: string // si ton backend en a besoin tu peux le garder
  onClose: () => void
  onUploaded: () => void // callback après upload (rafraîchir)
}

export default function UploadModal({ open, parentId, marcheId, onClose, onUploaded }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [description, setDescription] = useState("")
  const [typePiece, setTypePiece] = useState<"originale" | "copie">("originale")
  const [nombrePieces, setNombrePieces] = useState<number>(1) // ✅ ajouté
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const handleUpload = async () => {
    if (!file || !parentId) return alert("Sélectionnez un fichier et un dossier")

    const formData = new FormData()
    formData.append("file", file)
    formData.append("hierarchie_id", String(parentId))
    formData.append("description", description)
    formData.append("type_piece", typePiece)
    formData.append("nombre_pieces", String(nombrePieces)) // ✅ ajouté
    // formData.append("marche_id", String(marcheId));

    try {
      setLoading(true)
      await axios.post("/pieces/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      // reset du formulaire
      setFile(null)
      setDescription("")
      setTypePiece("originale")
      setNombrePieces(1)
      onUploaded()
      onClose()
    } catch (err) {
      console.error("Erreur upload:", err)
      alert("Erreur lors de l'upload du fichier")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Ajouter une pièce</h2>

        {/* Fichier */}
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full mb-4" />

        {/* Description */}
        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mb-4 rounded border p-2 dark:bg-gray-700 dark:text-white"
        />

        {/* Type */}
        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Type de pièce</label>
        <select
          value={typePiece}
          onChange={(e) => setTypePiece(e.target.value as "originale" | "copie")}
          className="w-full mb-4 rounded border p-2 dark:bg-gray-700 dark:text-white"
        >
          <option value="originale">Originale</option>
          <option value="copie">Copie</option>
        </select>

        {/* Nombre de pièces */}
        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Nombre de pièces</label>
        <input
          type="number"
          min={1}
          value={nombrePieces}
          onChange={(e) => setNombrePieces(Number(e.target.value))}
          className="w-full mb-6 rounded border p-2 dark:bg-gray-700 dark:text-white"
        />

        {/* Boutons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            Annuler
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="px-4 py-2 rounded bg-[var(--brand)] text-white disabled:opacity-50"
          >
            {loading ? "Upload…" : "Uploader"}
          </button>
        </div>
      </div>
    </div>
  )
}
