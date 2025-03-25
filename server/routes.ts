import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { z } from "zod";
import { 
  insertInventoryItemSchema, 
  insertDeliveryStopSchema, 
  insertRouteSchema, 
  insertStopSchema, 
  insertScheduleEntrySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "truck-tracking-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production" },
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // 24 hours
      }),
    })
  );
  
  // Passport authentication setup
  app.use(passport.initialize());
  app.use(passport.session());
  
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username." });
        }
        if (user.password !== password) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );
  
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });
  
  // API Endpoints
  const apiRouter = express.Router();
  app.use("/api", apiRouter);
  
  // Auth endpoints
  apiRouter.post("/login", passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });
  
  apiRouter.post("/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
  
  apiRouter.get("/me", (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json(req.user);
  });
  
  // Middleware to check if user is authenticated
  // For demo purposes, we'll automatically authenticate the user with a demo account
  const isAuthenticated = async (req: Request, res: Response, next: Function) => {
    if (!req.user) {
      // Get or create the demo user
      let demoUser = await storage.getUserByUsername("demo");
      
      if (!demoUser) {
        demoUser = await storage.createUser({
          username: "demo",
          password: "demo123",
          name: "Demo Driver",
          driverId: "DRV-001",
          profileImage: null,
          isActive: true
        });
      }
      
      // Manually authenticate the user
      req.login(demoUser, (err) => {
        if (err) {
          return res.status(500).json({ error: "Authentication error" });
        }
        return next();
      });
    } else {
      return next();
    }
  };
  
  // Inventory endpoints
  apiRouter.get("/inventory", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const items = await storage.getInventoryItems(userId);
    res.json(items);
  });
  
  apiRouter.post("/inventory", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const validatedData = insertInventoryItemSchema.parse({
        ...req.body,
        userId,
      });
      
      const newItem = await storage.createInventoryItem(validatedData);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(400).json({ error: (error as any).message });
    }
  });
  
  apiRouter.put("/inventory/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const id = parseInt(req.params.id);
      
      const item = await storage.getInventoryItem(id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const validatedData = z.object({
        name: z.string().optional(),
        quantity: z.number().optional(),
        location: z.string().optional(),
        deadline: z.string().optional(),
      }).parse(req.body);
      
      const updatedItem = await storage.updateInventoryItem(id, validatedData);
      res.json(updatedItem);
    } catch (error) {
      res.status(400).json({ error: (error as any).message });
    }
  });
  
  apiRouter.delete("/inventory/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const id = parseInt(req.params.id);
      
      const item = await storage.getInventoryItem(id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      await storage.deleteInventoryItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as any).message });
    }
  });
  
  // Routes endpoints
  apiRouter.get("/routes", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const routes = await storage.getRoutes(userId);
    res.json(routes);
  });
  
  apiRouter.get("/routes/current", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const currentRoute = await storage.getCurrentRoute(userId);
    
    if (!currentRoute) {
      return res.status(404).json({ error: "No current route found" });
    }
    
    res.json(currentRoute);
  });
  
  apiRouter.post("/routes", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const validatedData = insertRouteSchema.parse({
        ...req.body,
        userId,
      });
      
      const newRoute = await storage.createRoute(validatedData);
      res.status(201).json(newRoute);
    } catch (error) {
      res.status(400).json({ error: (error as any).message });
    }
  });
  
  // Delivery stops endpoints
  apiRouter.get("/routes/:routeId/stops", isAuthenticated, async (req, res) => {
    try {
      const routeId = parseInt(req.params.routeId);
      const stops = await storage.getDeliveryStops(routeId);
      res.json(stops);
    } catch (error) {
      res.status(400).json({ error: (error as any).message });
    }
  });
  
  apiRouter.post("/routes/:routeId/stops", isAuthenticated, async (req, res) => {
    try {
      const routeId = parseInt(req.params.routeId);
      const validatedData = insertDeliveryStopSchema.parse({
        ...req.body,
        routeId,
      });
      
      const newStop = await storage.createDeliveryStop(validatedData);
      res.status(201).json(newStop);
    } catch (error) {
      res.status(400).json({ error: (error as any).message });
    }
  });
  
  // Rest/fuel stops endpoints
  apiRouter.get("/routes/:routeId/rest-stops", isAuthenticated, async (req, res) => {
    try {
      const routeId = parseInt(req.params.routeId);
      const stops = await storage.getStops(routeId);
      res.json(stops);
    } catch (error) {
      res.status(400).json({ error: (error as any).message });
    }
  });
  
  apiRouter.post("/routes/:routeId/rest-stops", isAuthenticated, async (req, res) => {
    try {
      const routeId = parseInt(req.params.routeId);
      const validatedData = insertStopSchema.parse({
        ...req.body,
        routeId,
      });
      
      const newStop = await storage.createStop(validatedData);
      res.status(201).json(newStop);
    } catch (error) {
      res.status(400).json({ error: (error as any).message });
    }
  });
  
  // Schedule endpoints
  apiRouter.get("/schedule", isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const entries = await storage.getScheduleEntries(userId);
    res.json(entries);
  });
  
  apiRouter.post("/schedule", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const validatedData = insertScheduleEntrySchema.parse({
        ...req.body,
        userId,
      });
      
      const newEntry = await storage.createScheduleEntry(validatedData);
      res.status(201).json(newEntry);
    } catch (error) {
      res.status(400).json({ error: (error as any).message });
    }
  });
  
  apiRouter.delete("/schedule/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const id = parseInt(req.params.id);
      
      const entry = await storage.getScheduleEntry(id);
      if (!entry) {
        return res.status(404).json({ error: "Schedule entry not found" });
      }
      
      if (entry.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      await storage.deleteScheduleEntry(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: (error as any).message });
    }
  });
  
  // Google API endpoints - these would typically call the Gemini API
  // for optimization, but for now, they'll return mock data
  apiRouter.get("/optimize-route", isAuthenticated, async (req, res) => {
    res.json({
      recommendations: [
        "Consider taking alternate route via Oak Street to avoid construction on Market Street",
        "Rearrange stops #4 and #5 to save approximately 15 minutes due to traffic patterns",
        "Schedule a 30-minute rest at the truck stop on Howard Street after your 4th delivery",
        "Weather alert: Light rain expected after 4PM - plan accordingly for final deliveries",
      ]
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
