import { useState, useEffect } from "react";

interface GoogleMapsHookResult {
  isLoaded: boolean;
  loadError: Error | null;
}

export function useGoogleMaps(): GoogleMapsHookResult {
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    // Check if the Google Maps API is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if there's already a script loading
    const existingScript = document.getElementById("google-maps-script");
    if (existingScript) {
      // Wait for the existing script to load
      const onLoad = () => setIsLoaded(true);
      const onError = () => setLoadError(new Error("Failed to load Google Maps API"));
      
      existingScript.addEventListener("load", onLoad);
      existingScript.addEventListener("error", onError);
      
      return () => {
        existingScript.removeEventListener("load", onLoad);
        existingScript.removeEventListener("error", onError);
      };
    }

    // Otherwise, create a new script element to load the API
    const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
    
    if (!googleMapsKey) {
      setLoadError(new Error("Google Maps API key not found"));
      return;
    }
    
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.addEventListener("load", () => setIsLoaded(true));
    script.addEventListener("error", () => {
      setLoadError(new Error("Failed to load Google Maps API"));
    });
    
    document.head.appendChild(script);
    
    return () => {
      script.removeEventListener("load", () => setIsLoaded(true));
      script.removeEventListener("error", () => {
        setLoadError(new Error("Failed to load Google Maps API"));
      });
    };
  }, []);

  return { isLoaded, loadError };
}
