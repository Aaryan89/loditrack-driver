import { MenuIcon, Bell, HelpCircle, User } from "lucide-react";
import { useSidebar } from "@/context/SidebarContext";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  title: string;
}

const TopBar = ({ title }: TopBarProps) => {
  const { toggleSidebar } = useSidebar();
  const { user, logout } = useAuthContext();

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-4 text-gray-600"
            onClick={toggleSidebar}
          >
            <MenuIcon className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-medium font-google-sans text-gray-900">{title}</h2>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-3 text-gray-600 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100"
          >
            <Bell className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="mr-3 text-gray-600 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100"
              >
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <span>{user?.fullName || "John Driver"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <span>{user?.email || "john.driver@example.com"}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
