import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  useListHods,
  useCreateHod,
  useUpdateHod,
  useResetHodPassword,
  type StaffUser,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldAlert,
  UserPlus,
  Edit,
  KeyRound,
  CheckCircle,
  XCircle,
  Loader2,
  Building,
  ShieldCheck,
  Search,
  UserCheck,
} from "lucide-react";

const DEPARTMENTS = [
  { value: "CSE", label: "Computer Science & Engineering (CSE)" },
  { value: "IT", label: "Information Technology (IT)" },
  { value: "ECE", label: "Electronics & Communication Engineering (ECE)" },
  { value: "EEE", label: "Electrical & Electronics Engineering (EEE)" },
  { value: "MECHANICAL", label: "Mechanical Engineering (MECH)" },
  { value: "CIVIL", label: "Civil Engineering (CIVIL)" },
  { value: "AIML", label: "Artificial Intelligence & ML (AIML)" },
  { value: "AIDS", label: "AI & Data Science (AIDS)" },
];

export default function SuperAdminHods() {
  const [, setLocation] = useLocation();
  const { staffToken, staffUser } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");

  // Create Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createDepartment, setCreateDepartment] = useState("CSE");
  const [createPassword, setCreatePassword] = useState("");

  // Edit Modal
  const [editUser, setEditUser] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editDepartment, setEditDepartment] = useState("");

  // Reset Password Modal
  const [resetUser, setResetUser] = useState<StaffUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: hods, isLoading, refetch } = useListHods(staffToken || undefined);
  const createHod = useCreateHod();
  const updateHod = useUpdateHod();
  const resetPassword = useResetHodPassword();

  // Role Guard: Only SUPER_ADMIN (or ADMIN)
  if (!staffToken || (staffUser?.role !== "SUPER_ADMIN" && staffUser?.role !== "ADMIN")) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-muted/20 min-h-[calc(100vh-140px)]">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4 border border-destructive/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">403 Forbidden</h2>
        <p className="text-destructive font-medium mb-6 max-w-md text-sm">
          Access denied. Super Admin authorization required.
        </p>
        <Button onClick={() => setLocation("/admin/login")} className="text-xs">
          Go to Admin Login
        </Button>
      </div>
    );
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createUsername || !createEmail || !createPassword) return;

    if (createPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    createHod.mutate(
      {
        token: staffToken,
        data: {
          name: createName.trim(),
          username: createUsername.trim().toLowerCase(),
          email: createEmail.trim().toLowerCase(),
          department: createDepartment,
          password: createPassword,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "HOD Created", description: `Account for ${createName} created successfully.` });
          setCreateOpen(false);
          setCreateName("");
          setCreateUsername("");
          setCreateEmail("");
          setCreatePassword("");
          refetch();
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Creation Failed",
            description: err?.message || err?.data?.error || "Failed to create HOD account.",
          });
        },
      }
    );
  };

  const handleOpenEdit = (hod: StaffUser) => {
    setEditUser(hod);
    setEditName(hod.name);
    setEditEmail(hod.email);
    setEditDepartment(hod.department || "CSE");
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    updateHod.mutate(
      {
        token: staffToken,
        id: editUser.id,
        data: {
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          department: editDepartment,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "HOD Updated", description: "HOD account updated successfully." });
          setEditUser(null);
          refetch();
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Update Failed",
            description: err?.message || err?.data?.error || "Failed to update HOD.",
          });
        },
      }
    );
  };

  const handleToggleStatus = (hod: StaffUser) => {
    const nextStatus = !hod.isActive;
    updateHod.mutate(
      {
        token: staffToken,
        id: hod.id,
        data: { isActive: nextStatus },
      },
      {
        onSuccess: () => {
          toast({
            title: nextStatus ? "Account Enabled" : "Account Disabled",
            description: `${hod.name} is now ${nextStatus ? "active" : "inactive"}.`,
          });
          refetch();
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Action Failed",
            description: err?.message || err?.data?.error || "Failed to change status.",
          });
        },
      }
    );
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || !newPassword) return;

    if (newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Password must be at least 8 characters long.",
      });
      return;
    }

    resetPassword.mutate(
      {
        token: staffToken,
        id: resetUser.id,
        newPassword,
      },
      {
        onSuccess: () => {
          toast({
            title: "Password Reset",
            description: `Password for ${resetUser.name} has been updated.`,
          });
          setResetUser(null);
          setNewPassword("");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Reset Failed",
            description: err?.message || err?.data?.error || "Failed to reset password.",
          });
        },
      }
    );
  };

  const filteredHods = (hods || []).filter((h) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      h.name.toLowerCase().includes(s) ||
      (h.username && h.username.toLowerCase().includes(s)) ||
      h.email.toLowerCase().includes(s) ||
      (h.department && h.department.toLowerCase().includes(s))
    );
  });

  return (
    <div className="flex-1 bg-muted/20 pb-12">
      {/* Top Banner */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">
                  HOD Account Management
                </h1>
                <Badge className="bg-purple-700 text-white text-[10px] font-bold">
                  SUPER ADMIN
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create, configure, enable/disable, and reset credentials for Department Heads
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="bg-primary hover:bg-primary/90 text-white text-xs h-9 shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1.5" /> Add New HOD
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card className="shadow-md">
          <CardHeader className="p-4 md:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" /> Active Department Heads
              </CardTitle>
              <CardDescription className="text-xs">
                All registered HOD credentials and department assignments
              </CardDescription>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search HOD by name, email, dept..."
                className="pl-8 text-xs h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                Loading HOD accounts...
              </div>
            ) : filteredHods.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No HOD accounts match your search.
              </div>
            ) : (
              <div className="overflow-x-auto">
                {/* Table (Requirement 16: Name, Username, Email, Department, Role, Status, Last Login, Actions) */}
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                    <tr>
                      <th className="p-3">Name</th>
                      <th className="p-3">Username</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Last Login</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredHods.map((hod) => (
                      <tr key={hod.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-semibold text-foreground">{hod.name}</td>
                        <td className="p-3 font-mono font-medium text-foreground">
                          {hod.username || "—"}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">
                          {hod.email}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
                            {hod.department || "Unassigned"}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{hod.role}</td>
                        <td className="p-3">
                          {hod.isActive ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-medium text-[10px]">
                              <CheckCircle className="w-3 h-3 mr-1" /> Active
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-medium text-[10px]">
                              <XCircle className="w-3 h-3 mr-1" /> Disabled
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {hod.lastLoginAt ? new Date(hod.lastLoginAt).toLocaleString() : "Never"}
                        </td>
                        <td className="p-3 text-right">
                          {/* Actions: Edit, Disable, Enable, Reset Password */}
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenEdit(hod)}
                              className="text-xs h-7 px-2"
                              title="Edit HOD"
                            >
                              <Edit className="w-3 h-3 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant={hod.isActive ? "outline" : "default"}
                              onClick={() => handleToggleStatus(hod)}
                              className={`text-xs h-7 px-2 ${
                                hod.isActive
                                  ? "text-destructive hover:bg-destructive/10"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
                              }`}
                              title={hod.isActive ? "Disable HOD" : "Enable HOD"}
                            >
                              {hod.isActive ? "Disable" : "Enable"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setResetUser(hod);
                                setNewPassword("");
                              }}
                              className="text-xs h-7 px-2 text-amber-700 hover:bg-amber-50"
                              title="Reset Password"
                            >
                              <KeyRound className="w-3 h-3 mr-1" /> Reset Pass
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add New HOD Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> Create New HOD Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign an official department, username, and secure initial password
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Full Name *</Label>
              <Input
                placeholder="e.g. Dr. K. Rama Krishna"
                className="text-xs h-9"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Username *</Label>
                <Input
                  placeholder="e.g. hod_cse"
                  className="text-xs h-9"
                  value={createUsername}
                  onChange={(e) => setCreateUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Department *</Label>
                <Select value={createDepartment} onValueChange={setCreateDepartment}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d.value} value={d.value} className="text-xs">
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Official Email Address *</Label>
              <Input
                type="email"
                placeholder="hod.dept@mictech.edu.in"
                className="text-xs h-9"
                value={createEmail}
                onChange={(e) => setCreateEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Initial Password * (min 8 chars)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="text-xs h-9"
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createHod.isPending}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-white text-xs"
              >
                {createHod.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit HOD Modal */}
      {editUser && (
        <Dialog open={Boolean(editUser)} onOpenChange={() => setEditUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit className="w-4 h-4 text-primary" /> Edit HOD Details
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update account details for {editUser.username}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Full Name *</Label>
                <Input
                  className="text-xs h-9"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Official Email Address *</Label>
                <Input
                  type="email"
                  className="text-xs h-9"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assigned Department *</Label>
                <Select value={editDepartment} onValueChange={setEditDepartment}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => (
                      <SelectItem key={d.value} value={d.value} className="text-xs">
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditUser(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateHod.isPending}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white text-xs"
                >
                  {updateHod.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Reset Password Modal (Requirement 16) */}
      {resetUser && (
        <Dialog open={Boolean(resetUser)} onOpenChange={() => setResetUser(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-600" /> Reset HOD Password
              </DialogTitle>
              <DialogDescription className="text-xs">
                Set a new password for <strong className="text-foreground">{resetUser.name}</strong> ({resetUser.username}).
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleResetPassword} className="space-y-3 pt-1">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">New Password (min 8 chars) *</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="text-xs h-9"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResetUser(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={resetPassword.isPending}
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
                >
                  {resetPassword.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Confirm Reset
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
