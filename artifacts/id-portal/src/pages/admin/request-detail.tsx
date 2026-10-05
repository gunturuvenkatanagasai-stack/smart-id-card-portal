import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useGetRequest, getGetRequestQueryKey, useAdminAction, useGetAuditLogs } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, FileText, Loader2, Printer, ShieldCheck, CheckCircle2, History, PackageCheck } from "lucide-react";

export default function AdminRequestDetail() {
  const [, params] = useRoute("/admin/requests/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const { staffToken, staffUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [adminNote, setAdminNote] = useState("");

  if (!staffToken || (staffUser?.role !== "ADMIN" && staffUser?.role !== "SUPER_ADMIN" && staffUser?.role !== "ID_CARD_STAFF")) {
    setLocation("/admin/login");
    return null;
  }

  const { data: request, isLoading } = useGetRequest(id, { enabled: !!id });
  const { data: auditLogs } = useGetAuditLogs(id, { enabled: !!id });
  const adminAction = useAdminAction();

  const handleAction = (action: string) => {
    adminAction.mutate(
      { id, token: staffToken, data: { action, note: adminNote.trim() || undefined } },
      {
        onSuccess: (data) => {
          toast({ title: "Status Updated Successfully", description: `Application ${data.requestNumber} status set to ${data.status}.` });
          queryClient.setQueryData(getGetRequestQueryKey(id), data);
          setAdminNote("");
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Update Failed", description: err?.message || "Could not update status." });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Request Not Found</h2>
          <Link href="/admin"><Button variant="outline">Back to Admin Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-muted/10">
      <div className="container mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="mr-3 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            </Link>
            <h1 className="text-2xl font-display font-bold">Request Inspection: {request.requestNumber}</h1>
          </div>
          <Badge variant="outline" className="font-mono text-xs px-3 py-1 bg-background">
            {request.status.replace(/_/g, " ")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column — Application Details & Audit Trail */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center text-base gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Student Identity Record
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2 col-span-2">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Full Name:</span>
                    <span className="font-semibold text-foreground">{request.studentName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Register Number:</span>
                    <span className="font-mono font-bold text-foreground">{request.registerNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Branch &amp; Year:</span>
                    <span>{request.branch} ({request.year} Year)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-mono">{request.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Mobile:</span>
                    <span>{request.mobileNumber}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center text-base gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Approvals &amp; Application Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs">
                <div className="p-3 bg-muted/40 rounded-lg border space-y-1">
                  <div className="font-semibold text-foreground">HOD Approval Record</div>
                  <p className="text-muted-foreground">Status: {request.hodApprovedAt ? `Approved by ${request.hodApprovedBy || "HOD"}` : "Pending"}</p>
                  {request.hodNote && <p className="italic">"{request.hodNote}"</p>}
                </div>

                <div className="p-3 bg-muted/40 rounded-lg border space-y-1">
                  <div className="font-semibold text-foreground">Principal Approval Record</div>
                  <p className="text-muted-foreground">
                    Status: {request.principalApprovedAt ? `Approved by ${(!request.principalApprovedBy || request.principalApprovedBy === "Principal" || request.principalApprovedBy === "Principal Office" || request.principalApprovedBy.includes("Subba Rao")) ? "Dr. T. Vamsi Kiran" : request.principalApprovedBy.replace(/\s*\(Principal\)$/i, "")}` : "Pending"}
                  </p>
                  {request.principalNote && <p className="italic">"{request.principalNote}"</p>}
                </div>

                {request.paymentId && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg space-y-1 text-emerald-950">
                    <div className="font-bold">Payment Verified</div>
                    <p>Amount: ₹{request.paymentAmount || "200.00"} | TxID: {request.paymentId} ({request.paymentMethod})</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audit Logs */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center text-base gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Audit Trail History
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2 text-xs">
                {auditLogs?.map((log) => (
                  <div key={log.id} className="p-2.5 bg-muted/30 rounded border flex justify-between items-start">
                    <div>
                      <span className="font-semibold text-foreground">{log.action}</span>
                      <p className="text-[11px] text-muted-foreground">{log.user} ({log.role})</p>
                      {log.remarks && <p className="text-[11px] italic mt-0.5">"{log.remarks}"</p>}
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column — Pipeline Actions */}
          <div className="lg:col-span-1">
            <Card className="border-border/50 shadow-sm sticky top-24 border-t-4 border-t-primary space-y-4 p-5">
              <div>
                <h3 className="font-bold text-base">Pipeline Status Actions</h3>
                <p className="text-xs text-muted-foreground">Advance request through verification &amp; printing</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Admin Note / Remarks</Label>
                <Textarea
                  placeholder="Enter note or status remark..."
                  className="text-xs h-20"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={() => handleAction("VERIFY")}
                  disabled={adminAction.isPending || request.status !== "PENDING_ADMIN_VERIFICATION"}
                  className="w-full justify-start text-xs font-semibold bg-emerald-600 hover:bg-emerald-700"
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Verify Application (Request Payment)
                </Button>

                <Button
                  onClick={() => handleAction("START_PRINTING")}
                  disabled={adminAction.isPending || (request.status !== "PAYMENT_SUCCESS" && request.status !== "PENDING_ADMIN_VERIFICATION")}
                  className="w-full justify-start text-xs font-semibold bg-purple-700 hover:bg-purple-800"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Start ID Card Printing
                </Button>

                <Button
                  onClick={() => handleAction("MARK_READY")}
                  disabled={adminAction.isPending || (request.status !== "ID_CARD_PRINTING" && request.status !== "ID_CARD_PRINTED" && request.status !== "QUALITY_CHECKED")}
                  className="w-full justify-start text-xs font-semibold bg-blue-700 hover:bg-blue-800"
                >
                  <PackageCheck className="w-4 h-4 mr-2" />
                  Mark Ready for Collection
                </Button>

                <Button
                  onClick={() => handleAction("MARK_COLLECTED")}
                  disabled={adminAction.isPending || request.status !== "READY_TO_COLLECT"}
                  className="w-full justify-start text-xs font-semibold bg-teal-700 hover:bg-teal-800"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Physical Handover (Collected)
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
