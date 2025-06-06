import { User } from "@shared/schema";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  user?: User;
}

export default function Sidebar({ isOpen, toggleSidebar, user }: SidebarProps) {
  const [location, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setLocation("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Get user's initials for the avatar
  const getInitials = () => {
    if (!user?.name) return "U";
    
    const nameParts = user.name.split(" ");
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
    }
    return nameParts[0][0].toUpperCase();
  };

  return (
    <aside 
      id="sidebar" 
      className={`w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 transition duration-200 ease-in-out z-30 shadow-sm`}
    >
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <i className="fas fa-truck text-primary text-2xl"></i>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-600 bg-clip-text text-transparent">
            Driver Dashboard
          </h1>
        </div>
      </div>
      
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary-600 text-white flex items-center justify-center shadow-sm">
            <span className="font-bold text-lg">{getInitials()}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{user?.name || "User"}</h3>
            <p className="text-sm text-gray-500">ID: {user?.driverId || "Unknown"}</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-2 px-2">
        <a href="#route" className="flex items-center py-3 px-4 rounded-md my-1 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
          <i className="fas fa-route w-6 text-primary"></i>
          <span>Route Planning</span>
        </a>
        <a href="#schedule" className="flex items-center py-3 px-4 rounded-md my-1 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
          <i className="fas fa-calendar-alt w-6 text-gray-500"></i>
          <span>Schedule</span>
        </a>
        <a href="#inventory" className="flex items-center py-3 px-4 rounded-md my-1 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
          <i className="fas fa-boxes w-6 text-gray-500"></i>
          <span>Inventory</span>
        </a>
        <a href="#stops" className="flex items-center py-3 px-4 rounded-md my-1 text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
          <i className="fas fa-gas-pump w-6 text-gray-500"></i>
          <span>Fuel & Rest Stops</span>
        </a>
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
        <button 
          onClick={handleLogout}
          className="flex items-center text-gray-600 hover:text-primary w-full transition-colors"
        >
          <i className="fas fa-sign-out-alt w-6 text-gray-500"></i>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
