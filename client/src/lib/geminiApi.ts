// This file handles interactions with the Google Gemini API

// Define types for route optimization
interface DeliveryPoint {
  id: number | string;
  deliveryId?: string;
  destination: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  scheduledTime?: string;
  items?: any[];
}

interface Location {
  lat: number;
  lng: number;
}

interface RoutePreferences {
  prioritizeTime?: boolean;
  prioritizeDistance?: boolean;
  avoidHighways?: boolean;
  avoidTolls?: boolean;
  includeRestStops?: boolean;
  restInterval?: number; // minutes
  maxDrivingTime?: number; // hours
}

interface RecommendedStop {
  type: 'fuel' | 'rest' | 'charging';
  afterDeliveryId: number | string;
  location: Location;
  reason: string;
  estimatedArrivalTime?: string;
}

interface OptimizedRoute {
  optimizedRoute: (number | string)[];
  estimatedDistance: number;
  estimatedDuration: number;
  recommendedStops: RecommendedStop[];
  suggestions: string;
}

// Main service for interacting with Gemini API
const optimizeRoute = async (
  deliveries: DeliveryPoint[],
  startLocation: Location,
  preferences?: RoutePreferences
): Promise<OptimizedRoute> => {
  try {
    const response = await fetch('/api/routes/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deliveries,
        startLocation,
        preferences,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to optimize route');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in route optimization:', error);
    throw error;
  }
};

// Generate delivery schedule suggestions
const suggestDeliverySchedule = async (
  driver: { id: number; name: string },
  deliveries: DeliveryPoint[],
  existingCommitments: { start: string; end: string; title: string }[],
  preferences?: any
): Promise<any> => {
  try {
    // This would be replaced with an actual API call to the backend,
    // which would then use Gemini API to generate scheduling suggestions
    const response = await fetch('/api/routes/suggest-schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        driver,
        deliveries,
        existingCommitments,
        preferences,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to generate schedule suggestions');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in schedule suggestion:', error);
    throw error;
  }
};

// Analyze inventory and suggest optimal loading 
const suggestInventoryLoad = async (
  items: any[],
  truck: { capacity: number; currentLoad: number },
  deliveries: DeliveryPoint[]
): Promise<any> => {
  try {
    // This would be replaced with an actual API call to the backend,
    // which would then use Gemini API for inventory organization
    const response = await fetch('/api/inventory/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
        truck,
        deliveries,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to optimize inventory load');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in inventory load suggestion:', error);
    throw error;
  }
};

export const geminiService = {
  optimizeRoute,
  suggestDeliverySchedule,
  suggestInventoryLoad,
};

export default geminiService;
