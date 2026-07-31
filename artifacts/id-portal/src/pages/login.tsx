import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSendOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const COLLEGE_LOGO = "https://www.mictech.edu.in/images/logo-small.png";
const BUILDING_ENTRANCE = "https://www.mictech.edu.in/images/background/1.jpg";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid institutional email address"),
});

const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { setStudentEmail } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  const onEmailSubmit = (values: z.infer<typeof emailSchema>) => {
    sendOtp.mutate({ data: values }, {
      onSuccess: (data) => {
        setEmail(values.email);
        setStep("otp");
        if (data.otp) {
          setDevOtp(data.otp);
          otpForm.setValue("otp", data.otp);
          toast({ title: "OTP Sent", description: `Dev mode OTP is: ${data.otp}` });
        } else {
          toast({ title: "OTP Sent", description: "Please check your email for the verification code." });
        }
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Failed to send OTP", description: error.data?.error || "An unexpected error occurred." });
      }
    });
  };

  const onOtpSubmit = (values: z.infer<typeof otpSchema>) => {
    verifyOtp.mutate({ data: { email, otp: values.otp } }, {
      onSuccess: (data) => {
        setStudentEmail(data.email);
        toast({ title: "Authentication Successful", description: "Welcome to the ID Portal." });
        setLocation("/apply");
      },
      onError: (error) => {
        toast({ variant: "destructive", title: "Verification Failed", description: error.data?.error || "Invalid OTP code." });
      }
    });
  };

  return (
    <div className="flex-1 flex min-h-0">

      {/* Left panel — college entrance building photo */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        <motion.img
          src={BUILDING_ENTRANCE}
          alt="DVR & DR HS MIC College of Technology — Entrance"
          className="absolute inset-0 w-full h-full object-cover object-center"
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* College branding over the photo */}
        <motion.div
          className="relative z-10 flex flex-col justify-between h-full p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Top: logo + name */}
          <div className="flex items-center gap-3">
            <img
              src={COLLEGE_LOGO}
              alt="MIC College Logo"
              className="w-12 h-12 rounded-full bg-white object-contain p-1 shadow-lg"
            />
            <div>
              <div className="text-white font-bold text-sm leading-tight">
                DVR &amp; DR HS MIC<br />College of Technology
              </div>
              <div className="text-white/60 text-xs">Autonomous Institution</div>
            </div>
          </div>

          {/* Bottom: campus name + accreditations */}
          <div>
            <div className="text-white/70 text-xs uppercase tracking-widest mb-2">
              Kanchikacharla, Krishna District, AP
            </div>
            <h2 className="text-white text-3xl font-bold leading-snug mb-4">
              Welcome to the<br />Official ID Card Portal
            </h2>
            <div className="flex flex-wrap gap-2">
              {["NAAC A+", "NBA Accredited", "ISO 9001:2015", "AICTE Approved"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/15 text-white/90 border border-white/20 backdrop-blur-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-muted/20">
        <div className="w-full max-w-md">
          {/* Mobile: show logo when building photo is hidden */}
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <img
              src={COLLEGE_LOGO}
              alt="MIC College Logo"
              className="w-9 h-9 rounded-full bg-primary object-contain p-0.5"
            />
            <span className="text-sm font-semibold text-muted-foreground">
              DVR &amp; DR HS MIC College of Technology
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-display">Student Portal Login</CardTitle>
                <CardDescription>
                  Authenticate with your institutional email to manage your ID card requests.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <AnimatePresence mode="wait">
                  {step === "email" ? (
                    <motion.div
                      key="email-step"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Form {...emailForm}>
                        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                          <FormField
                            control={emailForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <Label>Institutional Email</Label>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                    <Input
                                      placeholder="student@college.edu"
                                      className="pl-10 h-12"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium mt-6"
                            disabled={sendOtp.isPending}
                          >
                            {sendOtp.isPending ? (
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                              <>
                                Send Verification Code
                                <ArrowRight className="w-5 h-5 ml-2" />
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="otp-step"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="mb-6 text-sm text-muted-foreground p-3 bg-muted rounded-md border">
                        Code sent to <span className="font-semibold text-foreground">{email}</span>
                        <button
                          onClick={() => setStep("email")}
                          className="ml-2 text-primary hover:underline"
                          type="button"
                        >
                          Change
                        </button>
                      </div>

                      <Form {...otpForm}>
                        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                          <FormField
                            control={otpForm.control}
                            name="otp"
                            render={({ field }) => (
                              <FormItem className="flex flex-col items-center justify-center space-y-4">
                                <Label className="self-start">Enter 6-digit Code</Label>
                                <FormControl>
                                  <InputOTP maxLength={6} {...field}>
                                    <InputOTPGroup>
                                      <InputOTPSlot index={0} className="w-12 h-14 text-lg" />
                                      <InputOTPSlot index={1} className="w-12 h-14 text-lg" />
                                      <InputOTPSlot index={2} className="w-12 h-14 text-lg" />
                                      <InputOTPSlot index={3} className="w-12 h-14 text-lg" />
                                      <InputOTPSlot index={4} className="w-12 h-14 text-lg" />
                                      <InputOTPSlot index={5} className="w-12 h-14 text-lg" />
                                    </InputOTPGroup>
                                  </InputOTP>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {devOtp && (
                            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                              Dev mode: Auto-filled OTP {devOtp}
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full h-12 text-base font-medium"
                            disabled={verifyOtp.isPending}
                          >
                            {verifyOtp.isPending ? (
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            ) : (
                              <>
                                Verify & Continue
                                <KeyRound className="w-5 h-5 ml-2" />
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

    </div>
  );
}
