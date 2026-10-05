import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetMyRequest, usePayRequest, useGetAuditLogs, type ReissueRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ReceiptModal } from "@/components/ReceiptModal";
import {
  User,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  QrCode,
  History,
  ArrowRight,
  ShieldCheck,
  Building,
  Loader2,
  Lock,
  PackageCheck,
  Check,
} from "lucide-react";

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { studentEmail, studentProfile, logout } = useAuth();
  const { toast } = useToast();

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const { data: request, isLoading, refetch } = useGetMyRequest(
    { email: studentEmail || "" },
    { enabled: Boolean(studentEmail) }
  );

  const { data: auditLogs } = useGetAuditLogs(request?.id || "", {
    enabled: Boolean(request?.id) && auditOpen,
  });

  const payRequest = usePayRequest();

  if (!studentEmail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <ShieldCheck className="w-16 h-16 text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Student Authentication Required</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Please verify your official college email with OTP before accessing the Student Dashboard.
        </p>
        <Button onClick={() => setLocation("/login")}>Go to Email Verification</Button>
      </div>
    );
  }

  const handlePayNow = () => {
    if (!request) return;
    const txId = `TXN-${Date.now().toString().slice(-8)}`;
    payRequest.mutate(
      { id: request.id, data: { paymentMethod: "UPI / Online Banking", transactionId: txId } },
      {
        onSuccess: () => {
          toast({
            title: "Payment Successful",
            description: "₹200.00 reissue fee recorded. Request sent for ID card printing.",
          });
          refetch();
        },
        onError: (err: any) => {
          toast({
            variant: "destructive",
            title: "Payment Failed",
            description: err?.message || "Could not complete payment.",
          });
        },
      }
    );
  };

  const getTimelineSteps = (currentStatus?: string) => {
    const steps = [
      { id: "submitted", label: "Application Submitted" },
      { id: "hod", label: "HOD Approval" },
      { id: "principal", label: "Principal Approval" },
      { id: "admin", label: "Admin Verification" },
      { id: "payment", label: "Payment" },
      { id: "printing", label: "ID Card Printing" },
      { id: "ready", label: "Ready to Collect" },
      { id: "collected", label: "Collected" },
    ];

    let currentIndex = 0;
    if (!currentStatus) return { steps, currentIndex: 0, isRejected: false };

    const isRejected = currentStatus.includes("REJECTED");
    if (currentStatus === "PENDING_HOD_APPROVAL") currentIndex = 0;
    else if (currentStatus === "PENDING_PRINCIPAL_APPROVAL" || currentStatus === "HOD_APPROVED") currentIndex = 1;
    else if (currentStatus === "PENDING_ADMIN_VERIFICATION" || currentStatus === "PRINCIPAL_APPROVED") currentIndex = 2;
    else if (currentStatus === "PAYMENT_PENDING") currentIndex = 3;
    else if (currentStatus === "PAYMENT_SUCCESS") currentIndex = 4;
    else if (currentStatus === "ID_CARD_PRINTING" || currentStatus === "ID_CARD_PRINTED" || currentStatus === "QUALITY_CHECKED") currentIndex = 5;
    else if (currentStatus === "READY_TO_COLLECT") currentIndex = 6;
    else if (currentStatus === "COLLECTED") currentIndex = 7;

    return { steps, currentIndex, isRejected };
  };

  const { steps, currentIndex, isRejected } = getTimelineSteps(request?.status);

  return (
    <div className="flex-1 bg-muted/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Banner / Welcome */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-card rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl shrink-0">
              {studentProfile?.studentName?.[0] || "S"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-display">{studentProfile?.studentName || "Student"}</h1>
                <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                  Verified College Email
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reg No: <span className="font-semibold text-foreground">{studentProfile?.registerNumber || "N/A"}</span> | {studentProfile?.branch || "Computer Science"} ({studentProfile?.year || "3"} Year)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <Button variant="outline" size="sm" onClick={() => setLocation("/apply")}>
              <FileText className="w-4 h-4 mr-2" />
              New Application
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-destructive">
              Logout
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols — Application & Status Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-xl">Application Progress &amp; Timeline</CardTitle>
                  <CardDescription>Track real-time status from submission to physical collection</CardDescription>
                </div>
                {request && (
                  <Badge variant="secondary" className="font-mono">
                    {request.requestNumber}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-6">
                {isLoading ? (
                  <div className="py-12 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    Loading application data...
                  </div>
                ) : !request ? (
                  <div className="py-10 text-center border-2 border-dashed rounded-xl p-6 bg-muted/30">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-1">No Active Reissue Application</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5">
                      You have not submitted a missing ID card application yet. Click below to start.
                    </p>
                    <Button onClick={() => setLocation("/apply")} className="font-semibold">
                      Start Missing ID Application
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Visual Status Banner */}
                    <div className="p-4 rounded-xl border bg-muted/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Current Status</span>
                        <div className="text-lg font-bold text-foreground mt-0.5 capitalize">
                          {request.status.replace(/_/g, " ")}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {request.status === "PAYMENT_PENDING" && (
                          <Button onClick={handlePayNow} disabled={payRequest.isPending} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                            {payRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CreditCard className="w-4 h-4 mr-2" />}
                            Pay Reissue Fee (₹200)
                          </Button>
                        )}

                        {(request.status === "PAYMENT_SUCCESS" || request.status === "READY_TO_COLLECT" || request.status === "COLLECTED" || request.status.includes("PRINTING")) && (
                          <Button variant="outline" onClick={() => setReceiptOpen(true)}>
                            <QrCode className="w-4 h-4 mr-2 text-primary" />
                            View QR Receipt
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Timeline Steps */}
                    <div className="py-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {steps.map((step, idx) => {
                          const isDone = idx < currentIndex;
                          const isCurrent = idx === currentIndex && !isRejected;

                          return (
                            <div
                              key={step.id}
                              className={`p-3 rounded-lg border text-xs flex flex-col justify-between space-y-2 transition-all ${
                                isDone
                                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                                  : isCurrent
                                  ? "bg-blue-50 border-blue-300 text-blue-950 ring-2 ring-blue-500/20"
                                  : isRejected && idx === currentIndex
                                  ? "bg-red-50 border-red-200 text-red-950"
                                  : "bg-muted/30 border-border text-muted-foreground opacity-60"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono font-bold text-[10px]">0{idx + 1}</span>
                                {isDone ? (
                                  <Check className="w-4 h-4 text-emerald-600" />
                                ) : isCurrent ? (
                                  <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
                                ) : isRejected && idx === currentIndex ? (
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 opacity-40" />
                                )}
                              </div>
                              <span className="font-semibold leading-tight">{step.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Rejection Alert */}
                    {isRejected && (
                      <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-lg text-xs space-y-1">
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          Application Rejected
                        </div>
                        <p>
                          Remark: {request.hodNote || request.principalNote || request.adminNote || "Does not meet guidelines."}
                        </p>
                      </div>
                    )}

                    {/* Ready to Collect Alert */}
                    {request.status === "READY_TO_COLLECT" && (
                      <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs flex items-start gap-3">
                        <PackageCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-sm">Your ID Card is Ready for Collection!</div>
                          <p className="mt-0.5">
                            Please visit the <strong>ID Card Department</strong> with your QR Receipt to collect your new physical ID card.
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Application Detail Card */}
            {request && (
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Submitted Application Overview</CardTitle>
                    <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs">
                          <History className="w-3.5 h-3.5 mr-1.5" />
                          Audit Trail Logs
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Application Audit Log Trail</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 text-xs">
                          {auditLogs?.map((log) => (
                            <div key={log.id} className="p-2.5 bg-muted/50 rounded-lg border">
                              <div className="flex items-center justify-between font-semibold text-foreground">
                                <span>{log.action}</span>
                                <span className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                Performed by <strong>{log.user}</strong> ({log.role})
                              </p>
                              {log.remarks && <p className="text-[11px] text-foreground/80 mt-1 italic">"{log.remarks}"</p>}
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Reason for Reissue</span>
                    <span className="font-semibold text-foreground">{request.reason}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Mobile Number</span>
                    <span className="font-semibold text-foreground">{request.mobileNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Date of Loss</span>
                    <span className="font-semibold text-foreground">{request.dateOfLoss || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Location of Loss</span>
                    <span className="font-semibold text-foreground">{request.locationOfLoss || "College Campus"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Submitted On</span>
                    <span className="font-semibold text-foreground">{new Date(request.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Payment Status</span>
                    <span className="font-semibold text-emerald-700">{request.paymentId ? `Paid (${request.paymentId})` : "Pending"}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Col — Student Profile Card & Contact */}
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Student Profile Record
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-semibold text-foreground">{studentProfile?.studentName}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Register No:</span>
                    <span className="font-mono font-bold text-foreground">{studentProfile?.registerNumber}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-semibold text-foreground">{studentProfile?.branch}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-border/60">
                    <span className="text-muted-foreground">College Email:</span>
                    <span className="font-mono text-foreground text-[11px]">{studentEmail}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-primary/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase font-bold text-primary tracking-wider">ID Card Department Support</CardTitle>
              </CardHeader>
              <CardContent className="text-xs space-y-2 text-muted-foreground">
                <p>Physical collection hours: 10:00 AM – 4:00 PM (Monday to Saturday)</p>
                <div className="flex items-center gap-1.5 font-semibold text-foreground pt-1">
                  <Building className="w-4 h-4 text-primary shrink-0" />
                  Main Administrative Block, Room 104
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {request && <ReceiptModal open={receiptOpen} onOpenChange={setReceiptOpen} request={request} />}
    </div>
  );
}
