import {
  users, type User, type InsertUser,
  inventoryItems, type InventoryItem, type InsertInventoryItem,
  deliveryStops, type DeliveryStop, type InsertDeliveryStop,
  routes, type Route, type InsertRoute,
  stops, type Stop, type InsertStop,
  scheduleEntries, type ScheduleEntry, type InsertScheduleEntry
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Inventory methods
  getInventoryItems(userId: number): Promise<InventoryItem[]>;
  getInventoryItem(id: number): Promise<InventoryItem | undefined>;
  createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem>;
  updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined>;
  deleteInventoryItem(id: number): Promise<boolean>;
  
  // Delivery stops methods
  getDeliveryStops(routeId: number): Promise<DeliveryStop[]>;
  getDeliveryStop(id: number): Promise<DeliveryStop | undefined>;
  createDeliveryStop(stop: InsertDeliveryStop): Promise<DeliveryStop>;
  updateDeliveryStop(id: number, stop: Partial<InsertDeliveryStop>): Promise<DeliveryStop | undefined>;
  deleteDeliveryStop(id: number): Promise<boolean>;
  
  // Routes methods
  getRoutes(userId: number): Promise<Route[]>;
  getRoute(id: number): Promise<Route | undefined>;
  getCurrentRoute(userId: number): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, route: Partial<InsertRoute>): Promise<Route | undefined>;
  deleteRoute(id: number): Promise<boolean>;
  
  // Stops methods
  getStops(routeId: number): Promise<Stop[]>;
  getStop(id: number): Promise<Stop | undefined>;
  createStop(stop: InsertStop): Promise<Stop>;
  updateStop(id: number, stop: Partial<InsertStop>): Promise<Stop | undefined>;
  deleteStop(id: number): Promise<boolean>;
  
  // Schedule methods
  getScheduleEntries(userId: number): Promise<ScheduleEntry[]>;
  getScheduleEntry(id: number): Promise<ScheduleEntry | undefined>;
  createScheduleEntry(entry: InsertScheduleEntry): Promise<ScheduleEntry>;
  updateScheduleEntry(id: number, entry: Partial<InsertScheduleEntry>): Promise<ScheduleEntry | undefined>;
  deleteScheduleEntry(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private inventoryItems: Map<number, InventoryItem>;
  private deliveryStops: Map<number, DeliveryStop>;
  private routes: Map<number, Route>;
  private stops: Map<number, Stop>;
  private scheduleEntries: Map<number, ScheduleEntry>;
  
  private currentId: Record<string, number> = {
    users: 1,
    inventoryItems: 1,
    deliveryStops: 1,
    routes: 1,
    stops: 1,
    scheduleEntries: 1
  };

  constructor() {
    this.users = new Map();
    this.inventoryItems = new Map();
    this.deliveryStops = new Map();
    this.routes = new Map();
    this.stops = new Map();
    this.scheduleEntries = new Map();
    
    // Initialize with demo data
    this.initializeData();
  }

  private initializeData() {
    // Create a demo user
    const demoUser: InsertUser = {
      username: "demo",
      password: "password",
      name: "John Driver",
      driverId: "DR-78521",
      profileImage: "",
      isActive: true
    };
    
    this.createUser(demoUser);
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const newUser: User = { id, ...user };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = await this.getUser(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Inventory methods
  async getInventoryItems(userId: number): Promise<InventoryItem[]> {
    return Array.from(this.inventoryItems.values()).filter(
      (item) => item.userId === userId,
    );
  }

  async getInventoryItem(id: number): Promise<InventoryItem | undefined> {
    return this.inventoryItems.get(id);
  }

  async createInventoryItem(item: InsertInventoryItem): Promise<InventoryItem> {
    const id = this.currentId.inventoryItems++;
    const newItem: InventoryItem = { id, ...item };
    this.inventoryItems.set(id, newItem);
    return newItem;
  }

  async updateInventoryItem(id: number, item: Partial<InsertInventoryItem>): Promise<InventoryItem | undefined> {
    const existingItem = await this.getInventoryItem(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.inventoryItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    return this.inventoryItems.delete(id);
  }

  // Delivery stops methods
  async getDeliveryStops(routeId: number): Promise<DeliveryStop[]> {
    return Array.from(this.deliveryStops.values()).filter(
      (stop) => stop.routeId === routeId,
    );
  }

  async getDeliveryStop(id: number): Promise<DeliveryStop | undefined> {
    return this.deliveryStops.get(id);
  }

  async createDeliveryStop(stop: InsertDeliveryStop): Promise<DeliveryStop> {
    const id = this.currentId.deliveryStops++;
    const newStop: DeliveryStop = { id, ...stop };
    this.deliveryStops.set(id, newStop);
    return newStop;
  }

  async updateDeliveryStop(id: number, stop: Partial<InsertDeliveryStop>): Promise<DeliveryStop | undefined> {
    const existingStop = await this.getDeliveryStop(id);
    if (!existingStop) return undefined;
    
    const updatedStop = { ...existingStop, ...stop };
    this.deliveryStops.set(id, updatedStop);
    return updatedStop;
  }

  async deleteDeliveryStop(id: number): Promise<boolean> {
    return this.deliveryStops.delete(id);
  }

  // Routes methods
  async getRoutes(userId: number): Promise<Route[]> {
    return Array.from(this.routes.values()).filter(
      (route) => route.userId === userId,
    );
  }

  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async getCurrentRoute(userId: number): Promise<Route | undefined> {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(this.routes.values()).find(
      (route) => route.userId === userId && route.date === today,
    );
  }

  async createRoute(route: InsertRoute): Promise<Route> {
    const id = this.currentId.routes++;
    const newRoute: Route = { id, ...route };
    this.routes.set(id, newRoute);
    return newRoute;
  }

  async updateRoute(id: number, route: Partial<InsertRoute>): Promise<Route | undefined> {
    const existingRoute = await this.getRoute(id);
    if (!existingRoute) return undefined;
    
    const updatedRoute = { ...existingRoute, ...route };
    this.routes.set(id, updatedRoute);
    return updatedRoute;
  }

  async deleteRoute(id: number): Promise<boolean> {
    return this.routes.delete(id);
  }

  // Stops methods
  async getStops(routeId: number): Promise<Stop[]> {
    return Array.from(this.stops.values()).filter(
      (stop) => stop.routeId === routeId,
    );
  }

  async getStop(id: number): Promise<Stop | undefined> {
    return this.stops.get(id);
  }

  async createStop(stop: InsertStop): Promise<Stop> {
    const id = this.currentId.stops++;
    const newStop: Stop = { id, ...stop };
    this.stops.set(id, newStop);
    return newStop;
  }

  async updateStop(id: number, stop: Partial<InsertStop>): Promise<Stop | undefined> {
    const existingStop = await this.getStop(id);
    if (!existingStop) return undefined;
    
    const updatedStop = { ...existingStop, ...stop };
    this.stops.set(id, updatedStop);
    return updatedStop;
  }

  async deleteStop(id: number): Promise<boolean> {
    return this.stops.delete(id);
  }

  // Schedule methods
  async getScheduleEntries(userId: number): Promise<ScheduleEntry[]> {
    return Array.from(this.scheduleEntries.values()).filter(
      (entry) => entry.userId === userId,
    );
  }

  async getScheduleEntry(id: number): Promise<ScheduleEntry | undefined> {
    return this.scheduleEntries.get(id);
  }

  async createScheduleEntry(entry: InsertScheduleEntry): Promise<ScheduleEntry> {
    const id = this.currentId.scheduleEntries++;
    const newEntry: ScheduleEntry = { id, ...entry };
    this.scheduleEntries.set(id, newEntry);
    return newEntry;
  }

  async updateScheduleEntry(id: number, entry: Partial<InsertScheduleEntry>): Promise<ScheduleEntry | undefined> {
    const existingEntry = await this.getScheduleEntry(id);
    if (!existingEntry) return undefined;
    
    const updatedEntry = { ...existingEntry, ...entry };
    this.scheduleEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteScheduleEntry(id: number): Promise<boolean> {
    return this.scheduleEntries.delete(id);
  }
}

export const storage = new MemStorage();
