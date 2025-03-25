import { useState, useEffect } from "react";
import { useSidebar } from "@/context/SidebarContext";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { googleCalendarService } from "@/lib/googleCalendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  endOfDay,
  parseISO,
  addHours,
} from "date-fns";
import type { CalendarEvent } from "@shared/schema";

const eventTypes = [
  { value: "delivery", label: "Delivery" },
  { value: "rest", label: "Rest" },
  { value: "maintenance", label: "Maintenance" },
  { value: "meeting", label: "Meeting" },
];

// Define the calendar event form schema
const eventFormSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  startTime: z.string().refine(val => !!val, {
    message: "Start time is required.",
  }),
  endTime: z.string().refine(val => !!val, {
    message: "End time is required.",
  }),
  description: z.string().optional(),
  eventType: z.string({
    required_error: "Please select an event type.",
  }),
  relatedDeliveryId: z.string().optional(),
});

// Format time ranges for display
const formatTimeRange = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return `${format(startDate, "h:mm a")} - ${format(endDate, "h:mm a")}`;
};

// Get event color based on type
const getEventColor = (eventType: string) => {
  switch (eventType) {
    case "delivery":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "rest":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "maintenance":
      return "bg-red-100 text-red-700 border-red-200";
    case "meeting":
      return "bg-green-100 text-green-700 border-green-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const Calendar = () => {
  const { isOpen } = useSidebar();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(currentDate));
  const [weekEnd, setWeekEnd] = useState(endOfWeek(currentDate));
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isGoogleCalendarConnected, setIsGoogleCalendarConnected] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Update week bounds when current date changes
  useEffect(() => {
    setWeekStart(startOfWeek(currentDate));
    setWeekEnd(endOfWeek(currentDate));
  }, [currentDate]);

  // Check if Google Calendar is connected
  useEffect(() => {
    const checkGoogleCalendarConnection = async () => {
      try {
        await googleCalendarService.loadCalendarApi();
        setIsGoogleCalendarConnected(googleCalendarService.isSignedIn());
      } catch (error) {
        console.error("Error checking Google Calendar connection:", error);
      }
    };

    checkGoogleCalendarConnection();
  }, []);

  // Connect to Google Calendar
  const handleConnectGoogleCalendar = async () => {
    try {
      await googleCalendarService.loadCalendarApi();
      await googleCalendarService.signIn();
      setIsGoogleCalendarConnected(true);
      toast({
        title: "Connected to Google Calendar",
        description: "Your calendar is now connected and synchronized.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to Google Calendar",
        variant: "destructive",
      });
    }
  };

  // Navigate to previous week
  const handlePreviousWeek = () => {
    setCurrentDate(subDays(currentDate, 7));
  };

  // Navigate to next week
  const handleNextWeek = () => {
    setCurrentDate(addDays(currentDate, 7));
  };

  // Navigate to today
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open add event dialog with selected date
  const handleAddEvent = (date: Date) => {
    setSelectedDate(date);
    setIsAddingEvent(true);
  };

  // Generate the week days array
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Fetch calendar events for the current week
  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/calendar', format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await fetch(`/api/calendar?start=${format(weekStart, 'yyyy-MM-dd')}&end=${format(weekEnd, 'yyyy-MM-dd')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }
      return response.json();
    }
  });

  // Group events by day
  const eventsByDay = events?.reduce((acc: Record<string, CalendarEvent[]>, event: CalendarEvent) => {
    const date = format(parseISO(event.startTime), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {}) || {};

  // Initialize event form
  const eventForm = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      startTime: selectedDate 
        ? format(addHours(selectedDate, 9), "yyyy-MM-dd'T'HH:mm") 
        : "",
      endTime: selectedDate 
        ? format(addHours(selectedDate, 10), "yyyy-MM-dd'T'HH:mm") 
        : "",
      description: "",
      eventType: "delivery",
      relatedDeliveryId: "",
    },
  });

  // Update form values when selected date changes
  useEffect(() => {
    if (selectedDate) {
      eventForm.setValue('startTime', format(addHours(selectedDate, 9), "yyyy-MM-dd'T'HH:mm"));
      eventForm.setValue('endTime', format(addHours(selectedDate, 10), "yyyy-MM-dd'T'HH:mm"));
    }
  }, [selectedDate, eventForm]);

  // Fetch deliveries for dropdown
  const { data: deliveries } = useQuery({
    queryKey: ['/api/deliveries'],
    queryFn: async () => {
      const response = await fetch('/api/deliveries');
      if (!response.ok) {
        throw new Error('Failed to fetch deliveries');
      }
      return response.json();
    }
  });

  // Add event mutation
  const addEventMutation = useMutation({
    mutationFn: async (eventData: z.infer<typeof eventFormSchema>) => {
      const payload = {
        title: eventData.title,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        description: eventData.description || "",
        eventType: eventData.eventType,
        relatedDeliveryId: eventData.relatedDeliveryId 
          ? parseInt(eventData.relatedDeliveryId)
          : undefined,
        assignedDriver: 1, // Using default driver ID
      };
      
      const response = await apiRequest('POST', '/api/calendar', payload);
      const newEvent = await response.json();
      
      // If Google Calendar is connected, also add event there
      if (isGoogleCalendarConnected) {
        try {
          const googleEvent = {
            summary: eventData.title,
            description: eventData.description || "",
            start: {
              dateTime: eventData.startTime,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            end: {
              dateTime: eventData.endTime,
              timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
            colorId: googleCalendarService.getEventColorId(eventData.eventType),
          };
          
          const createdGoogleEvent = await googleCalendarService.createEvent(googleEvent);
          
          // Update our event with Google Calendar ID
          await apiRequest('PUT', `/api/calendar/${newEvent.id}`, {
            googleCalendarId: createdGoogleEvent.id,
          });
        } catch (error) {
          console.error("Failed to create Google Calendar event:", error);
          // We'll continue anyway since the local event was created successfully
        }
      }
      
      return newEvent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar'] });
      toast({
        title: "Event added",
        description: "The calendar event has been added successfully."
      });
      setIsAddingEvent(false);
      eventForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to add event",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    }
  });

  // Handle event form submission
  const onSubmit = (values: z.infer<typeof eventFormSchema>) => {
    addEventMutation.mutate(values);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`flex-1 flex flex-col overflow-hidden ${isOpen ? 'lg:ml-64' : ''}`}>
        <TopBar title="Delivery Schedule" />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Card className="mb-6">
            <CardHeader className="pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200">
              <CardTitle className="text-xl font-medium mb-2 sm:mb-0">
                Calendar
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToday}
                  className="flex items-center"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousWeek}
                  className="flex items-center"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextWeek}
                  className="flex items-center"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  className="bg-[#1a73e8] hover:bg-[#1a68d8] text-white"
                  size="sm"
                  onClick={() => {
                    setSelectedDate(new Date());
                    setIsAddingEvent(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Event
                </Button>
                {!isGoogleCalendarConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConnectGoogleCalendar}
                    className="flex items-center"
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="#1a73e8">
                      <path d="M12,1.5 C6.21,1.5 1.5,6.21 1.5,12 C1.5,17.79 6.21,22.5 12,22.5 C17.79,22.5 22.5,17.79 22.5,12 C22.5,6.21 17.79,1.5 12,1.5 Z M12,20.25 C7.455,20.25 3.75,16.545 3.75,12 C3.75,7.455 7.455,3.75 12,3.75 C16.545,3.75 20.25,7.455 20.25,12 C20.25,16.545 16.545,20.25 12,20.25 Z" fill="#1a73e8"></path>
                      <path d="M12,7.5 L12,12 L16.5,14.625" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
                    </svg>
                    Connect Google Calendar
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="px-0 py-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  {format(weekStart, "MMMM d")} - {format(weekEnd, "MMMM d, yyyy")}
                </h2>
              </div>
              
              <div className="grid grid-cols-7 border-b border-gray-200">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="px-2 py-3 text-center text-sm font-medium text-gray-600">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 min-h-[600px] border-l border-gray-200">
                {weekDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayEvents = eventsByDay[dateKey] || [];
                  const isToday = isSameDay(day, new Date());
                  
                  return (
                    <div 
                      key={day.toString()} 
                      className={`border-r border-b border-gray-200 min-h-[120px] ${
                        isToday ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="p-2">
                        <div 
                          className={`flex justify-center items-center h-8 w-8 rounded-full mx-auto mb-1 ${
                            isToday ? 'bg-[#1a73e8] text-white' : ''
                          }`}
                        >
                          {format(day, 'd')}
                        </div>
                        
                        {isLoading ? (
                          <div className="mt-2 space-y-1">
                            <Skeleton className="h-5 w-full" />
                            <Skeleton className="h-5 w-full" />
                          </div>
                        ) : (
                          <>
                            {dayEvents.map((event: CalendarEvent) => (
                              <div 
                                key={event.id} 
                                className={`p-1 mb-1 text-xs rounded cursor-pointer border ${getEventColor(event.eventType)}`}
                                title={`${event.title}\n${formatTimeRange(event.startTime, event.endTime)}\n${event.description || ''}`}
                              >
                                <div className="font-medium truncate">{event.title}</div>
                                <div className="truncate">{formatTimeRange(event.startTime, event.endTime)}</div>
                              </div>
                            ))}
                            <div 
                              className="mt-1 p-1 text-xs text-center text-[#1a73e8] cursor-pointer hover:bg-blue-50 rounded"
                              onClick={() => handleAddEvent(startOfDay(day))}
                            >
                              + Add
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Upcoming events */}
          <Card>
            <CardHeader className="pb-4 border-b border-gray-200">
              <CardTitle className="text-lg font-medium">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {isLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {events && events.length > 0 ? (
                    <div className="space-y-4">
                      {events
                        .filter((event: CalendarEvent) => new Date(event.startTime) >= new Date())
                        .sort((a: CalendarEvent, b: CalendarEvent) => 
                          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                        )
                        .slice(0, 5)
                        .map((event: CalendarEvent) => (
                          <div key={event.id} className="flex items-start space-x-4">
                            <div className={`h-12 w-12 rounded flex items-center justify-center ${
                              event.eventType === 'delivery' ? 'bg-yellow-100 text-yellow-700' :
                              event.eventType === 'rest' ? 'bg-blue-100 text-blue-700' :
                              event.eventType === 'maintenance' ? 'bg-red-100 text-red-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {event.eventType === 'delivery' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                  <line x1="16" y1="8" x2="8" y2="8"></line>
                                  <line x1="16" y1="16" x2="8" y2="16"></line>
                                  <line x1="10" y1="12" x2="3" y2="12"></line>
                                </svg>
                              )}
                              {event.eventType === 'rest' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M2 4h20"></path>
                                  <path d="M4 4v10c0 6 16 6 16 0V4"></path>
                                  <path d="M12 4v10"></path>
                                </svg>
                              )}
                              {event.eventType === 'maintenance' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                                </svg>
                              )}
                              {event.eventType === 'meeting' && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                  <circle cx="9" cy="7" r="4"></circle>
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                                </svg>
                              )}
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{event.title}</h4>
                              <p className="text-sm text-gray-600">
                                {format(new Date(event.startTime), "EEE, MMM d · h:mm a")}
                              </p>
                              {event.description && (
                                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-600">
                      <p>No upcoming events</p>
                      <Button 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => {
                          setSelectedDate(new Date());
                          setIsAddingEvent(true);
                        }}
                      >
                        Add Your First Event
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* Add Event Dialog */}
      <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Calendar Event</DialogTitle>
          </DialogHeader>
          
          <Form {...eventForm}>
            <form onSubmit={eventForm.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={eventForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter event title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={eventForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={eventForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={eventForm.control}
                name="eventType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select event type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={eventForm.control}
                name="relatedDeliveryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Delivery (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a delivery" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {deliveries?.map((delivery: any) => (
                          <SelectItem key={delivery.id} value={delivery.id.toString()}>
                            #{delivery.deliveryId} - {delivery.destination}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Link this event to a specific delivery
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={eventForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add event details" 
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddingEvent(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#1a73e8] hover:bg-[#1a68d8] text-white"
                  disabled={addEventMutation.isPending}
                >
                  {addEventMutation.isPending ? "Adding..." : "Add Event"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Calendar;
