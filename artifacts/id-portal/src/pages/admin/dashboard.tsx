import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useGetAdminStats,
  useListRequests,
  useVerifyQr,
  useCollectCard,
  useListHods,
  useCreateHod,
  useUpdateHod,
  useResetHodPassword,
  useBulkResetHodPassword,
  getListRequestsQueryKey,
  type ReissueRequest,
  type StaffUser,
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Eye,
  Search,
  CheckCircle2,
  RefreshCw,
  QrCode,
  PackageCheck,
  ShieldCheck,
  Loader2,
  LogOut,
  Users,
  UserPlus,
  KeyRound,
  Ban,
  Check,
  Lock,
} from "lucide-react";

export default function AdminDashboard() {
  const [location, setLocation] = useLocation();
  const { staffToken, staffUser, logoutStaff } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // QR Scanner Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrInput, setQrInput] = useState("");

  // Super Admin HOD Management Modal State
  const [hodModalOpen, setHodModalOpen] = useState(false);
  const [createHodOpen, setCreateHodOpen] = useState(false);
  const [resetPassOpen, setResetPassOpen] = useState<StaffUser | null>(null);
  const [bulkResetOpen, setBulkResetOpen] = useState(false);

  // Form states
  const [newHodName, setNewHodName] = useState("");
  const [newHodUsername, setNewHodUsername] = useState("");
  const [newHodEmail, setNewHodEmail] = useState("");
  const [newHodPassword, setNewHodPassword] = useState("");
  const [newHodDept, setNewHodDept] = useState("Computer Science");
  const [newHodResetPass, setNewHodResetPass] = useState("");
  const [bulkHodPass, setBulkHodPass] = useState("");

  const verifyQr = useVerifyQr();
  const collectCard = useCollectCard();
  const { data: hodsList, refetch: refetchHods } = useListHods(staffToken || undefined);
  const createHod = useCreateHod();
  const updateHod = useUpdateHod();
  const resetHodPass = useResetHodPassword();
  const bulkResetHodPass = useBulkResetHodPassword();

  // Route Guard
  if (!staffToken || (staffUser?.role !== "ADMIN" && staffUser?.role !== "SUPER_ADMIN" && staffUser?.role !== "ID_CARD_STAFF")) {
    setLocation("/admin/login");
    return null;
  }

  const isSuper = staffUser?.role === "SUPER_ADMIN";
  const { data: stats } = useGetAdminStats(staffToken);

  const listParams = {
    token: staffToken,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(searchQuery ? { search: searchQuery } : {}),
  };

  const { data: requests, isLoading: requestsLoading } = useListRequests(listParams);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    queryClient.invalidateQueries({ queryKey: getListRequestsQueryKey(listParams) });
    if (isSuper) refetchHods();
  };

  const handleVerifyQrCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;

    verifyQr.mutate(
      { requestNumber: qrInput.trim(), token: staffToken },
      {
        onSuccess: (data) => {
          if (data.verified) {
            toast({
              title: "QR Verification Successful",
              description: data.message || "Ready for physical handover.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Verification Failed",
              description: data.message || "Application not ready for collection.",
            });
          }
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Verification Error",
            description: err?.message || "Application not found.",
          });
        },
      }
    );
  };

  const handleConfirmHandover = (requestId: number) => {
    collectCard.mutate(
      { id: requestId, token: staffToken, data: { staffId: staffUser.name, remarks: "Handed over via QR Verification" } },
      {
        onSuccess: () => {
          toast({
            title: "Collection Recorded",
            description: "Physical ID card handover recorded successfully.",
          });
          verifyQr.reset();
          setQrModalOpen(false);
          setQrInput("");
          handleRefresh();
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Handover Error",
            description: err?.message || "Failed to record handover.",
          });
        },
      }
    );
  };

  const handleCreateHodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffToken) return;

    createHod.mutate(
      {
        token: staffToken,
        data: {
          name: newHodName,
          username: newHodUsername,
          email: newHodEmail,
          password: newHodPassword,
          department: newHodDept,
        },
      },
      {
        onSuccess: (data) => {
          toast({ title: "HOD Account Created", description: `Account for ${data.name} (${data.department}) created.` });
          setCreateHodOpen(false);
          setNewHodName("");
          setNewHodUsername("");
          setNewHodEmail("");
          setNewHodPassword("");
          refetchHods();
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Creation Failed", description: err?.message || "Could not create HOD account." });
        },
      }
    );
  };

  const handleToggleHodActive = (hod: StaffUser) => {
    if (!staffToken) return;
    updateHod.mutate(
      { token: staffToken, id: hod.id, data: { isActive: !hod.isActive } },
      {
        onSuccess: () => {
          toast({ title: "Status Updated", description: `HOD account ${hod.username} set to ${!hod.isActive ? "Active" : "Disabled"}.` });
          refetchHods();
        },
      }
    );
  };

  const handleResetHodPassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffToken || !resetPassOpen || !newHodResetPass) return;

    resetHodPass.mutate(
      { token: staffToken, id: resetPassOpen.id, newPassword: newHodResetPass },
      {
        onSuccess: (data) => {
          toast({ title: "Password Reset Successful", description: data.message });
          setResetPassOpen(null);
          setNewHodResetPass("");
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Reset Failed", description: err?.message || "Could not reset password." });
        },
      }
    );
  };

  const handleBulkResetHodPassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffToken || !bulkHodPass) return;

    bulkResetHodPass.mutate(
      { token: staffToken, newPassword: bulkHodPass },
      {
        onSuccess: (data) => {
          toast({ title: "All HOD Passwords Updated", description: data.message });
          setBulkResetOpen(false);
          setBulkHodPass("");
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Bulk Reset Failed", description: err?.message || "Could not update passwords for all HODs." });
        },
      }
    );
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-muted/10">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 bg-card rounded-xl border shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-primary" />
              <h1 className="text-2xl font-bold font-display">ID Card Department Dashboard</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Logged in as: <span className="font-semibold text-foreground">{staffUser.name}</span> ({staffUser.role})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isSuper && (
              <Button onClick={() => setHodModalOpen(true)} variant="outline" className="text-xs font-semibold">
                <Users className="w-4 h-4 mr-1.5 text-primary" />
                Manage HOD Accounts
              </Button>
            )}
            <Button onClick={() => setQrModalOpen(true)} className="bg-blue-700 hover:bg-blue-800 text-xs font-semibold">
              <QrCode className="w-4 h-4 mr-2" />
              QR Code Handover Scanner
            </Button>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { logoutStaff(); setLocation("/admin/login"); }} className="text-xs text-destructive">
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <Card className="p-3 bg-white">
            <span className="text-[11px] text-muted-foreground font-semibold block">Total</span>
            <div className="text-xl font-bold mt-0.5">{stats?.total || 0}</div>
          </Card>
          <Card className="p-3 bg-amber-50/60 border-amber-200">
            <span className="text-[11px] text-amber-800 font-semibold block">Pending HOD</span>
            <div className="text-xl font-bold text-amber-950 mt-0.5">{stats?.pendingHod || 0}</div>
          </Card>
          <Card className="p-3 bg-amber-50/60 border-amber-200">
            <span className="text-[11px] text-amber-800 font-semibold block">Pending Principal</span>
            <div className="text-xl font-bold text-amber-950 mt-0.5">{stats?.pendingPrincipal || 0}</div>
          </Card>
          <Card className="p-3 bg-blue-50/60 border-blue-200">
            <span className="text-[11px] text-blue-800 font-semibold block">Pending Admin</span>
            <div className="text-xl font-bold text-blue-950 mt-0.5">{stats?.pendingAdmin || 0}</div>
          </Card>
          <Card className="p-3 bg-orange-50/60 border-orange-200">
            <span className="text-[11px] text-orange-800 font-semibold block">Awaiting Pay</span>
            <div className="text-xl font-bold text-orange-950 mt-0.5">{stats?.paymentPending || 0}</div>
          </Card>
          <Card className="p-3 bg-purple-50/60 border-purple-200">
            <span className="text-[11px] text-purple-800 font-semibold block">Printing</span>
            <div className="text-xl font-bold text-purple-950 mt-0.5">{stats?.printing || 0}</div>
          </Card>
          <Card className="p-3 bg-emerald-50/60 border-emerald-200">
            <span className="text-[11px] text-emerald-800 font-semibold block">Ready Collect</span>
            <div className="text-xl font-bold text-emerald-950 mt-0.5">{stats?.readyToCollect || 0}</div>
          </Card>
          <Card className="p-3 bg-teal-50/60 border-teal-200">
            <span className="text-[11px] text-teal-800 font-semibold block">Collected</span>
            <div className="text-xl font-bold text-teal-950 mt-0.5">{stats?.collected || 0}</div>
          </Card>
        </div>

        {/* Requests Filter & Table */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="px-6 py-4 border-b bg-muted/20">
            <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
              <div>
                <CardTitle className="text-lg">ID Reissue Applications Queue</CardTitle>
                <CardDescription className="text-xs">Search and filter active requests across approval stages</CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search name, reg no, ID..."
                    className="pl-9 w-full sm:w-[220px] text-xs h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[200px] text-xs h-9">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                    <SelectItem value="PENDING_HOD_APPROVAL" className="text-xs">Pending HOD</SelectItem>
                    <SelectItem value="PENDING_PRINCIPAL_APPROVAL" className="text-xs">Pending Principal</SelectItem>
                    <SelectItem value="PENDING_ADMIN_VERIFICATION" className="text-xs">Pending Admin</SelectItem>
                    <SelectItem value="PAYMENT_PENDING" className="text-xs">Payment Pending</SelectItem>
                    <SelectItem value="PAYMENT_SUCCESS" className="text-xs">Payment Success</SelectItem>
                    <SelectItem value="ID_CARD_PRINTING" className="text-xs">ID Card Printing</SelectItem>
                    <SelectItem value="READY_TO_COLLECT" className="text-xs">Ready to Collect</SelectItem>
                    <SelectItem value="COLLECTED" className="text-xs">Collected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 text-xs">
                    <TableHead className="w-[140px]">App ID</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Register No.</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {requestsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                        Loading applications...
                      </TableCell>
                    </TableRow>
                  ) : requests && requests.length > 0 ? (
                    requests.map((req: ReissueRequest) => (
                      <TableRow key={req.id} className="group hover:bg-muted/20 transition-colors">
                        <TableCell className="font-mono text-xs font-bold text-primary">{req.requestNumber}</TableCell>
                        <TableCell className="font-medium">{req.studentName}</TableCell>
                        <TableCell className="font-mono">{req.registerNumber}</TableCell>
                        <TableCell>{req.branch}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(req.createdAt).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {req.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/requests/${req.id}`}>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              <Eye className="w-3.5 h-3.5 mr-1" /> Inspect
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No requests matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QR Code Handover Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              QR Code Receipt Verification &amp; Handover
            </DialogTitle>
            <DialogDescription className="text-xs">
              Scan or enter the Application ID from the student's receipt to verify and record collection.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifyQrCode} className="space-y-4 py-2">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. IDR-2026-000145"
                className="font-mono text-xs h-9 uppercase"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
              />
              <Button type="submit" size="sm" disabled={verifyQr.isPending || !qrInput.trim()} className="text-xs shrink-0">
                {verifyQr.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify QR"}
              </Button>
            </div>

            {/* Verification Result Display */}
            {verifyQr.data && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-3 ${
                  verifyQr.data.verified ? "bg-emerald-50 border-emerald-200 text-emerald-950" : "bg-red-50 border-red-200 text-red-950"
                }`}
              >
                <div className="font-bold text-sm flex items-center justify-between">
                  <span>{verifyQr.data.message}</span>
                  {verifyQr.data.verified && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                </div>

                {verifyQr.data.request && (
                  <div className="space-y-1.5 pt-1 border-t border-emerald-200/80">
                    <div className="flex justify-between">
                      <span className="opacity-70">Student Name:</span>
                      <span className="font-bold">{verifyQr.data.request.studentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Register Number:</span>
                      <span className="font-mono font-bold">{verifyQr.data.request.registerNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Department:</span>
                      <span>{verifyQr.data.request.branch}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="opacity-70">Payment Status:</span>
                      <span className="font-bold text-emerald-700">{verifyQr.data.request.paymentId ? `Paid (${verifyQr.data.request.paymentId})` : "Verified"}</span>
                    </div>
                  </div>
                )}

                {verifyQr.data.verified && verifyQr.data.request && verifyQr.data.request.status !== "COLLECTED" && (
                  <Button
                    type="button"
                    onClick={() => handleConfirmHandover(verifyQr.data.request!.id)}
                    disabled={collectCard.isPending}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold text-xs mt-2"
                  >
                    {collectCard.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PackageCheck className="w-4 h-4 mr-2" />}
                    Confirm Physical ID Card Handover
                  </Button>
                )}
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>

      {/* Super Admin HOD Management Modal */}
      {isSuper && (
        <Dialog open={hodModalOpen} onOpenChange={setHodModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-primary" />
                  Multiple HOD Accounts Management
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Create, edit, disable/enable, and reset passwords for department HOD accounts.
                </DialogDescription>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setBulkResetOpen(true)} className="text-xs shrink-0">
                  <Lock className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
                  Set Password for ALL HODs
                </Button>
                <Button size="sm" onClick={() => setCreateHodOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-xs shrink-0">
                  <UserPlus className="w-4 h-4 mr-1.5" />
                  Add New HOD
                </Button>
              </div>
            </DialogHeader>

            <div className="py-2 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 text-xs">
                    <TableHead>HOD Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {hodsList?.map((hod) => (
                    <TableRow key={hod.id}>
                      <TableCell className="font-semibold">{hod.name}</TableCell>
                      <TableCell className="font-mono text-primary font-bold">{hod.username || "-"}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{hod.email}</TableCell>
                      <TableCell><Badge variant="outline">{hod.department}</Badge></TableCell>
                      <TableCell>
                        <Badge variant="outline" className={hod.isActive ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}>
                          {hod.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleHodActive(hod)}
                          className={`h-7 text-xs ${hod.isActive ? "text-amber-700" : "text-emerald-700"}`}
                        >
                          {hod.isActive ? <Ban className="w-3.5 h-3.5 mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                          {hod.isActive ? "Disable" : "Enable"}
                        </Button>

                        <Button size="sm" variant="outline" onClick={() => setResetPassOpen(hod)} className="h-7 text-xs">
                          <KeyRound className="w-3.5 h-3.5 mr-1 text-primary" />
                          Reset Pass
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Reset Passwords Sub-Modal */}
      <Dialog open={bulkResetOpen} onOpenChange={setBulkResetOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              Set Uniform Password for ALL HODs
            </DialogTitle>
            <DialogDescription className="text-xs">
              This action will update and set the new password for all department HOD accounts simultaneously.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBulkResetHodPassSubmit} className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">New Password for All HOD Accounts</Label>
              <Input
                type="password"
                placeholder="e.g. HodPassword2026!"
                className="h-9 text-xs"
                value={bulkHodPass}
                onChange={(e) => setBulkHodPass(e.target.value)}
                required
              />
              <p className="text-[11px] text-muted-foreground">Minimum 8 characters. Uppercase, lowercase, number recommended.</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setBulkResetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={bulkResetHodPass.isPending} className="bg-amber-600 hover:bg-amber-700 font-semibold">
                {bulkResetHodPass.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Lock className="w-4 h-4 mr-1.5" />}
                Update Password for All HODs
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create HOD Account Sub-Modal */}
      <Dialog open={createHodOpen} onOpenChange={setCreateHodOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New HOD Account</DialogTitle>
            <DialogDescription className="text-xs">Assign a new Head of Department credential.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateHodSubmit} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label>HOD Full Name</Label>
              <Input placeholder="Dr. Jane Doe" className="h-9 text-xs" value={newHodName} onChange={(e) => setNewHodName(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label>Username</Label>
              <Input placeholder="hod_cse" className="h-9 text-xs font-mono" value={newHodUsername} onChange={(e) => setNewHodUsername(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label>Official Email</Label>
              <Input type="email" placeholder="hod.cs@mictech.edu.in" className="h-9 text-xs font-mono" value={newHodEmail} onChange={(e) => setNewHodEmail(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label>Department</Label>
              <Select value={newHodDept} onValueChange={setNewHodDept}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Information Technology">Information Technology</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Mechanical">Mechanical</SelectItem>
                  <SelectItem value="Civil">Civil</SelectItem>
                  <SelectItem value="AIML">AIML</SelectItem>
                  <SelectItem value="AIDS">AIDS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Initial Password (Min 8 chars)</Label>
              <Input type="password" placeholder="••••••••" className="h-9 text-xs" value={newHodPassword} onChange={(e) => setNewHodPassword(e.target.value)} required />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setCreateHodOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={createHod.isPending}>
                {createHod.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Create HOD
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Individual HOD Password Sub-Modal */}
      {resetPassOpen && (
        <Dialog open={Boolean(resetPassOpen)} onOpenChange={(open) => !open && setResetPassOpen(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Reset Password for {resetPassOpen.name}</DialogTitle>
              <DialogDescription className="text-xs">Username: <span className="font-mono font-bold">{resetPassOpen.username}</span> | Department: {resetPassOpen.department}</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleResetHodPassSubmit} className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <Label>New Password</Label>
                <Input type="password" placeholder="••••••••" className="h-9 text-xs" value={newHodResetPass} onChange={(e) => setNewHodResetPass(e.target.value)} required />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" size="sm" onClick={() => setResetPassOpen(null)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={resetHodPass.isPending}>
                  {resetHodPass.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                  Reset Password
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
