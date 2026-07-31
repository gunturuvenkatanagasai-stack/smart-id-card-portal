import { useState, useEffect } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetRequest, 
  getGetRequestQueryKey, 
  useUpdateRequestStatus, 
  UpdateStatusBodyStatus 
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, FileText, CreditCard, Loader2, Save } from "lucide-react";

const updateSchema = z.object({
  status: z.enum(["pending", "payment_pending", "approved", "ready_to_collect", "collected"]),
  adminNote: z.string().optional(),
});

export default function AdminRequestDetail() {
  const [, params] = useRoute("/admin/requests/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const { adminToken } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (adminToken === null) {
    setLocation("/admin/login");
    return null;
  }

  const { data: request, isLoading } = useGetRequest(id, {
    query: { enabled: !!id, queryKey: getGetRequestQueryKey(id) }
  });

  const updateStatus = useUpdateRequestStatus();

  const form = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      status: "pending",
      adminNote: "",
    },
  });

  useEffect(() => {
    if (request) {
      form.reset({
        status: request.status as any,
        adminNote: request.adminNote || "",
      });
    }
  }, [request, form]);

  const onSubmit = (values: z.infer<typeof updateSchema>) => {
    updateStatus.mutate({ 
      id, 
      data: { 
        status: values.status as UpdateStatusBodyStatus, 
        adminNote: values.adminNote || null 
      } 
    }, {
      onSuccess: (data) => {
        toast({ title: "Status Updated Successfully" });
        queryClient.setQueryData(getGetRequestQueryKey(id), data);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: error.data?.error || "Could not update status.",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex-1 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Request Not Found</h2>
          <Link href="/admin"><Button variant="outline">Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 bg-muted/10">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6 flex items-center">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mr-4 -ml-3 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
          </Link>
          <h1 className="text-2xl font-display font-bold">Request Details</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between pb-4 border-b">
                <div>
                  <CardTitle className="flex items-center text-lg gap-2">
                    <User className="w-5 h-5 text-muted-foreground" />
                    Student Information
                  </CardTitle>
                </div>
                <StatusBadge status={request.status} className="text-sm px-3 py-1" />
              </CardHeader>
              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Full Name</div>
                  <div className="font-medium text-base">{request.studentName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Register Number</div>
                  <div className="font-medium font-mono">{request.registerNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Branch</div>
                  <div className="font-medium">{request.branch}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Academic Year</div>
                  <div className="font-medium">Year {request.year}, Semester {request.semester}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Email Address</div>
                  <div className="font-medium">{request.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Mobile Number</div>
                  <div className="font-medium">{request.mobileNumber}</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4 border-b">
                <CardTitle className="flex items-center text-lg gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  Application Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Request ID</div>
                  <div className="font-medium font-mono bg-muted inline-block px-2 py-1 rounded text-sm">{request.requestNumber}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Submitted On</div>
                  <div className="font-medium">{new Date(request.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Reason for Reissue</div>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed border">
                    {request.reason}
                  </div>
                </div>
              </CardContent>
            </Card>

            {request.paymentId && (
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4 border-b">
                  <CardTitle className="flex items-center text-lg gap-2">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Transaction ID</div>
                    <div className="font-medium font-mono text-sm break-all">{request.paymentId}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Method</div>
                    <div className="font-medium uppercase">{request.paymentMethod}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Amount</div>
                    <div className="font-bold text-green-600">₹{request.paymentAmount}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Actions */}
          <div className="lg:col-span-1">
            <Card className="border-border/50 shadow-sm sticky top-24 border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
                <CardDescription>Advance the application workflow</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending Verification</SelectItem>
                            <SelectItem value="payment_pending">Payment Pending</SelectItem>
                            <SelectItem value="approved">Approved for Print</SelectItem>
                            <SelectItem value="ready_to_collect">Ready to Collect</SelectItem>
                            <SelectItem value="collected">Collected</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    
                    <FormField control={form.control} name="adminNote" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Note (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add notes visible to the student..." 
                            className="resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground mt-1">This note will be shown on the student's tracking page.</p>
                      </FormItem>
                    )} />
                    
                    <Button type="submit" className="w-full" disabled={updateStatus.isPending}>
                      {updateStatus.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save Changes
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
