import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface CalendarEvent {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  eventType: 'delivery' | 'rest' | 'maintenance' | 'meeting';
}

const DeliveryCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Get days for current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Fetch calendar events for the current month
  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/calendar', format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(`/api/calendar?start=${format(monthStart, 'yyyy-MM-dd')}&end=${format(monthEnd, 'yyyy-MM-dd')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      return response.json();
    }
  });

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  // Group events by date
  const eventsByDate = events?.reduce((acc: Record<string, CalendarEvent[]>, event: CalendarEvent) => {
    const date = event.startTime.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {}) || {};

  // Get event background color based on event type
  const getEventColorClass = (eventType: string) => {
    switch (eventType) {
      case 'delivery':
        return 'bg-yellow-100 text-yellow-700';
      case 'rest':
        return 'bg-blue-100 text-blue-700';
      case 'maintenance':
        return 'bg-red-100 text-red-600';
      case 'meeting':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Format event time
  const formatEventTime = (timeString: string) => {
    const time = new Date(timeString);
    return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className="mb-6">
      <CardHeader className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">Delivery Schedule</CardTitle>
          <div className="flex">
            <Button 
              variant="ghost"
              size="sm"
              className="mr-2 text-sm text-gray-600 hover:text-[#1a73e8]"
              onClick={handleToday}
            >
              <CalendarIcon className="h-4 w-4 mr-1" /> Today
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className="mr-2 text-sm text-gray-600 hover:text-[#1a73e8]"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className="mr-2 text-sm text-gray-600 hover:text-[#1a73e8]"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              className="text-sm text-[#1a73e8]"
            >
              <span className="mr-1">{format(currentMonth, 'MMMM yyyy')}</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Calendar headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-gray-50 p-2 text-center text-gray-600 text-sm font-medium">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate[dateKey] || [];
            
            return (
              <div 
                key={day.toISOString()}
                className={`bg-white p-1 min-h-[100px] ${
                  isToday(day) ? 'ring-2 ring-[#1a73e8]' : ''
                }`}
              >
                <div className="flex justify-between p-1">
                  <span className={`text-sm ${
                    isToday(day) 
                      ? 'font-bold text-[#1a73e8]' 
                      : isSameMonth(day, currentMonth)
                        ? 'font-medium text-gray-900'
                        : 'text-gray-600'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  <span className={`text-xs ${
                    isToday(day) 
                      ? 'font-medium text-[#1a73e8]' 
                      : 'text-gray-600'
                  }`}>
                    {isToday(day) ? 'Today' : format(day, 'MMM')}
                  </span>
                </div>
                <div className="mt-1">
                  {isLoading ? (
                    <div className="h-4 w-full bg-gray-100 animate-pulse rounded"></div>
                  ) : (
                    dayEvents.map((event) => (
                      <div 
                        key={event.id}
                        className={`calendar-event mb-1 rounded px-1 text-xs truncate ${getEventColorClass(event.eventType)}`}
                        title={event.title}
                      >
                        {formatEventTime(event.startTime)} - {event.title}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeliveryCalendar;
