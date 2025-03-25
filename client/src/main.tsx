import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Load Font Awesome
const loadFontAwesome = () => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css";
  link.integrity = "sha512-MV7K8+y+gLIBoVD59lQIYicR65iaqukzvf/nwasF0nqhPay5w/9lJmVM2hMDcnK1OnMGCdVK+iQrJ7lzPJQd1w==";
  link.crossOrigin = "anonymous";
  link.referrerPolicy = "no-referrer";
  document.head.appendChild(link);
};

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

// Load external resources
loadFontAwesome();
loadGoogleMapsAPI();

createRoot(document.getElementById("root")!).render(<App />);
