"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Check,
  X,
  Calendar,
  User,
  Building2,
  Package,
  Truck,
  CreditCard,
} from "lucide-react";
import { DataTableCard, Column } from "@/app/components/cards/DataTableCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Item, Request, ReviewRequestProps } from "@/lib/interfaces";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Helper to calculate total from items
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
};

// Format currency - Updated to match ServiceOrder style
const formatCurrency = (value: string | number | undefined | null): string => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

export default function ReviewRequest({ requests }: ReviewRequestProps) {
  const [requestList, setRequestList] = useState<Request[]>(requests);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const supabase = createClient();

  const getStatusBadge = (
    status: Request["status"],
    rejectionReason?: string,
  ) => {
    const styles: Record<string, string> = {
      "for review": "bg-amber-50 text-amber-700 border-amber-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-rose-50 text-rose-700 border-rose-200",
    };

    const badge = (
      <Badge
        className={cn(
          styles[status] || "bg-slate-50 text-slate-700 border-slate-200",
          "border font-semibold",
        )}
        variant="secondary"
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );

    // Show tooltip only for rejected requests
    if (status === "rejected" && rejectionReason) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>{badge}</TooltipTrigger>
            <TooltipContent className="max-w-xs text-left">
              <p className="font-medium">Rejection Reason:</p>
              <p className="text-sm text-rose-100">{rejectionReason}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return badge;
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      High: "bg-rose-50 text-rose-700 border-rose-200",
      Medium: "bg-amber-50 text-amber-700 border-amber-200",
      Low: "bg-blue-50 text-blue-700 border-blue-200",
    };
    return (
      <Badge
        className={cn(
          styles[priority] || "bg-slate-50 text-slate-700 border-slate-200",
          "border font-semibold",
        )}
        variant="secondary"
      >
        {priority}
      </Badge>
    );
  };

  const handleView = (request: Request) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleActionClick = (
    request: Request,
    action: "approved" | "rejected",
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === "rejected" && !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    await handleUpdateStatus(
      selectedRequest,
      actionType, // ← Now directly passes "approved" or "rejected"
      {
        rejectionReason:
          actionType === "rejected" ? rejectionReason.trim() : undefined,
      },
    );

    // Reset
    setActionDialogOpen(false);
    setRejectionReason("");
    setSelectedRequest(null);
    setActionType(null);
  };

  async function handleUpdateStatus(
    request: Request,
    status: "approved" | "rejected",
    metadata?: { rejectionReason?: string }, // ← New optional parameter
  ) {
    try {
      const isServiceRequest = request.request_number.startsWith("SR");
      const table = isServiceRequest ? "service_requests" : "purchase_requests";

      const updatePayload: any = { status };

      // Add rejection reason if provided
      if (status === "rejected" && metadata?.rejectionReason) {
        updatePayload.rejection_reason = metadata.rejectionReason; // Use snake_case for DB
      }

      const { error } = await supabase
        .from(table)
        .update(updatePayload)
        .eq("id", request.id);

      if (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status", {
          description:
            error.message || "An error occurred while updating the request.",
        });
        return;
      }

      // Determine request type label
      const requestType = isServiceRequest
        ? "Service Request"
        : "Purchase Request";

      // Enhanced toast for rejection
      toast.success(
        status === "approved"
          ? `${requestType} approved successfully`
          : `${requestType} rejected successfully`,
        {
          description:
            status === "approved"
              ? `${requestType} ${request.request_number} has been approved.`
              : `${requestType} ${request.request_number} has been rejected.`,
        },
      );

      // Update UI
      setRequestList((prev) =>
        prev.map((req) =>
          req.id === request.id
            ? {
                ...req,
                status,
                ...(status === "rejected" &&
                  metadata?.rejectionReason && {
                    rejection_reason: metadata.rejectionReason,
                  }),
              }
            : req,
        ),
      );
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Unexpected error occurred", {
        description:
          "Please try again or contact support if the problem persists.",
      });
    }
  }

  // Stats calculation - Updated to match ServiceOrder style
  const stats = useMemo(
    () => [
      {
        title: "Total Requests",
        value: requestList.length,
        icon: FileText,
        color: "text-[#2B3A9F]",
        bgColor: "bg-[#EEF2FF]",
      },
      {
        title: "For Review",
        value: requestList.filter((r) => r.status === "for review").length,
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      },
      {
        title: "Approved",
        value: requestList.filter((r) => r.status === "approved").length,
        icon: CheckCircle,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      },
      {
        title: "Rejected",
        value: requestList.filter((r) => r.status === "rejected").length,
        icon: XCircle,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
      },
    ],
    [requestList],
  );

  // Define columns - Enhanced to match ServiceOrder style
  const columns: Column<Request>[] = [
    {
      key: "request_number",
      header: "Request #",
      width: "w-[140px]",
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-[#2B3A9F]">
          {row.request_number}
        </span>
      ),
    },
    {
      key: "title",
      header: "Title",
      width: "min-w-[200px]",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 line-clamp-1">
            {row.title}
          </span>
          <span className="text-xs text-slate-500">{row.service_category}</span>
        </div>
      ),
    },
    {
      key: "company",
      header: "Company / Dept",
      width: "w-[180px]",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{row.company}</span>
          <span className="text-xs text-slate-500">{row.department}</span>
        </div>
      ),
    },
    {
      key: "priority_level",
      header: "Priority",
      width: "w-[100px]",
      render: (row) => getPriorityBadge(row.priority_level),
    },
    {
      key: "status",
      header: "Status",
      width: "w-[120px]",
      render: (row) => getStatusBadge(row.status, row.rejection_reason), // ← Pass rejection reason
    },
    {
      key: "preferred_date",
      header: "Preferred Date",
      width: "w-[140px]",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {new Date(row.preferred_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      ),
    },
  ];

  const filterOptions = [
    { value: "for review", label: "For Review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8">
      {/* Header - Updated to match ServiceOrder */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          Service and Purchase Requests
        </h1>
        <p className="text-slate-500">
          Manage and track all incoming service and purchase requests in one
          place
        </p>
      </div>

      {/* Stats Grid - Updated to match ServiceOrder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="border-[#E2E8F0] shadow-sm bg-white hover:shadow-md transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stat.value}
                  </p>
                </div>
                <div className={cn("p-3 rounded-xl", stat.bgColor)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Table - Updated styling */}
      <DataTableCard
        data={requestList}
        columns={columns}
        keyExtractor={(row) => row.id}
        title="All Service and Purchase Requests"
        subtitle="Manage and track all incoming service and purchase requests"
        searchPlaceholder="Search requests..."
        searchable
        searchKeys={[
          "request_number",
          "title",
          "service_category",
          "company",
          "department",
        ]}
        filterable
        filterKey="status"
        filterOptions={filterOptions}
        pagination
        defaultPageSize={5}
        actions={(row) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleView(row)}
              className="h-8 px-3 text-xs font-medium border-[#E2E8F0] text-slate-700 hover:text-[#2B3A9F] hover:border-[#2B3A9F]/30 hover:bg-[#EEF2FF] transition-all"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View
            </Button>
            {row.status === "for review" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(row, "approved")}
                  className="h-8 px-3 text-xs font-medium border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all"
                >
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleActionClick(row, "rejected")}
                  className="h-8 px-3 text-xs font-medium border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 transition-all"
                >
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Reject
                </Button>
              </>
            )}
          </div>
        )}
      />

      {/* View Dialog - Completely redesigned to match ServiceOrder */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Request Details
                </DialogTitle>
                <DialogDescription className="text-slate-500 mt-1">
                  {selectedRequest?.request_number}
                </DialogDescription>
              </div>
              {selectedRequest &&
                getStatusBadge(
                  selectedRequest.status,
                  selectedRequest.rejection_reason,
                )}
            </div>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6 py-4">
              {/* Request Title & Description */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <h3 className="font-bold text-lg text-slate-900 mb-2">
                  {selectedRequest.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {selectedRequest.description}
                </p>
              </div>

              {/* Key Info Grid - Icon style like ServiceOrder */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#EEF2FF] text-[#2B3A9F]">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Company
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedRequest.company}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedRequest.department}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#EEF2FF] text-[#2B3A9F]">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Requested By
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedRequest.requested_by}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-[#EEF2FF] text-[#2B3A9F]">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Dates
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        Preferred:{" "}
                        {new Date(
                          selectedRequest.preferred_date,
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        Expected complition:{" "}
                        {new Date(
                          selectedRequest.expected_completion,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Service Category
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedRequest.service_category}
                      </p>
                      {getPriorityBadge(selectedRequest.priority_level)}
                    </div>
                  </div>

                  {selectedRequest.payment_method && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Payment
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedRequest.payment_method}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedRequest.vehicle?.plate_number && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Vehicle
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedRequest.vehicle.plate_number}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedRequest.vehicle.car_type} •{" "}
                          {selectedRequest.vehicle.owners_first_name}{" "}
                          {selectedRequest.vehicle.owners_last_name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vendor Info */}
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#2B3A9F]" />
                  Vendor Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                      Preferred Vendor
                    </p>
                    <p className="font-semibold text-slate-900">
                      {selectedRequest.preferred_vendor || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                      Contact Person
                    </p>
                    <p className="font-semibold text-slate-900">
                      {selectedRequest.contact_person || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table - Updated to match ServiceOrder */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#2B3A9F]" />
                  Requested Items ({selectedRequest.items.length})
                </h4>
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-[#F8FAFC]">
                      <TableRow className="border-b border-[#E2E8F0]">
                        <TableHead className="text-xs font-bold text-slate-600">
                          Item
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-600">
                          Description
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-600 text-center">
                          Qty
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-600 text-right">
                          Unit Price
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedRequest.items.map((item, index) => (
                        <TableRow
                          key={index}
                          className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F8FAFC] transition-colors"
                        >
                          <TableCell className="font-medium text-slate-900">
                            {item.name}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {item.description}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#EEF2FF] text-[#2B3A9F]">
                              {item.quantity} {item.unit}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-slate-600">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-3 flex justify-end">
                  <div className="bg-[#EEF2FF] rounded-lg px-4 py-2 border border-[#2B3A9F]/20">
                    <span className="text-sm text-slate-600 mr-2">
                      Total Estimated Cost:
                    </span>
                    <span className="text-lg font-bold text-[#2B3A9F] font-mono">
                      {formatCurrency(calculateTotal(selectedRequest.items))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supporting Documents */}
              {selectedRequest.supporting_documents &&
                selectedRequest.supporting_documents.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#2B3A9F]" />
                      Supporting Documents
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.supporting_documents.map(
                        (doc, index) => (
                          <a
                            key={index}
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EEF2FF] text-[#2B3A9F] text-sm font-medium hover:bg-[#2B3A9F] hover:text-white transition-colors"
                          >
                            <FileText className="h-4 w-4" />
                            Document {index + 1}
                          </a>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter className="border-t border-[#E2E8F0] pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="border-[#E2E8F0] text-slate-700 hover:bg-[#F8FAFC]"
            >
              Close
            </Button>
            {selectedRequest?.status === "for review" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleActionClick(selectedRequest, "rejected");
                  }}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleActionClick(selectedRequest, "approved");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog - Updated styling */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {actionType === "approved" ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-600" />
              )}
              {actionType === "approved" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Are you sure you want to{" "}
              {actionType === "approved" ? "approve" : "reject"}{" "}
              <span className="font-semibold text-slate-900">
                {selectedRequest?.request_number}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          {/* Rejection Reason - Fixed condition */}
          {actionType === "rejected" && (
            <div className="space-y-2 py-2">
              <Label
                htmlFor="rejectionReason"
                className="text-sm text-slate-700"
              >
                Reason for Rejection <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter reason for rejecting this request..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px] resize-y border-[#E2E8F0]"
              />
              <p className="text-xs text-slate-500">
                This reason will be visible to the requester.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setActionDialogOpen(false);
                setRejectionReason("");
              }}
              className="border-[#E2E8F0] text-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={actionType === "rejected" && !rejectionReason.trim()}
              className={
                actionType === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }
            >
              {actionType === "approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
