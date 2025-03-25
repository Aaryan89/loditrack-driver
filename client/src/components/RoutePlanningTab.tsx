import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MapDisplay from "./MapDisplay";
import { DeliveryStop, Route } from "@shared/schema";
import { useGeminiAI } from "@/hooks/useGeminiAI";

export default function RoutePlanningTab() {
  const { data: currentRoute } = useQuery<Route>({
    queryKey: ["/api/routes/current"]
  });

  const { data: deliveryStops } = useQuery<DeliveryStop[]>({
    queryKey: ["/api/routes", currentRoute?.id, "stops"],
    enabled: !!currentRoute?.id
  });

  const { data: aiRecommendations } = useQuery<{recommendations: string[]}>({
    queryKey: ["/api/optimize-route"]
  });

  // Mock data for initial display
  const mockRoute: Route = {
    id: 1,
    name: "San Francisco Route",
    date: new Date().toISOString().split('T')[0],
    userId: 1,
    totalDistance: "243 miles",
    estimatedTime: "5h 20m",
    deliveryCount: 8,
    completion: 25
  };

  const mockDeliveryStops: DeliveryStop[] = [
    {
      id: 1,
      name: "TechCorp Headquarters",
      address: "123 Main St, San Francisco, CA",
      time: "8:30 AM",
      status: "completed",
      itemCount: 2,
      routeId: 1
    },
    {
      id: 2,
      name: "LightSpeed Office",
      address: "456 Market St, San Francisco, CA",
      time: "9:45 AM",
      status: "completed",
      itemCount: 5,
      routeId: 1
    },
    {
      id: 3,
      name: "MediaPros Building",
      address: "789 Mission St, San Francisco, CA",
      time: "11:15 AM",
      status: "current",
      itemCount: 3,
      routeId: 1
    },
    {
      id: 4,
      name: "FoodCorp Warehouse",
      address: "101 Howard St, San Francisco, CA",
      time: "1:30 PM",
      status: "upcoming",
      itemCount: 12,
      routeId: 1
    },
    {
      id: 5,
      name: "Tech Innovations Center",
      address: "202 Valencia St, San Francisco, CA",
      time: "3:00 PM",
      status: "upcoming",
      itemCount: 8,
      routeId: 1
    }
  ];

  const route = currentRoute || mockRoute;
  const stops = deliveryStops || mockDeliveryStops;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Map */}
        <div className="w-full md:w-2/3 h-[500px] rounded-lg overflow-hidden border border-neutral-200">
          <MapDisplay stops={stops} />
        </div>

        {/* Route Info */}
        <div className="w-full md:w-1/3">
          <h3 className="text-lg font-semibold mb-4">Today's Route</h3>
          
          {/* Route Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-neutral-100 p-3 rounded-lg">
              <p className="text-sm text-neutral-600">Total Distance</p>
              <p className="text-xl font-medium">{route.totalDistance}</p>
            </div>
            
            <div className="bg-neutral-100 p-3 rounded-lg">
              <p className="text-sm text-neutral-600">Estimated Time</p>
              <p className="text-xl font-medium">{route.estimatedTime}</p>
            </div>
            
            <div className="bg-neutral-100 p-3 rounded-lg">
              <p className="text-sm text-neutral-600">Deliveries</p>
              <p className="text-xl font-medium">{route.deliveryCount}</p>
            </div>
            
            <div className="bg-neutral-100 p-3 rounded-lg">
              <p className="text-sm text-neutral-600">Completion</p>
              <div className="flex items-center">
                <p className="text-xl font-medium mr-2">{route.completion}%</p>
                <div className="w-full bg-neutral-300 rounded-full h-2.5">
                  <div 
                    className="bg-success h-2.5 rounded-full" 
                    style={{ width: `${route.completion}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Delivery Stops */}
          <h4 className="text-md font-medium mb-3">Delivery Stops</h4>
          
          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
            {stops.map(stop => (
              <div 
                key={stop.id}
                className={`p-3 border-l-4 rounded-r-lg flex items-start ${
                  stop.status === 'completed' 
                    ? 'border-success bg-neutral-50' 
                    : stop.status === 'current'
                    ? 'border-primary bg-primary-50'
                    : 'border-neutral-300 bg-neutral-50'
                }`}
              >
                <div className="mr-3 mt-1">
                  {stop.status === 'completed' ? (
                    <i className="fas fa-check-circle text-success"></i>
                  ) : stop.status === 'current' ? (
                    <i className="fas fa-dot-circle text-primary"></i>
                  ) : (
                    <i className="far fa-circle text-neutral-400"></i>
                  )}
                </div>
                <div className="flex-1">
                  <h5 className="font-medium">{stop.name}</h5>
                  <p className="text-sm text-neutral-600">{stop.address}</p>
                  <div className="flex text-xs text-neutral-500 mt-1">
                    <span className="mr-2"><i className="far fa-clock mr-1"></i>{stop.time}</span>
                    <span><i className="fas fa-box mr-1"></i>{stop.itemCount} items</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* AI Recommendations */}
      <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
        <div className="flex items-start">
          <div className="mr-3">
            <i className="fas fa-robot text-primary text-xl"></i>
          </div>
          <div>
            <h4 className="font-medium text-lg mb-2">Gemini AI Recommendations</h4>
            <p className="text-neutral-700 mb-3">
              Based on current traffic and weather conditions, I recommend the following optimizations:
            </p>
            <ul className="space-y-2 text-neutral-700 list-disc list-inside">
              {(aiRecommendations?.recommendations || [
                "Consider taking alternate route via Oak Street to avoid construction on Market Street",
                "Rearrange stops #4 and #5 to save approximately 15 minutes due to traffic patterns",
                "Schedule a 30-minute rest at the truck stop on Howard Street after your 4th delivery",
                "Weather alert: Light rain expected after 4PM - plan accordingly for final deliveries"
              ]).map((recommendation, index) => (
                <li key={index}>{recommendation}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
