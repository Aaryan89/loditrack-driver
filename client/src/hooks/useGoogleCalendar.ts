import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { ScheduleEntry } from "@shared/schema";

interface UseGoogleCalendarResult {
  data: ScheduleEntry[] | null;
  isLoading: boolean;
  error: Error | null;
  addEvent: (event: Omit<ScheduleEntry, "id" | "userId">) => Promise<void>;
  updateEvent: (id: number, event: Partial<ScheduleEntry>) => Promise<void>;
  deleteEvent: (id: number) => Promise<void>;
}

export function useGoogleCalendar(): UseGoogleCalendarResult {
  const [data, setData] = useState<ScheduleEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Mock data for demonstration
  const mockScheduleEntries: ScheduleEntry[] = [
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

  useEffect(() => {
    const fetchSchedule = async () => {
      setIsLoading(true);
      try {
        // In a real application, this would fetch from Google Calendar API
        await new Promise(resolve => setTimeout(resolve, 500));
        setData(mockScheduleEntries);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const addEvent = async (event: Omit<ScheduleEntry, "id" | "userId">) => {
    setIsLoading(true);
    try {
      // In a real application, this would call the Google Calendar API to create an event
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Add the new event to the local state
      const newEvent: ScheduleEntry = {
        ...event,
        id: data ? Math.max(...data.map(e => e.id)) + 1 : 1,
        userId: 1
      };
      
      setData(prev => prev ? [...prev, newEvent] : [newEvent]);
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEvent = async (id: number, event: Partial<ScheduleEntry>) => {
    setIsLoading(true);
    try {
      // In a real application, this would call the Google Calendar API to update an event
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update the event in the local state
      setData(prev => {
        if (!prev) return null;
        
        return prev.map(e => 
          e.id === id ? { ...e, ...event } : e
        );
      });
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvent = async (id: number) => {
    setIsLoading(true);
    try {
      // In a real application, this would call the Google Calendar API to delete an event
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove the event from the local state
      setData(prev => {
        if (!prev) return null;
        
        return prev.filter(e => e.id !== id);
      });
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    data,
    isLoading,
    error,
    addEvent,
    updateEvent,
    deleteEvent
  };
}
