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
    
    this.createUser(demoUser).then(user => {
      // Create demo route
      this.createRoute({
        name: "Seattle to Portland Delivery",
        date: new Date().toISOString().split('T')[0],
        userId: user.id,
        totalDistance: "174 miles",
        estimatedTime: "3 hours 15 minutes",
        deliveryCount: 4,
        completion: 25
      }).then(route => {
        // Create delivery stops for the route
        this.createDeliveryStop({
          name: "Coffee Supply Co.",
          address: "123 Pike St, Seattle, WA",
          coordinates: "47.610378,-122.342090",
          scheduledTime: "08:30 AM",
          status: "completed",
          items: ["Coffee beans", "Filters", "Cups"],
          routeId: route.id
        });
        
        this.createDeliveryStop({
          name: "Organic Grocers",
          address: "456 Pine Ave, Tacoma, WA",
          coordinates: "47.252895,-122.444290",
          scheduledTime: "10:15 AM",
          status: "in-progress",
          items: ["Fresh produce", "Dairy products"],
          routeId: route.id
        });
        
        this.createDeliveryStop({
          name: "City Hospital",
          address: "789 Medical Dr, Olympia, WA",
          coordinates: "47.037872,-122.900695",
          scheduledTime: "12:30 PM",
          status: "pending",
          items: ["Medical supplies", "Equipment"],
          routeId: route.id
        });
        
        this.createDeliveryStop({
          name: "Riverside Restaurant",
          address: "321 River Rd, Portland, OR",
          coordinates: "45.523064,-122.676483",
          scheduledTime: "2:45 PM",
          status: "pending",
          items: ["Food ingredients", "Kitchen supplies"],
          routeId: route.id
        });
        
        // Create rest/fuel stops
        this.createStop({
          name: "Highway Rest Stop",
          type: "rest",
          address: "I-5 Mile Marker 132, WA",
          status: "scheduled",
          routeId: route.id,
          hours: "24/7",
          distance: "65 miles from start",
          features: ["Restrooms", "Vending machines", "Picnic area"],
          pricing: null
        });
        
        this.createStop({
          name: "Cascade Fuel Station",
          type: "fuel",
          address: "2468 Cascade Hwy, Centralia, WA",
          status: "scheduled",
          routeId: route.id,
          hours: "5:00 AM - 11:00 PM",
          distance: "93 miles from start",
          features: ["Diesel", "DEF", "Food mart", "Showers"],
          pricing: {"Diesel": "$3.89/gal", "DEF": "$3.25/gal"}
        });
        
        this.createStop({
          name: "Green EV Charging",
          type: "ev",
          address: "135 Electric Ave, Vancouver, WA",
          status: "scheduled",
          routeId: route.id,
          hours: "24/7",
          distance: "160 miles from start",
          features: ["Level 3 charging", "Lounge", "WiFi"],
          pricing: {"Level 3": "$0.40/kWh", "Level 2": "$0.25/kWh"}
        });
      });
      
      // Create inventory items
      this.createInventoryItem({
        name: "Coffee beans (organic)",
        category: "Food",
        quantity: 20,
        weight: 200,
        location: "Truck section A1",
        deadline: "2025-03-26",
        userId: user.id
      });
      
      this.createInventoryItem({
        name: "Paper filters",
        category: "Supplies",
        quantity: 1000,
        weight: 10,
        location: "Truck section A2",
        deadline: "2025-03-26",
        userId: user.id
      });
      
      this.createInventoryItem({
        name: "Disposable cups",
        category: "Supplies",
        quantity: 500,
        weight: 25,
        location: "Truck section A3",
        deadline: "2025-03-26",
        userId: user.id
      });
      
      this.createInventoryItem({
        name: "Fresh produce (assorted)",
        category: "Food",
        quantity: 15,
        weight: 150,
        location: "Refrigerated section R1",
        deadline: "2025-03-26",
        userId: user.id
      });
      
      this.createInventoryItem({
        name: "Dairy products",
        category: "Food",
        quantity: 30,
        weight: 100,
        location: "Refrigerated section R2",
        deadline: "2025-03-26",
        userId: user.id
      });
      
      this.createInventoryItem({
        name: "Medical supplies",
        category: "Healthcare",
        quantity: 10,
        weight: 50,
        location: "Secure section S1",
        deadline: "2025-03-26",
        userId: user.id
      });
      
      this.createInventoryItem({
        name: "Medical equipment",
        category: "Healthcare",
        quantity: 5,
        weight: 200,
        location: "Secure section S2",
        deadline: "2025-03-26",
        userId: user.id
      });
      
      // Create schedule entries
      this.createScheduleEntry({
        type: "delivery",
        title: "Morning Deliveries",
        date: new Date().toISOString().split('T')[0],
        details: "Seattle and Tacoma stops",
        startTime: "08:00 AM",
        endTime: "12:00 PM",
        userId: user.id
      });
      
      this.createScheduleEntry({
        type: "rest",
        title: "Lunch Break",
        date: new Date().toISOString().split('T')[0],
        details: "Highway Rest Stop",
        startTime: "12:00 PM",
        endTime: "12:45 PM",
        userId: user.id
      });
      
      this.createScheduleEntry({
        type: "delivery",
        title: "Afternoon Deliveries",
        date: new Date().toISOString().split('T')[0],
        details: "Olympia and Portland stops",
        startTime: "1:00 PM",
        endTime: "5:00 PM",
        userId: user.id
      });
      
      // Tomorrow's entries
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      this.createScheduleEntry({
        type: "maintenance",
        title: "Truck Maintenance",
        date: tomorrowStr,
        details: "Regular service check",
        startTime: "08:00 AM",
        endTime: "10:00 AM",
        userId: user.id
      });
      
      this.createScheduleEntry({
        type: "delivery",
        title: "Portland to Seattle Return",
        date: tomorrowStr,
        details: "Return trip with pickups",
        startTime: "11:00 AM",
        endTime: "4:00 PM",
        userId: user.id
      });
    });
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
