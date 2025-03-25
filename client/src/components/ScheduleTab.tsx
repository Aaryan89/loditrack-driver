import { useState } from "react";
import { format, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";

export default function ScheduleTab() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Get schedule entries from the API (mocked for now)
  const { data: scheduleEntries } = useGoogleCalendar();
  
  // Mock schedule entries
  const mockScheduleEntries = [
    {
      id: 1,
      title: "San Francisco Route",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "8:00 AM",
      endTime: "5:00 PM",
      type: "route",
      details: "8 stops | Truck #T-5892",
      userId: 1
    },
    {
      id: 2,
      title: "Rest Period",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "5:00 PM",
      endTime: "8:00 AM",
      type: "rest",
      details: "Required Rest",
      userId: 1
    },
    {
      id: 3,
      title: "Day Off",
      date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      startTime: "",
      endTime: "",
      type: "off",
      details: "Scheduled Rest",
      userId: 1
    },
    {
      id: 4,
      title: "Seattle Route",
      date: format(addDays(new Date(), 4), "yyyy-MM-dd"),
      startTime: "6:00 AM",
      endTime: "6:00 PM",
      type: "route",
      details: "3-day haul",
      userId: 1
    },
    {
      id: 5,
      title: "Portland Route",
      date: format(addDays(new Date(), 12), "yyyy-MM-dd"),
      startTime: "7:00 AM",
      endTime: "8:00 PM",
      type: "route",
      details: "2-day haul",
      userId: 1
    }
  ];
  
  const entries = scheduleEntries || mockScheduleEntries;
  
  // Filter entries for the selected date
  const selectedDateEntries = entries.filter(entry => 
    entry.date === format(selectedDate, "yyyy-MM-dd")
  );
  
  // Filter upcoming entries (excluding selected date)
  const upcomingEntries = entries
    .filter(entry => new Date(entry.date) > new Date())
    .filter(entry => entry.date !== format(selectedDate, "yyyy-MM-dd"))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
  
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const onDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar View */}
        <div className="w-full md:w-2/3">
          <div className="bg-white border border-neutral-200 rounded-lg">
            {/* Calendar Navigation */}
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <i className="fas fa-chevron-left"></i>
                </Button>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <i className="fas fa-chevron-right"></i>
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
              </div>
            </div>
            
            {/* Calendar */}
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateClick(date)}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="w-full"
              classNames={{
                day_selected: "bg-primary text-primary-foreground",
                day_today: "bg-neutral-100 text-neutral-900 font-bold",
              }}
            />
          </div>
        </div>
        
        {/* Schedule Details */}
        <div className="w-full md:w-1/3">
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Schedule Details</h3>
            
            <div className="mb-4">
              <p className="text-sm text-neutral-600 mb-1">Selected Date</p>
              <p className="text-xl font-medium">{format(selectedDate, "MMMM d, yyyy")}</p>
            </div>
            
            <div className="space-y-4">
              {selectedDateEntries.length > 0 ? (
                selectedDateEntries.map(entry => (
                  <div 
                    key={entry.id}
                    className={`p-3 rounded-r-lg ${
                      entry.type === 'route' 
                        ? 'bg-primary-50 border-l-4 border-primary'
                        : entry.type === 'rest'
                        ? 'bg-neutral-50 border-l-4 border-neutral-300'
                        : 'bg-neutral-50 border-l-4 border-neutral-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{entry.title}</h4>
                      {entry.type === 'route' && (
                        <span className="text-xs bg-primary-100 text-primary px-2 py-1 rounded">Current</span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 mt-1">
                      {entry.startTime} - {entry.endTime}
                    </p>
                    <div className="mt-2 flex space-x-4 text-sm">
                      {entry.type === 'route' ? (
                        <>
                          <span><i className="fas fa-map-marker-alt text-primary mr-1"></i> 8 stops</span>
                          <span><i className="fas fa-truck text-primary mr-1"></i> Truck #T-5892</span>
                        </>
                      ) : entry.type === 'rest' ? (
                        <span><i className="fas fa-bed text-neutral-500 mr-1"></i> {entry.details}</span>
                      ) : (
                        <span><i className="fas fa-calendar-day text-neutral-500 mr-1"></i> {entry.details}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
                  <p className="text-neutral-500">No scheduled activities for this date</p>
                </div>
              )}
            </div>
            
            <div className="mt-6">
              <h4 className="font-medium mb-3">Upcoming Schedule</h4>
              
              <div className="space-y-3">
                {upcomingEntries.map(entry => (
                  <div key={entry.id} className="flex items-center p-2 border-b border-neutral-200">
                    <div className="w-10 text-center">
                      <span className="text-sm font-medium">{format(new Date(entry.date), "d")}</span>
                      <p className="text-xs text-neutral-500">{format(new Date(entry.date), "EEE")}</p>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{entry.title}</p>
                      <p className="text-xs text-neutral-500">{entry.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6">
              <Button className="w-full">
                <i className="far fa-calendar-plus mr-2"></i> 
                Add Schedule Item
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
