// API endpoints
export const API_ENDPOINTS = {
  LOGIN: "/api/login",
  LOGOUT: "/api/logout",
  CURRENT_USER: "/api/me",
  INVENTORY: "/api/inventory",
  ROUTES: "/api/routes",
  CURRENT_ROUTE: "/api/routes/current",
  DELIVERY_STOPS: (routeId: number) => `/api/routes/${routeId}/stops`,
  REST_STOPS: (routeId: number) => `/api/routes/${routeId}/rest-stops`,
  SCHEDULE: "/api/schedule",
  OPTIMIZE_ROUTE: "/api/optimize-route"
};

// Color mappings for status
export const STATUS_COLORS = {
  completed: "success",
  current: "primary",
  upcoming: "neutral-300"
};

// Color mappings for stop types
export const STOP_TYPE_COLORS = {
  fuel: "yellow",
  rest: "blue",
  ev: "green"
};

// Default map center (San Francisco)
export const DEFAULT_MAP_CENTER = {
  lat: 37.7749,
  lng: -122.4194
};

// Default map zoom level
export const DEFAULT_MAP_ZOOM = 12;
