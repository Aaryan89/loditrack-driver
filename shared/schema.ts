import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (already existing, but modified to add driver-specific fields)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  driverId: text("driver_id"),
  profileImage: text("profile_image"),
  isActive: boolean("is_active").default(true),
});

// Inventory items on the truck
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull(),
  weight: integer("weight").notNull(),
  location: text("location").notNull(),
  deadline: text("deadline").notNull(),
  userId: integer("user_id").notNull(),
});

// Delivery stops for a route
export const deliveryStops = pgTable("delivery_stops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  coordinates: text("coordinates"),
  scheduledTime: text("scheduled_time").notNull(),
  status: text("status").notNull(), // 'completed', 'in-progress', 'pending'
  items: json("items").$type<string[]>(),
  routeId: integer("route_id").notNull(),
});

// Routes
export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: text("date").notNull(),
  userId: integer("user_id").notNull(),
  totalDistance: text("total_distance"),
  estimatedTime: text("estimated_time"),
  deliveryCount: integer("delivery_count"),
  completion: integer("completion").default(0),
});

// Rest and fuel stops for a route
export const stops = pgTable("stops", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  type: text("type").notNull(), // 'fuel', 'rest', 'ev'
  hours: text("hours"),
  status: text("status"), // 'open', 'closed'
  routeId: integer("route_id").notNull(),
  distance: text("distance"), // distance from current location
  features: json("features").$type<string[]>(),
  pricing: json("pricing").$type<Record<string, string>>(),
});

// Schedule entries
export const scheduleEntries = pgTable("schedule_entries", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  type: text("type").notNull(), // 'route', 'rest', 'off'
  details: text("details"),
  userId: integer("user_id").notNull(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  driverId: true,
  profileImage: true,
  isActive: true,
});

export const insertInventoryItemSchema = createInsertSchema(inventoryItems);
// Use omit to exclude id since it's auto-generated
export const insertInventoryItemSchemaForApi = insertInventoryItemSchema.omit({ id: true });

export const insertDeliveryStopSchema = createInsertSchema(deliveryStops);
// Use omit to exclude id since it's auto-generated
export const insertDeliveryStopSchemaForApi = insertDeliveryStopSchema.omit({ id: true });

export const insertRouteSchema = createInsertSchema(routes).pick({
  name: true,
  date: true,
  userId: true,
  totalDistance: true,
  estimatedTime: true,
  deliveryCount: true,
  completion: true,
});

export const insertStopSchema = createInsertSchema(stops).pick({
  name: true,
  address: true,
  type: true,
  hours: true,
  status: true,
  routeId: true,
  distance: true,
  features: true,
  pricing: true,
});

export const insertScheduleEntrySchema = createInsertSchema(scheduleEntries).pick({
  title: true,
  date: true,
  startTime: true,
  endTime: true,
  type: true,
  details: true,
  userId: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertInventoryItem = z.infer<typeof insertInventoryItemSchema>;
export type InventoryItem = typeof inventoryItems.$inferSelect;

export type InsertDeliveryStop = z.infer<typeof insertDeliveryStopSchema>;
export type DeliveryStop = typeof deliveryStops.$inferSelect;

export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;

export type InsertStop = z.infer<typeof insertStopSchema>;
export type Stop = typeof stops.$inferSelect;

export type InsertScheduleEntry = z.infer<typeof insertScheduleEntrySchema>;
export type ScheduleEntry = typeof scheduleEntries.$inferSelect;
