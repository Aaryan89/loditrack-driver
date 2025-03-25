import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Search, Edit, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AddEditItemForm from "./AddEditItemForm";
import type { InventoryItem } from "@shared/schema";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InventoryModal = ({ isOpen, onClose }: InventoryModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      toast({
        title: "Item deleted",
        description: "The inventory item has been deleted successfully."
      });
      setDeletingItemId(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete item",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Handle item quantity changes
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number, quantity: number }) => {
      await apiRequest('PUT', `/api/inventory/${id}`, { quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update quantity",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Filter inventory items based on search
  const filteredItems = inventoryItems?.filter((item: InventoryItem) => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.destination && item.destination.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Handle item deletion
  const handleDeleteItem = (id: number) => {
    setDeletingItemId(id);
  };

  const confirmDelete = () => {
    if (deletingItemId !== null) {
      deleteMutation.mutate(deletingItemId);
    }
  };

  // Handle quantity changes
  const handleDecreaseQuantity = (item: InventoryItem) => {
    if (item.quantity > 0) {
      updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity - 1 });
    }
  };

  const handleIncreaseQuantity = (item: InventoryItem) => {
    updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity + 1 });
  };

  // Handle edit item
  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsAddingItem(true);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setIsAddingItem(false);
      setEditingItem(null);
    }
  }, [isOpen]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-gray-900">Manage Inventory</DialogTitle>
          </DialogHeader>
          
          {!isAddingItem ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search inventory..."
                    className="pl-10 pr-4 py-2 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  className="bg-[#1a73e8] text-white hover:bg-[#1a68d8]"
                  onClick={() => {
                    setEditingItem(null);
                    setIsAddingItem(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="overflow-y-auto flex-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-36" /></TableCell>
                          <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredItems?.length > 0 ? (
                      filteredItems.map((item: InventoryItem) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium text-gray-900">{item.name}</TableCell>
                          <TableCell className="text-gray-600">{item.category}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-gray-600 hover:text-[#1a73e8]"
                                onClick={() => handleDecreaseQuantity(item)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus">
                                  <path d="M5 12h14" />
                                </svg>
                              </Button>
                              <span className="px-3">{item.quantity}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-gray-600 hover:text-[#1a73e8]"
                                onClick={() => handleIncreaseQuantity(item)}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
                                  <path d="M5 12h14" />
                                  <path d="M12 5v14" />
                                </svg>
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">{item.weight} kg</TableCell>
                          <TableCell className="text-gray-600">{item.destination || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="mr-2 text-gray-600 hover:text-[#1a73e8]"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-gray-600 hover:text-red-600"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-gray-600">
                          {searchQuery ? 'No items match your search criteria.' : 'No inventory items found.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="py-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mb-4"
                onClick={() => setIsAddingItem(false)}
              >
                <X className="h-4 w-4 mr-2" /> Back to Inventory
              </Button>
              <AddEditItemForm 
                item={editingItem} 
                onSuccess={() => {
                  setIsAddingItem(false);
                  queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
                }}
                onCancel={() => setIsAddingItem(false)}
              />
            </div>
          )}
          
          {!isAddingItem && (
            <DialogFooter className="pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deletingItemId !== null} onOpenChange={() => setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the inventory item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InventoryModal;
