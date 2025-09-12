"use client"

import { X } from "lucide-react"

interface PreviewModalProps {
  open: boolean
  fileUrl: string | null
  fileName: string
  onClose: () => void
}

export default function PreviewModal({ open, fileUrl, fileName, onClose }: PreviewModalProps) {
  if (!open || !fileUrl) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-[90vw] h-[90vh] max-w-6xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Aperçu du fichier</h2>
            <p className="text-sm text-gray-600 truncate">{fileName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          <div className="w-full h-full bg-gray-50 rounded-lg overflow-hidden">
            <iframe
              src={fileUrl}
              title={`Aperçu de ${fileName}`}
              className="w-full h-full border-0"
              onError={() => {
                console.error("Erreur lors du chargement du fichier:", fileUrl)
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <a
            href={fileUrl}
            download={fileName}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
          >
            Télécharger
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
