import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const [location] = useLocation();
  const { studentEmail, logout, adminToken, logoutAdmin } = useAuth();
  
  const isAdminRoute = location.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8 flex h-14 items-center justify-between">
        <Link href={isAdminRoute ? "/admin" : "/"} className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">ID Card Reissue Portal</span>
            <span className="text-[11px] text-muted-foreground font-medium">DVR &amp; DR HS MIC College of Technology</span>
          </div>
          {isAdminRoute && <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full text-muted-foreground ml-2">Admin</span>}
        </Link>
        
        <nav className="flex items-center gap-4">
          {!isAdminRoute ? (
            <>
              <Link href="/track">
                <Button variant="ghost" className="hidden sm:inline-flex">Track Request</Button>
              </Link>
              {studentEmail ? (
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground hidden sm:inline-block">{studentEmail}</span>
                  <Button variant="outline" onClick={logout}>Sign Out</Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button>Student Login</Button>
                </Link>
              )}
            </>
          ) : (
            <>
              {adminToken ? (
                <Button variant="outline" onClick={logoutAdmin}>Exit Admin</Button>
              ) : null}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
