import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  email: true,
  phoneNumber: true,
});

// Inventory item model
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  weight: real("weight").notNull(), // Weight in kg
  destination: text("destination"),
  description: text("description"),
  deadlineDate: timestamp("deadline_date"),
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems).pick({
  name: true,
  category: true,
  quantity: true,
  weight: true,
  destination: true,
  description: true,
  deadlineDate: true,
});

// Delivery model
export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  deliveryId: varchar("delivery_id", { length: 10 }).notNull().unique(),
  destination: text("destination").notNull(),
  address: text("address").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  status: text("status").notNull().default("scheduled"), // scheduled, in-transit, delivered, canceled
  assignedDriver: integer("assigned_driver").references(() => users.id),
  items: jsonb("items").notNull(), // Array of inventory item IDs
  coordinates: jsonb("coordinates"), // lat, lng for the destination
  notes: text("notes"),
});

export const insertDeliverySchema = createInsertSchema(deliveries).pick({
  deliveryId: true,
  destination: true,
  address: true,
  scheduledTime: true,
  status: true,
  assignedDriver: true,
  items: true,
  coordinates: true,
  notes: true,
});

// Route model
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  startLocation: jsonb("start_location").notNull(), // lat, lng
  endLocation: jsonb("end_location"), // lat, lng
  waypoints: jsonb("waypoints").notNull(), // Array of delivery IDs in order
  distance: real("distance"), // Total distance in kilometers
  estimatedDuration: integer("estimated_duration"), // Duration in minutes
  assignedDriver: integer("assigned_driver").references(() => users.id),
  optimized: boolean("optimized").default(false),
  geminiSuggestions: jsonb("gemini_suggestions"), // Suggestions from Gemini API
});

export const insertRouteSchema = createInsertSchema(routes).pick({
  name: true,
  date: true,
  startLocation: true,
  endLocation: true,
  waypoints: true,
  distance: true,
  estimatedDuration: true,
  assignedDriver: true,
  optimized: true,
  geminiSuggestions: true,
});

// Station model (for rest/fuel/charging stations)
export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // fuel, ev, rest
  address: text("address").notNull(),
  coordinates: jsonb("coordinates").notNull(), // lat, lng
  openHours: text("open_hours"),
  amenities: jsonb("amenities"), // Array of amenities
  distance: real("distance"), // Distance from current route in kilometers
});

export const insertStationSchema = createInsertSchema(stations).pick({
  name: true,
  type: true,
  address: true,
  coordinates: true,
  openHours: true,
  amenities: true,
  distance: true,
});

// Calendar event model
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  description: text("description"),
  eventType: text("event_type").notNull(), // delivery, rest, maintenance, meeting
  relatedDeliveryId: integer("related_delivery_id").references(() => deliveries.id),
  assignedDriver: integer("assigned_driver").references(() => users.id),
  googleCalendarId: text("google_calendar_id"), // ID from Google Calendar API
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).pick({
  title: true,
  startTime: true,
  endTime: true,
  description: true,
  eventType: true,
  relatedDeliveryId: true,
  assignedDriver: true,
  googleCalendarId: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;

export type Route = typeof routes.$inferSelect;
export type InsertRoute = z.infer<typeof insertRouteSchema>;

export type Station = typeof stations.$inferSelect;
export type InsertStation = z.infer<typeof insertStationSchema>;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
