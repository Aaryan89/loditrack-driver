import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Inventory from "@/pages/Inventory";
import Calendar from "@/pages/Calendar";
import Routes from "@/pages/Routes";
import Stations from "@/pages/Stations";
import Settings from "@/pages/Settings";
import { useAuthContext } from "./context/AuthContext";
import { useEffect } from "react";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path?: string }) {
  const { isAuthenticated } = useAuthContext();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated } = useAuthContext();
  const [location] = useLocation();

  // Redirect to dashboard if authenticated and trying to access login
  if (isAuthenticated && location === "/login") {
    return <Redirect to="/" />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/inventory" component={() => <ProtectedRoute component={Inventory} />} />
      <Route path="/calendar" component={() => <ProtectedRoute component={Calendar} />} />
      <Route path="/routes" component={() => <ProtectedRoute component={Routes} />} />
      <Route path="/stations" component={() => <ProtectedRoute component={Stations} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
