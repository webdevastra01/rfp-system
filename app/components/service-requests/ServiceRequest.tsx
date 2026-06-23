"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
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
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Package,
  AlertCircle,
  User,
  Building2,
  Calendar,
  CreditCard,
  Truck,
} from "lucide-react";
import { DataTableCard, Column } from "@/app/components/cards/DataTableCard";
import {
  priorityConfig,
  Request,
  ServiceRequestPageProps,
  statusConfig,
} from "@/lib/interfaces";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ServiceRequest({
  requests,
  module,
}: ServiceRequestPageProps) {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const getStatusBadge = (
    status: keyof typeof statusConfig,
    rejectionReason?: string,
  ) => {
    const config = statusConfig[status];

    const badge = (
      <Badge
        className={`${config.bgColor} ${config.color} border ${config.borderColor}`}
        variant="secondary"
      >
        {config.label}
      </Badge>
    );

    // Show tooltip only for rejected status
    if (status === "rejected" && rejectionReason?.trim()) {
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

  const getPriorityBadge = (priority: keyof typeof priorityConfig) => {
    const config = priorityConfig[priority];
    return (
      <Badge
        className={`${config.bgColor} ${config.color} border ${config.borderColor}`}
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

  // Stats calculation
  const stats = [
    {
      title: "Total Requests",
      value: requests.length,
      icon: FileText,
      color: "text-[#2B3A9F]",
      bgColor: "bg-[#2B3A9F]/10",
    },
    {
      title: "Submitted",
      value: requests.filter((r) => r.status === "submitted").length,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Approved",
      value: requests.filter((r) => r.status === "approved").length,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Rejected",
      value: requests.filter((r) => r.status === "rejected").length,
      icon: XCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  ];

  // Define columns for Service Requests
  const columns: Column<Request>[] = [
    { key: "request_number", header: "Request ID", width: "w-[140px]" },
    { key: "title", header: "Request Title", width: "min-w-[200px]" },
    { key: "service_category", header: "Service Type", width: "w-[160px]" },
    {
      key: "requestor",
      header: "Requestor",
      width: "w-[140px]",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.requested_by}</span>
          <span className="text-xs text-slate-500">{row.department}</span>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      width: "w-[100px]",
      render: (row) => getPriorityBadge(row.priority_level),
    },
    {
      key: "status",
      header: "Status",
      width: "w-[110px]",
      render: (row) => getStatusBadge(row.status, row.rejection_reason), // ← Added rejection_reason
    },
  ];

  const filterOptions = [
    { value: "submitted", label: "Submitted" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(value);
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-50/50">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Service Requests
        </h1>
        <p className="text-slate-500">
          Manage and track all your service requests in one place
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-0 shadow-sm bg-white">
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
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Table Card - Only View Action */}
      <DataTableCard
        data={requests}
        columns={columns}
        keyExtractor={(row) => row.id}
        title="All Service Requests"
        subtitle="View and manage your service requests"
        searchPlaceholder="Search requests..."
        searchable
        searchKeys={[
          "id",
          "title",
          "service_category",
          "requested_by",
          "department",
        ]}
        filterable
        filterKey="status"
        filterOptions={filterOptions}
        pagination
        defaultPageSize={5}
        headerActions={
          <Button
            className="bg-[#2B3A9F] hover:bg-[#2B3A9F]/90 text-white"
            onClick={() =>
              router.push(`/home/${module}/service-requests/create-sr`)
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Service Request
          </Button>
        }
        actions={(row) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleView(row)}
            className="h-8 px-3 text-xs font-medium border-slate-200 text-slate-700 hover:text-[#2B3A9F] hover:border-[#2B3A9F]/30 hover:bg-[#2B3A9F]/5"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View
          </Button>
        )}
      />

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto p-0 gap-0">
          {/* Header with gradient accent */}
          <div className="h-1.5 bg-gradient-to-r from-[#2B3A9F] via-[#3B4DB8] to-[#14B8A6]" />

          <DialogHeader className="px-6 py-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight truncate">
                  Service Request Details
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[#2B3A9F] font-semibold">
                    {selectedRequest?.request_number}
                  </span>
                  <span className="text-[#CBD5E1] hidden sm:inline">•</span>
                  <span className="truncate">
                    View complete request information
                  </span>
                </DialogDescription>
              </div>
              {selectedRequest && (
                <div className="shrink-0">
                  {getStatusBadge(
                    selectedRequest.status,
                    selectedRequest.rejection_reason,
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          {selectedRequest && (
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Title & Description Card */}
              <div className="bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0]">
                <h3 className="font-bold text-lg text-slate-900 mb-2">
                  {selectedRequest.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {selectedRequest.description}
                </p>
              </div>

              {/* Info Grid - Responsive: 1 col mobile, 2 col tablet+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Service Category */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                  <div className="p-2 rounded-lg bg-[#EEF2FF] text-[#2B3A9F] shrink-0">
                    <Package className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Service Category
                    </p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedRequest.service_category}
                    </p>
                  </div>
                </div>

                {/* Priority */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Priority Level
                    </p>
                    <div className="mt-0.5">
                      {getPriorityBadge(selectedRequest.priority_level)}
                    </div>
                  </div>
                </div>

                {/* Requested By */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                  <div className="p-2 rounded-lg bg-[#EEF2FF] text-[#2B3A9F] shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Requested By
                    </p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedRequest.requested_by}
                    </p>
                  </div>
                </div>

                {/* Department */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                  <div className="p-2 rounded-lg bg-[#EEF2FF] text-[#2B3A9F] shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Department
                    </p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedRequest.department}
                    </p>
                  </div>
                </div>

                {/* Company */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Company
                    </p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedRequest.company}
                    </p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Payment Method
                    </p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {selectedRequest.payment_method}
                    </p>
                  </div>
                </div>

                {/* Preferred Date */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Preferred Date
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(
                        selectedRequest.preferred_date,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Required By */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                  <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Required By
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(selectedRequest.required_by).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>

                {/* Expected Completion */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors sm:col-span-2">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                      Expected Completion
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(
                        selectedRequest.expected_completion,
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vendor Information */}
              {(selectedRequest.preferred_vendor ||
                selectedRequest.contact_person) && (
                <div className="border border-[#E2E8F0] rounded-xl p-5 bg-white">
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-[#EEF2FF]">
                      <Building2 className="h-4 w-4 text-[#2B3A9F]" />
                    </div>
                    Vendor Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedRequest.preferred_vendor && (
                      <div className="p-3 rounded-lg bg-[#F8FAFC]">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Preferred Vendor
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedRequest.preferred_vendor}
                        </p>
                      </div>
                    )}
                    {selectedRequest.contact_person && (
                      <div className="p-3 rounded-lg bg-[#F8FAFC]">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Contact Person
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedRequest.contact_person}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vehicle Information */}
              {selectedRequest.vehicle?.plate_number && (
                <div className="border border-[#E2E8F0] rounded-xl p-5 bg-white">
                  <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-amber-50">
                      <Truck className="h-4 w-4 text-amber-600" />
                    </div>
                    Vehicle Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 rounded-lg bg-[#F8FAFC]">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Plate Number
                      </p>
                      <p className="text-sm font-semibold text-slate-900 font-mono">
                        {selectedRequest.vehicle.plate_number}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F8FAFC]">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Vehicle Type
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedRequest.vehicle.car_type}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#F8FAFC]">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                        Owner
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedRequest.vehicle.owners_first_name}{" "}
                        {selectedRequest.vehicle.owners_last_name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Table */}
              {selectedRequest.items?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-[#EEF2FF]">
                      <Package className="h-4 w-4 text-[#2B3A9F]" />
                    </div>
                    Requested Items ({selectedRequest.items.length})
                  </h4>
                  <div className="border border-[#E2E8F0] rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-[#F8FAFC]">
                        <TableRow className="border-b border-[#E2E8F0] hover:bg-transparent">
                          <TableHead className="text-xs font-bold text-slate-600 py-3">
                            Item
                          </TableHead>
                          <TableHead className="text-xs font-bold text-slate-600 py-3 text-center w-24">
                            Qty
                          </TableHead>
                          <TableHead className="text-xs font-bold text-slate-600 py-3 text-right w-28">
                            Unit Price
                          </TableHead>
                          <TableHead className="text-xs font-bold text-slate-600 py-3 text-right w-28">
                            Total
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRequest.items.map((item, index) => {
                          const qty = parseFloat(item.quantity) || 0;
                          const price = parseFloat(item.unitPrice) || 0;
                          const total = qty * price;
                          return (
                            <TableRow
                              key={index}
                              className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F8FAFC]"
                            >
                              <TableCell className="py-3">
                                <div className="flex flex-col">
                                  <span className="font-medium text-slate-900 text-sm">
                                    {item.name}
                                  </span>
                                  <span className="text-xs text-slate-500 line-clamp-1">
                                    {item.description}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#EEF2FF] text-[#2B3A9F]">
                                  {item.quantity} {item.unit}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-mono text-slate-600 text-sm py-3">
                                {formatCurrency(price)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold text-slate-900 text-sm py-3">
                                {formatCurrency(total)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <div className="bg-[#EEF2FF] rounded-lg px-4 py-2 border border-[#2B3A9F]/20">
                      <span className="text-sm text-slate-600 mr-2">
                        Total Estimated Cost:
                      </span>
                      <span className="text-lg font-bold text-[#2B3A9F] font-mono">
                        {formatCurrency(
                          selectedRequest.items.reduce((sum, item) => {
                            const qty = parseFloat(item.quantity) || 0;
                            const price = parseFloat(item.unitPrice) || 0;
                            return sum + qty * price;
                          }, 0),
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Supporting Documents */}
              {selectedRequest.supporting_documents?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-[#EEF2FF]">
                      <FileText className="h-4 w-4 text-[#2B3A9F]" />
                    </div>
                    Supporting Documents
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.supporting_documents.map((doc, index) => (
                      <a
                        key={index}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EEF2FF] text-[#2B3A9F] text-sm font-medium hover:bg-[#2B3A9F] hover:text-white transition-all border border-[#2B3A9F]/20 hover:border-[#2B3A9F]"
                      >
                        <FileText className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">
                          {doc.split("/").pop()?.split("?")[0] ||
                            `Document ${index + 1}`}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="sm:max-w-3xl max-h-[85vh] overflow-y-auto p-4 gap-0">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="border-[#E2E8F0] text-slate-700 hover:bg-white hover:text-[#2B3A9F] hover:border-[#2B3A9F]/30 transition-all w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
