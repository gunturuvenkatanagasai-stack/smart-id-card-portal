import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  useGetHodApplications,
  useGetHodStats,
  useHodApproveApplication,
  useHodRejectApplication,
  useChangePassword,
  type ReissueRequest,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Search,
  Eye,
  Shield,
  Clock,
  Loader2,
  KeyRound,
  LogOut,
  User,
  LayoutDashboard,
  FileText,
  Bell,
  Building,
  Check,
  Ban,
  Lock,
} from "lucide-react";

export default function HodDashboard() {
  const [, setLocation] = useLocation();
  const { staffToken, staffUser, logoutStaff } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<
    "dashboard" | "applications" | "pending" | "approved" | "rejected" | "notifications" | "profile"
  >("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ReissueRequest | null>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approvalNote, setApprovalNote] = useState("");

  // Change password modal
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const changePass = useChangePassword();
  const approveApp = useHodApproveApplication();
  const rejectApp = useHodRejectApplication();

  // Route Guard (Requirement 13: Access denied. HOD authorization required.)
  if (!staffToken || (staffUser?.role !== "HOD" && staffUser?.role !== "SUPER_ADMIN")) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-muted/20 min-h-[calc(100vh-140px)]">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4 border border-destructive/20">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">403 Forbidden</h2>
        <p className="text-destructive font-medium mb-6 max-w-md text-sm">
          Access denied. HOD authorization required.
        </p>
        <Button
          onClick={() => setLocation("/hod/login")}
          className="bg-amber-600 hover:bg-amber-700 font-semibold text-xs text-white"
        >
          Go to HOD Login
        </Button>
      </div>
    );
  }

  // Determine status filter based on active tab
  let statusFilter: string | undefined;
  if (activeTab === "pending") statusFilter = "PENDING_HOD_APPROVAL";
  else if (activeTab === "approved") statusFilter = "APPROVED";
  else if (activeTab === "rejected") statusFilter = "HOD_REJECTED";

  const {
    data: applications,
    isLoading: appsLoading,
    refetch: refetchApps,
  } = useGetHodApplications({
    token: staffToken,
    status: statusFilter,
    search: searchQuery || undefined,
  });

  const { data: stats, refetch: refetchStats } = useGetHodStats(staffToken);

  const pendingCount = stats?.pending ?? 0;
  const approvedCount = stats?.approved ?? 0;
  const rejectedCount = stats?.rejected ?? 0;
  const totalCount = stats?.total ?? 0;

  const handleApprove = () => {
    if (!selectedRequest) return;

    approveApp.mutate(
      {
        id: selectedRequest.id,
        token: staffToken,
        remark: approvalNote.trim() || "Approved by HOD",
        hodName: staffUser.name,
      },
      {
        onSuccess: () => {
          toast({
            title: "Application Approved",
            description: `Application ${selectedRequest.requestNumber} approved and routed to Principal.`,
          });
          setSelectedRequest(null);
          setApprovalNote("");
          refetchApps();
          refetchStats();
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Approval Failed",
            description: err?.message || err?.data?.error || "Failed to approve application.",
          });
        },
      }
    );
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    if (!rejectionReason.trim()) {
      toast({
        variant: "destructive",
        title: "Rejection Reason Required",
        description: "Please specify why this application is being rejected.",
      });
      return;
    }

    rejectApp.mutate(
      {
        id: selectedRequest.id,
        token: staffToken,
        reason: rejectionReason.trim(),
        hodName: staffUser.name,
      },
      {
        onSuccess: () => {
          toast({
            title: "Application Rejected",
            description: `Application ${selectedRequest.requestNumber} rejected. Student notified.`,
          });
          setRejectionModalOpen(false);
          setSelectedRequest(null);
          setRejectionReason("");
          refetchApps();
          refetchStats();
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Rejection Failed",
            description: err?.message || err?.data?.error || "Failed to reject application.",
          });
        },
      }
    );
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) return;
    if (newPass.length < 8) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "New password must be at least 8 characters long.",
      });
      return;
    }

    changePass.mutate(
      {
        token: staffToken,
        currentPassword: currentPass,
        newPassword: newPass,
      },
      {
        onSuccess: () => {
          toast({ title: "Success", description: "Your password has been updated successfully." });
          setChangePassOpen(false);
          setCurrentPass("");
          setNewPass("");
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Failed to Change Password",
            description: err?.message || err?.data?.error || "Verification failed.",
          });
        },
      }
    );
  };

  return (
    <div className="flex-1 bg-muted/20 pb-12">
      {/* Top Banner (Requirement 5: HOD Name, Department, Role: HOD) */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center border border-amber-200">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">
                    {staffUser.name}
                  </h1>
                  <Badge className="bg-amber-600 text-white hover:bg-amber-700 text-[10px] uppercase font-bold">
                    Role: HOD
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <span className="font-semibold text-foreground">Department:</span>
                  <span>{staffUser.department || "All Departments"}</span>
                  <span className="text-slate-300">•</span>
                  <span>{staffUser.email}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangePassOpen(true)}
                className="text-xs h-8"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1 text-amber-600" /> Change Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={logoutStaff}
                className="text-xs h-8 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" /> Logout
              </Button>
            </div>
          </div>

          {/* Navigation Bar (Requirement 5) */}
          <div className="flex items-center gap-1 overflow-x-auto pt-4 border-t mt-4 text-xs">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("dashboard")}
              className={`text-xs h-8 ${activeTab === "dashboard" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> Dashboard
            </Button>
            <Button
              variant={activeTab === "applications" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("applications")}
              className={`text-xs h-8 ${activeTab === "applications" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
            >
              <FileText className="w-3.5 h-3.5 mr-1.5" /> Applications
            </Button>
            <Button
              variant={activeTab === "pending" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("pending")}
              className={`text-xs h-8 ${activeTab === "pending" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
            >
              <Clock className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Pending Approval ({pendingCount})
            </Button>
            <Button
              variant={activeTab === "approved" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("approved")}
              className={`text-xs h-8 ${activeTab === "approved" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
            >
              <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Approved ({approvedCount})
            </Button>
            <Button
              variant={activeTab === "rejected" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("rejected")}
              className={`text-xs h-8 ${activeTab === "rejected" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
            >
              <Ban className="w-3.5 h-3.5 mr-1.5 text-rose-600" /> Rejected ({rejectedCount})
            </Button>
            <Button
              variant={activeTab === "notifications" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("notifications")}
              className={`text-xs h-8 ${activeTab === "notifications" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
            >
              <Bell className="w-3.5 h-3.5 mr-1.5" /> Notifications
            </Button>
            <Button
              variant={activeTab === "profile" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("profile")}
              className={`text-xs h-8 ${activeTab === "profile" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
            >
              <User className="w-3.5 h-3.5 mr-1.5" /> Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Dashboard Cards (Requirement 5: Pending, Approved, Rejected, Total) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            onClick={() => setActiveTab("pending")}
            className="cursor-pointer border-amber-200/80 bg-amber-50/40 hover:bg-amber-50 transition-colors"
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold text-amber-900 flex items-center justify-between">
                <span>Pending Applications</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-display text-amber-900">{pendingCount}</div>
              <p className="text-[11px] text-amber-700 mt-0.5">Awaiting HOD verification</p>
            </CardContent>
          </Card>

          <Card
            onClick={() => setActiveTab("approved")}
            className="cursor-pointer border-emerald-200/80 bg-emerald-50/40 hover:bg-emerald-50 transition-colors"
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold text-emerald-900 flex items-center justify-between">
                <span>Approved Applications</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-display text-emerald-900">{approvedCount}</div>
              <p className="text-[11px] text-emerald-700 mt-0.5">Forwarded to Principal</p>
            </CardContent>
          </Card>

          <Card
            onClick={() => setActiveTab("rejected")}
            className="cursor-pointer border-rose-200/80 bg-rose-50/40 hover:bg-rose-50 transition-colors"
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold text-rose-900 flex items-center justify-between">
                <span>Rejected Applications</span>
                <XCircle className="w-4 h-4 text-rose-600" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-display text-rose-900">{rejectedCount}</div>
              <p className="text-[11px] text-rose-700 mt-0.5">Disapproved / returned</p>
            </CardContent>
          </Card>

          <Card
            onClick={() => setActiveTab("applications")}
            className="cursor-pointer border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            <CardHeader className="p-4 pb-2">
              <CardDescription className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>Total Applications</span>
                <FileText className="w-4 h-4 text-slate-600" />
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-display text-slate-900">{totalCount}</div>
              <p className="text-[11px] text-muted-foreground mt-0.5">In {staffUser.department} Dept</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile Tab View */}
        {activeTab === "profile" && (
          <Card className="max-w-xl mx-auto shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-amber-600" /> HOD Profile Details
              </CardTitle>
              <CardDescription className="text-xs">
                Official Department Head profile configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-lg">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-semibold text-foreground">{staffUser.name}</span>
                <span className="text-muted-foreground">Username:</span>
                <span className="font-mono font-medium">{staffUser.username || "—"}</span>
                <span className="text-muted-foreground">Official Email:</span>
                <span className="font-mono">{staffUser.email}</span>
                <span className="text-muted-foreground">Assigned Department:</span>
                <span className="font-semibold text-amber-700">{staffUser.department}</span>
                <span className="text-muted-foreground">Role:</span>
                <span className="font-semibold">{staffUser.role}</span>
                <span className="text-muted-foreground">Status:</span>
                <span className="text-emerald-600 font-semibold">Active Account</span>
              </div>
              <Button
                size="sm"
                onClick={() => setChangePassOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs w-full"
              >
                Change Official Password
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Notifications Tab View */}
        {activeTab === "notifications" && (
          <Card className="max-w-2xl mx-auto shadow-md">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" /> Department Notifications
              </CardTitle>
              <CardDescription className="text-xs">
                Recent status updates and system alerts for {staffUser.department} department
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs">
              <div className="p-4 bg-muted/30 rounded-lg text-center text-muted-foreground">
                All department alerts are synchronized with official student emails.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applications List Table (Dashboard, Applications, Pending, Approved, Rejected) */}
        {activeTab !== "profile" && activeTab !== "notifications" && (
          <Card className="shadow-md">
            <CardHeader className="p-4 md:p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-600" />
                  {activeTab === "pending"
                    ? "Pending Applications Requiring HOD Approval"
                    : activeTab === "approved"
                    ? "Approved Department Applications"
                    : activeTab === "rejected"
                    ? "Rejected Department Applications"
                    : "Department Applications Overview"}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Showing applications strictly isolated to <strong className="text-amber-800">{staffUser.department}</strong> department
                </CardDescription>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, roll no..."
                  className="pl-8 text-xs h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {appsLoading ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-600" />
                  Loading department applications...
                </div>
              ) : !applications || applications.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No applications found in {staffUser.department} department for the selected view.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        <th className="p-3">Application ID</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3">Roll Number</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Date Applied</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {applications.map((req) => (
                        <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-mono font-medium text-foreground">
                            {req.requestNumber}
                          </td>
                          <td className="p-3 font-medium text-foreground">{req.studentName}</td>
                          <td className="p-3 font-mono">{req.registerNumber}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-medium text-[11px]">
                              {req.branch}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            {req.status === "PENDING_HOD_APPROVAL" ? (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-medium text-[10px]">
                                <Clock className="w-3 h-3 mr-1" /> Pending HOD
                              </Badge>
                            ) : req.status === "HOD_REJECTED" ? (
                              <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-medium text-[10px]">
                                <XCircle className="w-3 h-3 mr-1" /> HOD Rejected
                              </Badge>
                            ) : (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-medium text-[10px]">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> {req.status.replace(/_/g, " ")}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequest(req)}
                              className="text-xs h-7 px-2.5"
                            >
                              <Eye className="w-3 h-3 mr-1" /> Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review & Action Dialog */}
      {selectedRequest && (
        <Dialog open={Boolean(selectedRequest)} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Review Application — {selectedRequest.requestNumber}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Department HOD verification &amp; routing approval
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs pt-1">
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/40 rounded-lg">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Student Name</span>
                  <span className="font-semibold text-foreground">{selectedRequest.studentName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Register / Roll No</span>
                  <span className="font-mono font-semibold">{selectedRequest.registerNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Department</span>
                  <span className="font-semibold text-amber-800">{selectedRequest.branch}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Year / Semester</span>
                  <span>Year {selectedRequest.year}, Sem {selectedRequest.semester}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Contact Mobile</span>
                  <span>{selectedRequest.mobileNumber}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">College Email</span>
                  <span className="font-mono text-[11px]">{selectedRequest.email}</span>
                </div>
              </div>

              <div className="p-3 border rounded-lg space-y-1.5 bg-background">
                <span className="text-muted-foreground font-semibold block text-[11px]">
                  Reason for Replacement:
                </span>
                <p className="text-foreground leading-relaxed">{selectedRequest.reason}</p>
                {selectedRequest.locationOfLoss && (
                  <p className="text-[11px] text-muted-foreground">
                    <strong>Location of Loss:</strong> {selectedRequest.locationOfLoss}
                  </p>
                )}
                {selectedRequest.dateOfLoss && (
                  <p className="text-[11px] text-muted-foreground">
                    <strong>Date of Loss:</strong> {selectedRequest.dateOfLoss}
                  </p>
                )}
              </div>

              {selectedRequest.status === "PENDING_HOD_APPROVAL" ? (
                <div className="space-y-2 pt-2">
                  <Label className="text-xs font-semibold">Approval Remarks (Optional):</Label>
                  <Input
                    placeholder="e.g. Verified student records and approved."
                    className="text-xs h-9"
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                  />
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      onClick={handleApprove}
                      disabled={approveApp.isPending}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9"
                    >
                      {approveApp.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Approve &amp; Forward to Principal
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setRejectionModalOpen(true)}
                      disabled={rejectApp.isPending}
                      className="text-xs h-9 px-4"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" /> Reject
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-muted/40 rounded-lg text-xs space-y-1">
                  <span className="text-muted-foreground block text-[10px]">Current Status:</span>
                  <span className="font-semibold text-foreground">{selectedRequest.status}</span>
                  {selectedRequest.hodNote && (
                    <p className="text-muted-foreground text-[11px] mt-1">
                      <strong>HOD Note:</strong> {selectedRequest.hodNote}
                    </p>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Mandatory Rejection Reason Dialog (Requirement 9) */}
      <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <XCircle className="w-4 h-4" /> Reject ID Card Application
            </DialogTitle>
            <DialogDescription className="text-xs">
              A rejection reason is required. This reason will be communicated directly to the student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Rejection Reason *</Label>
              <Textarea
                placeholder="e.g. Student information requires correction. Please verify roll number and semester details."
                className="text-xs min-h-[90px]"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectionModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleReject}
                disabled={rejectApp.isPending || !rejectionReason.trim()}
                className="text-xs"
              >
                {rejectApp.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                ) : null}
                Confirm Rejection
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={changePassOpen} onOpenChange={setChangePassOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" /> Change HOD Password
            </DialogTitle>
            <DialogDescription className="text-xs">
              Update your password. Must be at least 8 characters long.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-3 pt-1">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Current Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="text-xs h-9"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">New Password (min 8 chars)</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="text-xs h-9"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                required
                minLength={8}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setChangePassOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={changePass.isPending}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
              >
                {changePass.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
