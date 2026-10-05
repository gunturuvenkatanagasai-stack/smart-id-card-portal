import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CreditCard, Download, Search, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

const COLLEGE_LOGO = "https://www.mictech.edu.in/images/logo-small.png";
const CAMPUS_PHOTO_1 = "https://www.mictech.edu.in/images/background/1.jpg";
const CAMPUS_PHOTO_2 = "https://www.mictech.edu.in/images/main-slider/mobile-banner2.jpg";
const CAMPUS_ABOUT = "https://www.mictech.edu.in/images/education-system.jpg";
const BUILDING_PHOTO = "https://www.mictech.edu.in/images/resource/about-1.jpg";

export default function Home() {
  const { studentEmail } = useAuth();
  const steps = [
    {
      title: "Verify Identity",
      description: "Login with your college email address to begin the application.",
      icon: <CheckCircle2 className="w-6 h-6 text-primary" />,
    },
    {
      title: "Submit Details",
      description: "Provide your register number, branch, and reason for reissue.",
      icon: <FileText className="w-6 h-6 text-primary" />,
    },
    {
      title: "Pay Fee",
      description: "Securely pay the ₹200 reissue fee online via UPI, debit card, or net banking.",
      icon: <CreditCard className="w-6 h-6 text-primary" />,
    },
    {
      title: "Track Status",
      description: "Monitor your application progress in real-time from any device.",
      icon: <Search className="w-6 h-6 text-primary" />,
    },
    {
      title: "Download Receipt",
      description: "Get your payment and application receipt instantly.",
      icon: <Download className="w-6 h-6 text-primary" />,
    },
    {
      title: "Collect ID",
      description: "Show your receipt at the ID Card Department to collect your new card.",
      icon: <CheckCircle2 className="w-6 h-6 text-primary" />,
    },
  ];

  return (
    <div className="flex flex-col flex-1">

      {/* Hero — split layout with real campus photo */}
      <section className="bg-primary text-primary-foreground relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[520px] items-center gap-0">

            {/* Left: text */}
            <motion.div
              className="py-16 md:py-20 pr-0 lg:pr-12"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={COLLEGE_LOGO}
                  alt="MIC College Logo"
                  className="w-9 h-9 rounded-full bg-white object-contain p-0.5"
                />
                <span className="text-xs font-semibold text-primary-foreground/70 uppercase tracking-widest">
                  DVR &amp; DR HS MIC College of Technology
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-5">
                Official ID Card<br />Reissue Portal
              </h1>
              <p className="text-base md:text-lg text-primary-foreground/80 mb-8 max-w-xl">
                Lost or damaged your college ID? Apply for a replacement entirely online — no HOD visit, no principal's office, no queue. Track your status and collect directly from the ID Card Department.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={studentEmail ? "/student/dashboard" : "/login"}>
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto font-semibold">
                    {studentEmail ? "Go to Student Dashboard" : "Start Application"}
                  </Button>
                </Link>
                <Link href="/track">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent border-primary-foreground/30 hover:bg-primary-foreground/10 text-primary-foreground">
                    Track Existing Request
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right: campus photo */}
            <motion.div
              className="hidden lg:block relative h-full min-h-[520px]"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <img
                src={CAMPUS_PHOTO_1}
                alt="MIC College of Technology Campus"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/40 to-transparent"></div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* College Building Photo — full width, high quality */}
      <section className="relative w-full overflow-hidden" style={{ height: "380px" }}>
        <motion.img
          src={BUILDING_PHOTO}
          alt="DVR & DR HS MIC College of Technology — Main Building"
          className="w-full h-full object-cover object-center"
          initial={{ scale: 1.06 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <motion.div
            className="max-w-5xl mx-auto flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div>
              <div className="text-white/80 text-sm font-medium mb-1 uppercase tracking-widest">
                Kanchikacharla, Krishna District, Andhra Pradesh
              </div>
              <div className="text-white text-xl md:text-2xl font-bold">
                DVR &amp; DR HS MIC College of Technology
              </div>
            </div>
            <Link href="/login">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold shrink-0 shadow-lg">
                Start Application
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* College Campus Section */}
      <section className="py-14 bg-muted/20 border-b">
        <div className="container mx-auto px-4 md:px-8">
          <motion.div
            className="flex flex-col md:flex-row gap-8 items-center max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {/* Campus images */}
            <div className="flex gap-3 w-full md:w-1/2 shrink-0">
              <div className="flex-1 rounded-xl overflow-hidden shadow-md aspect-[4/3]">
                <img
                  src={CAMPUS_ABOUT}
                  alt="MIC College of Technology"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="flex-1 rounded-xl overflow-hidden shadow-md aspect-[4/3]">
                <img
                  src={CAMPUS_PHOTO_2}
                  alt="MIC College Campus"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>

            {/* College info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={COLLEGE_LOGO}
                  alt="MIC College Logo"
                  className="w-14 h-14 rounded-full bg-white object-contain p-1 border shadow-sm"
                />
                <div>
                  <div className="font-bold text-lg leading-tight">DVR &amp; DR HS MIC College of Technology</div>
                  <div className="text-sm text-muted-foreground">Autonomous Institution</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Established in 2002, MIC College of Technology is a premier autonomous engineering institution in the Vijayawada region. Accredited with NAAC "A+" Grade, NBA accreditation, and ISO 9001:2015 certification.
              </p>
              <div className="flex flex-wrap gap-2 text-xs mb-5">
                {["NAAC A+ Grade", "NBA Accredited", "ISO 9001:2015", "AICTE Approved", "JNTUK Affiliated"].map((tag) => (
                  <span key={tag} className="bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">{tag}</span>
                ))}
              </div>
              <a
                href="https://www.mictech.edu.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Visit College Website
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground">The replacement process has been completely digitized. Follow these 6 steps to get your new ID card.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="h-full border-border/50 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                      {step.icon}
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm font-bold text-muted-foreground">0{index + 1}</span>
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Note */}
      <section className="py-12 bg-muted/30 border-t">
        <div className="container mx-auto px-4 md:px-8">
          <div className="bg-card border rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center max-w-4xl mx-auto">
            <div className="bg-amber-100 p-4 rounded-full text-amber-600 shrink-0">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-2">Important Information</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                The standard fee for a replacement ID card is <strong>₹200</strong>. Processing typically takes 2–3 working days after payment confirmation. You will be notified via email when your card is ready for collection at the <strong>ID Card Department, DVR &amp; DR HS MIC College of Technology</strong>, Kanchikacharla, Krishna District, Andhra Pradesh.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
