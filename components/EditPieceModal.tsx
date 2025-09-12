"use client"

import { useEffect, useState } from "react"
import axios from "@/lib/axios"

export interface EditPiece {
  id: number
  description: string
  type_piece: "originale" | "copie" | string
  nombre_pieces: number // <-- ajouté
}

interface EditPieceModalProps {
  open: boolean
  piece: EditPiece | null
  onClose: () => void
  onUpdated: () => void // callback pour recharger
}

export default function EditPieceModal({ open, piece, onClose, onUpdated }: EditPieceModalProps) {
  const [description, setDescription] = useState("")
  const [typePiece, setTypePiece] = useState<"originale" | "copie" | string>("originale")
  const [nombrePieces, setNombrePieces] = useState<number>(1) // <-- ajouté
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setDescription(piece?.description ?? "")
    setTypePiece((piece?.type_piece as any) ?? "originale")
    setNombrePieces(piece?.nombre_pieces ?? 1) // <-- initialise
  }, [piece, open])

  if (!open || !piece) return null

  const handleSave = async () => {
    try {
      setLoading(true)
      await axios.put(`/pieces/${piece.id}`, {
        description,
        type_piece: typePiece,
        nombre_pieces: nombrePieces, // <-- inclus
      })
      onUpdated()
      onClose()
    } catch (err) {
      console.error("Erreur update:", err)
      alert("Erreur lors de la modification de la pièce")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Modifier la pièce</h2>

        {/* Description */}
        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full mb-4 rounded border p-2 dark:bg-gray-700 dark:text-white"
        />

        {/* Type de pièce */}
        <label className="block text-sm text-gray-700 dark:text-gray-200 mb-1">Type de pièce</label>
        <select
          value={typePiece}
          onChange={(e) => setTypePiece(e.target.value)}
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

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded bg-[var(--brand)] text-white disabled:opacity-50"
          >
            {loading ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  )
}
