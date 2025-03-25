import { 
  users, type User, type InsertUser,
  inventoryItems, type InventoryItem, type InsertInventoryItem,
  deliveries, type Delivery, type InsertDelivery,
  routes, type Route, type InsertRoute,
  stations, type Station, type InsertStation,
  calendarEvents, type CalendarEvent, type InsertCalendarEvent
} from "@shared/schema";

// Define the interface for storage operations
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Inventory methods
  getInventoryItems(): Promise<InventoryItem[]>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  
  // Delivery methods
  getDeliveries(): Promise<Delivery[]>;
  getDelivery(id: number): Promise<Delivery | undefined>;
  getDeliveriesByDriver(driverId: number): Promise<Delivery[]>;
  getDeliveriesByStatus(status: string): Promise<Delivery[]>;
  getDeliveriesByDate(date: Date): Promise<Delivery[]>;
  createDelivery(delivery: InsertDelivery): Promise<Delivery>;
  updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery | undefined>;
  deleteDelivery(id: number): Promise<boolean>;
  
  // Route methods
  getRoutes(): Promise<Route[]>;
  getRoute(id: number): Promise<Route | undefined>;
  getRoutesByDriver(driverId: number): Promise<Route[]>;
  getRoutesByDate(date: Date): Promise<Route[]>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, route: Partial<InsertRoute>): Promise<Route | undefined>;
  deleteRoute(id: number): Promise<boolean>;
  
  // Station methods
  getStations(): Promise<Station[]>;
  getStation(id: number): Promise<Station | undefined>;
  getNearbyStations(lat: number, lng: number, radius: number): Promise<Station[]>;
  createStation(station: InsertStation): Promise<Station>;
  updateStation(id: number, station: Partial<InsertStation>): Promise<Station | undefined>;
  deleteStation(id: number): Promise<boolean>;
  
  // Calendar event methods
  getCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEvent(id: number): Promise<CalendarEvent | undefined>;
  getCalendarEventsByDriver(driverId: number): Promise<CalendarEvent[]>;
  getCalendarEventsByDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: number, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private inventoryItems: Map<number, InventoryItem>;
  private deliveries: Map<number, Delivery>;
  private routes: Map<number, Route>;
  private stations: Map<number, Station>;
  private calendarEvents: Map<number, CalendarEvent>;
  
  private nextUserId: number;
  private nextInventoryItemId: number;
  private nextDeliveryId: number;
  private nextRouteId: number;
  private nextStationId: number;
  private nextCalendarEventId: number;
  
  constructor() {
    this.users = new Map();
    this.inventoryItems = new Map();
    this.deliveries = new Map();
    this.routes = new Map();
    this.stations = new Map();
    this.calendarEvents = new Map();
    
    this.nextUserId = 1;
    this.nextInventoryItemId = 1;
    this.nextDeliveryId = 1;
    this.nextRouteId = 1;
    this.nextStationId = 1;
    this.nextCalendarEventId = 1;
    
    this.initSampleData();
  }
  
  private initSampleData() {
    // Create default admin user
    this.createUser({
      username: "john.driver",
      password: "password123",
      fullName: "John Driver",
      role: "Lead Driver",
      email: "john.driver@example.com",
      phoneNumber: "+1234567890"
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.nextUserId++;
    const newUser = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }
  
  // Inventory methods
  async getInventoryItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values());
  }
  
  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }
  
  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.nextInventoryItemId++;
    const newItem = { ...item, id };
    this.inventoryItems.set(id, newItem);
    return newItem;
  }
  
  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const existingItem = this.inventoryItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }
  
  // Delivery methods
  async getDeliveries(): Promise<Delivery[]> {
    return Array.from(this.deliveries.values());
  }
  
  async getDelivery(id: number): Promise<Delivery | undefined> {
    return this.deliveries.get(id);
  }
  
  async getDeliveriesByDriver(driverId: number): Promise<Delivery[]> {
    return Array.from(this.deliveries.values())
      .filter(delivery => delivery.assignedDriver === driverId);
  }
  
  async getDeliveriesByStatus(status: string): Promise<Delivery[]> {
    return Array.from(this.deliveries.values())
      .filter(delivery => delivery.status === status);
  }
  
  async getDeliveriesByDate(date: Date): Promise<Delivery[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);
    
    return Array.from(this.deliveries.values())
      .filter(delivery => {
        const deliveryDate = new Date(delivery.scheduledTime);
        return deliveryDate >= targetDate && deliveryDate < nextDay;
      });
  }
  
  async createDelivery(delivery: InsertDelivery): Promise<Delivery> {
    const id = this.nextDeliveryId++;
    const newDelivery = { ...delivery, id };
    this.deliveries.set(id, newDelivery);
    return newDelivery;
  }
  
  async updateDelivery(id: number, delivery: Partial<InsertDelivery>): Promise<Delivery | undefined> {
    const existingDelivery = this.deliveries.get(id);
    if (!existingDelivery) return undefined;
    
    const updatedDelivery = { ...existingDelivery, ...delivery };
    this.deliveries.set(id, updatedDelivery);
    return updatedDelivery;
  }
  
  async deleteDelivery(id: number): Promise<boolean> {
    return this.deliveries.delete(id);
  }
  
  // Route methods
  async getRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }
  
  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }
  
  async getRoutesByDriver(driverId: number): Promise<Route[]> {
    return Array.from(this.routes.values())
      .filter(route => route.assignedDriver === driverId);
  }
  
  async getRoutesByDate(date: Date): Promise<Route[]> {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(targetDate.getDate() + 1);
    
    return Array.from(this.routes.values())
      .filter(route => {
        const routeDate = new Date(route.date);
        return routeDate >= targetDate && routeDate < nextDay;
      });
  }
  
  async createRoute(route: InsertRoute): Promise<Route> {
    const id = this.nextRouteId++;
    const newRoute = { ...route, id };
    this.routes.set(id, newRoute);
    return newRoute;
  }
  
  async updateRoute(id: number, route: Partial<InsertRoute>): Promise<Route | undefined> {
    const existingRoute = this.routes.get(id);
    if (!existingRoute) return undefined;
    
    const updatedRoute = { ...existingRoute, ...route };
    this.routes.set(id, updatedRoute);
    return updatedRoute;
  }
  
  async deleteRoute(id: number): Promise<boolean> {
    return this.routes.delete(id);
  }
  
  // Station methods
  async getStations(): Promise<Station[]> {
    return Array.from(this.stations.values());
  }
  
  async getStation(id: number): Promise<Station | undefined> {
    return this.stations.get(id);
  }
  
  async getNearbyStations(lat: number, lng: number, radius: number): Promise<Station[]> {
    // Simple implementation to calculate distance and filter by radius
    // In a real implementation, this would use a more sophisticated geospatial query
    return Array.from(this.stations.values())
      .map(station => {
        const coords = station.coordinates as { lat: number, lng: number };
        const distance = this.calculateDistance(lat, lng, coords.lat, coords.lng);
        return { ...station, distance };
      })
      .filter(station => station.distance <= radius)
      .sort((a, b) => a.distance - b.distance);
  }
  
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    // Simple implementation of the Haversine formula
    const R = 6371; // Radius of the Earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  }
  
  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  async createStation(station: InsertStation): Promise<Station> {
    const id = this.nextStationId++;
    const newStation = { ...station, id };
    this.stations.set(id, newStation);
    return newStation;
  }
  
  async updateStation(id: number, station: Partial<InsertStation>): Promise<Station | undefined> {
    const existingStation = this.stations.get(id);
    if (!existingStation) return undefined;
    
    const updatedStation = { ...existingStation, ...station };
    this.stations.set(id, updatedStation);
    return updatedStation;
  }
  
  async deleteStation(id: number): Promise<boolean> {
    return this.stations.delete(id);
  }
  
  // Calendar event methods
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values());
  }
  
  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    return this.calendarEvents.get(id);
  }
  
  async getCalendarEventsByDriver(driverId: number): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values())
      .filter(event => event.assignedDriver === driverId);
  }
  
  async getCalendarEventsByDateRange(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values())
      .filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= startDate && eventStart <= endDate;
      });
  }
  
  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = this.nextCalendarEventId++;
    const newEvent = { ...event, id };
    this.calendarEvents.set(id, newEvent);
    return newEvent;
  }
  
  async updateCalendarEvent(id: number, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const existingEvent = this.calendarEvents.get(id);
    if (!existingEvent) return undefined;
    
    const updatedEvent = { ...existingEvent, ...event };
    this.calendarEvents.set(id, updatedEvent);
    return updatedEvent;
  }
  
  async deleteCalendarEvent(id: number): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }
}

export const storage = new MemStorage();
