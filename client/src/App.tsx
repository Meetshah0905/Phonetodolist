import { Switch, Route, Redirect } from "wouter";
import { GameProvider } from "@/lib/store";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Home from "@/pages/Home";
import Habits from "@/pages/Habits";
import Library from "@/pages/Library";
import Shop from "@/pages/Shop";
import Journal from "@/pages/Journal";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Default route is now Home, bypassing login */}
      <Route path="/" component={Home} />
      <Route path="/habits" component={Habits} />
      <Route path="/library" component={Library} />
      <Route path="/shop" component={Shop} />
      <Route path="/journal" component={Journal} />
      <Route path="/profile" component={Profile} />
      
      {/* Legacy auth routes now just redirect to Home */}
      <Route path="/auth">
        <Redirect to="/" />
      </Route>
      <Route path="/login">
        <Redirect to="/" />
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <GameProvider>
        <Router />
        <Toaster />
      </GameProvider>
    </ErrorBoundary>
  );
}

export default App;