"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, MapPin, Loader2, Save } from "lucide-react"
import axios from "@/lib/axios"

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

interface EditMarcheModalProps {
  marche: Marche
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditMarcheModal({ marche, isOpen, onClose, onSuccess }: EditMarcheModalProps) {
  const [loading, setLoading] = useState(false)
  const [locLoading, setLocLoading] = useState(false)
  const [formData, setFormData] = useState({
    num_marche: "",
    objet: "",
    annee: new Date().getFullYear(),
    num_boite: "",
    organisme: "",
    type_communaute_publique: "",
    geom: "",
  })

  // Pré-remplir le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && marche) {
      setFormData({
        num_marche: marche.num_marche || "",
        objet: marche.objet || "",
        annee: marche.annee || new Date().getFullYear(),
        num_boite: marche.num_boite || "",
        organisme: marche.organisme || "",
        type_communaute_publique: marche.type_communaute_publique || "",
        geom: marche.longitude && marche.latitude ? `POINT(${marche.longitude} ${marche.latitude})` : "",
      })
    }
  }, [isOpen, marche])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleMaPosition = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.")
      return
    }
    setLocLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lon = position.coords.longitude
        const lat = position.coords.latitude
        setFormData({
          ...formData,
          geom: `POINT(${lon} ${lat})`,
        })
        setLocLoading(false)
      },
      () => {
        alert("Impossible de récupérer la position.")
        setLocLoading(false)
      },
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await axios.put(`/marches/${marche.id}`, {
        num_marche: formData.num_marche,
        objet: formData.objet,
        annee: Number(formData.annee),
        num_boite: formData.num_boite,
        organisme: formData.organisme,
        type_communaute_publique: formData.type_communaute_publique,
        geom: formData.geom || null,
      })

      onSuccess()
      onClose()
    } catch (err) {
      alert("Erreur lors de la modification du marché.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Save className="text-emerald-600" size={24} />
            Modifier le marché
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { name: "num_marche", label: "Numéro de marché", placeholder: "ex: 25/001", required: true },
              { name: "objet", label: "Objet", placeholder: "ex: Travaux de réhabilitation...", required: true },
              { name: "annee", label: "Année", type: "number", required: true },
              { name: "num_boite", label: "Numéro de boîte", placeholder: "ex: B-17" },
              { name: "organisme", label: "Organisme", placeholder: "ex: Mairie" },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
                <input
                  type={field.type || "text"}
                  name={field.name}
                  value={formData[field.name as keyof typeof formData]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  required={field.required}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
              </div>
            ))}

            {/* Type communauté publique */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de communauté publique</label>
              <select
                name="type_communaute_publique"
                value={formData.type_communaute_publique}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              >
                <option value="">Choisir le type</option>
                <option value="Commune">Commune</option>
                <option value="Province">Province</option>
                <option value="Région">Région</option>
              </select>
            </div>

            {/* Champ geom */}
            <div className="sm:col-span-2 flex flex-col gap-2">
              <label className="block text-sm font-medium text-gray-700">Coordonnées (geom)</label>
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  name="geom"
                  value={formData.geom}
                  onChange={handleChange}
                  placeholder="ex: POINT(2.3522 48.8566)"
                  className="flex-1 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                />
                <button
                  type="button"
                  onClick={handleMaPosition}
                  className="flex items-center gap-2 bg-gray-200 px-4 py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  {locLoading ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}
                  Ma position actuelle
                </button>
              </div>
              <p className="text-xs text-gray-500">Format : POINT(longitude latitude)</p>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              Enregistrer les modifications
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
