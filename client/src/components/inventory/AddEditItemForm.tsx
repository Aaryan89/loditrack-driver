import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { InventoryItem } from "@shared/schema";

// Define form schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  category: z.string().min(2, {
    message: "Category must be at least 2 characters.",
  }),
  quantity: z.coerce.number().int().min(0, {
    message: "Quantity must be a non-negative integer.",
  }),
  weight: z.coerce.number().min(0.1, {
    message: "Weight must be greater than 0 kg.",
  }),
  destination: z.string().optional(),
  description: z.string().optional(),
  deadlineDate: z.string().optional(),
});

interface AddEditItemFormProps {
  item: InventoryItem | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const AddEditItemForm = ({ item, onSuccess, onCancel }: AddEditItemFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!item;

  // Initialize form with default values or existing item values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item?.name || "",
      category: item?.category || "",
      quantity: item?.quantity || 0,
      weight: item?.weight || 0,
      destination: item?.destination || "",
      description: item?.description || "",
      deadlineDate: item?.deadlineDate 
        ? new Date(item.deadlineDate).toISOString().slice(0, 16) 
        : "",
    },
  });

  // Create mutation for adding/updating item
  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      // Format the deadline date correctly if provided
      const formattedValues = {
        ...values,
        deadlineDate: values.deadlineDate ? new Date(values.deadlineDate).toISOString() : undefined,
      };
      
      if (isEditing && item) {
        // Update existing item
        await apiRequest('PUT', `/api/inventory/${item.id}`, formattedValues);
      } else {
        // Create new item
        await apiRequest('POST', '/api/inventory', formattedValues);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Item updated" : "Item added",
        description: isEditing 
          ? "The inventory item has been updated successfully." 
          : "The inventory item has been added successfully."
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: isEditing ? "Failed to update item" : "Failed to add item",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter item name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Enter category" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (kg)</FormLabel>
                <FormControl>
                  <Input type="number" min="0.1" step="0.1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination</FormLabel>
                <FormControl>
                  <Input placeholder="Enter destination (optional)" {...field} />
                </FormControl>
                <FormDescription>
                  Where this item needs to be delivered
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="deadlineDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deadline</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormDescription>
                  When this item needs to be delivered by
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter item description (optional)" 
                  className="min-h-24"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-[#1a73e8] hover:bg-[#1a68d8] text-white"
            disabled={isSubmitting}
          >
            {isEditing ? 'Update Item' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddEditItemForm;
