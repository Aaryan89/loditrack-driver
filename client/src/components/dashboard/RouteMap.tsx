import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navigation, Printer, Plus, Minus, Locate } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { googleMapsService } from "@/lib/googleMaps";
import { Skeleton } from "@/components/ui/skeleton";

interface RouteMapProps {
  date?: Date;
  driverId?: number;
}

const RouteMap = ({ date = new Date(), driverId }: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  
  // Fetch route data for the given date and driver
  const { data: routeData, isLoading } = useQuery({
    queryKey: ['/api/routes', date.toISOString().split('T')[0], driverId],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append('date', date.toISOString().split('T')[0]);
      if (driverId) queryParams.append('driverId', String(driverId));
      
      const response = await fetch(`/api/routes?${queryParams}`);
      const routes = await response.json();
      return routes[0]; // Get the first route for the day
    }
  });
  
  // Fetch deliveries for the route
  const { data: deliveryData, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ['/api/deliveries', routeData?.waypoints],
    enabled: !!routeData?.waypoints,
    queryFn: async () => {
      // We would fetch deliveries by ID from the waypoints
      // For this example, we'll just return some mock data
      return routeData.waypoints.map((id: number) => ({
        id,
        coordinates: { lat: 37.7749 + (Math.random() * 0.1 - 0.05), lng: -122.4194 + (Math.random() * 0.1 - 0.05) },
        destination: `Delivery #${id}`,
        address: "123 Example St"
      }));
    }
  });

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return;
    
    const initMap = async () => {
      try {
        const mapInstance = await googleMapsService.initializeMap('route-map');
        setMap(mapInstance);
        
        // Try to get user's current location
        try {
          const location = await googleMapsService.getCurrentLocation();
          setUserLocation(location);
          mapInstance.setCenter(location);
        } catch (error) {
          console.warn('Could not get current location:', error);
        }
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };
    
    initMap();
  }, []);

  // Update map with route and deliveries when data is available
  useEffect(() => {
    if (!map || !routeData || !deliveryData || isLoading || isLoadingDeliveries) return;
    
    const drawRoute = async () => {
      try {
        // Clear existing markers
        map.data.forEach((feature) => {
          map.data.remove(feature);
        });
        
        // Add markers for each delivery
        deliveryData.forEach((delivery: any) => {
          googleMapsService.addMarker(map, delivery.coordinates, {
            title: delivery.destination,
            content: `<div><strong>${delivery.destination}</strong><br/>${delivery.address}</div>`
          });
        });
        
        // Calculate and display the route
        if (deliveryData.length > 0) {
          const origin = userLocation || deliveryData[0].coordinates;
          const destination = deliveryData[deliveryData.length - 1].coordinates;
          const waypoints = deliveryData.slice(1, -1).map((delivery: any) => ({
            location: delivery.coordinates,
            stopover: true
          }));
          
          await googleMapsService.calculateRoute(map, origin, destination, waypoints);
        }
      } catch (error) {
        console.error('Error drawing route:', error);
      }
    };
    
    drawRoute();
  }, [map, routeData, deliveryData, isLoading, isLoadingDeliveries, userLocation]);

  const handleZoomIn = () => {
    if (map) {
      map.setZoom(map.getZoom()! + 1);
    }
  };

  const handleZoomOut = () => {
    if (map) {
      map.setZoom(map.getZoom()! - 1);
    }
  };

  const handleLocateMe = async () => {
    if (map) {
      try {
        const location = await googleMapsService.getCurrentLocation();
        setUserLocation(location);
        map.setCenter(location);
      } catch (error) {
        console.error('Error getting location:', error);
      }
    }
  };

  const handleStartNavigation = () => {
    if (!routeData || !deliveryData || deliveryData.length === 0) return;
    
    // Open Google Maps with directions
    const firstDelivery = deliveryData[0];
    const url = `https://www.google.com/maps/dir/?api=1&destination=${firstDelivery.coordinates.lat},${firstDelivery.coordinates.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <Card className="mb-6">
      <CardHeader className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">Today's Route</CardTitle>
          <div className="flex">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2 text-sm text-[#1a73e8] flex items-center"
              onClick={handleStartNavigation}
              disabled={isLoading || isLoadingDeliveries || !deliveryData || deliveryData.length === 0}
            >
              <Navigation className="h-4 w-4 mr-1" /> Start Navigation
            </Button>
            <Button variant="ghost" size="sm" className="text-sm text-gray-600 flex items-center">
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <div className="relative">
        {(isLoading || isLoadingDeliveries) ? (
          <Skeleton className="h-[500px] w-full" />
        ) : (
          <div id="route-map" ref={mapRef} className="h-[500px] w-full"></div>
        )}
        
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow p-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded mb-1"
            onClick={handleZoomIn}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded mb-1"
            onClick={handleZoomOut}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 text-gray-600 hover:bg-gray-100 rounded"
            onClick={handleLocateMe}
          >
            <Locate className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4 border-t border-gray-200">
        <div className="flex items-center text-gray-600 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>Estimated completion time: <span className="font-medium">5:30 PM</span></span>
          <span className="mx-3">|</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <path d="M3 22h12"></path>
            <path d="M5 18V7a5 5 0 0 1 5-5h0a5 5 0 0 1 5 5v11"></path>
            <line x1="7" y1="15" x2="9" y2="15"></line>
            <line x1="11" y1="15" x2="13" y2="15"></line>
            <line x1="7" y1="11" x2="13" y2="11"></line>
            <line x1="7" y1="7" x2="13" y2="7"></line>
            <circle cx="15" cy="22" r="1"></circle>
            <circle cx="5" cy="22" r="1"></circle>
          </svg>
          <span>Next fuel stop: <span className="font-medium">2:15 PM</span> (83 km ahead)</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default RouteMap;
