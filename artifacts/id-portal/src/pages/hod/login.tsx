import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useStaffLogin, useForgotPassword } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, UserCheck, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";

const HOD_BRANCHES = [
  { username: "hod_it", name: "hod_it", branch: "IT", fullName: "Information Technology", color: "border-blue-300 bg-blue-50/70 text-blue-800 hover:bg-blue-100" },
  { username: "hod_ece", name: "hod_ece", branch: "ECE", fullName: "Electronics & Communication", color: "border-emerald-300 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100" },
  { username: "hod_cse", name: "hod_cse", branch: "CSE", fullName: "Computer Science", color: "border-purple-300 bg-purple-50/70 text-purple-800 hover:bg-purple-100" },
  { username: "hod_AIDS", name: "hod_AIDS", branch: "AIDS", fullName: "AI & Data Science", color: "border-amber-300 bg-amber-50/70 text-amber-800 hover:bg-amber-100" },
  { username: "hod_AIML", name: "hod_AIML", branch: "AIML", fullName: "AI & Machine Learning", color: "border-rose-300 bg-rose-50/70 text-rose-800 hover:bg-rose-100" },
  { username: "hod_eee", name: "hod_eee", branch: "EEE", fullName: "Electrical & Electronics", color: "border-cyan-300 bg-cyan-50/70 text-cyan-800 hover:bg-cyan-100" },
  { username: "hod_mech", name: "hod_mech", branch: "MECH", fullName: "Mechanical Engineering", color: "border-orange-300 bg-orange-50/70 text-orange-800 hover:bg-orange-100" },
  { username: "hod_civil", name: "hod_civil", branch: "CIVIL", fullName: "Civil Engineering", color: "border-slate-300 bg-slate-50/70 text-slate-800 hover:bg-slate-100" },
];

export default function HodLogin() {
  const [, setLocation] = useLocation();
  const { loginStaff } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const staffLogin = useStaffLogin();
  const forgotPass = useForgotPassword();

  const selectBranch = (uName: string) => {
    setUsername(uName);
    setPassword("demo");
    toast({
      title: "Branch Selected",
      description: `Populated ${uName} with demo password: demo`,
    });
  };

  const handleHodLogin = (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    const u = (customUser || username).trim();
    const p = customPass || password;

    if (!u || !p) {
      toast({
        variant: "destructive",
        title: "Credentials Required",
        description: "Please enter your username and password.",
      });
      return;
    }

    staffLogin.mutate(
      { data: { identifier: u, password: p } },
      {
        onSuccess: (data) => {
          if (data.user.role !== "HOD" && data.user.role !== "SUPER_ADMIN") {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "Access denied. HOD authorization required.",
            });
            return;
          }

          loginStaff(data.token, data.user);
          toast({
            title: "HOD Login Successful",
            description: `Welcome, ${data.user.name}! (${data.user.department || "Department"} HOD)`,
          });
          setLocation("/hod/dashboard");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Authentication Failed",
            description: err?.message || err?.data?.error || "Invalid username or password.",
          });
        },
      }
    );
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    forgotPass.mutate(
      { email: resetEmail.trim() },
      {
        onSuccess: (data) => {
          toast({
            title: "Request Received",
            description: data.message || "If the account exists, password reset instructions have been sent.",
          });
          setForgotOpen(false);
          setResetEmail("");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: err?.message || "Failed to process request.",
          });
        },
      }
    );
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-muted/20 min-h-[calc(100vh-140px)]">
      <Card className="max-w-lg w-full border-border/80 shadow-2xl">
        <CardHeader className="text-center space-y-2 pb-6 border-b bg-card rounded-t-xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-2 border border-amber-200 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <div className="text-xs uppercase font-bold tracking-wider text-muted-foreground">
            DVR &amp; DR HS MIC COLLEGE OF TECHNOLOGY
          </div>
          <CardTitle className="text-2xl font-bold font-display text-foreground tracking-tight">
            HOD PORTAL
          </CardTitle>
          <CardDescription className="text-xs">
            Sign in with your official Department HOD credentials
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-5">
          {/* Demo Branches Quick-Select (Requirement: display hod_it, hod_ece, hod_cse, hod_AIDS, hod_AIML) */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                Select HOD Branch (Demo Access)
              </span>
              <span className="text-[11px] font-mono font-semibold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded border border-amber-300">
                Password: demo (or 123456)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Click any department branch below to auto-fill credentials:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {HOD_BRANCHES.map((b) => (
                <button
                  key={b.username}
                  type="button"
                  onClick={() => selectBranch(b.username)}
                  className={`flex flex-col items-start p-2 rounded-lg border text-left transition-all ${b.color} ${
                    username === b.username ? "ring-2 ring-amber-500 ring-offset-1 font-bold shadow-sm" : ""
                  }`}
                >
                  <span className="font-mono text-xs font-bold">{b.name}</span>
                  <span className="text-[10px] opacity-80 truncate w-full">{b.fullName}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={(e) => handleHodLogin(e)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Username</Label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="e.g. hod_it, hod_ece, hod_cse, hod_AIDS, hod_AIML"
                  className="pl-9 text-xs h-10 font-mono"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Password</Label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-[11px] font-medium text-amber-700 hover:text-amber-800 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password (demo password: demo)"
                  className="pl-9 pr-9 text-xs h-10 font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={staffLogin.isPending}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs h-10 mt-3 shadow-md"
            >
              {staffLogin.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="w-4 h-4 mr-2" />
              )}
              LOGIN
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              Reset HOD Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter your official college email address. If an account is associated with this email, password reset instructions will be provided.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Official Email</Label>
              <Input
                type="email"
                placeholder="hod.dept@mictech.edu.in"
                className="text-xs h-9"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setForgotOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={forgotPass.isPending} size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                {forgotPass.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Send Instructions
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
