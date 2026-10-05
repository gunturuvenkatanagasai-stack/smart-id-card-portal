import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Download, Printer, CheckCircle, Clock } from "lucide-react";
import type { ReissueRequest } from "@workspace/api-client-react";

const COLLEGE_LOGO = "https://www.mictech.edu.in/images/logo-small.png";

type ReceiptModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ReissueRequest;
};

// Generate a simple vector SVG QR code representation for the application ID
function QRCodeSvg({ text }: { text: string }) {
  // Create a deterministic pattern based on the text hash
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  const cells = [];
  const size = 15;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      // Keep corner positioning squares
      const isTopLeftCorner = row < 4 && col < 4;
      const isTopRightCorner = row < 4 && col >= size - 4;
      const isBottomLeftCorner = row >= size - 4 && col < 4;
      const isCornerBorder =
        (row === 0 || row === 3) && col < 4 ||
        (col === 0 || col === 3) && row < 4 ||
        (row === 0 || row === 3) && col >= size - 4 ||
        (col === size - 1 || col === size - 4) && row < 4 ||
        (row === size - 1 || row === size - 4) && col < 4 ||
        (col === 0 || col === 3) && row >= size - 4;

      const isCornerCenter =
        (row === 1 || row === 2) && (col === 1 || col === 2) ||
        (row === 1 || row === 2) && (col === size - 3 || col === size - 2) ||
        (row === size - 3 || row === size - 2) && (col === 1 || col === 2);

      let isFilled = false;
      if (isTopLeftCorner || isTopRightCorner || isBottomLeftCorner) {
        isFilled = isCornerBorder || isCornerCenter;
      } else {
        const val = Math.abs(hash * (row + 1) * 31 + (col + 1) * 17);
        isFilled = val % 3 === 0;
      }

      if (isFilled) {
        cells.push(
          <rect
            key={`${row}-${col}`}
            x={col * 10}
            y={row * 10}
            width={10}
            height={10}
            fill="#1e3a8a"
          />
        );
      }
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white border-2 border-blue-900 rounded-xl shadow-inner">
      <svg viewBox="0 0 150 150" className="w-32 h-32">
        <rect width="150" height="150" fill="#ffffff" />
        {cells}
      </svg>
      <div className="mt-1.5 font-mono text-[10px] font-bold text-blue-950 tracking-wider">
        {text}
      </div>
    </div>
  );
}

export function ReceiptModal({ open, onOpenChange, request }: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-border/80 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Official ID Card Reissue Receipt</DialogTitle>
          <DialogDescription>Receipt for application {request.requestNumber}</DialogDescription>
        </DialogHeader>

        {/* Printable Area */}
        <div id="printable-receipt" className="p-6 bg-white text-slate-900 font-sans">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
            <img src={COLLEGE_LOGO} alt="MIC College" className="w-12 h-12 rounded-full border border-slate-200 p-0.5" />
            <div>
              <h3 className="text-base font-bold leading-tight text-blue-950">
                DVR &amp; DR HS MIC College of Technology
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">Autonomous Institution | Kanchikacharla</p>
              <div className="text-[11px] font-bold text-blue-700 tracking-wide mt-0.5">
                ID CARD REISSUE PAYMENT RECEIPT
              </div>
            </div>
          </div>

          {/* Status Ribbon */}
          <div className="my-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-emerald-900">Payment Status: SUCCESS</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 font-bold">₹200.00</span>
          </div>

          {/* Details Grid */}
          <div className="space-y-2.5 text-xs mb-5">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Application ID:</span>
              <span className="font-mono font-bold text-slate-900">{request.requestNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Student Name:</span>
              <span className="font-semibold text-slate-900">{request.studentName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Register Number:</span>
              <span className="font-mono font-bold text-slate-900">{request.registerNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Department &amp; Year:</span>
              <span className="font-medium text-slate-900">{request.branch} ({request.year} Year)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono text-slate-900">{request.paymentId || "TXN-AUTO-9988"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Payment Method:</span>
              <span className="font-medium text-slate-900 capitalize">{request.paymentMethod || "UPI / Net Banking"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Paid Date:</span>
              <span className="font-medium text-slate-900">
                {request.paidAt ? new Date(request.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* QR Code Verification Section */}
          <div className="flex flex-col items-center justify-center pt-2">
            <QRCodeSvg text={request.requestNumber} />
            <p className="text-[10px] text-center text-slate-500 mt-2 max-w-xs">
              Present this QR receipt at the <strong>ID Card Department</strong> for physical identity verification and ID card collection.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs">
            <Printer className="w-4 h-4 mr-1.5" />
            Print Receipt
          </Button>
          <Button size="sm" onClick={handlePrint} className="text-xs bg-blue-700 hover:bg-blue-800">
            <Download className="w-4 h-4 mr-1.5" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
