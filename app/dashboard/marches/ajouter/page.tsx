"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import axios from "@/lib/axios"
import { MapPin, PlusCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Typage du formulaire
interface FormData {
  num_marche: string
  objet: string
  annee: number
  num_boite: string
  organisme: string
  type_communaute_publique: string
  latitude: string
  longitude: string
}

export default function AjouterMarchePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [coordsSelected, setCoordsSelected] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    num_marche: "",
    objet: "",
    annee: new Date().getFullYear(),
    num_boite: "",
    organisme: "",
    type_communaute_publique: "",
    latitude: "",
    longitude: "",
  })
  useEffect(() => {
    const savedCoords = localStorage.getItem("selectedCoords")
    if (savedCoords) {
      try {
        const coordsData = JSON.parse(savedCoords)
        console.log("Loading coordinates:", coordsData)

        setFormData((prev) => ({
          ...prev,
          latitude: coordsData.latitude?.toString() || "",
          longitude: coordsData.longitude?.toString() || "",
        }))

        setCoordsSelected(true)
        setTimeout(() => setCoordsSelected(false), 3000)
      } catch (err) {
        console.error("Erreur lors du parsing des coordonnées:", err)
      }
    }

    // Listen for coordinate selection events
    const handleCoordsSelected = (event: CustomEvent) => {
      const { latitude, longitude } = event.detail
      setFormData((prev) => ({
        ...prev,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      }))
      setCoordsSelected(true)
      setTimeout(() => setCoordsSelected(false), 3000)
    }

    window.addEventListener("coordsSelected", handleCoordsSelected as EventListener)

    return () => {
      window.removeEventListener("coordsSelected", handleCoordsSelected as EventListener)
    }
  }, [])
  useEffect(() => {
    const savedFormData = localStorage.getItem("addMarcheFormData")
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData)
        setFormData((prev) => ({ ...prev, ...parsedData }))
        localStorage.removeItem("addMarcheFormData")
      } catch (error: unknown) {
        console.error("Erreur lors du parsing des données du formulaire:", error)
      }
    }
  }, [])

  // Gestion des changements de champs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Redirection vers la carte pour choisir les coordonnées
  const handleChoisirSurCarte = () => {
    localStorage.setItem("addMarcheFormData", JSON.stringify(formData))
    router.push("/dashboard/map?from=add-marche")
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let geom = null
      if (formData.latitude && formData.longitude) {
        geom = `POINT(${Number.parseFloat(formData.longitude)} ${Number.parseFloat(formData.latitude)})`
      }

      await axios.post("/marches/add", {
        num_marche: formData.num_marche,
        objet: formData.objet,
        annee: Number(formData.annee),
        num_boite: formData.num_boite,
        organisme: formData.organisme,
        type_communaute_publique: formData.type_communaute_publique,
        geom,
      })

      router.push("/dashboard/marches")
    } catch (error: unknown) {
      console.error(error)
      const err = error as any
      const msg = err.response?.data?.message || "Erreur lors de l'ajout du marché."
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-1 bg-[var(--muted-bg)] rounded-xl">
              <PlusCircle className="w-8 h-8 text-[var(--brand)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">Ajouter un marché</h1>
              <p className="text-slate-500 mt-1">Créez un nouveau marché public</p>
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
                  value={formData.num_marche}
                  onChange={handleChange}
                  placeholder="ex: 25/001"
                  required
                  className="border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--ring)]"
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
                  value={formData.annee}
                  onChange={handleChange}
                  required
                  className="border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--ring)]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="objet" className="text-sm font-medium text-[var(--foreground)]">
                  Objet *
                </label>
                <Input
                  id="objet"
                  name="objet"
                  value={formData.objet}
                  onChange={handleChange}
                  placeholder="ex: Travaux de réhabilitation..."
                  required
                  className="border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--ring)]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="num_boite" className="text-sm font-medium text-[var(--foreground)]">
                  Numéro de boîte
                </label>
                <Input
                  id="num_boite"
                  name="num_boite"
                  value={formData.num_boite}
                  onChange={handleChange}
                  placeholder="ex: B-17"
                  className="border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--ring)]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="organisme" className="text-sm font-medium text-[var(--foreground)]">
                  Organisme
                </label>
                <Input
                  id="organisme"
                  name="organisme"
                  value={formData.organisme}
                  onChange={handleChange}
                  placeholder="ex: Mairie"
                  className="border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--ring)]"
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
                value={formData.type_communaute_publique}
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
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="ex: 34.0205"
                    className={
                      coordsSelected
                        ? "border-[var(--brand)] bg-[var(--muted-bg)]"
                        : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--ring)]"
                    }
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
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="ex: -6.8336"
                    className={
                      coordsSelected
                        ? "border-[var(--brand)] bg-[var(--muted-bg)]"
                        : "border-slate-200 focus:border-[var(--brand)] focus:ring-[var(--ring)]"
                    }
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleChoisirSurCarte}
                className="flex items-center justify-center gap-2 w-fit px-85 py- rounded-xl border border-[var(--brand)] text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-all duration-200"
              >
                <MapPin className="w-5 h-5" />
                <span>Choisir sur la carte</span>
              </Button>

              <p className="text-sm text-slate-600 text-center">
                Cliquez pour sélectionner les coordonnées sur la carte interactive
              </p>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center pt-6">
            <Button
              type="submit"
              disabled={loading}
              size="lg"
              className="min-w-[200px] bg-[var(--brand)] hover:bg-[var(--brand-600)] text-white"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Ajouter le marché
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
