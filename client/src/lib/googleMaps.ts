// This file handles interactions with the Google Maps JavaScript API

// Initialize the map with provided API key
const initializeMap = (elementId: string): Promise<google.maps.Map> => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'missing-api-key';
  
  return new Promise((resolve, reject) => {
    // First check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      const map = new google.maps.Map(document.getElementById(elementId)!, {
        center: { lat: 37.7749, lng: -122.4194 }, // Default: San Francisco
        zoom: 10,
        mapTypeControl: true,
        fullscreenControl: false,
        streetViewControl: false,
      });
      resolve(map);
      return;
    }
    
    // Otherwise load the script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.defer = true;
    script.async = true;
    script.onload = () => {
      const map = new google.maps.Map(document.getElementById(elementId)!, {
        center: { lat: 37.7749, lng: -122.4194 }, // Default: San Francisco
        zoom: 10,
        mapTypeControl: true,
        fullscreenControl: false,
        streetViewControl: false,
      });
      resolve(map);
    };
    script.onerror = (error) => {
      reject(new Error('Failed to load Google Maps API: ' + error));
    };
    document.head.appendChild(script);
  });
};

// Calculate and display a route between multiple points
const calculateRoute = async (
  map: google.maps.Map,
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral,
  waypoints: google.maps.DirectionsWaypoint[] = []
): Promise<google.maps.DirectionsResult> => {
  return new Promise((resolve, reject) => {
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false,
    });
    
    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);
          resolve(result);
        } else {
          reject(new Error(`Failed to calculate route: ${status}`));
        }
      }
    );
  });
};

// Add a marker to the map
const addMarker = (
  map: google.maps.Map,
  position: google.maps.LatLngLiteral,
  options: {
    title?: string;
    icon?: string;
    label?: string;
    content?: string;
  } = {}
): google.maps.Marker => {
  const marker = new google.maps.Marker({
    position,
    map,
    title: options.title,
    icon: options.icon,
    label: options.label,
  });
  
  if (options.content) {
    const infoWindow = new google.maps.InfoWindow({
      content: options.content,
    });
    
    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });
  }
  
  return marker;
};

// Find nearby places of a specific type
const findNearbyPlaces = (
  map: google.maps.Map,
  location: google.maps.LatLngLiteral,
  type: string,
  radius: number = 5000
): Promise<google.maps.places.PlaceResult[]> => {
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(map);
    
    service.nearbySearch(
      {
        location,
        radius,
        type: type as google.maps.places.PlaceType,
      },
      (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      }
    );
  });
};

// Get station icons by type
const getStationIcon = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'fuel':
    case 'gas_station':
      return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    case 'ev':
    case 'charging_station':
      return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
    case 'rest':
    case 'hotel':
      return 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    default:
      return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
  }
};

// Get the user's current location
const getCurrentLocation = (): Promise<google.maps.LatLngLiteral> => {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        }
      );
    } else {
      reject(new Error('Geolocation is not supported by this browser.'));
    }
  });
};

export const googleMapsService = {
  initializeMap,
  calculateRoute,
  addMarker,
  findNearbyPlaces,
  getStationIcon,
  getCurrentLocation,
};

export default googleMapsService;
