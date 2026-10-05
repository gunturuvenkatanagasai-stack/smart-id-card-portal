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
import { Award, Lock, Mail, Eye, EyeOff, Loader2, KeyRound } from "lucide-react";

export default function PrincipalLogin() {
  const [, setLocation] = useLocation();
  const { loginStaff } = useAuth();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const staffLogin = useStaffLogin();
  const forgotPass = useForgotPassword();

  const handlePrincipalLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      toast({ variant: "destructive", title: "Credentials Required", description: "Please enter your Principal username or email and password." });
      return;
    }

    staffLogin.mutate(
      { data: { identifier: identifier.trim(), email: identifier.trim(), password } },
      {
        onSuccess: (data) => {
          if (data.user.role !== "PRINCIPAL" && data.user.role !== "SUPER_ADMIN") {
            toast({
              variant: "destructive",
              title: "Access Denied",
              description: "Access Denied — Principal authorization required. You do not have Principal privileges.",
            });
            return;
          }

          loginStaff(data.token, data.user);
          toast({
            title: "Principal Login Successful",
            description: `Welcome, ${data.user.name}! (Principal Office)`,
          });
          setLocation("/principal/dashboard");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Principal Authentication Failed",
            description: err?.message || "Invalid Principal credentials.",
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
          toast({ title: "Reset Verification Sent", description: data.message });
          setForgotOpen(false);
          setResetEmail("");
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Error", description: err?.message || "Failed to process request." });
        },
      }
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
      <Card className="max-w-md w-full border-border/80 shadow-xl">
        <CardHeader className="text-center space-y-2 pb-6 border-b bg-card rounded-t-xl">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center mx-auto mb-1 border border-purple-200">
            <Award className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold font-display text-foreground">Principal Institutional Portal</CardTitle>
          <CardDescription className="text-xs">
            DVR &amp; DR HS MIC College of Technology — Executive Institutional Authentication
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-4">
          {/* Demo Principal Credentials Helper */}
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" />
                Principal Demo Credentials
              </span>
              <span className="font-mono font-semibold text-purple-800 bg-purple-200/60 px-2 py-0.5 rounded border border-purple-300 text-[11px]">
                Password: demo (or 123456)
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>Username: <strong className="text-foreground font-mono">principal</strong></span>
              <button
                type="button"
                onClick={() => {
                  setIdentifier("principal");
                  setPassword("demo");
                  toast({
                    title: "Demo Credentials Populated",
                    description: "Username: principal, Password: demo",
                  });
                }}
                className="text-purple-700 hover:text-purple-900 font-semibold underline text-[11px]"
              >
                Auto-Fill Demo Credentials
              </button>
            </div>
          </div>

          <form onSubmit={handlePrincipalLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Principal Username or Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="e.g. principal or principal@mictech.edu.in"
                  className="pl-9 text-xs h-9"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold">Principal Password</Label>
                <button
                  type="button"
                  onClick={() => setForgotOpen(true)}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-9 pr-9 text-xs h-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={staffLogin.isPending} className="w-full bg-purple-700 hover:bg-purple-800 font-semibold text-xs h-9 mt-2">
              {staffLogin.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
              Sign In to Principal Portal
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Principal Password</DialogTitle>
            <DialogDescription className="text-xs">
              Enter your registered Principal email address to receive password reset verification instructions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleForgotPassword} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Principal Email</Label>
              <Input
                type="email"
                placeholder="principal@mictech.edu.in"
                className="text-xs h-9"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setForgotOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={forgotPass.isPending}>
                {forgotPass.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Send Reset Verification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
