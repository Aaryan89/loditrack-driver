import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, EvStation, GasPump, Hotel, Navigation } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { googleMapsService } from "@/lib/googleMaps";
import { Skeleton } from "@/components/ui/skeleton";

interface Station {
  id: number;
  name: string;
  type: 'fuel' | 'ev' | 'rest';
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  openHours: string;
  amenities: string[];
  distance: number;
}

const StationsList = () => {
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

  // Get user's current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const location = await googleMapsService.getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  // Fetch nearby stations
  const { data: stations, isLoading, refetch } = useQuery({
    queryKey: ['/api/stations', userLocation?.lat, userLocation?.lng],
    queryFn: async () => {
      if (!userLocation) return [];
      
      const response = await fetch(
        `/api/stations?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=100`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch stations');
      }
      
      return response.json();
    },
    enabled: !!userLocation
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleGetDirections = (station: Station) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${station.coordinates.lat},${station.coordinates.lng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // Get icon based on station type
  const getStationIcon = (type: string) => {
    switch (type) {
      case 'fuel':
        return <GasPump className="h-5 w-5 text-[#1a73e8] mr-2" />;
      case 'ev':
        return <EvStation className="h-5 w-5 text-[#34a853] mr-2" />;
      case 'rest':
        return <Hotel className="h-5 w-5 text-[#fbbc04] mr-2" />;
      default:
        return <GasPump className="h-5 w-5 text-[#1a73e8] mr-2" />;
    }
  };

  // Format distance with appropriate unit
  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${Math.round(distance)} km`;
  };

  // Calculate estimated travel time (rough estimate)
  const calculateTravelTime = (distance: number) => {
    const avgSpeedKmPerMin = 0.8; // ~50 km/h in minutes
    const timeInMinutes = Math.round(distance / avgSpeedKmPerMin);
    
    if (timeInMinutes < 60) {
      return `${timeInMinutes} min`;
    }
    
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    return `${hours} hr${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} min` : ''}`;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">Nearby Stations</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm text-[#1a73e8] flex items-center"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 overflow-x-auto">
        {isLoading || !userLocation ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, index) => (
              <Skeleton key={index} className="h-48 w-full" />
            ))}
          </div>
        ) : stations && stations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stations.slice(0, 3).map((station: Station) => (
              <div key={station.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    {getStationIcon(station.type)}
                    <h4 className="font-medium text-gray-900">{station.name}</h4>
                  </div>
                  <span className="text-sm text-green-600">{station.openHours || 'Open 24/7'}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{station.address}</p>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span>
                    {formatDistance(station.distance)} ahead ({calculateTravelTime(station.distance)})
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {station.amenities?.map((amenity, index) => (
                      <span 
                        key={index} 
                        className="text-xs bg-blue-100 text-[#1a73e8] px-2 py-0.5 rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[#1a73e8] text-sm"
                    onClick={() => handleGetDirections(station)}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-600">No stations found nearby.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleRefresh}
            >
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StationsList;
