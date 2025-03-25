// This file handles interactions with the Google Calendar API

// Define necessary types
type CalendarEvent = {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  colorId?: string;
};

// Load the Google API client library
const loadCalendarApi = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if the API is already loaded
    if (window.gapi && window.gapi.client && window.gapi.client.calendar) {
      resolve();
      return;
    }

    // Load the Google API client
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            apiKey: process.env.VITE_GOOGLE_API_KEY,
            clientId: process.env.VITE_GOOGLE_CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
            scope: 'https://www.googleapis.com/auth/calendar',
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    };
    script.onerror = (error) => {
      reject(new Error('Failed to load Google Calendar API: ' + error));
    };
    document.head.appendChild(script);
  });
};

// Sign in the user and get their consent
const signIn = async (): Promise<void> => {
  if (!window.gapi || !window.gapi.auth2) {
    await loadCalendarApi();
  }
  
  return window.gapi.auth2.getAuthInstance().signIn();
};

// Sign out the user
const signOut = async (): Promise<void> => {
  if (!window.gapi || !window.gapi.auth2) {
    throw new Error('Google API not loaded');
  }
  
  return window.gapi.auth2.getAuthInstance().signOut();
};

// Check if the user is signed in
const isSignedIn = (): boolean => {
  if (!window.gapi || !window.gapi.auth2) {
    return false;
  }
  
  return window.gapi.auth2.getAuthInstance().isSignedIn.get();
};

// Get events from the user's calendar
const getEvents = async (
  timeMin: Date,
  timeMax: Date,
  maxResults: number = 10
): Promise<CalendarEvent[]> => {
  if (!isSignedIn()) {
    await signIn();
  }
  
  const response = await window.gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'timeMin': timeMin.toISOString(),
    'timeMax': timeMax.toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': maxResults,
    'orderBy': 'startTime'
  });
  
  return response.result.items;
};

// Create a new event in the user's calendar
const createEvent = async (event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
  if (!isSignedIn()) {
    await signIn();
  }
  
  const response = await window.gapi.client.calendar.events.insert({
    'calendarId': 'primary',
    'resource': event
  });
  
  return response.result;
};

// Update an existing event
const updateEvent = async (eventId: string, event: Partial<Omit<CalendarEvent, 'id'>>): Promise<CalendarEvent> => {
  if (!isSignedIn()) {
    await signIn();
  }
  
  const response = await window.gapi.client.calendar.events.patch({
    'calendarId': 'primary',
    'eventId': eventId,
    'resource': event
  });
  
  return response.result;
};

// Delete an event
const deleteEvent = async (eventId: string): Promise<void> => {
  if (!isSignedIn()) {
    await signIn();
  }
  
  await window.gapi.client.calendar.events.delete({
    'calendarId': 'primary',
    'eventId': eventId
  });
};

// Get color mappings for different event types
const getEventColorId = (eventType: string): string => {
  switch (eventType.toLowerCase()) {
    case 'delivery':
      return '1'; // Lavender
    case 'rest':
      return '2'; // Sage
    case 'maintenance':
      return '4'; // Flamingo
    case 'meeting':
      return '3'; // Grape
    case 'charging':
      return '10'; // Basil
    case 'fuel':
      return '5'; // Banana
    default:
      return '0'; // Default blue
  }
};

export const googleCalendarService = {
  loadCalendarApi,
  signIn,
  signOut,
  isSignedIn,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventColorId
};

export default googleCalendarService;
