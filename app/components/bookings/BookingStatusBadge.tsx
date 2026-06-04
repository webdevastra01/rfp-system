import { Badge } from "@/components/ui/badge";
import { Booking } from "@/lib/interfaces";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    badge: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    badge: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50",
    icon: XCircle,
  },
} as const;

export default function BookingStatusBadge({
  status,
}: {
  status: Booking["status"];
}) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={`${config.badge} flex w-fit items-center gap-1.5 px-2.5 py-1 font-medium`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}
