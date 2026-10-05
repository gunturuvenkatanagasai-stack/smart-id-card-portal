import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGetMyRequest } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { motion, AnimatePresence } from "framer-motion";

const searchSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function Track() {
  const { toast } = useToast();
  const [searchedEmail, setSearchedEmail] = useState<string | null>(null);

  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: { email: "" },
  });

  const { data: request, isLoading, isError } = useGetMyRequest(
    { email: searchedEmail || "" },
    {
      enabled: !!searchedEmail,
      retry: false,
    }
  );

  const onSubmit = (values: z.infer<typeof searchSchema>) => {
    setSearchedEmail(values.email);
  };

  const getTimelineSteps = (status: string) => {
    const steps = [
      { id: "pending", label: "Request Submitted" },
      { id: "payment_pending", label: "Payment Required" },
      { id: "approved", label: "Request Approved" },
      { id: "ready_to_collect", label: "Ready to Collect" },
      { id: "collected", label: "ID Collected" }
    ];
    
    // Status mapping logic for timeline display
    let currentIndex = 0;
    if (status === "pending") currentIndex = 0;
    if (status === "payment_pending") currentIndex = 1;
    if (status === "approved") currentIndex = 2;
    if (status === "ready_to_collect") currentIndex = 3;
    if (status === "collected") currentIndex = 4;

    return { steps, currentIndex };
  };

  return (
    <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-bold text-foreground">Track Your Request</h1>
        <p className="text-muted-foreground mt-2">Enter your institutional email to check the status of your ID card replacement.</p>
      </div>

      <Card className="max-w-xl mx-auto shadow-md border-border/50 mb-10">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Enter your institutional email" className="pl-10 h-12" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="h-12 w-full sm:w-auto shrink-0" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Track Status"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </motion.div>
        )}

        {isError && (
          <motion.div key="error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12 text-muted-foreground">
            <p className="text-destructive font-medium text-lg">No Request Found</p>
            <p>We couldn't find any ID card reissue request for this email. Please check and try again.</p>
          </motion.div>
        )}

        {searchedEmail && request && (() => {
          const { steps, currentIndex } = getTimelineSteps(request.status);
          return (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <Card className="overflow-hidden border-border/50 shadow-sm">
                <div className="bg-muted/30 border-b px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Request Number</div>
                    <div className="font-mono font-bold text-lg">{request.requestNumber}</div>
                  </div>
                  <div className="text-right sm:text-left">
                    <div className="text-sm text-muted-foreground mb-1">Submitted On</div>
                    <div className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <StatusBadge status={request.status} />
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="relative py-6">
                    <div className="absolute top-10 left-8 right-8 h-1 bg-muted rounded-full">
                      <div
                        className="h-full bg-primary transition-all duration-1000 ease-in-out rounded-full"
                        style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
                      />
                    </div>
                    <div className="relative flex justify-between">
                      {steps.map((step, idx) => {
                        const isCompleted = idx <= currentIndex;
                        const isCurrent = idx === currentIndex;
                        return (
                          <div key={step.id} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 transition-colors mb-3
                              ${isCompleted ? "bg-primary text-primary-foreground" : "bg-muted border-2 border-muted-foreground/20 text-muted-foreground"}`}>
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-current opacity-30" />}
                              {isCurrent && <div className="absolute -inset-2 rounded-full border border-primary animate-ping opacity-20" />}
                            </div>
                            <span className={`text-xs sm:text-sm font-medium text-center max-w-[80px] sm:max-w-none ${isCurrent ? "text-primary font-bold" : "text-muted-foreground"}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {request.adminNote && (
                    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-lg text-sm border border-blue-100 dark:border-blue-800/30">
                      <span className="font-bold block mb-1">Message from Admin:</span>
                      {request.adminNote}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
