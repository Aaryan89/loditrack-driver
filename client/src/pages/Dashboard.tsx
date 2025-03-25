import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TabNavigation from "@/components/TabNavigation";
import RoutePlanningTab from "@/components/RoutePlanningTab";
import ScheduleTab from "@/components/ScheduleTab";
import InventoryTab from "@/components/InventoryTab";
import StopsTab from "@/components/StopsTab";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

type TabType = "route" | "schedule" | "inventory" | "stops";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("route");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const { data: user } = useQuery<User>({
    queryKey: ["/api/me"]
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button 
        onClick={toggleSidebar}
        className="md:hidden fixed bottom-4 right-4 z-50 bg-primary text-white p-3 rounded-full shadow-lg"
        aria-label="Toggle sidebar"
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} user={user} />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto ml-0 md:ml-64 bg-neutral-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="px-4 py-3 md:px-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-800">
                {activeTab === "route" && "Route Planning"}
                {activeTab === "schedule" && "Schedule"}
                {activeTab === "inventory" && "Inventory"}
                {activeTab === "stops" && "Stops"}
              </h2>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <button className="p-2 text-neutral-600 hover:text-primary focus:outline-none focus:text-primary">
                    <i className="far fa-bell text-lg"></i>
                    <span className="absolute top-0 right-0 h-4 w-4 bg-destructive rounded-full flex items-center justify-center text-white text-xs">3</span>
                  </button>
                </div>
                <div className="relative">
                  <button className="p-2 text-neutral-600 hover:text-primary focus:outline-none focus:text-primary">
                    <i className="far fa-envelope text-lg"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="bg-white shadow-sm mb-6">
          <div className="px-4 py-2 md:px-6">
            <nav className="flex text-sm">
              <a href="#" className="text-primary hover:text-primary-700">Home</a>
              <span className="mx-2 text-neutral-400">/</span>
              <span className="text-neutral-600">
                {activeTab === "route" && "Route Planning"}
                {activeTab === "schedule" && "Schedule"}
                {activeTab === "inventory" && "Inventory"}
                {activeTab === "stops" && "Rest & Fuel Stops"}
              </span>
            </nav>
          </div>
        </div>

        {/* Tab Navigation */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Contents */}
        <div className="px-4 md:px-6">
          {activeTab === "route" && <RoutePlanningTab />}
          {activeTab === "schedule" && <ScheduleTab />}
          {activeTab === "inventory" && <InventoryTab />}
          {activeTab === "stops" && <StopsTab />}
        </div>
      </main>
    </div>
  );
}
