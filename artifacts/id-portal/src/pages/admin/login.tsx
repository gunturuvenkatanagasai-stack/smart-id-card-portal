import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { setAdminToken } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    // Hardcoded simple admin auth
    if (values.email === "admin@college.edu" && values.password === "admin123") {
      setAdminToken("dummy-admin-token");
      toast({ title: "Welcome back, Admin" });
      setLocation("/admin");
    } else {
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Invalid admin credentials.",
      });
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 md:p-8 bg-muted/20">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex justify-center mb-6">
            <div className="bg-primary text-primary-foreground p-3 rounded-xl shadow-lg">
              <ShieldAlert className="w-8 h-8" />
            </div>
          </div>
          
          <Card className="border-border/50 shadow-xl border-t-4 border-t-primary">
            <CardHeader className="space-y-1 pb-6 text-center">
              <CardTitle className="text-2xl font-display">Admin Access</CardTitle>
              <CardDescription>
                Authorized personnel only.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Admin Email</Label>
                        <FormControl>
                          <Input placeholder="admin@college.edu" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <Label>Password</Label>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-2">
                    <Button type="submit" className="w-full h-11 text-base">
                      Access Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </form>
              </Form>
              
              <div className="mt-6 text-xs text-muted-foreground text-center bg-muted p-3 rounded-md">
                Hint: admin@college.edu / admin123
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
