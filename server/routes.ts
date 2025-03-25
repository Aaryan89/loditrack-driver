import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertInventoryItemSchema, 
  insertDeliverySchema, 
  insertRouteSchema,
  insertStationSchema,
  insertCalendarEventSchema
} from "@shared/schema";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Google Generative AI for Gemini
  const genAI = process.env.GEMINI_API_KEY 
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) 
    : null;

  // Set up API routes - all routes are prefixed with /api

  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Remove password before sending the user data
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json({
        user: userWithoutPassword,
        message: "Login successful"
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error during login" });
    }
  });

  // Inventory routes
  app.get("/api/inventory", async (req: Request, res: Response) => {
    try {
      const items = await storage.getInventoryItems();
      res.status(200).json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ message: "Failed to fetch inventory items" });
    }
  });

  app.get("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getInventoryItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.status(200).json(item);
    } catch (error) {
      console.error(`Error fetching inventory item ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch inventory item" });
    }
  });

  app.post("/api/inventory", async (req: Request, res: Response) => {
    try {
      const validatedData = insertInventoryItemSchema.parse(req.body);
      const newItem = await storage.createInventoryItem(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      console.error("Error creating inventory item:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inventory item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create inventory item" });
    }
  });

  app.put("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertInventoryItemSchema.partial().parse(req.body);
      
      const updatedItem = await storage.updateInventoryItem(id, validatedData);
      
      if (!updatedItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.status(200).json(updatedItem);
    } catch (error) {
      console.error(`Error updating inventory item ${req.params.id}:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid inventory item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  });

  app.delete("/api/inventory/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteInventoryItem(id);
      
      if (!success) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting inventory item ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  });

  // Delivery routes
  app.get("/api/deliveries", async (req: Request, res: Response) => {
    try {
      const { status, driverId, date } = req.query;
      
      let deliveries;
      
      if (status) {
        deliveries = await storage.getDeliveriesByStatus(status as string);
      } else if (driverId) {
        deliveries = await storage.getDeliveriesByDriver(parseInt(driverId as string));
      } else if (date) {
        deliveries = await storage.getDeliveriesByDate(new Date(date as string));
      } else {
        deliveries = await storage.getDeliveries();
      }
      
      res.status(200).json(deliveries);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      res.status(500).json({ message: "Failed to fetch deliveries" });
    }
  });

  app.get("/api/deliveries/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const delivery = await storage.getDelivery(id);
      
      if (!delivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      res.status(200).json(delivery);
    } catch (error) {
      console.error(`Error fetching delivery ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch delivery" });
    }
  });

  app.post("/api/deliveries", async (req: Request, res: Response) => {
    try {
      const validatedData = insertDeliverySchema.parse(req.body);
      const newDelivery = await storage.createDelivery(validatedData);
      res.status(201).json(newDelivery);
    } catch (error) {
      console.error("Error creating delivery:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid delivery data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create delivery" });
    }
  });

  app.put("/api/deliveries/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDeliverySchema.partial().parse(req.body);
      
      const updatedDelivery = await storage.updateDelivery(id, validatedData);
      
      if (!updatedDelivery) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      res.status(200).json(updatedDelivery);
    } catch (error) {
      console.error(`Error updating delivery ${req.params.id}:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid delivery data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update delivery" });
    }
  });

  app.delete("/api/deliveries/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDelivery(id);
      
      if (!success) {
        return res.status(404).json({ message: "Delivery not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting delivery ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete delivery" });
    }
  });

  // Route optimization routes
  app.get("/api/routes", async (req: Request, res: Response) => {
    try {
      const { driverId, date } = req.query;
      
      let routes;
      
      if (driverId) {
        routes = await storage.getRoutesByDriver(parseInt(driverId as string));
      } else if (date) {
        routes = await storage.getRoutesByDate(new Date(date as string));
      } else {
        routes = await storage.getRoutes();
      }
      
      res.status(200).json(routes);
    } catch (error) {
      console.error("Error fetching routes:", error);
      res.status(500).json({ message: "Failed to fetch routes" });
    }
  });

  app.get("/api/routes/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const route = await storage.getRoute(id);
      
      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }
      
      res.status(200).json(route);
    } catch (error) {
      console.error(`Error fetching route ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to fetch route" });
    }
  });

  app.post("/api/routes", async (req: Request, res: Response) => {
    try {
      const validatedData = insertRouteSchema.parse(req.body);
      const newRoute = await storage.createRoute(validatedData);
      res.status(201).json(newRoute);
    } catch (error) {
      console.error("Error creating route:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid route data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create route" });
    }
  });

  app.post("/api/routes/optimize", async (req: Request, res: Response) => {
    try {
      if (!genAI) {
        return res.status(503).json({ message: "Gemini API key not configured" });
      }

      const { deliveries, startLocation, preferences } = req.body;
      
      if (!deliveries || !Array.isArray(deliveries) || deliveries.length === 0) {
        return res.status(400).json({ message: "Deliveries are required" });
      }
      
      if (!startLocation || !startLocation.lat || !startLocation.lng) {
        return res.status(400).json({ message: "Valid start location is required" });
      }
      
      // Use Gemini API to optimize the route
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      const prompt = `
        I need to optimize a delivery route for a truck driver. 
        Start location: ${JSON.stringify(startLocation)}.
        Deliveries to make: ${JSON.stringify(deliveries)}.
        ${preferences ? `Driver preferences: ${JSON.stringify(preferences)}.` : ''}
        
        Please provide:
        1. The optimal order of deliveries to minimize total distance and time
        2. Estimated total distance in kilometers
        3. Estimated total duration in minutes
        4. Recommended rest or fuel stops along the route
        5. Any other suggestions to improve efficiency
        
        Format your response as a valid JSON object with the following structure:
        {
          "optimizedRoute": [ordered delivery IDs],
          "estimatedDistance": number,
          "estimatedDuration": number,
          "recommendedStops": [
            { "type": "fuel|rest", "afterDeliveryId": number, "location": { "lat": number, "lng": number }, "reason": "string" }
          ],
          "suggestions": "string with additional suggestions"
        }
      `;
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const textResponse = response.text();
      
      // Extract the JSON from the text response
      const jsonMatch = textResponse.match(/```json\n([\s\S]*?)\n```/) || 
                       textResponse.match(/{[\s\S]*}/);
                       
      if (!jsonMatch) {
        return res.status(500).json({ 
          message: "Failed to parse Gemini API response",
          rawResponse: textResponse
        });
      }
      
      const optimizationResult = JSON.parse(jsonMatch[0].replace(/```json\n|```/g, ''));
      
      res.status(200).json(optimizationResult);
    } catch (error) {
      console.error("Error optimizing route:", error);
      res.status(500).json({ message: "Failed to optimize route" });
    }
  });

  // Station routes
  app.get("/api/stations", async (req: Request, res: Response) => {
    try {
      const { lat, lng, radius } = req.query;
      
      let stations;
      
      if (lat && lng && radius) {
        stations = await storage.getNearbyStations(
          parseFloat(lat as string),
          parseFloat(lng as string),
          parseFloat(radius as string)
        );
      } else {
        stations = await storage.getStations();
      }
      
      res.status(200).json(stations);
    } catch (error) {
      console.error("Error fetching stations:", error);
      res.status(500).json({ message: "Failed to fetch stations" });
    }
  });

  app.post("/api/stations", async (req: Request, res: Response) => {
    try {
      const validatedData = insertStationSchema.parse(req.body);
      const newStation = await storage.createStation(validatedData);
      res.status(201).json(newStation);
    } catch (error) {
      console.error("Error creating station:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid station data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create station" });
    }
  });

  // Calendar event routes
  app.get("/api/calendar", async (req: Request, res: Response) => {
    try {
      const { driverId, start, end } = req.query;
      
      let events;
      
      if (driverId) {
        events = await storage.getCalendarEventsByDriver(parseInt(driverId as string));
      } else if (start && end) {
        events = await storage.getCalendarEventsByDateRange(
          new Date(start as string),
          new Date(end as string)
        );
      } else {
        events = await storage.getCalendarEvents();
      }
      
      res.status(200).json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/calendar", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCalendarEventSchema.parse(req.body);
      const newEvent = await storage.createCalendarEvent(validatedData);
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid calendar event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  app.put("/api/calendar/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCalendarEventSchema.partial().parse(req.body);
      
      const updatedEvent = await storage.updateCalendarEvent(id, validatedData);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: "Calendar event not found" });
      }
      
      res.status(200).json(updatedEvent);
    } catch (error) {
      console.error(`Error updating calendar event ${req.params.id}:`, error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid calendar event data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });

  app.delete("/api/calendar/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCalendarEvent(id);
      
      if (!success) {
        return res.status(404).json({ message: "Calendar event not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error(`Error deleting calendar event ${req.params.id}:`, error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
