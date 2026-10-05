import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSendOtp, useResendOtp, useVerifyOtp } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, KeyRound, ArrowRight, Loader2, RefreshCw, AlertTriangle, ShieldCheck, Lock, Clock } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const COLLEGE_LOGO = "https://www.mictech.edu.in/images/logo-small.png";
const BUILDING_ENTRANCE = "https://www.mictech.edu.in/images/background/1.jpg";

const ALLOWED_COLLEGE_DOMAINS = ["mictech.edu.in", "mic.edu.in"];

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Please enter your student email address.")
    .email("Please enter a valid email address."),
});

const otpSchema = z.object({
  otp: z.string().trim().length(6, "Please enter the 6-digit OTP."),
});

export default function Login() {
  const [, setLocation] = useLocation();
  const { studentEmail, studentToken, studentProfile, loginStudent, logout } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [demoOtp, setDemoOtp] = useState<string>("123456");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<string | null>(null);
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);
  const autoSubmittedOtp = useRef<string | null>(null);
  const verificationInFlight = useRef(false);
  
  // Timers & Cooldowns (5 minutes = 300s, Cooldown = 30s)
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number>(300);
  const [resendCooldownSeconds, setResendCooldownSeconds] = useState<number>(0);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null);

  const sendOtp = useSendOtp();
  const resendOtp = useResendOtp();
  const verifyOtp = useVerifyOtp();

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });

  // 5-minute OTP countdown timer
  useEffect(() => {
    if (step !== "otp") return;
    if (otpExpirySeconds <= 0) return;

    const interval = setInterval(() => {
      setOtpExpirySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [step, otpExpirySeconds]);

  // 30-second Resend OTP countdown timer
  useEffect(() => {
    if (resendCooldownSeconds <= 0) return;

    const interval = setInterval(() => {
      setResendCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCooldownSeconds]);

  const triggerSendOtp = (targetEmail: string) => {
    sendOtp.mutate(
      { data: { email: targetEmail } },
      {
        onSuccess: (data) => {
          setEmail(targetEmail);
          setStep("otp");
          setOtpExpirySeconds(data.expiresInSeconds || 300);
          setResendCooldownSeconds(data.resendCooldownSeconds || 30);
          setDevOtp(data.otp || null);
          setDemoOtp(data.demoOtp || "123456");
          setIsEmailSent(Boolean(data.emailSent));
          setPreviewUrl(data.previewUrl || null);
          setDeliveryMethod(data.deliveryMethod || null);
          setRemainingAttempts(null);
          setLockoutMinutes(null);
          otpForm.reset({ otp: "" });

          toast({
            title: data.emailSent ? "OTP Sent to Email" : "Verification OTP Generated",
            description: data.message || `A 6-digit verification code has been dispatched to ${targetEmail}.`,
          });
        },
        onError: (error: any) => {
          const errData = error.data;
          if (errData?.locked) {
            setLockoutMinutes(errData.remainingMinutes || 15);
          }
          const errorMsg =
            errData?.message ||
            errData?.error ||
            error.message ||
            "Unable to send OTP right now. Please try again.";

          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: errorMsg,
          });
        },
      }
    );
  };

  const triggerResendOtp = () => {
    if (resendCooldownSeconds > 0 || resendOtp.isPending || sendOtp.isPending) return;

    resendOtp.mutate(
      { data: { email } },
      {
        onSuccess: (data) => {
          setOtpExpirySeconds(data.expiresInSeconds || 300);
          setResendCooldownSeconds(data.resendCooldownSeconds || 30);
          setDevOtp(data.otp || null);
          setDemoOtp(data.demoOtp || "123456");
          setIsEmailSent(Boolean(data.emailSent));
          setPreviewUrl(data.previewUrl || null);
          setDeliveryMethod(data.deliveryMethod || null);
          setRemainingAttempts(null);
          otpForm.reset({ otp: "" });

          toast({
            title: data.emailSent ? "New OTP Dispatched" : "New OTP Generated",
            description: data.message || `A new 6-digit OTP has been dispatched to ${email}.`,
          });
        },
        onError: (error: any) => {
          const errData = error.data;
          if (errData?.cooldownSeconds) {
            setResendCooldownSeconds(errData.cooldownSeconds);
          }
          const errorMsg =
            errData?.message ||
            errData?.error ||
            error.message ||
            "Unable to resend OTP right now. Please try again.";

          toast({
            variant: "destructive",
            title: "Resend Failed",
            description: errorMsg,
          });
        },
      }
    );
  };

  const onEmailSubmit = (values: z.infer<typeof emailSchema>) => {
    triggerSendOtp(values.email.trim());
  };

  const onOtpSubmit = (values: z.infer<typeof otpSchema>) => {
    const normalizedOtp = (values.otp || "").replace(/\D/g, "");
    
    if (!normalizedOtp || normalizedOtp.length !== 6) {
      toast({
        variant: "destructive",
        title: "Incomplete OTP",
        description: "Please enter the 6-digit OTP.",
      });
      return;
    }

    if (otpExpirySeconds <= 0) {
      toast({
        variant: "destructive",
        title: "OTP Expired",
        description: "OTP expired. Please request a new OTP.",
      });
      return;
    }

    otpForm.setValue("otp", normalizedOtp, { shouldValidate: true, shouldDirty: true });
    if (verificationInFlight.current) return;
    verificationInFlight.current = true;

    verifyOtp.mutate(
      { data: { email, otp: normalizedOtp } },
      {
        onSuccess: (data) => {
          loginStudent(data.email, data.token, data.student);
          toast({
            title: "College Email Verified",
            description: "College email verified successfully. Starting your application...",
          });
          setLocation("/apply");
        },
        onError: (error: any) => {
          verificationInFlight.current = false;
          const errData = error.data;
          if (errData?.locked) {
            setLockoutMinutes(errData.remainingMinutes || 15);
            setRemainingAttempts(0);
          } else if (typeof errData?.remainingAttempts === "number") {
            setRemainingAttempts(errData.remainingAttempts);
          }

          const errorMsg =
            errData?.message ||
            errData?.error ||
            error.message ||
            "Invalid OTP. Please check the OTP and try again.";

          toast({
            variant: "destructive",
            title: "Verification Failed",
            description: errorMsg,
          });
        },
      }
    );
  };

  const otpValue = otpForm.watch("otp");

  useEffect(() => {
    const normalizedOtp = (otpValue || "").replace(/\D/g, "");
    if (normalizedOtp.length !== 6) {
      autoSubmittedOtp.current = null;
      return;
    }

    if (
      step !== "otp" ||
      verifyOtp.isPending ||
      otpExpirySeconds <= 0 ||
      (lockoutMinutes !== null && lockoutMinutes > 0) ||
      autoSubmittedOtp.current === normalizedOtp
    ) {
      return;
    }

    autoSubmittedOtp.current = normalizedOtp;
    void otpForm.handleSubmit(onOtpSubmit)();
  }, [otpValue, step, verifyOtp.isPending, otpExpirySeconds, lockoutMinutes, otpForm, onOtpSubmit]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex-1 flex min-h-0">
      {/* Left panel — College Entrance Photo */}
      <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden">
        <motion.img
          src={BUILDING_ENTRANCE}
          alt="DVR & DR HS MIC College of Technology — Entrance"
          className="absolute inset-0 w-full h-full object-cover object-center"
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <motion.div
          className="relative z-10 flex flex-col justify-between h-full p-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {/* Top Logo & College Name */}
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
              <div className="text-white/70 text-xs font-medium">Autonomous Institution</div>
            </div>
          </div>

          {/* Bottom Heading & Badges */}
          <div>
            <div className="text-white/70 text-xs uppercase tracking-widest mb-2 font-semibold">
              Kanchikacharla, Krishna District, AP
            </div>
            <h2 className="text-white text-3xl font-bold leading-snug mb-4">
              Secure College Email<br />OTP Authentication
            </h2>
            <p className="text-white/80 text-sm max-w-lg mb-6 leading-relaxed">
              To protect student identity and prevent unauthorized applications, you must verify your official college email address (@mictech.edu.in or @mic.edu.in) with a secure 6-digit OTP before accessing the ID Card Reissue form.
            </p>
            <div className="flex flex-wrap gap-2">
              {["NAAC A+", "NBA Accredited", "ISO 9001:2015", "Secure OTP Gate"].map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full bg-white/15 text-white/90 border border-white/20 backdrop-blur-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right panel — Email & OTP Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-muted/20">
        <div className="w-full max-w-md">
          {/* Mobile Header Logo */}
          <div className="flex items-center gap-2.5 mb-6 lg:hidden">
            <img
              src={COLLEGE_LOGO}
              alt="MIC College Logo"
              className="w-9 h-9 rounded-full bg-primary object-contain p-0.5"
            />
            <div>
              <span className="text-xs font-bold text-foreground block">
                DVR &amp; DR HS MIC College of Technology
              </span>
              <span className="text-[11px] text-muted-foreground block">
                ID Card Reissue Portal
              </span>
            </div>
          </div>

          {studentEmail && studentToken ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-border/60 shadow-lg">
                <CardHeader className="text-center pb-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <CardTitle className="text-2xl font-display font-bold">Already Signed In</CardTitle>
                  <CardDescription className="text-xs">
                    Your college authentication is active and saved.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="p-4 bg-muted/50 rounded-xl border text-xs space-y-2">
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-muted-foreground">Student Name:</span>
                      <span className="font-bold text-foreground">{studentProfile?.studentName || "Verified Student"}</span>
                    </div>
                    {studentProfile?.registerNumber && (
                      <div className="flex justify-between items-center py-1 border-b border-border/50">
                        <span className="text-muted-foreground">Roll Number:</span>
                        <span className="font-mono font-bold text-foreground">{studentProfile.registerNumber}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-1 border-b border-border/50">
                      <span className="text-muted-foreground">College Email:</span>
                      <span className="font-mono font-medium text-foreground">{studentEmail}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">Session Status:</span>
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span> Verified &amp; Saved
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 pt-1">
                    <Button
                      size="lg"
                      className="w-full font-semibold"
                      onClick={() => setLocation("/student/dashboard")}
                    >
                      Continue to Student Dashboard
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full font-semibold"
                      onClick={() => setLocation("/apply")}
                    >
                      Fill ID Reissue Application
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:bg-destructive/10 mt-1"
                      onClick={() => logout()}
                    >
                      Sign In with Different Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-border/60 shadow-lg">
                <CardHeader className="space-y-1.5 pb-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-display font-bold">
                    {step === "email" ? "College Email Verification" : "Verification Code"}
                  </CardTitle>
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <CardDescription className="text-sm">
                  {step === "email"
                    ? "Enter your student email address to receive your 6-digit access OTP."
                    : `Enter the 6-digit OTP sent to: ${email}`}
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
                        <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-5">
                          <FormField
                            control={emailForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <Label className="text-sm font-medium">Student Email Address</Label>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                                    <Input
                                      placeholder="e.g. 24h71a1286@mictech.edu.in or student@mic.edu.in"
                                      className="pl-11 h-12 text-base"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="p-3 bg-muted/50 rounded-lg border text-xs text-muted-foreground space-y-1.5">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                              Student Email Verification
                            </div>
                            <p>
                              An authentication OTP will be sent directly to the email address you provide. Both official college domains and student email accounts are supported.
                            </p>
                          </div>

                          <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold mt-2"
                            disabled={sendOtp.isPending}
                          >
                            {sendOtp.isPending ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Checking Database &amp; Sending OTP...
                              </>
                            ) : (
                              <>
                                Send 6-Digit OTP
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
                      {/* Email Badge + Change Option */}
                      <div className="mb-5 text-xs text-muted-foreground p-3 bg-muted/60 rounded-lg border flex items-center justify-between">
                        <div className="truncate pr-2">
                          Code sent to: <span className="font-semibold text-foreground">{email}</span>
                        </div>
                        <button
                          onClick={() => setStep("email")}
                          className="text-primary font-semibold hover:underline shrink-0"
                          type="button"
                        >
                          Change Email
                        </button>
                      </div>

                      {/* Lockout Warning Banner */}
                      {lockoutMinutes !== null && lockoutMinutes > 0 && (
                        <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start gap-2.5">
                          <Lock className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                          <div>
                            <div className="font-bold text-sm">Account Verification Locked</div>
                            <p className="mt-0.5">
                              Too many failed attempts. Verification is locked for {lockoutMinutes} minute(s) to protect your account.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Remaining Attempts Banner */}
                      {remainingAttempts !== null && remainingAttempts > 0 && lockoutMinutes === null && (
                        <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            <strong>{remainingAttempts}</strong> attempt(s) remaining before account lock.
                          </span>
                        </div>
                      )}

                      {/* Expiry / Countdown Timer Display */}
                      <div className="mb-4 flex items-center justify-between p-3 rounded-lg border bg-background text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className={`w-4 h-4 ${otpExpirySeconds < 60 ? "text-red-500 animate-pulse" : "text-primary"}`} />
                          <span className="text-muted-foreground">OTP Expiry Timer:</span>
                        </div>
                        <span className={`font-mono font-bold text-sm ${otpExpirySeconds < 60 ? "text-red-600" : "text-primary"}`}>
                          {otpExpirySeconds > 0 ? formatTimer(otpExpirySeconds) : "Expired"}
                        </span>
                      </div>

                      {/* OTP Status Banner */}
                      {isEmailSent && (
                        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex items-start gap-2.5 text-emerald-900">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="text-emerald-800 font-semibold block">
                              OTP dispatched to {email}
                            </span>
                            <span className="text-emerald-700 block">
                              Please check your inbox (and spam/junk folder) for your 6-digit verification code.
                            </span>
                            {previewUrl && (
                              <div className="pt-1">
                                <a
                                  href={previewUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-white px-2.5 py-1 rounded border border-blue-200 hover:underline shadow-sm"
                                >
                                  View Test Email in Web Preview &rarr;
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Demo OTP Helper Banner — Kept Alive */}
                      <div className="mb-5 p-3.5 bg-blue-50/95 border border-blue-300 rounded-lg text-xs flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
                          <div>
                            <span className="text-blue-900 font-bold block text-[11px] uppercase tracking-wider">
                              Demo OTP Type Active
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-base font-bold text-blue-700 tracking-widest">
                                {demoOtp}
                              </span>
                              <span className="text-[10px] text-blue-600 font-medium">(works anytime)</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 font-semibold"
                          onClick={() => {
                            otpForm.setValue("otp", demoOtp, { shouldValidate: true, shouldDirty: true });
                          }}
                        >
                          Use Demo OTP
                        </Button>
                      </div>

                      <Form {...otpForm}>
                        <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-6">
                          <FormField
                            control={otpForm.control}
                            name="otp"
                            render={({ field }) => (
                              <FormItem className="flex flex-col items-center justify-center space-y-4">
                                <Label className="self-start text-sm font-medium">Enter 6-Digit OTP</Label>
                                <FormControl>
                                  <InputOTP
                                    maxLength={6}
                                    value={field.value ?? ""}
                                    onChange={(value) => {
                                      field.onChange(value);
                                      if (value.replace(/\D/g, "").length === 6 && !verifyOtp.isPending) {
                                        otpForm.handleSubmit(onOtpSubmit)();
                                      }
                                    }}
                                    onBlur={field.onBlur}
                                    name={field.name}
                                    ref={field.ref}
                                  >
                                    <InputOTPGroup className="gap-2">
                                      <InputOTPSlot index={0} className="w-11 h-13 text-lg font-bold rounded-md border" />
                                      <InputOTPSlot index={1} className="w-11 h-13 text-lg font-bold rounded-md border" />
                                      <InputOTPSlot index={2} className="w-11 h-13 text-lg font-bold rounded-md border" />
                                      <InputOTPSlot index={3} className="w-11 h-13 text-lg font-bold rounded-md border" />
                                      <InputOTPSlot index={4} className="w-11 h-13 text-lg font-bold rounded-md border" />
                                      <InputOTPSlot index={5} className="w-11 h-13 text-lg font-bold rounded-md border" />
                                    </InputOTPGroup>
                                  </InputOTP>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button
                            type="submit"
                            className="w-full h-12 text-base font-semibold"
                            disabled={verifyOtp.isPending || otpExpirySeconds <= 0 || (lockoutMinutes !== null && lockoutMinutes > 0)}
                          >
                            {verifyOtp.isPending ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Verifying OTP...
                              </>
                            ) : (
                              <>
                                Verify OTP
                                <KeyRound className="w-5 h-5 ml-2" />
                              </>
                            )}
                          </Button>

                          {/* Resend OTP Button with 30s countdown */}
                          <div className="pt-2 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground hover:text-primary"
                              disabled={resendCooldownSeconds > 0 || resendOtp.isPending || sendOtp.isPending || (lockoutMinutes !== null && lockoutMinutes > 0)}
                              onClick={triggerResendOtp}
                            >
                              {resendOtp.isPending ? (
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              {resendCooldownSeconds > 0
                                ? `Resend OTP in ${resendCooldownSeconds}s`
                                : "Resend OTP"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
