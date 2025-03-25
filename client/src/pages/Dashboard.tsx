import { useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import OverviewCards from "@/components/dashboard/OverviewCards";
import RouteMap from "@/components/dashboard/RouteMap";
import DeliveryTable from "@/components/dashboard/DeliveryTable";
import InventoryPanel from "@/components/dashboard/InventoryPanel";
import DeliveryCalendar from "@/components/dashboard/DeliveryCalendar";
import StationsList from "@/components/dashboard/StationsList";
import { useAuthContext } from "@/context/AuthContext";

const Dashboard = () => {
  const { isOpen } = useSidebar();
  const { user } = useAuthContext();

  // Load Google APIs on component mount
  useEffect(() => {
    const loadGoogleApis = async () => {
      try {
        // Attempt to load APIs
        // This is a placeholder - actual implementation would depend on the specific APIs
        console.log('Loading Google APIs...');
      } catch (error) {
        console.error('Error loading Google APIs:', error);
      }
    };

    loadGoogleApis();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`flex-1 flex flex-col overflow-hidden ${isOpen ? 'lg:ml-64' : ''}`}>
        <TopBar title="Driver Dashboard" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Overview Section */}
          <OverviewCards />
          
          {/* Map and Route Section */}
          <RouteMap driverId={user?.id} />
          
          {/* Delivery and Inventory Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <DeliveryTable />
            </div>
            <div className="lg:col-span-1">
              <InventoryPanel />
            </div>
          </div>
          
          {/* Calendar Section */}
          <DeliveryCalendar />
          
          {/* Rest and Fuel Stations Section */}
          <StationsList />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
