import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Load Google Maps API script
const loadGoogleMapsAPI = () => {
  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  
  if (!googleMapsKey) {
    console.warn("Google Maps API Key not provided. Maps functionality will be limited.");
    return;
  }
  
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

loadGoogleMapsAPI();

createRoot(document.getElementById("root")!).render(<App />);
