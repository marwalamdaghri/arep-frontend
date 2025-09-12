"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import axios from "@/lib/axios"
import { MapPin, Loader2, CheckCircle2, Edit } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ModifierMarchePage() {
  const router = useRouter()
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [coordsSelected, setCoordsSelected] = useState(false)
  const [marche, setMarche] = useState<any>(null)

  const [form, setForm] = useState({
    num_marche: "",
    objet: "",
    organisme: "",
    annee: "",
    num_boite: "",
    type_communaute_publique: "",
    latitude: "",
    longitude: "",
  })

  // Chargement initial
  useEffect(() => {
    const fetchMarche = async () => {
      try {
        const res = await axios.get(`/marches/${id}`)
        setMarche(res.data)
        setForm({
          num_marche: res.data.num_marche || "",
          objet: res.data.objet || "",
          organisme: res.data.organisme || "",
          annee: res.data.annee || "",
          num_boite: res.data.num_boite || "",
          type_communaute_publique: res.data.type_communaute_publique || "",
          latitude: res.data.latitude || "",
          longitude: res.data.longitude || "",
        })
      } catch (err) {
        console.error("Erreur chargement marché", err)
      } finally {
        setLoading(false)
      }
    }
    fetchMarche()
  }, [id])

  // Restauration après retour depuis la carte
  useEffect(() => {
    const savedFormData = localStorage.getItem("editMarcheFormData")
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData)
        setForm((prev) => ({ ...prev, ...parsed }))
        localStorage.removeItem("editMarcheFormData")
      } catch (err) {
        console.error("Erreur parsing form data:", err)
      }
    }
  }, [])

  // Gestion coords choisies depuis la carte
  useEffect(() => {
    const handleCoordsSelected = (event: any) => {
      const { latitude, longitude } = event.detail
      setForm((prev) => ({
        ...prev,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      }))
      setCoordsSelected(true)
      setTimeout(() => setCoordsSelected(false), 3000)
    }

    window.addEventListener("coordsSelected", handleCoordsSelected as EventListener)
    return () => window.removeEventListener("coordsSelected", handleCoordsSelected as EventListener)
  }, [])

  // Redirection vers la carte
  const handleChoisirSurCarte = () => {
    localStorage.setItem("editMarcheFormData", JSON.stringify(form))
    router.push(`/dashboard/map?from=edit-marche&id=${id}`)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await axios.put(`/marches/${id}`, form)
      alert("Marché modifié avec succès")
      router.push("/dashboard/marches")
    } catch (err) {
      console.error("Erreur modification", err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8">Chargement...</div>
  if (!marche) return <div className="p-8 text-red-500">Marché introuvable</div>

  return (
    <div className="min-h-screen bg-[var(--background)] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-[var(--muted-bg)] rounded-xl">
              <Edit className="w-8 h-8 text-[var(--brand)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                Modifier le marché {marche.num_marche}
              </h1>
              <p className="text-slate-500 mt-1">Mettez à jour les informations du marché</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-[var(--muted-bg)]">
              <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
                <div className="w-2 h-2 bg-[var(--brand)] rounded-full"></div>
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[var(--background)]">
              <div className="space-y-2">
                <label htmlFor="num_marche" className="text-sm font-medium text-[var(--foreground)]">
                  Numéro de marché *
                </label>
                <Input
                  id="num_marche"
                  name="num_marche"
                  value={form.num_marche}
                  onChange={handleChange}
                  placeholder="ex: 25/001"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="annee" className="text-sm font-medium text-[var(--foreground)]">
                  Année *
                </label>
                <Input
                  id="annee"
                  name="annee"
                  type="number"
                  value={form.annee}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="objet" className="text-sm font-medium text-[var(--foreground)]">
                  Objet *
                </label>
                <Input
                  id="objet"
                  name="objet"
                  value={form.objet}
                  onChange={handleChange}
                  placeholder="ex: Travaux de réhabilitation..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="num_boite" className="text-sm font-medium text-[var(--foreground)]">
                  Numéro de boîte
                </label>
                <Input
                  id="num_boite"
                  name="num_boite"
                  value={form.num_boite}
                  onChange={handleChange}
                  placeholder="ex: B-17"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="organisme" className="text-sm font-medium text-[var(--foreground)]">
                  Organisme
                </label>
                <Input
                  id="organisme"
                  name="organisme"
                  value={form.organisme}
                  onChange={handleChange}
                  placeholder="ex: Mairie"
                />
              </div>
            </CardContent>
          </Card>

          {/* Type de communauté */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-[var(--muted-bg)]">
              <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
                <div className="w-2 h-2 bg-[var(--brand)] rounded-full"></div>
                Type de communauté publique
              </CardTitle>
            </CardHeader>
            <CardContent className="bg-[var(--background)]">
              <select
                value={form.type_communaute_publique}
                onChange={(e) => handleSelectChange("type_communaute_publique", e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--ring)] bg-[var(--background)] text-[var(--foreground)]"
              >
                <option value="">Choisir le type</option>
                <option value="Commune">Commune</option>
                <option value="Province">Province</option>
                <option value="Région">Région</option>
              </select>
            </CardContent>
          </Card>

          {/* Localisation */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-[var(--muted-bg)]">
              <CardTitle className="flex items-center gap-2 text-[var(--foreground)]">
                <div className="w-2 h-2 bg-[var(--brand)] rounded-full"></div>
                Localisation
                {coordsSelected && (
                  <div className="flex items-center gap-1 text-[var(--brand)] text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Coordonnées sélectionnées
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 bg-[var(--background)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="latitude" className="text-sm font-medium text-[var(--foreground)]">
                    Latitude
                  </label>
                  <Input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={form.latitude}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="longitude" className="text-sm font-medium text-[var(--foreground)]">
                    Longitude
                  </label>
                  <Input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={form.longitude}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleChoisirSurCarte}
                className="flex items-center justify-center gap-2 w-fit px-6 py-2 rounded-xl border border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all duration-200"
              >
                <MapPin className="w-5 h-5" />
                <span>Choisir sur la carte</span>
              </Button>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={saving}
              size="lg"
              className="min-w-[200px] bg-[var(--brand)] hover:bg-[var(--brand-600)] text-white"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
