"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default markers in react-leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
}

function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      // Reverse geocoding to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onLocationSelect(lat, lng, address);
      } catch (error) {
        console.error("Geocoding error:", error);
        onLocationSelect(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    },
  });

  return null;
}

interface LocationMapProps {
  onLocationSelect: (location: string) => void;
  initialLocation?: string;
  className?: string;
}

export default function LocationMap({ onLocationSelect, initialLocation, className }: LocationMapProps) {
  const [position, setPosition] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }

    // If there's an initial location, try to geocode it
    if (initialLocation && initialLocation.trim()) {
      geocodeAddress(initialLocation);
    }
  }, [initialLocation]);

  const geocodeAddress = async (address: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setPosition([lat, lng]);
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setPosition([lat, lng]);
    onLocationSelect(address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  };

  if (!isClient) {
    return (
      <div className={`h-40 bg-gradient-to-br from-surface-muted to-surface-muted/50 rounded-xl flex items-center justify-center text-surface-muted border-2 border-dashed border-surface-muted/50 ${className}`}>
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm">Loading Map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-40 rounded-xl overflow-hidden border-2 border-surface-muted/50 ${className}`}>
      <MapContainer
        center={position}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        key={`${position[0]}-${position[1]}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={icon} />
        <MapClickHandler onLocationSelect={handleLocationSelect} />
      </MapContainer>
    </div>
  );
}
