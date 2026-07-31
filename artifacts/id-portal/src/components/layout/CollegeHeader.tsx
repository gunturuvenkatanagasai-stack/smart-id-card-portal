export function CollegeHeader() {
  return (
    <div className="w-full bg-primary text-primary-foreground border-b border-primary-foreground/10">
      <div className="container mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-4">
          <a href="https://www.mictech.edu.in" target="_blank" rel="noopener noreferrer" className="shrink-0">
            <img
              src="https://www.mictech.edu.in/images/logo-small.png"
              alt="MIC College of Technology Logo"
              className="w-16 h-16 object-contain rounded-full bg-white p-1 shadow-md"
            />
          </a>

          <div className="text-center sm:text-left">
            <div className="text-xs font-medium text-primary-foreground/70 uppercase tracking-widest mb-0.5">
              Autonomous | Approved by AICTE | Affiliated to JNTUK, Kakinada
            </div>
            <h1 className="text-base md:text-lg font-bold leading-tight tracking-tight">
              DVR &amp; DR HS MIC COLLEGE OF TECHNOLOGY
            </h1>
            <div className="text-xs text-primary-foreground/80 mt-0.5 flex items-center gap-1 justify-center sm:justify-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              Kanchikacharla, Krishna District, Andhra Pradesh — 521180
            </div>
          </div>
        </div>

        <div className="sm:ml-auto flex flex-col items-center sm:items-end gap-1 text-xs text-primary-foreground/70">
          <a
            href="https://www.mictech.edu.in"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-primary-foreground transition-colors underline underline-offset-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            www.mictech.edu.in
          </a>
          <span>Vijayawada Region, A.P.</span>
        </div>
      </div>
    </div>
  );
}
