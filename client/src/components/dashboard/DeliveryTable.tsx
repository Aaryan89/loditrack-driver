import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Delivery {
  id: number;
  deliveryId: string;
  destination: string;
  address: string;
  scheduledTime: string;
  status: 'scheduled' | 'in-transit' | 'delivered' | 'canceled';
  items: any[];
}

const DeliveryTable = () => {
  const [page, setPage] = useState(1);
  const pageSize = 4;

  // Fetch deliveries for today
  const { data: deliveries, isLoading, refetch } = useQuery({
    queryKey: ['/api/deliveries', 'today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/deliveries?date=${today}`);
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      return response.json();
    }
  });

  const totalDeliveries = deliveries?.length || 0;
  const totalPages = Math.ceil(totalDeliveries / pageSize);
  
  const paginatedDeliveries = deliveries
    ? deliveries.slice((page - 1) * pageSize, page * pageSize)
    : [];

  const handleRefresh = () => {
    refetch();
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-600';
      case 'in-transit':
        return 'bg-yellow-100 text-yellow-700';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-700';
      case 'canceled':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-600';
      case 'in-transit':
      case 'scheduled':
        return 'bg-yellow-500';
      case 'canceled':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card>
      <CardHeader className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">Today's Deliveries</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-sm text-[#1a73e8] flex items-center"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-gray-600 text-sm border-b border-gray-200">
              <th className="px-4 py-3 font-medium">Delivery</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Skeleton loader when loading
              Array(4).fill(0).map((_, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="px-4 py-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-20 mt-1" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-32 mt-1" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-6 w-16" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-6 w-24" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </td>
                </tr>
              ))
            ) : (
              paginatedDeliveries.map((delivery: Delivery) => (
                <tr key={delivery.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">#{delivery.deliveryId}</p>
                      <p className="text-sm text-gray-600">
                        {delivery.items && delivery.items.length > 0 
                          ? delivery.items[0].category 
                          : 'Mixed Items'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-gray-900">{delivery.destination}</p>
                      <p className="text-sm text-gray-600">{delivery.address}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900">{formatTime(delivery.scheduledTime)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(delivery.status)}`}>
                      <span className={`w-1.5 h-1.5 mr-1.5 rounded-full ${getStatusDot(delivery.status)}`}></span>
                      {delivery.status.charAt(0).toUpperCase() + delivery.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-gray-600 hover:text-[#1a73e8]">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Update Status</DropdownMenuItem>
                        <DropdownMenuItem>Navigate to</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <CardFooter className="p-4 border-t border-gray-200">
        <div className="flex justify-between items-center w-full">
          <div className="text-sm text-gray-600">
            Showing {paginatedDeliveries.length} of {totalDeliveries} deliveries
          </div>
          <div className="flex">
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8 rounded hover:bg-gray-100 text-gray-600"
              onClick={handlePrevPage}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <Button
                key={pageNum}
                variant={pageNum === page ? "secondary" : "ghost"}
                size="icon"
                className={`w-8 h-8 rounded ${pageNum === page ? 'bg-blue-50 text-[#1a73e8]' : 'hover:bg-gray-100 text-gray-600'}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </Button>
            ))}
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-8 h-8 rounded hover:bg-gray-100 text-gray-600"
              onClick={handleNextPage}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default DeliveryTable;
