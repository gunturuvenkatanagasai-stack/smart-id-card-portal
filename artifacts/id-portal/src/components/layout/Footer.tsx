import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="border-t py-8 md:py-10 bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-6">
          <div className="flex flex-col gap-2 max-w-sm">
            <div className="font-bold text-base">DVR &amp; DR HS MIC College of Technology</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Kanchikacharla, Krishna District, Andhra Pradesh — 521180
            </p>
            <p className="text-xs text-muted-foreground">
              Approved by AICTE &bull; Affiliated to JNTUK
            </p>
            <a
              href="https://www.mictech.edu.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 w-fit"
            >
              www.mictech.edu.in
            </a>
          </div>

          <div className="flex flex-col gap-2">
            <div className="text-sm font-semibold mb-1">ID Card Reissue Portal</div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground transition-colors">Admin Access</Link>
              <Link href="/track" className="hover:text-foreground transition-colors">Track Request</Link>
              <a href="https://www.mictech.edu.in" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">College Website</a>
              <a href="mailto:office@mictech.ac.in" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </div>

        <div className="border-t pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} DVR &amp; DR HS MIC College of Technology. All rights reserved.</span>
          <span>ID Card Reissue Portal &mdash; Digital Administration System</span>
        </div>
      </div>
    </footer>
  );
}
