import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useListRequests, usePrincipalAction, useChangePassword, type ReissueRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Search, Filter, Eye, Award, Clock, Loader2, KeyRound, LogOut } from "lucide-react";

export default function PrincipalDashboard() {
  const [, setLocation] = useLocation();
  const { staffToken, staffUser, logoutStaff } = useAuth();
  const { toast } = useToast();

  const [selectedBranch, setSelectedBranch] = useState<string>("All Departments");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ReissueRequest | null>(null);
  const [actionRemark, setActionRemark] = useState("");

  // Change password modal
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const changePass = useChangePassword();
  const principalAction = usePrincipalAction();

  // Route Guard (Requirement 13: Access denied. Principal authorization required.)
  if (!staffToken || (staffUser?.role !== "PRINCIPAL" && staffUser?.role !== "SUPER_ADMIN")) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-muted/20 min-h-[calc(100vh-140px)]">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4 border border-destructive/20">
          <Award className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">403 Forbidden</h2>
        <p className="text-destructive font-medium mb-6 max-w-md text-sm">
          Access denied. Principal authorization required.
        </p>
        <Button onClick={() => setLocation("/principal/login")} className="bg-purple-700 hover:bg-purple-800 font-semibold text-xs text-white">
          Go to Principal Login
        </Button>
      </div>
    );
  }

  const { data: requests, isLoading, refetch } = useListRequests({
    token: staffToken,
    branch: selectedBranch === "All Departments" ? undefined : selectedBranch,
    search: searchQuery || undefined,
  });

  const pendingCount = requests?.filter((r: ReissueRequest) => r.status === "PENDING_PRINCIPAL_APPROVAL").length || 0;
  const approvedCount = requests?.filter((r: ReissueRequest) => r.status !== "PENDING_PRINCIPAL_APPROVAL" && r.status !== "PENDING_HOD_APPROVAL" && !r.status.includes("REJECTED")).length || 0;
  const rejectedCount = requests?.filter((r: ReissueRequest) => r.status === "PRINCIPAL_REJECTED").length || 0;

  const handleAction = (action: "APPROVE" | "REJECT") => {
    if (!selectedRequest) return;
    if (action === "REJECT" && !actionRemark.trim()) {
      toast({
        variant: "destructive",
        title: "Remark Required",
        description: "Please provide a rejection reason for the student.",
      });
      return;
    }

    principalAction.mutate(
      {
        id: selectedRequest.id,
        token: staffToken,
        data: {
          action,
          remark: actionRemark.trim() || undefined,
          principalName: staffUser.name,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: `Application ${action === "APPROVE" ? "Approved" : "Rejected"}`,
            description: `Request ${selectedRequest.requestNumber} updated successfully.`,
          });
          setSelectedRequest(null);
          setActionRemark("");
          refetch();
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Action Failed",
            description: err?.message || "Failed to update application.",
          });
        },
      }
    );
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) return;

    changePass.mutate(
      { token: staffToken, currentPassword: currentPass, newPassword: newPass },
      {
        onSuccess: (data) => {
          toast({ title: "Password Changed", description: data.message });
          setChangePassOpen(false);
          setCurrentPass("");
          setNewPass("");
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Change Password Error", description: err?.message || "Could not update password." });
        },
      }
    );
  };

  return (
    <div className="flex-1 bg-muted/20 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-card rounded-xl border shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-600" />
              <h1 className="text-2xl font-bold font-display">Principal Institutional Approval Portal</h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              DVR &amp; DR HS MIC College of Technology | Logged in as: <span className="font-semibold text-foreground">{staffUser.name}</span> (Principal Office)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-44 h-9 text-xs">
                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Departments">All Departments</SelectItem>
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

            <Button variant="outline" size="sm" onClick={() => setChangePassOpen(true)} className="text-xs">
              <KeyRound className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
              Change Password
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { logoutStaff(); setLocation("/principal/login"); }} className="text-xs text-destructive">
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-amber-50/50 border-amber-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Pending Principal Review</span>
                <div className="text-2xl font-bold text-amber-950 mt-1">{pendingCount}</div>
              </div>
              <Clock className="w-8 h-8 text-amber-600 opacity-80" />
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/50 border-emerald-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Principal Approved</span>
                <div className="text-2xl font-bold text-emerald-950 mt-1">{approvedCount}</div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600 opacity-80" />
            </CardContent>
          </Card>

          <Card className="bg-red-50/50 border-red-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-red-800 uppercase tracking-wider">Principal Rejected</span>
                <div className="text-2xl font-bold text-red-950 mt-1">{rejectedCount}</div>
              </div>
              <XCircle className="w-8 h-8 text-red-600 opacity-80" />
            </CardContent>
          </Card>
        </div>

        {/* Table Card */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">HOD-Approved Applications Queue</CardTitle>
              <CardDescription>Applications awaiting executive principal sign-off</CardDescription>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Name, Reg No, App ID..."
                className="pl-9 h-9 text-xs"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="py-12 flex justify-center text-muted-foreground text-xs">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Loading applications queue...
              </div>
            ) : !requests || requests.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No applications pending Principal approval.
              </div>
            ) : (
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 border-b font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-3">Application ID</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3">Reg Number</th>
                      <th className="p-3">Department</th>
                      <th className="p-3">HOD Remark</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {requests.map((req: ReissueRequest) => (
                      <tr key={req.id} className="hover:bg-muted/20">
                        <td className="p-3 font-mono font-bold text-primary">{req.requestNumber}</td>
                        <td className="p-3 font-medium">{req.studentName}</td>
                        <td className="p-3 font-mono">{req.registerNumber}</td>
                        <td className="p-3">{req.branch}</td>
                        <td className="p-3 italic text-muted-foreground">{req.hodNote || "Approved"}</td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={
                              req.status === "PENDING_PRINCIPAL_APPROVAL"
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : req.status === "PRINCIPAL_REJECTED"
                                ? "bg-red-50 text-red-800 border-red-300"
                                : "bg-emerald-50 text-emerald-800 border-emerald-300"
                            }
                          >
                            {req.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="outline" onClick={() => setSelectedRequest(req)} className="h-7 text-xs">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Review
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
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-base">
                <span>Principal Review: {selectedRequest.requestNumber}</span>
                <Badge variant="outline">{selectedRequest.status.replace(/_/g, " ")}</Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">Executive institutional sign-off for Smart ID Card reissue</DialogDescription>
            </DialogHeader>

            <div className="space-y-2 text-xs py-2">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Student Name:</span>
                <span className="font-bold">{selectedRequest.studentName}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Register Number:</span>
                <span className="font-mono font-bold">{selectedRequest.registerNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Department &amp; Year:</span>
                <span>{selectedRequest.branch} ({selectedRequest.year} Year)</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Reason for Loss:</span>
                <span className="font-semibold text-foreground">{selectedRequest.reason}</span>
              </div>
              <div className="flex justify-between py-1 border-b bg-emerald-50/60 p-1.5 rounded border border-emerald-200">
                <span className="text-emerald-900 font-medium">HOD Remarks:</span>
                <span className="font-semibold text-emerald-950">{selectedRequest.hodNote || "Approved"}</span>
              </div>
            </div>

            {/* Remarks Input */}
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-semibold">Principal Approval Note / Remarks</Label>
              <Textarea
                placeholder="Enter executive approval note or rejection reason..."
                className="text-xs h-20"
                value={actionRemark}
                onChange={(e) => setActionRemark(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleAction("REJECT")}
                disabled={principalAction.isPending || (selectedRequest.status !== "PENDING_PRINCIPAL_APPROVAL" && selectedRequest.status !== "HOD_APPROVED")}
              >
                <XCircle className="w-4 h-4 mr-1.5" />
                Reject Application
              </Button>
              <Button
                size="sm"
                onClick={() => handleAction("APPROVE")}
                disabled={principalAction.isPending || (selectedRequest.status !== "PENDING_PRINCIPAL_APPROVAL" && selectedRequest.status !== "HOD_APPROVED")}
                className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
              >
                {principalAction.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                Approve &amp; Forward to Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Change Password Modal */}
      <Dialog open={changePassOpen} onOpenChange={setChangePassOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Principal Password</DialogTitle>
            <DialogDescription className="text-xs">Update your Principal account security password.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label>Current Password</Label>
              <Input type="password" className="h-9 text-xs" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label>New Password (Min 8 chars)</Label>
              <Input type="password" className="h-9 text-xs" value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setChangePassOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={changePass.isPending}>
                {changePass.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
