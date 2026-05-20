import {
  XCircle,
  User,
  Car,
  MapPin,
  FileText,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Booking } from "@/lib/interfaces";
import BookingStatusBadge from "./BookingStatusBadge";

function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingDetailDialog({
  booking,
  open,
  onOpenChange,
}: {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <FileText className="h-5 w-5 text-[#2B3A9F]" />
            Booking Details
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Reference: {booking.reference}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          {/* Status Banner */}
          <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700">
                Status:
              </span>
              <BookingStatusBadge status={booking.status} />
            </div>
            <span className="text-xs text-slate-500">
              Requested {formatDateTime(booking.requestedAt)}
            </span>
          </div>

          {/* Primary Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Requester
              </label>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <User className="h-4 w-4 text-slate-400" />
                {booking.requester}
              </div>
              <p className="text-xs text-slate-500">{booking.department}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Vehicle
              </label>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <Car className="h-4 w-4 text-slate-400" />
                {booking.vehicleType}
              </div>
              <p className="text-xs text-slate-500">ID: {booking.vehicleId}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Destination
              </label>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <MapPin className="h-4 w-4 text-slate-400" />
                {booking.destination}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Passengers
              </label>
              <div className="text-sm font-medium text-slate-900">
                {booking.passengers}{" "}
                {booking.passengers === 1 ? "person" : "people"}
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Schedule
            </label>
            <div className="grid grid-cols-2 gap-4 rounded-lg border border-[#E2E8F0] p-4">
              <div>
                <p className="text-xs text-slate-500">Start</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatDate(booking.startDate)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatTime(booking.startDate)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">End</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatDate(booking.endDate)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatTime(booking.endDate)}
                </p>
              </div>
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Purpose
            </label>
            <p className="rounded-lg border border-[#E2E8F0] p-3 text-sm text-slate-700">
              {booking.purpose}
            </p>
          </div>

          {/* Approval Info */}
          {(booking.approver || booking.rejectionReason) && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Approval Details
              </label>
              <div className="rounded-lg border border-[#E2E8F0] p-4 space-y-2">
                {booking.approver && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Approved by:</span>
                    <span className="font-medium text-slate-900">
                      {booking.approver}
                    </span>
                    {booking.approvedAt && (
                      <span className="text-xs text-slate-400">
                        at {formatDateTime(booking.approvedAt)}
                      </span>
                    )}
                  </div>
                )}
                {booking.rejectionReason && (
                  <div className="flex items-start gap-2 text-sm">
                    <XCircle className="mt-0.5 h-4 w-4 text-rose-400" />
                    <div>
                      <span className="text-slate-500">Reason:</span>
                      <span className="ml-1 font-medium text-rose-700">
                        {booking.rejectionReason}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
