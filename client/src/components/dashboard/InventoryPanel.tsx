import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import InventoryModal from "../inventory/InventoryModal";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  weight: number;
  destination?: string;
}

const InventoryPanel = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  // Calculate total weight and capacity
  const totalWeight = inventoryItems?.reduce((sum: number, item: InventoryItem) => sum + item.weight, 0) || 0;
  const truckCapacity = 1200; // kg
  const loadPercentage = Math.min(Math.round((totalWeight / truckCapacity) * 100), 100);

  const handleManageInventory = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900">Truck Inventory</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-[#1a73e8] text-sm"
              onClick={handleManageInventory}
            >
              Manage
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-gray-600 text-sm">Current Load</h4>
            <span className="text-sm font-medium text-gray-900">{loadPercentage}% full</span>
          </div>
          
          <Progress value={loadPercentage} className="h-2.5 mb-6" />
          
          <div className="space-y-4">
            {isLoading ? (
              // Skeleton loader for items
              Array(4).fill(0).map((_, index) => (
                <div key={index} className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center">
                    <Skeleton className="h-6 w-6 mr-3 rounded" />
                    <div>
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-16 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-12" />
                </div>
              ))
            ) : (
              inventoryItems?.slice(0, 4).map((item: InventoryItem) => (
                <div key={item.id} className="flex items-center justify-between pb-2 border-b border-gray-200">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-gray-600 mr-3" />
                    <div>
                      <p className="text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-600">{item.quantity} {item.quantity === 1 ? 'item' : 'items'}</p>
                    </div>
                  </div>
                  <span className="text-gray-900 font-medium">{item.weight} kg</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-between w-full">
            <div>
              <p className="text-sm text-gray-600">Total Weight</p>
              <p className="text-xl font-medium text-gray-900">{totalWeight} kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Capacity</p>
              <p className="text-xl font-medium text-gray-900">{truckCapacity} kg</p>
            </div>
          </div>
        </CardFooter>
      </Card>

      <InventoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default InventoryPanel;
