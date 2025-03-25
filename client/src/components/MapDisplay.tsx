import { useEffect, useRef, useState } from "react";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { DeliveryStop, Stop } from "@shared/schema";

interface MapDisplayProps {
  stops?: Array<DeliveryStop | Stop>;
  type?: "deliveries" | "stops";
}

export default function MapDisplay({ stops = [], type = "deliveries" }: MapDisplayProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { isLoaded, loadError } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  
  // Initialize the map
  useEffect(() => {
    if (!isLoaded || loadError || !mapContainerRef.current) return;
    
    const mapOptions = {
      center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      zoom: 12,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    };
    
    const newMap = new google.maps.Map(mapContainerRef.current, mapOptions);
    setMap(newMap);
  }, [isLoaded, loadError]);
  
  // Add markers for stops when map and stops are available
  useEffect(() => {
    if (!map || !stops.length || !isLoaded) return;
    
    // Clear existing markers
    map.data.forEach(feature => {
      map.data.remove(feature);
    });
    
    const bounds = new google.maps.LatLngBounds();
    
    // Add markers for each stop
    stops.forEach((stop) => {
      // In a real application, you would use the address to geocode to get lat/lng coordinates
      // For this demo, we'll use random offsets from the center of San Francisco
      const lat = 37.7749 + (Math.random() - 0.5) * 0.05;
      const lng = -122.4194 + (Math.random() - 0.5) * 0.05;
      const position = new google.maps.LatLng(lat, lng);
      
      // Create marker
      const marker = new google.maps.Marker({
        position,
        map,
        title: stop.name,
        icon: {
          url: `http://maps.google.com/mapfiles/ms/icons/${getMarkerColor(stop)}.png`,
        }
      });
      
      // Add info window
      const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(stop, type)
      });
      
      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
      
      bounds.extend(position);
    });
    
    // Fit map to show all markers
    map.fitBounds(bounds);
    
    // If only 1 marker, zoom out a bit
    if (stops.length === 1) {
      map.setZoom(14);
    }
  }, [map, stops, isLoaded, type]);
  
  const getMarkerColor = (stop: DeliveryStop | Stop) => {
    if (type === "deliveries") {
      const deliveryStop = stop as DeliveryStop;
      if (deliveryStop.status === "completed") return "green";
      if (deliveryStop.status === "current") return "blue";
      return "red";
    } else {
      const restStop = stop as Stop;
      if (restStop.type === "fuel") return "yellow";
      if (restStop.type === "rest") return "blue";
      if (restStop.type === "ev") return "green";
      return "red";
    }
  };
  
  const createInfoWindowContent = (stop: DeliveryStop | Stop, type: string) => {
    if (type === "deliveries") {
      const deliveryStop = stop as DeliveryStop;
      return `
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">${deliveryStop.name}</h3>
          <p style="font-size: 12px; margin-bottom: 4px;">${deliveryStop.address}</p>
          <div style="font-size: 12px; color: #666;">
            <p>Time: ${deliveryStop.time}</p>
            <p>Items: ${deliveryStop.itemCount}</p>
            <p>Status: ${deliveryStop.status}</p>
          </div>
        </div>
      `;
    } else {
      const restStop = stop as Stop;
      return `
        <div style="padding: 8px; max-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">${restStop.name}</h3>
          <p style="font-size: 12px; margin-bottom: 4px;">${restStop.address}</p>
          <div style="font-size: 12px; color: #666;">
            <p>Type: ${restStop.type}</p>
            <p>Hours: ${restStop.hours}</p>
            <p>Distance: ${restStop.distance}</p>
          </div>
        </div>
      `;
    }
  };

  if (loadError) {
    return (
      <div className="bg-neutral-100 h-full flex items-center justify-center">
        <div className="text-center p-6">
          <i className="fas fa-exclamation-triangle text-warning text-4xl mb-4"></i>
          <h3 className="text-lg font-medium text-neutral-700 mb-2">Error Loading Maps</h3>
          <p className="text-neutral-600">
            There was an error loading Google Maps. Please check your API key and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="bg-neutral-100 h-full flex items-center justify-center">
        <div className="text-center p-6">
          <i className="fas fa-spinner fa-spin text-primary text-4xl mb-4"></i>
          <h3 className="text-lg font-medium text-neutral-700 mb-2">Loading Maps</h3>
          <p className="text-neutral-600">
            Please wait while we load Google Maps...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="h-full w-full"></div>
  );
}
