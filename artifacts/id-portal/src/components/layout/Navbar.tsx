import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useGetNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Shield, Award, User, LogOut } from "lucide-react";

export function Navbar() {
  const { studentEmail, logout, staffUser, logoutStaff } = useAuth();
  
  const { data: notifications, refetch } = useGetNotifications(
    { email: studentEmail || "" },
    { enabled: Boolean(studentEmail) }
  );

  const markRead = useMarkNotificationRead();
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const handleMarkRead = (id: number) => {
    markRead.mutate({ id }, { onSuccess: () => refetch() });
  };

  const isHod = staffUser?.role === "HOD";
  const isPrincipal = staffUser?.role === "PRINCIPAL";
  const isAdmin = staffUser?.role === "ADMIN" || staffUser?.role === "SUPER_ADMIN" || staffUser?.role === "ID_CARD_STAFF";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8 flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">Digital ID Card Reissue Portal</span>
            <span className="text-[11px] text-muted-foreground font-medium">DVR &amp; DR HS MIC College of Technology</span>
          </div>
        </Link>
        
        <nav className="flex items-center gap-2 md:gap-3 text-xs">
          <Link href="/student/dashboard">
            <Button variant="ghost" size="sm" className="text-xs">
              <User className="w-3.5 h-3.5 mr-1 text-primary" /> Student Portal
            </Button>
          </Link>

          <Link href={isHod ? "/hod/dashboard" : "/hod/login"}>
            <Button variant={isHod ? "default" : "ghost"} size="sm" className={`text-xs hidden sm:inline-flex ${isHod ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}>
              <Shield className="w-3.5 h-3.5 mr-1 text-amber-600" /> HOD Portal
            </Button>
          </Link>

          <Link href={isPrincipal ? "/principal/dashboard" : "/principal/login"}>
            <Button variant={isPrincipal ? "default" : "ghost"} size="sm" className={`text-xs hidden sm:inline-flex ${isPrincipal ? "bg-purple-700 hover:bg-purple-800 text-white" : ""}`}>
              <Award className="w-3.5 h-3.5 mr-1 text-purple-600" /> Principal Portal
            </Button>
          </Link>

          <Link href={isAdmin ? "/admin/dashboard" : "/admin/login"}>
            <Button variant={isAdmin ? "default" : "ghost"} size="sm" className={`text-xs hidden sm:inline-flex ${isAdmin ? "bg-blue-700 hover:bg-blue-800 text-white" : ""}`}>
              Admin
            </Button>
          </Link>

          {(staffUser?.role === "SUPER_ADMIN" || staffUser?.role === "ADMIN") && (
            <Link href="/super-admin/hods">
              <Button variant="ghost" size="sm" className="text-xs hidden sm:inline-flex text-purple-700 hover:bg-purple-50 font-medium">
                <Shield className="w-3.5 h-3.5 mr-1 text-purple-600" /> Manage HODs
              </Button>
            </Link>
          )}

          {/* In-App Notifications Drawer */}
          {studentEmail && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8">
                  <Bell className="w-4 h-4 text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 shadow-lg" align="end">
                <div className="p-3 border-b bg-muted/30 font-semibold text-xs flex justify-between items-center">
                  <span>Notifications</span>
                  <span className="text-[10px] text-muted-foreground">{unreadCount} Unread</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y text-xs">
                  {!notifications || notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-xs">No notifications yet.</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.read && handleMarkRead(n.id)}
                        className={`p-3 cursor-pointer transition-colors ${n.read ? "bg-background opacity-75" : "bg-blue-50/50 hover:bg-blue-50"}`}
                      >
                        <div className="font-semibold text-foreground flex items-center justify-between">
                          <span>{n.title}</span>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{n.message}</p>
                        <span className="text-[9px] text-muted-foreground mt-1 block font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {staffUser ? (
            <Button variant="outline" size="sm" onClick={logoutStaff} className="h-8 text-xs text-destructive">
              <LogOut className="w-3.5 h-3.5 mr-1" /> Logout ({staffUser.role})
            </Button>
          ) : studentEmail ? (
            <Button variant="outline" size="sm" onClick={logout} className="h-8 text-xs">
              <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
            </Button>
          ) : (
            <Link href="/login">
              <Button size="sm" className="h-8 text-xs font-semibold">Student Login</Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
