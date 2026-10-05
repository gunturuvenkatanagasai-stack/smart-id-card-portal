import { useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateRequest } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { FileText, Loader2, ShieldCheck, ArrowRight } from "lucide-react";

const applicationSchema = z.object({
  studentName: z.string().min(2, "Name is required"),
  registerNumber: z.string().min(5, "Register number is required"),
  branch: z.string().min(2, "Branch is required"),
  year: z.string().min(1, "Year is required"),
  semester: z.string().min(1, "Semester is required"),
  section: z.string().optional(),
  mobileNumber: z.string().min(10, "Valid 10-digit mobile number is required"),
  reason: z.string().min(10, "Please provide a detailed reason for missing ID card"),
  dateOfLoss: z.string().min(1, "Date of loss is required"),
  locationOfLoss: z.string().min(2, "Location of loss is required"),
  additionalRemarks: z.string().optional(),
});

export default function Apply() {
  const [, setLocation] = useLocation();
  const { studentEmail, studentToken, studentProfile } = useAuth();
  const { toast } = useToast();

  const createRequest = useCreateRequest();

  const appForm = useForm<z.infer<typeof applicationSchema>>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      studentName: studentProfile?.studentName || "",
      registerNumber: studentProfile?.registerNumber || "",
      branch: studentProfile?.branch || "",
      year: studentProfile?.year || "",
      semester: studentProfile?.semester || "",
      section: "A",
      mobileNumber: studentProfile?.mobileNumber || "",
      reason: "",
      dateOfLoss: new Date().toISOString().split("T")[0],
      locationOfLoss: "College Campus / Library",
      additionalRemarks: "",
    },
  });

  useEffect(() => {
    if (studentProfile) {
      if (studentProfile.studentName) appForm.setValue("studentName", studentProfile.studentName);
      if (studentProfile.registerNumber) appForm.setValue("registerNumber", studentProfile.registerNumber);
      if (studentProfile.branch) appForm.setValue("branch", studentProfile.branch);
      if (studentProfile.year) appForm.setValue("year", studentProfile.year);
      if (studentProfile.semester) appForm.setValue("semester", studentProfile.semester);
      if (studentProfile.mobileNumber) appForm.setValue("mobileNumber", studentProfile.mobileNumber);
    }
  }, [studentProfile, appForm]);

  const onAppSubmit = (values: z.infer<typeof applicationSchema>) => {
    if (!studentEmail) {
      toast({ variant: "destructive", title: "Authentication Required", description: "Please verify your official college email first." });
      setLocation("/login");
      return;
    }

    createRequest.mutate(
      {
        data: {
          ...values,
          email: studentEmail,
        },
      },
      {
        onSuccess: (data) => {
          toast({
            title: "Application Submitted",
            description: `Application ${data.requestNumber} routed to HOD for approval.`,
          });
          setLocation("/student/dashboard");
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Submission Failed",
            description: error.data?.error || "Unexpected error submitting application.",
          });
        },
      }
    );
  };

  if (!studentEmail || !studentToken) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-muted/20">
        <Card className="max-w-md w-full text-center p-8 border-border/60 shadow-lg">
          <FileText className="w-12 h-12 mx-auto text-primary mb-4" />
          <CardTitle className="mb-2 text-2xl font-bold">College Verification Required</CardTitle>
          <CardDescription className="mb-6 leading-relaxed text-xs">
            Authenticate your official college email (@mictech.edu.in or @mic.edu.in) with a 6-digit OTP before submitting your missing ID application.
          </CardDescription>
          <Button size="lg" className="w-full font-semibold" onClick={() => setLocation("/login")}>
            Verify College Email with OTP
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-foreground">Missing ID Card Application</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Complete the form below. Your request will be digitally routed to your HOD and Principal for approval.
        </p>
      </div>

      <Card className="shadow-sm border-border">
        <CardHeader>
          <CardTitle className="text-lg">Application Details</CardTitle>
          <CardDescription className="text-xs">Fields marked with verified badge are locked from student database records.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...appForm}>
            <form onSubmit={appForm.handleSubmit(onAppSubmit)} className="space-y-6">
              {/* Locked Verified Fields */}
              <div className="p-4 bg-muted/40 rounded-xl border space-y-3">
                <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Verified College Identity Record (Read-Only)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Student Name</span>
                    <span className="font-bold text-foreground">{studentProfile?.studentName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Register Number</span>
                    <span className="font-mono font-bold text-foreground">{studentProfile?.registerNumber}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Department &amp; Year</span>
                    <span className="font-semibold text-foreground">{studentProfile?.branch} ({studentProfile?.year} Year)</span>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={appForm.control}
                  name="mobileNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Contact Mobile Number</FormLabel>
                      <FormControl>
                        <Input placeholder="10-digit mobile number" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={appForm.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Section / Class</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Section A" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={appForm.control}
                  name="dateOfLoss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Approximate Date of Loss</FormLabel>
                      <FormControl>
                        <Input type="date" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={appForm.control}
                  name="locationOfLoss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Location of Loss</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Library, Canteen, Bus" className="h-9 text-xs" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={appForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Reason for Missing ID Card</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain clearly how the ID card was misplaced, damaged, or lost..."
                        className="text-xs h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={appForm.control}
                name="additionalRemarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Additional Remarks (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information..."
                        className="text-xs h-16"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <div className="pt-4 border-t flex justify-end">
                <Button type="submit" size="lg" disabled={createRequest.isPending} className="font-semibold text-xs">
                  {createRequest.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Submit Application for HOD Approval
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
