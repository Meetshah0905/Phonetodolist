import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { GameProvider, useGame } from "@/lib/store";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Habits from "@/pages/Habits";
import Library from "@/pages/Library";
import Journal from "@/pages/Journal";
import Shop from "@/pages/Shop";
import Profile from "@/pages/Profile";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  const { user } = useGame();
  console.log("ProtectedRoute check - user:", user);
  return user ? <Component /> : <Redirect to="/login" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/habits">
        <ProtectedRoute component={Habits} />
      </Route>
      <Route path="/library">
        <ProtectedRoute component={Library} />
      </Route>
      <Route path="/journal">
        <ProtectedRoute component={Journal} />
      </Route>
      <Route path="/shop">
        <ProtectedRoute component={Shop} />
      </Route>
      <Route path="/profile">
        <ProtectedRoute component={Profile} />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GameProvider>
        <Router />
        <Toaster />
      </GameProvider>
    </QueryClientProvider>
  );
}

export default App;
