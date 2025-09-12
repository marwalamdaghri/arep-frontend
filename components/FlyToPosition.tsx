"use client"

import type React from "react"

import { useEffect } from "react"
import { useMap } from "react-leaflet"

interface FlyToPositionProps {
  position: [number, number] | null
  zoom?: number
}

const FlyToPosition: React.FC<FlyToPositionProps> = ({ position, zoom = 13 }) => {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom)
    }
  }, [position, zoom, map])

  return null
}

export default FlyToPosition
