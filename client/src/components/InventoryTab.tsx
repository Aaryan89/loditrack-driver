import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { InventoryItem } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import AddInventoryModal from "./AddInventoryModal";

export default function InventoryTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  
  const { data: inventoryItems, isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"]
  });
  
  const deleteInventoryItem = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Item deleted",
        description: "The inventory item has been removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    }
  });
  
  const handleDeleteItem = (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteInventoryItem.mutate(id);
    }
  };
  
  const handleEditItem = (id: number) => {
    // In a real implementation, this would open a modal with the item's data for editing
    toast({
      title: "Edit functionality",
      description: "Edit functionality would be implemented here",
    });
  };
  
  // Mock inventory items until we get data from the API
  const mockItems: InventoryItem[] = [
    { id: 1, name: 'Electronics Bundle XL', quantity: 12, location: 'Compartment A', deadline: '2023-07-15', userId: 1 },
    { id: 2, name: 'Furniture Set #42', quantity: 3, location: 'Trailer Section B', deadline: '2023-07-14', userId: 1 },
    { id: 3, name: 'Medical Supplies Kit', quantity: 8, location: 'Secure Box C', deadline: '2023-07-13', userId: 1 },
    { id: 4, name: 'Food Packages (Refrigerated)', quantity: 24, location: 'Cooler Unit', deadline: '2023-07-12', userId: 1 }
  ];
  
  const items = inventoryItems || mockItems;
  
  // Function to determine the status class based on deadline
  const getDeadlineStatusClass = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return "text-destructive";
    if (daysLeft < 2) return "text-warning";
    return "text-success";
  };

  return (
    <div id="inventory-tab" data-tab-content className="bg-white rounded-lg shadow-md p-4 mb-6 hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Truck Inventory Management</h3>
        <Button onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-plus mr-2"></i> Add Item
        </Button>
      </div>
      
      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <p className="text-sm text-neutral-600">Total Items</p>
          <div className="flex items-center mt-1">
            <i className="fas fa-box-open text-primary text-xl mr-3"></i>
            <span className="text-2xl font-medium">
              {items.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
        </div>
        
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <p className="text-sm text-neutral-600">Capacity Usage</p>
          <div className="flex items-center mt-1">
            <i className="fas fa-truck-loading text-primary text-xl mr-3"></i>
            <span className="text-2xl font-medium">82%</span>
          </div>
        </div>
        
        <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
          <p className="text-sm text-neutral-600">Upcoming Deliveries</p>
          <div className="flex items-center mt-1">
            <i className="fas fa-dolly text-primary text-xl mr-3"></i>
            <span className="text-2xl font-medium">8</span>
          </div>
        </div>
      </div>
      
      {/* Inventory Table */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Product Name
                </th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Quantity
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Location
                </th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Delivery Deadline
                </th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-neutral-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {items.map(item => (
                <tr key={item.id} className="border-b border-neutral-200">
                  <td className="py-3 px-4">{item.name}</td>
                  <td className="py-3 px-4 text-center">{item.quantity}</td>
                  <td className="py-3 px-4">{item.location}</td>
                  <td className={`py-3 px-4 ${getDeadlineStatusClass(item.deadline)}`}>{item.deadline}</td>
                  <td className="py-3 px-4 text-right">
                    <button 
                      className="text-primary hover:text-primary-700 mr-2" 
                      onClick={() => handleEditItem(item.id)}
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="text-destructive hover:text-red-700" 
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Add Inventory Modal */}
      <AddInventoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
