// Re-export types from the schema for use in the frontend
export { 
  User, 
  InventoryItem, 
  DeliveryStop, 
  Route, 
  Stop, 
  ScheduleEntry 
} from "@shared/schema";

// Additional types for the frontend

export interface TabProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export interface MapMarker {
  id: number;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
  type: string;
  status?: string;
}

export interface GeminiRecommendation {
  type: 'route' | 'schedule' | 'inventory' | 'general';
  text: string;
  priority: 'high' | 'medium' | 'low';
}

export interface DriverDashboardStats {
  totalItems: number;
  capacityUsage: number;
  upcomingDeliveries: number;
  totalDistance: string;
  estimatedTime: string;
  completionPercentage: number;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  date: string;
  read: boolean;
}

export interface DriverSession {
  id: number;
  username: string;
  name: string;
  driverId: string;
  isActive: boolean;
}
