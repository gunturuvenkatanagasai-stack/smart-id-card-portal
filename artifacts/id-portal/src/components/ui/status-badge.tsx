import { Badge } from "@/components/ui/badge";

type StatusType = "pending" | "payment_pending" | "approved" | "ready_to_collect" | "collected";

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (s: string) => {
    switch (s) {
      case "pending":
        return { label: "Pending Verification", className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50" };
      case "payment_pending":
        return { label: "Payment Required", className: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800/50" };
      case "approved":
        return { label: "Approved for Printing", className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50" };
      case "ready_to_collect":
        return { label: "Ready to Collect", className: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800/50" };
      case "collected":
        return { label: "Collected", className: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" };
      default:
        return { label: s.replace(/_/g, " "), className: "bg-gray-100 text-gray-800 border-gray-200" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant="outline" className={`${config.className} ${className || ""}`}>
      {config.label}
    </Badge>
  );
}
