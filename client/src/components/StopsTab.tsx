import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Stop } from "@shared/schema";
import MapDisplay from "./MapDisplay";

type StopFilterType = "all" | "fuel" | "rest" | "ev";

export default function StopsTab() {
  const [filterType, setFilterType] = useState<StopFilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: stops } = useQuery<Stop[]>({
    queryKey: ["/api/routes/current/rest-stops"]
  });

  // Mock data for rest and fuel stops
  const mockStops: Stop[] = [
    { 
      id: 1, 
      name: "QuickFill Gas Station", 
      address: "1234 Highway 101, Redwood City, CA", 
      type: "fuel", 
      hours: "Open 24/7", 
      status: "open", 
      routeId: 1, 
      distance: "On route (2.5 mi ahead)",
      features: [],
      pricing: { "Diesel": "$4.25/gal", "Regular": "$4.05/gal" }
    },
    { 
      id: 2, 
      name: "Golden State Rest Area", 
      address: "Mile Marker 157, Highway 101", 
      type: "rest", 
      hours: "Open 24/7", 
      status: "open", 
      routeId: 1, 
      distance: "On route (45 mi ahead)",
      features: ["Truck Parking", "Restrooms", "Food"],
      pricing: {}
    },
    { 
      id: 3, 
      name: "ElectroDrive Charging Hub", 
      address: "5678 Marina Blvd, San Francisco, CA", 
      type: "ev", 
      hours: "6:00 AM - 10:00 PM", 
      status: "open", 
      routeId: 1, 
      distance: "0.7 mi off route",
      features: ["Fast Charge", "5 Stalls Available"],
      pricing: {}
    },
    { 
      id: 4, 
      name: "TruckStop Express", 
      address: "7890 Industrial Pkwy, San Jose, CA", 
      type: "fuel", 
      hours: "Open 24/7", 
      status: "open", 
      routeId: 1, 
      distance: "On route (78 mi ahead)",
      features: [],
      pricing: { "Diesel": "$4.19/gal", "Regular": "$3.95/gal" }
    },
    { 
      id: 5, 
      name: "Valley View Rest Area", 
      address: "Mile Marker 237, Highway 101", 
      type: "rest", 
      hours: "Open 24/7", 
      status: "open", 
      routeId: 1, 
      distance: "On route (125 mi ahead)",
      features: ["Truck Parking", "Restrooms"],
      pricing: {}
    }
  ];

  const allStops = stops || mockStops;
  
  // Filter stops based on type and search term
  const filteredStops = allStops.filter(stop => {
    const matchesType = filterType === "all" || stop.type === filterType;
    const matchesSearch = stop.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          stop.address.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div id="stops-tab" data-tab-content className="bg-white rounded-lg shadow-md p-4 mb-6 hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Rest & Refuel Stops</h3>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilterType("fuel")}
            className={`px-3 py-1 ${
              filterType === "fuel" 
                ? "bg-primary text-white" 
                : "bg-primary-50 text-primary-700 border border-primary-200"
            } rounded-md text-sm flex items-center`}
          >
            <i className="fas fa-gas-pump mr-1"></i> Fuel
          </button>
          <button 
            onClick={() => setFilterType("rest")}
            className={`px-3 py-1 ${
              filterType === "rest" 
                ? "bg-primary text-white" 
                : "bg-primary-50 text-primary-700 border border-primary-200"
            } rounded-md text-sm flex items-center`}
          >
            <i className="fas fa-bed mr-1"></i> Rest
          </button>
          <button 
            onClick={() => setFilterType("ev")}
            className={`px-3 py-1 ${
              filterType === "ev" 
                ? "bg-primary text-white" 
                : "bg-primary-50 text-primary-700 border border-primary-200"
            } rounded-md text-sm flex items-center`}
          >
            <i className="fas fa-charging-station mr-1"></i> EV
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Map for Stops */}
        <div className="w-full md:w-2/3 h-[500px] rounded-lg overflow-hidden border border-neutral-200">
          <MapDisplay stops={filteredStops} type="stops" />
        </div>
        
        {/* Stops List */}
        <div className="w-full md:w-1/3">
          <div className="mb-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search for stops..." 
                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"></i>
            </div>
          </div>
          
          <div className="space-y-3 overflow-y-auto max-h-[450px] pr-1">
            {filteredStops.map(stop => (
              <div key={stop.id} className="p-3 border border-neutral-200 rounded-lg">
                <div className="flex items-start">
                  <div className={`p-2 rounded-md mr-3 ${
                    stop.type === 'fuel' 
                      ? 'bg-yellow-100 text-yellow-700'
                      : stop.type === 'rest'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    <i className={`fas ${
                      stop.type === 'fuel' 
                        ? 'fa-gas-pump'
                        : stop.type === 'rest'
                        ? 'fa-bed'
                        : 'fa-charging-station'
                    }`}></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{stop.name}</h4>
                    <p className="text-sm text-neutral-600">{stop.address}</p>
                    <div className="flex justify-between text-xs text-neutral-500 mt-2">
                      <span><i className="fas fa-clock mr-1"></i>{stop.hours}</span>
                      <span><i className="fas fa-route mr-1"></i>{stop.distance}</span>
                    </div>
                    {stop.type === 'fuel' && Object.keys(stop.pricing).length > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center text-sm">
                          {Object.entries(stop.pricing).map(([key, value], idx) => (
                            <span key={idx} className={`${idx === 0 ? 'text-green-600 font-medium mr-2' : 'text-neutral-600'}`}>
                              {key}: {value}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(stop.features?.length ?? 0) > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap items-center text-xs gap-2">
                          {stop.features?.map((feature, idx) => (
                            <span 
                              key={idx} 
                              className={`px-2 py-0.5 rounded ${
                                idx % 3 === 0 
                                  ? 'bg-green-100 text-green-700' 
                                  : idx % 3 === 1
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-purple-100 text-purple-700'
                              }`}
                            >
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredStops.length === 0 && (
              <div className="p-6 text-center text-neutral-500">
                <i className="fas fa-search text-3xl mb-2"></i>
                <p>No stops found matching your criteria</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
