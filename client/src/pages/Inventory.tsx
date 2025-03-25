import { useState } from "react";
import { useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InventoryModal from "@/components/inventory/InventoryModal";
import type { InventoryItem } from "@shared/schema";

// Categories with corresponding colors
const categoryColors: Record<string, string> = {
  "Electronics": "bg-blue-100 text-blue-800",
  "Office Supplies": "bg-green-100 text-green-800",
  "Furniture": "bg-purple-100 text-purple-800",
  "Food Products": "bg-yellow-100 text-yellow-800",
  "Clothing": "bg-pink-100 text-pink-800",
  "Default": "bg-gray-100 text-gray-800"
};

const Inventory = () => {
  const { isOpen } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  
  // Fetch inventory items
  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ['/api/inventory'],
    queryFn: async () => {
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      return response.json();
    }
  });

  // Get unique categories for filtering
  const categories = inventoryItems 
    ? [...new Set(inventoryItems.map((item: InventoryItem) => item.category))]
    : [];

  // Filter and sort inventory items
  const filteredAndSortedItems = inventoryItems 
    ? inventoryItems
        .filter((item: InventoryItem) => 
          (filterCategory ? item.category === filterCategory : true) &&
          (searchQuery 
            ? item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (item.destination && item.destination.toLowerCase().includes(searchQuery.toLowerCase()))
            : true)
        )
        .sort((a: InventoryItem, b: InventoryItem) => {
          if (sortBy === 'name') {
            return sortDirection === 'asc' 
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name);
          } else if (sortBy === 'quantity') {
            return sortDirection === 'asc'
              ? a.quantity - b.quantity
              : b.quantity - a.quantity;
          } else if (sortBy === 'weight') {
            return sortDirection === 'asc'
              ? a.weight - b.weight
              : b.weight - a.weight;
          }
          return 0;
        })
    : [];
  
  // Calculate total weight and count
  const totalWeight = filteredAndSortedItems?.reduce((sum, item) => sum + item.weight, 0) || 0;
  const totalItems = filteredAndSortedItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const truckCapacity = 1200; // kg
  const loadPercentage = Math.min(Math.round((totalWeight / truckCapacity) * 100), 100);

  // Toggle sort direction
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    return categoryColors[category] || categoryColors.Default;
  };

  // Format deadline date
  const formatDeadline = (dateString: string | undefined) => {
    if (!dateString) return "No deadline";
    return format(new Date(dateString), "MMM d, yyyy h:mm a");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`flex-1 flex flex-col overflow-hidden ${isOpen ? 'lg:ml-64' : ''}`}>
        <TopBar title="Inventory Management" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-20" /> : totalItems}</div>
                <CardDescription>Items in inventory</CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-20" /> : `${totalWeight} kg`}</div>
                <CardDescription>Out of {truckCapacity} kg capacity</CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Truck Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-20" /> : `${loadPercentage}%`}</div>
                <Progress value={loadPercentage} className="h-2 mt-2" />
              </CardContent>
            </Card>
          </div>
          
          {/* Inventory Controls */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between mb-4">
              <div className="flex flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="text"
                  placeholder="Search inventory..."
                  className="pl-10 pr-4 py-2 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      {filterCategory || "All Categories"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Category</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setFilterCategory(null)}
                      className={filterCategory === null ? "bg-gray-100" : ""}
                    >
                      All Categories
                    </DropdownMenuItem>
                    {categories.map((category) => (
                      <DropdownMenuItem 
                        key={category} 
                        onClick={() => setFilterCategory(category)}
                        className={filterCategory === category ? "bg-gray-100" : ""}
                      >
                        {category}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleSort('name')}>
                      Name {sortBy === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('quantity')}>
                      Quantity {sortBy === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('weight')}>
                      Weight {sortBy === 'weight' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  className="bg-[#1a73e8] hover:bg-[#1a68d8] text-white"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
            
            {/* Category Pills */}
            {categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge 
                  variant={filterCategory === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setFilterCategory(null)}
                >
                  All
                </Badge>
                {categories.map((category) => (
                  <Badge 
                    key={category} 
                    variant={filterCategory === category ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setFilterCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            )}
            
            {/* Inventory Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {isLoading ? (
                // Skeleton loaders
                Array(6).fill(0).map((_, index) => (
                  <Card key={index} className="overflow-hidden">
                    <Skeleton className="h-40" />
                  </Card>
                ))
              ) : filteredAndSortedItems.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-600">No inventory items found.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterCategory(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                filteredAndSortedItems.map((item: InventoryItem) => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{item.name}</CardTitle>
                          <CardDescription>{item.description || "No description"}</CardDescription>
                        </div>
                        <Badge className={getCategoryColor(item.category)}>
                          {item.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Quantity</p>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Weight</p>
                          <p className="font-medium">{item.weight} kg</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Destination</p>
                          <p className="font-medium">{item.destination || "Not assigned"}</p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>Deadline: </span>
                        <span className={item.deadlineDate ? "text-yellow-600 font-medium" : ""}>
                          {formatDeadline(item.deadlineDate)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
      
      <InventoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Inventory;
