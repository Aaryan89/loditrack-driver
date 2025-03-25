import React from "react";

type TabType = "route" | "schedule" | "inventory" | "stops";

interface TabNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  // Function to handle tab change via hash
  const handleTabChange = (tab: TabType) => {
    window.location.hash = tab;
    setActiveTab(tab);
  };

  return (
    <div className="px-2 md:px-6 mb-4">
      <div className="flex overflow-x-auto pb-1 space-x-1 md:space-x-2">
        <a 
          href="#route"
          onClick={(e) => {
            e.preventDefault();
            handleTabChange("route");
          }}
          className={`px-3 py-2 md:px-4 ${
            activeTab === "route" 
              ? "bg-primary text-white" 
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          } rounded-lg whitespace-nowrap flex items-center text-sm md:text-base`}
        >
          <i className="fas fa-map-marked-alt mr-1 md:mr-2"></i>
          <span className="hidden xs:inline">Route</span>
          <span className="inline xs:hidden">R</span>
        </a>
        
        <a 
          href="#schedule"
          onClick={(e) => {
            e.preventDefault();
            handleTabChange("schedule");
          }}
          className={`px-3 py-2 md:px-4 ${
            activeTab === "schedule" 
              ? "bg-primary text-white" 
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          } rounded-lg whitespace-nowrap flex items-center text-sm md:text-base`}
        >
          <i className="fas fa-calendar-alt mr-1 md:mr-2"></i>
          <span className="hidden xs:inline">Schedule</span>
          <span className="inline xs:hidden">S</span>
        </a>
        
        <a 
          href="#inventory"
          onClick={(e) => {
            e.preventDefault();
            handleTabChange("inventory");
          }}
          className={`px-3 py-2 md:px-4 ${
            activeTab === "inventory" 
              ? "bg-primary text-white" 
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          } rounded-lg whitespace-nowrap flex items-center text-sm md:text-base`}
        >
          <i className="fas fa-boxes mr-1 md:mr-2"></i>
          <span className="hidden xs:inline">Inventory</span>
          <span className="inline xs:hidden">I</span>
        </a>
        
        <a 
          href="#stops"
          onClick={(e) => {
            e.preventDefault();
            handleTabChange("stops");
          }}
          className={`px-3 py-2 md:px-4 ${
            activeTab === "stops" 
              ? "bg-primary text-white" 
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          } rounded-lg whitespace-nowrap flex items-center text-sm md:text-base`}
        >
          <i className="fas fa-gas-pump mr-1 md:mr-2"></i>
          <span className="hidden xs:inline">Stops</span>
          <span className="inline xs:hidden">F</span>
        </a>
      </div>
    </div>
  );
}
