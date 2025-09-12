import type React from "react"
import { useMapEvents } from "react-leaflet"

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })

  return null
}

export default MapClickHandler
