import { useState, useEffect, useRef } from "react";
import { useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { googleMapsService } from "@/lib/googleMaps";
import { geminiService } from "@/lib/geminiApi";
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  Download, 
  FileText, 
  Loader2, 
  Map, 
  Navigation, 
  Plus, 
  RefreshCw, 
  Route,
  Settings,
  Truck
} from "lucide-react";
import { format } from "date-fns";
import type { Route as RouteType, Delivery } from "@shared/schema";

// Define route form schema
const routeFormSchema = z.object({
  name: z.string().min(2, {
    message: "Route name must be at least 2 characters.",
  }),
  date: z.string().refine(val => !!val, {
    message: "Date is required.",
  }),
  deliveries: z.array(z.string()).min(1, {
    message: "At least one delivery must be selected.",
  }),
  optimized: z.boolean().default(true),
  avoidHighways: z.boolean().default(false),
  avoidTolls: z.boolean().default(false),
  includeRestStops: z.boolean().default(true),
  restInterval: z.coerce.number().min(30).max(240).default(120),
  maxDrivingTime: z.coerce.number().min(4).max(12).default(8),
  startLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  notes: z.string().optional(),
});

const Routes = () => {
  const { isOpen } = useSidebar();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [activePath, setActivePath] = useState<google.maps.DirectionsRenderer | null>(null);
  const [isCreatingRoute, setIsCreatingRoute] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<RouteType | null>(null);
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch routes
  const { data: routes, isLoading: isLoadingRoutes } = useQuery({
    queryKey: ['/api/routes'],
    queryFn: async () => {
      const response = await fetch('/api/routes');
      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }
      return response.json();
    }
  });

  // Fetch deliveries for route creation
  const { data: deliveries, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ['/api/deliveries'],
    queryFn: async () => {
      const response = await fetch('/api/deliveries?status=scheduled');
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      return response.json();
    }
  });

  // Initialize Google Maps
  useEffect(() => {
    if (!mapRef.current) return;
    
    const initMap = async () => {
      try {
        const mapInstance = await googleMapsService.initializeMap('route-map');
        setMap(mapInstance);
        
        // Try to get user's current location
        try {
          const location = await googleMapsService.getCurrentLocation();
          setCurrentLocation(location);
          mapInstance.setCenter(location);
        } catch (error) {
          console.warn('Could not get current location:', error);
        }
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };
    
    initMap();
    
    // Cleanup function to remove markers
    return () => {
      markers.forEach(marker => marker.setMap(null));
      if (activePath) {
        activePath.setMap(null);
      }
    };
  }, []);

  // Clear existing markers and path
  const clearMap = () => {
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
    
    if (activePath) {
      activePath.setMap(null);
      setActivePath(null);
    }
  };

  // Display a route on the map
  const displayRoute = async (route: RouteType) => {
    if (!map) return;
    
    clearMap();
    
    // Add marker for start location
    const startMarker = googleMapsService.addMarker(
      map,
      route.startLocation as google.maps.LatLngLiteral,
      {
        title: "Start Location",
        icon: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
        content: "<div><strong>Start Location</strong></div>"
      }
    );
    
    setMarkers(prev => [...prev, startMarker]);
    
    // Add markers for waypoints
    const waypointDeliveries = await Promise.all(
      route.waypoints.map(async (waypointId: number) => {
        const response = await fetch(`/api/deliveries/${waypointId}`);
        return response.json();
      })
    );
    
    // Add waypoint markers
    waypointDeliveries.forEach((delivery: Delivery, index: number) => {
      const waypointMarker = googleMapsService.addMarker(
        map,
        delivery.coordinates as google.maps.LatLngLiteral,
        {
          title: delivery.destination,
          label: String(index + 1),
          content: `<div><strong>${delivery.destination}</strong><br/>${delivery.address}</div>`
        }
      );
      
      setMarkers(prev => [...prev, waypointMarker]);
    });
    
    // If there are waypoints, calculate the route
    if (waypointDeliveries.length > 0) {
      try {
        const endLocation = route.endLocation || route.startLocation;
        
        const waypoints = waypointDeliveries.slice(0, -1).map((delivery: Delivery) => ({
          location: delivery.coordinates as google.maps.LatLngLiteral,
          stopover: true
        }));
        
        const directionsService = new google.maps.DirectionsService();
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true, // We already added custom markers
          polylineOptions: {
            strokeColor: "#1a73e8",
            strokeWeight: 5,
            strokeOpacity: 0.7
          }
        });
        
        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(
            {
              origin: route.startLocation as google.maps.LatLngLiteral,
              destination: endLocation as google.maps.LatLngLiteral,
              waypoints,
              optimizeWaypoints: route.optimized,
              travelMode: google.maps.TravelMode.DRIVING,
              avoidHighways: route.geminiSuggestions?.avoidHighways || false,
              avoidTolls: route.geminiSuggestions?.avoidTolls || false,
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK) {
                resolve(result);
              } else {
                reject(new Error(`Failed to calculate route: ${status}`));
              }
            }
          );
        });
        
        directionsRenderer.setDirections(result);
        setActivePath(directionsRenderer);
        
        // Add markers for recommended stops if they exist
        if (route.geminiSuggestions?.recommendedStops) {
          route.geminiSuggestions.recommendedStops.forEach((stop: any) => {
            const stopMarker = googleMapsService.addMarker(
              map,
              stop.location,
              {
                title: stop.type === 'fuel' ? 'Fuel Stop' : stop.type === 'rest' ? 'Rest Stop' : 'Charging Station',
                icon: googleMapsService.getStationIcon(stop.type),
                content: `<div><strong>${stop.type.charAt(0).toUpperCase() + stop.type.slice(1)} Stop</strong><br/>${stop.reason}</div>`
              }
            );
            
            setMarkers(prev => [...prev, stopMarker]);
          });
        }
      } catch (error) {
        console.error("Error displaying route:", error);
        toast({
          title: "Failed to display route",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive"
        });
      }
    }
  };

  // Initialize route form
  const routeForm = useForm<z.infer<typeof routeFormSchema>>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: {
      name: "",
      date: format(new Date(), "yyyy-MM-dd"),
      deliveries: [],
      optimized: true,
      avoidHighways: false,
      avoidTolls: false,
      includeRestStops: true,
      restInterval: 120,
      maxDrivingTime: 8,
      notes: "",
    },
  });

  // Create route mutation
  const createRouteMutation = useMutation({
    mutationFn: async (values: z.infer<typeof routeFormSchema>) => {
      setIsOptimizing(true);
      
      try {
        // Get delivery details for selected delivery IDs
        const selectedDeliveries = await Promise.all(
          values.deliveries.map(async (id) => {
            const response = await fetch(`/api/deliveries/${id}`);
            return response.json();
          })
        );
        
        // Start location defaults to current location or first delivery
        const startLocation = values.startLocation || currentLocation || selectedDeliveries[0].coordinates;
        
        // Optimize route using Gemini API
        const optimization = await geminiService.optimizeRoute(
          selectedDeliveries,
          startLocation,
          {
            prioritizeTime: true,
            avoidHighways: values.avoidHighways,
            avoidTolls: values.avoidTolls,
            includeRestStops: values.includeRestStops,
            restInterval: values.restInterval,
            maxDrivingTime: values.maxDrivingTime,
          }
        );
        
        // Create new route in the backend
        const newRoute = {
          name: values.name,
          date: new Date(values.date).toISOString(),
          startLocation,
          waypoints: values.optimized 
            ? optimization.optimizedRoute 
            : values.deliveries.map(id => parseInt(id)),
          optimized: values.optimized,
          assignedDriver: 1, // Using default driver ID
          geminiSuggestions: {
            ...optimization,
            avoidHighways: values.avoidHighways,
            avoidTolls: values.avoidTolls,
          },
          distance: optimization.estimatedDistance,
          estimatedDuration: optimization.estimatedDuration,
        };
        
        const response = await apiRequest('POST', '/api/routes', newRoute);
        return response.json();
      } finally {
        setIsOptimizing(false);
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
      toast({
        title: "Route created",
        description: "The route has been created successfully."
      });
      setIsCreatingRoute(false);
      routeForm.reset();
      setSelectedRoute(data);
      displayRoute(data);
    },
    onError: (error) => {
      toast({
        title: "Failed to create route",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Handle route form submission
  const onSubmit = (values: z.infer<typeof routeFormSchema>) => {
    createRouteMutation.mutate(values);
  };

  // Handle route selection
  const handleSelectRoute = async (route: RouteType) => {
    setSelectedRoute(route);
    displayRoute(route);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`flex-1 flex flex-col overflow-hidden ${isOpen ? 'lg:ml-64' : ''}`}>
        <TopBar title="Route Management" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium">Routes</CardTitle>
                    <Button 
                      className="bg-[#1a73e8] hover:bg-[#1a68d8] text-white"
                      onClick={() => setIsCreatingRoute(true)}
                      disabled={isLoadingDeliveries}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Route
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                  {isLoadingRoutes ? (
                    <div className="p-4 space-y-4">
                      {Array(3).fill(0).map((_, index) => (
                        <Skeleton key={index} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : routes?.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {routes.map((route: RouteType) => (
                        <div 
                          key={route.id} 
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedRoute?.id === route.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleSelectRoute(route)}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">{route.name}</h3>
                            <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {route.optimized ? 'Optimized' : 'Custom'}
                            </span>
                          </div>
                          <div className="mt-2 text-sm text-gray-600 flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{format(new Date(route.date), "MMM d, yyyy")}</span>
                            <span className="mx-2">•</span>
                            <Truck className="h-4 w-4 mr-1" />
                            <span>{route.waypoints.length} stops</span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600 flex items-center">
                            <Map className="h-4 w-4 mr-1" />
                            <span>{route.distance ? `${route.distance} km` : 'Distance N/A'}</span>
                            <span className="mx-2">•</span>
                            <Clock className="h-4 w-4 mr-1" />
                            <span>
                              {route.estimatedDuration 
                                ? `${Math.floor(route.estimatedDuration / 60)}h ${route.estimatedDuration % 60}min` 
                                : 'Duration N/A'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <Route className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Routes Yet</h3>
                      <p className="text-gray-600 mb-4">Create your first route to get started with route planning and optimization.</p>
                      <Button 
                        className="bg-[#1a73e8] hover:bg-[#1a68d8] text-white"
                        onClick={() => setIsCreatingRoute(true)}
                        disabled={isLoadingDeliveries}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Route
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-3 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-medium">
                        {selectedRoute ? selectedRoute.name : 'Route Map'}
                      </CardTitle>
                      {selectedRoute && (
                        <CardDescription>
                          {format(new Date(selectedRoute.date), "MMMM d, yyyy")} • 
                          {selectedRoute.waypoints.length} stops • 
                          {selectedRoute.distance ? ` ${selectedRoute.distance} km` : ''}
                        </CardDescription>
                      )}
                    </div>
                    {selectedRoute && (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex items-center">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                        <Button 
                          className="bg-[#1a73e8] hover:bg-[#1a68d8] text-white" 
                          size="sm"
                          onClick={() => {
                            // Open Google Maps with directions
                            const firstWaypoint = selectedRoute.waypoints[0];
                            window.open(`https://www.google.com/maps/dir/?api=1&origin=${selectedRoute.startLocation.lat},${selectedRoute.startLocation.lng}&destination=${selectedRoute.startLocation.lat},${selectedRoute.startLocation.lng}&waypoints=${selectedRoute.waypoints.join('|')}&travelmode=driving`, '_blank');
                          }}
                        >
                          <Navigation className="h-4 w-4 mr-2" />
                          Start Navigation
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 relative">
                  <div id="route-map" ref={mapRef} className="w-full h-full min-h-[500px]"></div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Route details */}
          {selectedRoute && (
            <Card className="mt-6">
              <CardHeader className="pb-3 border-b border-gray-200">
                <CardTitle className="text-lg font-medium">Route Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Tabs defaultValue="overview">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="waypoints">Waypoints</TabsTrigger>
                    <TabsTrigger value="suggestions">Gemini Suggestions</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Route Information</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">{format(new Date(selectedRoute.date), "MMMM d, yyyy")}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Distance:</span>
                            <span className="font-medium">{selectedRoute.distance ? `${selectedRoute.distance} km` : 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Estimated Duration:</span>
                            <span className="font-medium">
                              {selectedRoute.estimatedDuration 
                                ? `${Math.floor(selectedRoute.estimatedDuration / 60)}h ${selectedRoute.estimatedDuration % 60}min` 
                                : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Number of Stops:</span>
                            <span className="font-medium">{selectedRoute.waypoints.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Optimized:</span>
                            <span className="font-medium">{selectedRoute.optimized ? 'Yes' : 'No'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Route Settings</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Avoid Highways:</span>
                            <span className="font-medium">{selectedRoute.geminiSuggestions?.avoidHighways ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Avoid Tolls:</span>
                            <span className="font-medium">{selectedRoute.geminiSuggestions?.avoidTolls ? 'Yes' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Includes Rest Stops:</span>
                            <span className="font-medium">
                              {selectedRoute.geminiSuggestions?.recommendedStops?.length > 0 ? 'Yes' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created By:</span>
                            <span className="font-medium">System</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">Actions</h3>
                        <div className="space-y-2">
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Navigation className="h-4 w-4 mr-2" />
                            Start Navigation
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Re-optimize Route
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Generate Report
                          </Button>
                          <Button variant="outline" className="w-full justify-start" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Route
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="waypoints" className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <Truck className="h-5 w-5 mr-2 text-[#1a73e8]" />
                        <div>
                          <div className="font-medium text-gray-900">Start Location</div>
                          <div>Depot</div>
                        </div>
                      </div>
                      
                      {selectedRoute.waypoints.map((waypointId, index) => (
                        <div key={waypointId} className="flex items-start">
                          <div className="flex-shrink-0 w-10 text-center">
                            <div className="h-6 w-6 rounded-full bg-[#1a73e8] text-white flex items-center justify-center text-sm">
                              {index + 1}
                            </div>
                            {index < selectedRoute.waypoints.length - 1 && (
                              <div className="h-full mx-auto w-0.5 bg-gray-200"></div>
                            )}
                          </div>
                          <div className="ml-4 flex-1 pb-5">
                            <div className="font-medium text-gray-900">Delivery #{waypointId}</div>
                            <div className="text-sm text-gray-600 mb-1">Loading delivery information...</div>
                            <Button variant="outline" size="sm" className="text-xs">
                              <Navigation className="h-3 w-3 mr-1" />
                              Navigate
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">End Location</div>
                          <div className="text-sm text-gray-600">Return to Depot</div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="suggestions" className="pt-4">
                    {selectedRoute.geminiSuggestions ? (
                      <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">Gemini AI Suggestions</h3>
                          <p className="text-gray-600">{selectedRoute.geminiSuggestions.suggestions}</p>
                        </div>
                        
                        <div>
                          <h3 className="font-medium text-gray-900 mb-3">Recommended Stops</h3>
                          {selectedRoute.geminiSuggestions.recommendedStops?.length > 0 ? (
                            <div className="space-y-3">
                              {selectedRoute.geminiSuggestions.recommendedStops.map((stop: any, index: number) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-3 flex">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                                    stop.type === 'fuel' ? 'bg-blue-100 text-blue-700' : 
                                    stop.type === 'rest' ? 'bg-yellow-100 text-yellow-700' : 
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {stop.type === 'fuel' && <GasPump className="h-5 w-5" />}
                                    {stop.type === 'rest' && (
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M2 4h20"></path>
                                        <path d="M4 4v10c0 6 16 6 16 0V4"></path>
                                        <path d="M12 4v10"></path>
                                      </svg>
                                    )}
                                    {stop.type === 'charging' && <EvStation className="h-5 w-5" />}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">
                                      {stop.type.charAt(0).toUpperCase() + stop.type.slice(1)} Stop
                                    </div>
                                    <div className="text-sm text-gray-600">{stop.reason}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      After delivery #{stop.afterDeliveryId}
                                      {stop.estimatedArrivalTime && ` • Estimated arrival: ${format(new Date(stop.estimatedArrivalTime), "h:mm a")}`}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-600">No stops recommended for this route.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No Gemini suggestions available for this route.</p>
                        <Button variant="outline" className="mt-4">
                          Generate Suggestions
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
      
      {/* Create Route Dialog */}
      <Dialog open={isCreatingRoute} onOpenChange={setIsCreatingRoute}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create New Route</DialogTitle>
          </DialogHeader>
          
          <Form {...routeForm}>
            <form onSubmit={routeForm.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={routeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter route name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={routeForm.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Route Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={routeForm.control}
                name="deliveries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Deliveries</FormLabel>
                    <div className="border border-gray-200 rounded-md p-4 max-h-40 overflow-y-auto">
                      {isLoadingDeliveries ? (
                        <div className="space-y-2">
                          {Array(3).fill(0).map((_, index) => (
                            <Skeleton key={index} className="h-6 w-full" />
                          ))}
                        </div>
                      ) : deliveries?.length > 0 ? (
                        deliveries.map((delivery: Delivery) => (
                          <div key={delivery.id} className="flex items-center mb-2 last:mb-0">
                            <input 
                              type="checkbox" 
                              id={`delivery-${delivery.id}`}
                              value={delivery.id}
                              checked={field.value.includes(String(delivery.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, e.target.value]);
                                } else {
                                  field.onChange(field.value.filter(value => value !== e.target.value));
                                }
                              }}
                              className="h-4 w-4 border-gray-300 rounded text-[#1a73e8] focus:ring-[#1a73e8]"
                            />
                            <label htmlFor={`delivery-${delivery.id}`} className="ml-2 text-sm text-gray-700">
                              #{delivery.deliveryId} - {delivery.destination} ({delivery.address})
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-600">No scheduled deliveries available.</p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <FormField
                    control={routeForm.control}
                    name="optimized"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel>Optimize Route</FormLabel>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={routeForm.control}
                    name="avoidHighways"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel>Avoid Highways</FormLabel>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={routeForm.control}
                    name="avoidTolls"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel>Avoid Tolls</FormLabel>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <FormField
                    control={routeForm.control}
                    name="includeRestStops"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between space-y-0">
                        <FormLabel>Include Rest Stops</FormLabel>
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={routeForm.control}
                    name="restInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rest Interval (minutes)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="30" 
                            max="240" 
                            step="10" 
                            disabled={!routeForm.watch('includeRestStops')}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={routeForm.control}
                    name="maxDrivingTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Driving Time (hours)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="4" 
                            max="12" 
                            step="1" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={routeForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add notes about this route" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreatingRoute(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#1a73e8] hover:bg-[#1a68d8] text-white"
                  disabled={isOptimizing}
                >
                  {isOptimizing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Optimizing Route...
                    </>
                  ) : (
                    <>
                      <Route className="h-4 w-4 mr-2" />
                      Create Route
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Routes;
