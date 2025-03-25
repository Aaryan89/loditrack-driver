import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Route, ArrowUpRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface OverviewStat {
  title: string;
  value: string;
  trend: {
    value: string;
    isPositive: boolean;
    icon: React.ReactNode;
  };
}

const OverviewCards = () => {
  // Fetch today's delivery stats
  const { data: deliveryStats, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ['/api/deliveries', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/deliveries?date=' + new Date().toISOString().split('T')[0]);
      const data = await response.json();
      return {
        todayCount: data.length,
        yesterdayCount: Math.max(0, data.length - 2), // Mocked comparison for example purposes
      };
    }
  });

  // Fetch route information
  const { data: routeInfo, isLoading: isLoadingRoute } = useQuery({
    queryKey: ['/api/routes', 'today'],
    queryFn: async () => {
      const response = await fetch('/api/routes?date=' + new Date().toISOString().split('T')[0]);
      const data = await response.json();
      return data[0] || { distance: 287, estimatedDuration: 360 }; // Fallback to sample data
    }
  });

  const stats: OverviewStat[] = [
    {
      title: "Today's Deliveries",
      value: isLoadingDeliveries ? "Loading..." : String(deliveryStats?.todayCount || 0),
      trend: {
        value: isLoadingDeliveries 
          ? "" 
          : `${Math.abs((deliveryStats?.todayCount || 0) - (deliveryStats?.yesterdayCount || 0))} more than yesterday`,
        isPositive: isLoadingDeliveries 
          ? true 
          : (deliveryStats?.todayCount || 0) >= (deliveryStats?.yesterdayCount || 0),
        icon: <ArrowUpRight className="h-3 w-3" />
      }
    },
    {
      title: "Distance to Cover",
      value: isLoadingRoute ? "Loading..." : `${routeInfo?.distance || 0} km`,
      trend: {
        value: "Optimized route",
        isPositive: true,
        icon: <Route className="h-3 w-3" />
      }
    },
    {
      title: "On-time Performance",
      value: "96%",
      trend: {
        value: "3% increase",
        isPositive: true,
        icon: <TrendingUp className="h-3 w-3" />
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-gray-600 text-sm font-medium">{stat.title}</h3>
              <button className="text-gray-600 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="more-vertical">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>
            </div>
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              {stat.trend && (
                <div className="flex items-center mt-1">
                  <span 
                    className={`text-xs ${
                      stat.trend.isPositive ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-700'
                    } px-2 py-0.5 rounded-full inline-flex items-center`}
                  >
                    {stat.trend.icon}
                    <span className="ml-1">{stat.trend.value}</span>
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OverviewCards;
