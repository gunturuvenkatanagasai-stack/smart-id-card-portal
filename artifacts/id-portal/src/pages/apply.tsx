import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateRequest, usePayRequest, ReissueRequest } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, CreditCard, FileText, Loader2, Printer, ShieldCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Link } from "wouter";

const applicationSchema = z.object({
  studentName: z.string().min(2, "Name is required"),
  registerNumber: z.string().min(5, "Register number is required"),
  branch: z.string().min(2, "Branch is required"),
  year: z.string().min(1, "Year is required"),
  semester: z.string().min(1, "Semester is required"),
  mobileNumber: z.string().min(10, "Valid mobile number is required"),
  reason: z.string().min(10, "Please provide a valid reason for reissue"),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(["upi", "card", "netbanking"]),
});

export default function Apply() {
  const [, setLocation] = useLocation();
  const { studentEmail } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [createdRequest, setCreatedRequest] = useState<ReissueRequest | null>(null);

  const createRequest = useCreateRequest();
  const payRequest = usePayRequest();

  const appForm = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      studentName: "",
      registerNumber: "",
      branch: "",
      year: "",
      semester: "",
      mobileNumber: "",
      reason: "",
    },
  });

  const payForm = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentMethod: "upi" },
  });

  const onAppSubmit = (values: z.infer<typeof applicationSchema>) => {
    if (!studentEmail) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please login first." });
      setLocation("/login");
      return;
    }
    createRequest.mutate({ data: { ...values, email: studentEmail, photoUrl: null } }, {
      onSuccess: (data) => {
        setCreatedRequest(data);
        setStep(2);
        toast({ title: "Application Submitted", description: "Please proceed to payment." });
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Submission Failed", description: error.data?.error || "Unexpected error." });
      }
    });
  };

  const onPaySubmit = (values: z.infer<typeof paymentSchema>) => {
    if (!createdRequest) return;
    const txId = `TXN${Math.floor(Math.random() * 1000000000)}`;
    payRequest.mutate({ id: createdRequest.id, data: { paymentMethod: values.paymentMethod, transactionId: txId } }, {
      onSuccess: (data) => {
        setCreatedRequest(data);
        setStep(3);
        toast({ title: "Payment Successful", description: "Your reissue request is now processing." });
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Payment Failed", description: error.data?.error || "Unexpected error." });
      }
    });
  };

  if (!studentEmail) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Card className="max-w-md w-full text-center p-8">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle className="mb-2">Authentication Required</CardTitle>
          <CardDescription className="mb-6">You must be logged in to apply for a reissue.</CardDescription>
          <Button onClick={() => setLocation("/login")}>Go to Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-foreground">ID Card Reissue Application</h1>
        <p className="text-muted-foreground mt-2">Follow the steps below to request a replacement for your lost or damaged ID card.</p>
      </div>

      {/* Progress Stepper */}
      <div className="mb-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 md:before:translate-y-4 before:h-full md:before:h-0.5 before:w-0.5 md:before:w-full before:bg-border">
        <div className="relative grid gap-4 md:grid-cols-3">
          {[
            { num: 1, label: "Application Details", icon: FileText },
            { num: 2, label: "Fee Payment", icon: CreditCard },
            { num: 3, label: "Confirmation", icon: CheckCircle2 },
          ].map((s) => (
            <div key={s.num} className={`relative flex md:flex-col items-center gap-3 md:gap-4 z-10 ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-background transition-colors
                ${step > s.num ? "bg-primary border-primary text-primary-foreground" : 
                  step === s.num ? "border-primary bg-primary/10" : "border-muted-foreground"}`}
              >
                {step > s.num ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className={`text-sm font-medium ${step >= s.num ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
                <CardDescription>Enter your institutional details accurately as they will appear on your new ID.</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...appForm}>
                  <form onSubmit={appForm.handleSubmit(onAppSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={appForm.control} name="studentName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={appForm.control} name="registerNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Register Number</FormLabel>
                          <FormControl><Input placeholder="e.g. 21BCE1234" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={appForm.control} name="branch" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch/Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Branch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Computer Science">Computer Science</SelectItem>
                              <SelectItem value="Information Technology">Information Technology</SelectItem>
                              <SelectItem value="Electronics">Electronics</SelectItem>
                              <SelectItem value="Mechanical">Mechanical</SelectItem>
                              <SelectItem value="Civil">Civil</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField control={appForm.control} name="year" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Year</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1st Year</SelectItem>
                                <SelectItem value="2">2nd Year</SelectItem>
                                <SelectItem value="3">3rd Year</SelectItem>
                                <SelectItem value="4">4th Year</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={appForm.control} name="semester" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Semester</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={s.toString()}>Sem {s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                      </div>
                      <FormField control={appForm.control} name="mobileNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number</FormLabel>
                          <FormControl><Input placeholder="10-digit mobile number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <FormField control={appForm.control} name="reason" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason for Reissue</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Explain why you need a new ID card (Lost, damaged, stolen, etc.)" 
                            className="resize-none h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="flex justify-end pt-4 border-t">
                      <Button type="submit" disabled={createRequest.isPending}>
                        {createRequest.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Continue to Payment
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && createdRequest && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Fee Payment</CardTitle>
                <CardDescription>A standard fee of ₹200 applies for ID card reissue.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">ID Card Reissue Fee</div>
                    <div className="text-3xl font-bold text-primary">₹200</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">Request No.</div>
                    <div className="font-mono font-semibold text-sm">{createdRequest.requestNumber}</div>
                  </div>
                </div>

                <Form {...payForm}>
                  <form onSubmit={payForm.handleSubmit(onPaySubmit)} className="space-y-6">
                    <FormField control={payForm.control} name="paymentMethod" render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-base">Select Payment Method</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                              { value: "upi", label: "UPI / GPay / PhonePe" },
                              { value: "card", label: "Debit / Credit Card" },
                              { value: "netbanking", label: "Net Banking" },
                            ].map((m) => (
                              <FormItem key={m.value}>
                                <FormControl>
                                  <RadioGroupItem value={m.value} className="peer sr-only" />
                                </FormControl>
                                <Label className="flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-lg cursor-pointer peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted transition-colors text-center text-sm font-medium">
                                  <CreditCard className="w-5 h-5 text-primary" />
                                  {m.label}
                                </Label>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg p-3">
                      <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
                      Your payment will be recorded and verified by the college administrator before processing.
                    </div>

                    <div className="flex justify-between pt-2 border-t">
                      <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={payRequest.isPending}>Back</Button>
                      <Button type="submit" disabled={payRequest.isPending} className="min-w-[140px]">
                        {payRequest.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Pay ₹200 Now
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && createdRequest && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Request Submitted Successfully</h2>
                <p className="text-muted-foreground">Your application has been received and payment is confirmed.</p>
              </div>

              <Card id="receipt-content" className="border-border/50 shadow-sm print:shadow-none print:border-none">
                <CardHeader className="border-b bg-muted/30 pb-4 print:bg-transparent">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">Payment Receipt</CardTitle>
                      <CardDescription className="mt-1 font-mono text-xs">Receipt No: RCPT-{createdRequest.paymentId}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm leading-tight">DVR &amp; DR HS MIC</div>
                      <div className="text-xs text-muted-foreground leading-tight">College of Technology</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Kanchikacharla, A.P.</div>
                      <div className="text-sm text-muted-foreground mt-1">{new Date().toLocaleDateString()}</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Request Number</div>
                      <div className="font-semibold text-base font-mono">{createdRequest.requestNumber}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Status</div>
                      <StatusBadge status={createdRequest.status} />
                    </div>
                    
                    <div className="col-span-2 border-t my-2"></div>
                    
                    <div>
                      <div className="text-muted-foreground mb-1">Student Name</div>
                      <div className="font-medium">{createdRequest.studentName}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Register Number</div>
                      <div className="font-medium">{createdRequest.registerNumber}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Branch</div>
                      <div className="font-medium">{createdRequest.branch}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Academic Year</div>
                      <div className="font-medium">Year {createdRequest.year}, Sem {createdRequest.semester}</div>
                    </div>
                    
                    <div className="col-span-2 border-t my-2"></div>
                    
                    <div>
                      <div className="text-muted-foreground mb-1">Payment Method</div>
                      <div className="font-medium uppercase">{createdRequest.paymentMethod}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Amount Paid</div>
                      <div className="font-medium">₹{createdRequest.paymentAmount}</div>
                    </div>

                    <div className="col-span-2 border-t my-2"></div>

                    <div className="col-span-2">
                      <div className="text-muted-foreground mb-1 text-xs">Track your request online</div>
                      <div className="font-medium text-primary text-sm">{window.location.origin}/track</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-muted-foreground mb-1 text-xs">College Website</div>
                      <div className="font-medium text-sm">www.mictech.edu.in</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/30 border-t print:hidden flex justify-between pt-4">
                  <Button variant="outline" onClick={() => window.print()}>
                    <Printer className="w-4 h-4 mr-2" /> Print
                  </Button>
                  <Link href="/track">
                    <Button>Track Status</Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
