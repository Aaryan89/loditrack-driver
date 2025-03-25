import React from "react";

type TabType = "route" | "schedule" | "inventory" | "stops";

interface TabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  return (
    <div className="px-4 md:px-6 mb-4">
      <div className="flex overflow-x-auto pb-1 space-x-2">
        <button 
          onClick={() => setActiveTab("route")}
          className={`px-4 py-2 ${
            activeTab === "route" 
              ? "bg-primary text-white" 
              : "bg-neutral-100 text-neutral-600"
          } rounded-t-lg whitespace-nowrap flex items-center`}
        >
          <i className="fas fa-map-marked-alt mr-2"></i>
          Current Route
        </button>
        
        <button 
          onClick={() => setActiveTab("schedule")}
          className={`px-4 py-2 ${
            activeTab === "schedule" 
              ? "bg-primary text-white" 
              : "bg-neutral-100 text-neutral-600"
          } rounded-t-lg whitespace-nowrap flex items-center`}
        >
          <i className="fas fa-calendar-alt mr-2"></i>
          Schedule
        </button>
        
        <button 
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 ${
            activeTab === "inventory" 
              ? "bg-primary text-white" 
              : "bg-neutral-100 text-neutral-600"
          } rounded-t-lg whitespace-nowrap flex items-center`}
        >
          <i className="fas fa-boxes mr-2"></i>
          Inventory
        </button>
        
        <button 
          onClick={() => setActiveTab("stops")}
          className={`px-4 py-2 ${
            activeTab === "stops" 
              ? "bg-primary text-white" 
              : "bg-neutral-100 text-neutral-600"
          } rounded-t-lg whitespace-nowrap flex items-center`}
        >
          <i className="fas fa-gas-pump mr-2"></i>
          Stops
        </button>
      </div>
    </div>
  );
}
