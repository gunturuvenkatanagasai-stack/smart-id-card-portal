import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CollegeHeader } from "@/components/layout/CollegeHeader";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Login from "@/pages/login";
import Apply from "@/pages/apply";
import Track from "@/pages/track";
import StudentDashboard from "@/pages/student/dashboard";
import HodLogin from "@/pages/hod/login";
import HodDashboard from "@/pages/hod/dashboard";
import PrincipalLogin from "@/pages/principal/login";
import PrincipalDashboard from "@/pages/principal/dashboard";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminRequestDetail from "@/pages/admin/request-detail";
import SuperAdminHods from "@/pages/super-admin/hods";

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <CollegeHeader />
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/student/dashboard" component={StudentDashboard} />
          <Route path="/apply" component={Apply} />
          <Route path="/track" component={Track} />
          <Route path="/hod/login" component={HodLogin} />
          <Route path="/hod" component={HodDashboard} />
          <Route path="/hod/dashboard" component={HodDashboard} />
          <Route path="/hod/applications" component={HodDashboard} />
          <Route path="/principal/login" component={PrincipalLogin} />
          <Route path="/principal" component={PrincipalDashboard} />
          <Route path="/principal/dashboard" component={PrincipalDashboard} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/requests/:id" component={AdminRequestDetail} />
          <Route path="/super-admin/hods" component={SuperAdminHods} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
