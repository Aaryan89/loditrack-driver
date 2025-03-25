import { useLocation, Link } from "wouter";
import { useSidebar } from "@/context/SidebarContext";
import { useAuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Route, 
  Package, 
  Inventory, 
  Calendar, 
  GasPump, 
  Settings, 
  Truck, 
  X 
} from "lucide-react";

const Sidebar = () => {
  const { isOpen, closeSidebar } = useSidebar();
  const [location] = useLocation();
  const { user } = useAuthContext();

  const navItems = [
    { path: "/", icon: <LayoutDashboard className="mr-3 h-5 w-5" />, label: "Dashboard" },
    { path: "/routes", icon: <Route className="mr-3 h-5 w-5" />, label: "Routes" },
    { path: "/deliveries", icon: <Package className="mr-3 h-5 w-5" />, label: "Deliveries" },
    { path: "/inventory", icon: <Inventory className="mr-3 h-5 w-5" />, label: "Inventory" },
    { path: "/calendar", icon: <Calendar className="mr-3 h-5 w-5" />, label: "Calendar" },
    { path: "/stations", icon: <GasPump className="mr-3 h-5 w-5" />, label: "Rest & Fuel Stations" },
    { path: "/settings", icon: <Settings className="mr-3 h-5 w-5" />, label: "Settings" }
  ];

  return (
    <div className={`sidebar w-64 h-full bg-white shadow-md transition-all fixed lg:relative z-40 ${isOpen ? "left-0" : "-left-full"} lg:left-0`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Truck className="h-6 w-6 text-[#1a73e8] mr-2" />
          <h1 className="text-xl font-medium font-google-sans text-gray-900">TruckLogistics</h1>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={closeSidebar}>
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center mb-4">
          <Avatar className="h-10 w-10 bg-[#1a73e8] text-white">
            <AvatarFallback>{user?.fullName.substring(0, 2).toUpperCase() || "JD"}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user?.fullName || "John Driver"}</p>
            <p className="text-xs text-gray-600">{user?.role || "Lead Driver"}</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-4">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <a
              className={`flex items-center px-4 py-3 ${
                location === item.path 
                  ? "text-[#1a73e8] bg-blue-50" 
                  : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={closeSidebar}
            >
              {item.icon}
              <span className="font-google-sans">{item.label}</span>
            </a>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
