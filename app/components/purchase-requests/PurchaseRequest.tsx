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
  Users,
  User,
  Building2,
  DollarSign,
  Package,
  AlertCircle,
  Building,
  Contact,
  Calendar,
  CreditCard,
  Car,
  ShoppingCart,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import { DataTableCard, Column } from "@/app/components/cards/DataTableCard";
import { Item, PurchaseRequestPageProps, Request } from "@/lib/interfaces";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PurchaseRequest({
  requests,
  module,
}: PurchaseRequestPageProps) {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const getStatusBadge = (
    status: Request["status"],
    rejectionReason?: string,
  ) => {
    const styles: Record<string, string> = {
      "for review": "bg-amber-100 text-amber-700",
      approved: "bg-emerald-100 text-emerald-700",
      rejected: "bg-rose-100 text-rose-700",
    };

    const badge = (
      <Badge
        className={styles[status] || "bg-slate-100 text-slate-700"}
        variant="secondary"
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );

    // Show tooltip for rejected requests
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

  // Define columns for Purchase Requests
  const columns: Column<Request>[] = [
    { key: "request_number", header: "Request ID", width: "w-[140px]" },
    { key: "title", header: "Request Title", width: "min-w-[200px]" },
    { key: "service_category", header: "Purchase Type", width: "w-[180px]" },
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
      key: "status",
      header: "Status",
      width: "w-[110px]",
      render: (row) => getStatusBadge(row.status, row.rejection_reason), // ← Updated
    },
  ];

  const filterOptions = [
    { value: "submitted", label: "Submitted" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const calculateTotal = (items: Item[]): number => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString();
  const formatCurrency = (amount: number) => `₱${amount.toFixed(2)}`;

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-50/50">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Purchase Requests
        </h1>
        <p className="text-slate-500">
          Manage and track all your purchase requests in one place
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
        title="All Purchase Requests"
        subtitle="View and manage your purchase requests"
        searchPlaceholder="Search requests..."
        searchable
        searchKeys={[
          "id",
          "title",
          "service_category",
          "requested_by",
          "department",
          "preferred_vendor",
        ]}
        filterable
        filterKey="status"
        filterOptions={filterOptions}
        pagination
        defaultPageSize={5}
        headerActions={
          <Button
            className="bg-[#2B3A9F] hover:bg-[#2B3A9F]/90 text-white shadow-lg shadow-[#2B3A9F]/25 transition-all hover:shadow-xl hover:shadow-[#2B3A9F]/20"
            onClick={() =>
              router.push(`/home/${module}/purchase-requests/create-pr`)
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Purchase Request
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
        <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
          {/* Header with gradient accent */}
          <div className="h-1.5 bg-gradient-to-r from-[#2B3A9F] via-[#3B4DB8] to-[#14B8A6]" />

          <DialogHeader className="px-6 py-5 border-b border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold text-slate-900 tracking-tight">
                  {selectedRequest?.title || "Purchase Request Details"}
                </DialogTitle>

                <DialogDescription className="text-sm text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[#2B3A9F] font-semibold">
                    {selectedRequest?.request_number}
                  </span>
                  <span className="text-[#CBD5E1] hidden sm:inline">•</span>
                  <span>{selectedRequest?.company}</span>
                </DialogDescription>
              </div>

              {selectedRequest && (
                <div className="shrink-0 flex items-center gap-2">
                  {getStatusBadge(
                    selectedRequest.status,
                    selectedRequest.rejection_reason,
                  )}

                  <Badge
                    variant={
                      selectedRequest.priority_level === "high"
                        ? "destructive"
                        : selectedRequest.priority_level === "medium"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {selectedRequest.priority_level?.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>

            {/* Rejection Reason - shown when status is rejected */}
            {selectedRequest?.status === "rejected" &&
              selectedRequest.rejection_reason?.trim() && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="font-medium text-red-700">Rejection Reason:</p>
                  <p className="mt-1 text-red-600 leading-relaxed">
                    {selectedRequest.rejection_reason}
                  </p>
                </div>
              )}
          </DialogHeader>

          {selectedRequest ? (
            <>
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Title & Description */}
                <div className="bg-[#F8FAFC] p-5 rounded-xl border border-[#E2E8F0] space-y-3">
                  <h3 className="font-semibold text-slate-900">
                    {selectedRequest.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {selectedRequest.description}
                  </p>
                </div>

                {/* Main Info Grid - 3 columns on large screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Request Number */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                    <div className="p-2 rounded-lg bg-[#EEF2FF] text-[#2B3A9F] shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Request Number
                      </p>
                      <p className="text-sm font-semibold text-slate-900 font-mono truncate">
                        {selectedRequest.request_number}
                      </p>
                    </div>
                  </div>

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

                  {/* Priority Level */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                    <div className="p-2 rounded-lg bg-red-50 text-red-600 shrink-0">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Priority
                      </p>
                      <p className="text-sm font-semibold text-slate-900 capitalize">
                        {selectedRequest.priority_level}
                      </p>
                    </div>
                  </div>

                  {/* Company */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      <Building className="h-4 w-4" />
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

                  {/* Department */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                      <Users className="h-4 w-4" />
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

                  {/* Total Amount */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Total Amount
                      </p>
                      <p className="text-sm font-semibold text-slate-900 font-mono">
                        {formatCurrency(calculateTotal(selectedRequest.items))}
                      </p>
                    </div>
                  </div>

                  {/* Preferred Vendor */}
                  {selectedRequest.preferred_vendor && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                      <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                          Preferred Vendor
                        </p>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {selectedRequest.preferred_vendor}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Contact Person */}
                  {selectedRequest.contact_person && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                      <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                        <Contact className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                          Contact Person
                        </p>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {selectedRequest.contact_person}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Requested By */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
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

                  {/* Required By */}
                  {selectedRequest.required_by && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                      <div className="p-2 rounded-lg bg-rose-50 text-rose-600 shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                          Required By
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatDate(selectedRequest.required_by)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Preferred Date */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                    <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600 shrink-0">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Preferred Date
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDate(selectedRequest.preferred_date)}
                      </p>
                    </div>
                  </div>

                  {/* Expected Completion */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-600 shrink-0">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                        Expected Completion
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatDate(selectedRequest.expected_completion)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  {selectedRequest.payment_method && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#2B3A9F]/30 transition-colors">
                      <div className="p-2 rounded-lg bg-orange-50 text-orange-600 shrink-0">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                          Payment Method
                        </p>
                        <p className="text-sm font-semibold text-slate-900 capitalize">
                          {selectedRequest.payment_method}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vehicle Section */}
                {selectedRequest.vehicle && (
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                    <div className="bg-[#F8FAFC] px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
                      <Car className="h-4 w-4 text-[#2B3A9F]" />
                      <h4 className="font-semibold text-slate-900 text-sm">
                        Vehicle Information
                      </h4>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">
                          Plate Number
                        </p>
                        <p className="text-sm font-semibold text-slate-900 font-mono">
                          {selectedRequest.vehicle.plate_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">
                          Type
                        </p>
                        <p className="text-sm font-semibold text-slate-900 capitalize">
                          {selectedRequest.vehicle.car_type}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">
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
                {selectedRequest.items && selectedRequest.items.length > 0 && (
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                    <div className="bg-[#F8FAFC] px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-[#2B3A9F]" />
                      <h4 className="font-semibold text-slate-900 text-sm">
                        Request Items ({selectedRequest.items.length})
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-[#F8FAFC] text-xs uppercase text-slate-500">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold">
                              Item
                            </th>
                            <th className="px-4 py-2 text-left font-semibold">
                              Description
                            </th>
                            <th className="px-4 py-2 text-right font-semibold">
                              Qty
                            </th>
                            <th className="px-4 py-2 text-right font-semibold">
                              Unit Price
                            </th>
                            <th className="px-4 py-2 text-right font-semibold">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E2E8F0]">
                          {selectedRequest.items.map((item, idx) => (
                            <tr
                              key={idx}
                              className="bg-white hover:bg-[#F8FAFC]"
                            >
                              <td className="px-4 py-3 font-medium text-slate-900">
                                {item.name}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                {item.description}
                              </td>
                              <td className="px-4 py-3 text-right font-mono">
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-right font-mono">
                                {formatCurrency(Number(item.unitPrice))}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-semibold">
                                {formatCurrency(
                                  Number(item.quantity) *
                                    Number(item.unitPrice),
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Supporting Documents */}
                {selectedRequest.supporting_documents &&
                  selectedRequest.supporting_documents.length > 0 && (
                    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                      <div className="bg-[#F8FAFC] px-4 py-3 border-b border-[#E2E8F0] flex items-center gap-2">
                        <Paperclip className="h-4 w-4 text-[#2B3A9F]" />
                        <h4 className="font-semibold text-slate-900 text-sm">
                          Supporting Documents
                        </h4>
                      </div>
                      <div className="p-4 flex flex-wrap gap-2">
                        {selectedRequest.supporting_documents.map(
                          (doc, idx) => (
                            <a
                              key={idx}
                              href={doc}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#EEF2FF] text-[#2B3A9F] text-sm hover:bg-[#2B3A9F] hover:text-white transition-colors"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              <span className="truncate max-w-[200px]">
                                Document {idx + 1}
                              </span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>

              <DialogFooter className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] shrink-0">
                <Button
                  variant="outline"
                  onClick={() => setViewDialogOpen(false)}
                  className="border-[#E2E8F0] text-slate-700 hover:bg-white hover:text-[#2B3A9F] hover:border-[#2B3A9F]/30 transition-all w-full sm:w-auto"
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="p-6 flex-1 flex items-center justify-center">
              <p className="text-slate-500">No request selected</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
