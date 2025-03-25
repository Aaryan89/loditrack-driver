import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddInventoryModal({ isOpen, onClose }: AddInventoryModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [weight, setWeight] = useState("");
  const [location, setLocation] = useState("");
  const [deadline, setDeadline] = useState("");
  
  const { toast } = useToast();
  
  const addInventoryItem = useMutation({
    mutationFn: async (data: { 
      name: string; 
      quantity: number; 
      location: string; 
      deadline: string;
    }) => {
      await apiRequest("POST", "/api/inventory", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Item added",
        description: "The inventory item has been added successfully",
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      });
    }
  });
  
  const resetForm = () => {
    setName("");
    setCategory("");
    setQuantity("");
    setWeight("");
    setLocation("");
    setDeadline("");
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !category || !quantity || !weight || !location || !deadline) {
      toast({
        title: "Missing fields",
        description: "Please fill in all the required fields",
        variant: "destructive",
      });
      return;
    }
    
    addInventoryItem.mutate({
      name,
      category,
      quantity: parseInt(quantity),
      weight: parseFloat(weight),
      location,
      deadline
    });
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Add Inventory Item</h3>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-700">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <Label htmlFor="product-name" className="block text-sm font-medium text-neutral-700 mb-1">
              Product Name
            </Label>
            <Input
              id="product-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="product-category" className="block text-sm font-medium text-neutral-700 mb-1">
              Category
            </Label>
            <Input
              id="product-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Food, Supplies, Equipment, etc."
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="mb-4">
              <Label htmlFor="product-quantity" className="block text-sm font-medium text-neutral-700 mb-1">
                Quantity
              </Label>
              <Input
                id="product-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-4">
              <Label htmlFor="product-weight" className="block text-sm font-medium text-neutral-700 mb-1">
                Weight (kg)
              </Label>
              <Input
                id="product-weight"
                type="number"
                min="0.1"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="mb-4">
            <Label htmlFor="product-location" className="block text-sm font-medium text-neutral-700 mb-1">
              Location in Truck
            </Label>
            <Input
              id="product-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="product-deadline" className="block text-sm font-medium text-neutral-700 mb-1">
              Delivery Deadline
            </Label>
            <Input
              id="product-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addInventoryItem.isPending}
            >
              {addInventoryItem.isPending ? "Adding..." : "Add Item"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
