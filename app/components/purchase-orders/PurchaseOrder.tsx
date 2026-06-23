"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  ArrowRight,
  Calendar,
  User,
  Building2,
  DollarSign,
  Package,
  Truck,
  CreditCard,
  Printer,
} from "lucide-react";
import { DataTableCard, Column } from "@/app/components/cards/DataTableCard";
import {
  colors,
  Item,
  Order,
  PurchaseOrderProps,
  Request,
} from "@/lib/interfaces";
import { cn } from "@/lib/utils";
import { useReactToPrint } from "react-to-print";
import { PrintPurchaseOrder } from "./PrintPurchaseOrder";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PurchaseOrder({
  requests,
  orders,
  units,
}: PurchaseOrderProps) {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approvedRequestsDialogOpen, setApprovedRequestsDialogOpen] =
    useState(false);

  // Ref for print content
  const contentRef = useRef<HTMLDivElement>(null);

  // Setup react-to-print hook
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: selectedOrder?.order_number
      ? `Purchase_Order_${selectedOrder.order_number}`
      : "Purchase_Order_Details",
    pageStyle: `
      @media print {
        @page { size: A4; margin: 10mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-content { padding: 0 !important; }
      }
    `,
  });

  // Calculate total amount from items
  const calculateTotal = (items: Item[]): number => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  // Format currency
  const formatCurrency = (
    value: string | number | undefined | null,
  ): string => {
    const amount = Number(value ?? 0);
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const getStatusBadge = (status: string, rejectionReason?: string) => {
    const config =
      colors.semantic[status as keyof typeof colors.semantic] ||
      colors.semantic.for_approval;

    const label =
      status === "for approval"
        ? "For Approval"
        : status.charAt(0).toUpperCase() + status.slice(1);

    const badge = (
      <Badge
        className={cn(
          config.bg,
          config.text,
          "border",
          config.border,
          "font-semibold",
        )}
        variant="secondary"
      >
        {label}
      </Badge>
    );

    // Show tooltip for rejected orders
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

  const getPriorityBadge = (priority: string) => {
    const config =
      colors.priority[priority as keyof typeof colors.priority] ||
      colors.priority.Medium;

    return (
      <Badge
        className={cn(
          config.bg,
          config.text,
          "border",
          config.border,
          "font-semibold",
        )}
        variant="secondary"
      >
        {priority}
      </Badge>
    );
  };

  const handleView = (order: Order) => {
    setSelectedOrder(order);
    setViewDialogOpen(true);
  };

  const handleReviewRequests = () => {
    setApprovedRequestsDialogOpen(true);
  };

  const handleCreatePurchaseOrder = (request: Request) => {
    setApprovedRequestsDialogOpen(false);
    router.push(`/home/finance/purchase-orders/create-po/${request.id}`);
  };

  const getUnitName = (unitId: string) => {
    const unit = units?.find((u) => u.unit_id === unitId);
    return unit?.name || unitId;
  };

  // Stats calculation
  const stats = [
    {
      title: "Total Orders",
      value: orders.length,
      icon: FileText,
      color: "text-[#2B3A9F]",
      bgColor: "bg-[#EEF2FF]",
    },
    {
      title: "For Approval",
      value: orders.filter((o) => o.status === "for approval").length,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Approved",
      value: orders.filter((o) => o.status === "approved").length,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Rejected",
      value: orders.filter((o) => o.status === "rejected").length,
      icon: XCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  ];

  // Define columns for Purchase Orders - Enhanced to match ServiceOrder style
  const columns: Column<Order>[] = [
    {
      key: "order_number",
      header: "Order #",
      width: "w-[140px]",
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-[#2B3A9F]">
          {row.order_number}
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
      render: (row) => getStatusBadge(row.status, row.rejection_reason), // ← Updated
    },
    {
      key: "expected_completion",
      header: "Expected Completion",
      width: "w-[140px]",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {new Date(row.expected_completion).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      ),
    },
    {
      key: "total_amount",
      header: "Amount",
      width: "w-[120px]",
      render: (row) => (
        <span className="font-mono font-semibold text-slate-900">
          {formatCurrency(calculateTotal(row.items))}
        </span>
      ),
    },
  ];

  const filterOptions = [
    { value: "for approval", label: "For Approval" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          Purchase Orders
        </h1>
        <p className="text-slate-500">
          Manage and track all your purchase orders in one place
        </p>
      </div>

      {/* Stats Grid */}
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

      {/* Data Table Card */}
      <DataTableCard
        data={orders}
        columns={columns}
        keyExtractor={(row) => row.id}
        title="All Purchase Orders"
        subtitle="View and manage your purchase orders"
        searchPlaceholder="Search orders..."
        searchable
        searchKeys={[
          "order_number",
          "title",
          "service_category",
          "company",
          "department",
          "requested_by",
        ]}
        filterable
        filterKey="status"
        filterOptions={filterOptions}
        pagination
        defaultPageSize={5}
        headerActions={
          <Button
            className="bg-[#2B3A9F] hover:bg-[#1E2A7A] text-white shadow-lg shadow-[#2B3A9F]/25 transition-all hover:shadow-xl hover:shadow-[#2B3A9F]/30"
            onClick={handleReviewRequests}
          >
            <Plus className="mr-2 h-4 w-4" />
            View Approved Purchase Requests
          </Button>
        }
        actions={(row) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleView(row)}
            className="h-8 px-3 text-xs font-medium border-[#E2E8F0] text-slate-700 hover:text-[#2B3A9F] hover:border-[#2B3A9F]/30 hover:bg-[#EEF2FF] transition-all"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            View
          </Button>
        )}
      />

      {/* View Dialog - Enhanced to match ServiceOrder style */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Purchase Order Details
                </DialogTitle>
                <DialogDescription className="text-slate-500 mt-1">
                  {selectedOrder?.order_number}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-3">
                {selectedOrder &&
                  getStatusBadge(
                    selectedOrder.status,
                    selectedOrder.rejection_reason,
                  )}

                {/* Print Button */}
                {selectedOrder && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrint}
                    className="border-[#E2E8F0] hover:bg-[#EEF2FF] hover:text-[#2B3A9F] hover:border-[#2B3A9F]/30 transition-all"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Hidden Printable Content */}
          {selectedOrder && (
            <div className="hidden">
              <div ref={contentRef}>
                <PrintPurchaseOrder
                  request={{
                    id: selectedOrder.id,
                    request_number: selectedOrder.order_number,
                    title: selectedOrder.title,
                    description: selectedOrder.description,
                    service_category: selectedOrder.service_category,
                    priority_level: selectedOrder.priority_level,
                    company: selectedOrder.company,
                    department: selectedOrder.department,
                    preferred_date: selectedOrder.preferred_date,
                    expected_completion: selectedOrder.expected_completion,
                    supporting_documents: selectedOrder.supporting_documents,
                    vehicle: selectedOrder.vehicle,
                    preferred_vendor: selectedOrder.preferred_vendor,
                    contact_person: selectedOrder.contact_person,
                    required_by: selectedOrder.required_by,
                    payment_method: selectedOrder.payment_method,
                    items: selectedOrder.items,
                    status: selectedOrder.status,
                    requested_by: selectedOrder.requested_by,
                  }}
                  formatCurrency={formatCurrency}
                  purchaseOrderNumber={selectedOrder.order_number}
                />
              </div>
            </div>
          )}

          {selectedOrder && (
            <div className="space-y-6 py-4">
              {/* Order Title & Description */}
              <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <h3 className="font-bold text-lg text-slate-900 mb-2">
                  {selectedOrder.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {selectedOrder.description}
                </p>
              </div>

              {/* Key Info Grid */}
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
                        {selectedOrder.company}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedOrder.department}
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
                        {selectedOrder.requested_by}
                      </p>
                      {selectedOrder.order_prepared_by && (
                        <p className="text-xs text-slate-500">
                          Prepared by: {selectedOrder.order_prepared_by}
                        </p>
                      )}
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
                          selectedOrder.preferred_date,
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        Expected Completion:{" "}
                        {new Date(
                          selectedOrder.expected_completion,
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
                        {selectedOrder.service_category}
                      </p>
                      {getPriorityBadge(selectedOrder.priority_level)}
                    </div>
                  </div>
                  {selectedOrder.payment_method && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Payment
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedOrder.payment_method}
                        </p>
                        <p className="text-xs text-slate-500">
                          Required by:{" "}
                          {new Date(
                            selectedOrder.required_by,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedOrder.vehicle?.plate_number && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                        <Truck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Vehicle
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedOrder.vehicle.plate_number}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedOrder.vehicle.car_type} •{" "}
                          {selectedOrder.vehicle.owners_first_name}{" "}
                          {selectedOrder.vehicle.owners_last_name}
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
                      {selectedOrder.preferred_vendor || "--"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                      Contact Person
                    </p>
                    <p className="font-semibold text-slate-900">
                      {selectedOrder.contact_person || "--"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4 text-[#2B3A9F]" />
                  Items ({selectedOrder.items.length})
                </h4>
                <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader className="bg-[#F8FAFC]">
                      <TableRow className="border-b border-[#E2E8F0]">
                        <TableHead className="text-xs font-bold text-slate-600">
                          Item
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-600 text-center">
                          Qty
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-600 text-right">
                          Unit Price
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-600 text-right">
                          Total
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => {
                        const qty = parseFloat(item.quantity) || 0;
                        const price = parseFloat(item.unitPrice) || 0;
                        const total = qty * price;
                        return (
                          <TableRow
                            key={index}
                            className="border-b border-[#E2E8F0] last:border-b-0"
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-900">
                                  {item.name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {item.description}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#EEF2FF] text-[#2B3A9F]">
                                {item.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-slate-600">
                              {formatCurrency(price)} / {getUnitName(item.unit)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-slate-900">
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
                      Total Amount:
                    </span>
                    <span className="text-lg font-bold text-[#2B3A9F] font-mono">
                      {formatCurrency(calculateTotal(selectedOrder.items))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Journal Entries */}
              {selectedOrder.journal_entries &&
                selectedOrder.journal_entries.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-[#2B3A9F]" />
                      Journal Entries
                    </h4>
                    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-[#F8FAFC]">
                          <TableRow className="border-b border-[#E2E8F0]">
                            <TableHead className="text-xs font-bold text-slate-600">
                              Account
                            </TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 text-right text-emerald-600">
                              Debit
                            </TableHead>
                            <TableHead className="text-xs font-bold text-slate-600 text-right text-rose-600">
                              Credit
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedOrder.journal_entries.map((entry, index) => (
                            <TableRow
                              key={index}
                              className="border-b border-[#E2E8F0] last:border-b-0"
                            >
                              <TableCell className="font-medium text-slate-900 capitalize">
                                {(entry.accountTitle || "Unknown").replace(
                                  /-/g,
                                  " ",
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.entryType === "debit" ? (
                                  <span className="text-emerald-600 font-semibold">
                                    {formatCurrency(entry.amount)}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.entryType === "credit" ? (
                                  <span className="text-rose-600 font-semibold">
                                    {formatCurrency(entry.amount)}
                                  </span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

              {/* Supporting Documents */}
              {selectedOrder.supporting_documents.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    Supporting Documents
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.supporting_documents.map((doc, index) => (
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-[#E2E8F0] pt-4">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="border-[#E2E8F0] text-slate-700 hover:bg-[#F8FAFC]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approved Purchase Requests Dialog - Enhanced */}
      <Dialog
        open={approvedRequestsDialogOpen}
        onOpenChange={setApprovedRequestsDialogOpen}
      >
        <DialogContent className="sm:max-w-3xl max-h-[85vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Approved Purchase Requests
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1">
                  Select a request to create a new purchase order
                </DialogDescription>
              </div>
              <Badge
                variant="secondary"
                className="bg-[#EEF2FF] text-[#2B3A9F] border border-[#2B3A9F]/20 font-semibold"
              >
                {requests.length} requests
              </Badge>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-6">
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#EEF2FF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-[#2B3A9F]" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No approved requests
                </h3>
                <p className="text-sm text-slate-500">
                  There are no approved purchase requests available at this
                  time.
                </p>
              </div>
            ) : (
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-[#F8FAFC]">
                    <TableRow className="border-b border-[#E2E8F0] hover:bg-transparent">
                      <TableHead className="font-bold text-xs text-slate-600 py-4 w-40">
                        Request ID
                      </TableHead>
                      <TableHead className="font-bold text-xs text-slate-600 py-4">
                        Title
                      </TableHead>
                      <TableHead className="font-bold text-xs text-slate-600 py-4 w-40">
                        Type
                      </TableHead>
                      <TableHead className="font-bold text-xs text-slate-600 py-4 text-right w-48">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((request) => (
                      <TableRow
                        key={request.id}
                        className="group hover:bg-[#F8FAFC] transition-colors border-b border-[#E2E8F0] last:border-b-0"
                      >
                        <TableCell className="font-mono text-sm text-[#2B3A9F] font-semibold py-4">
                          {request.request_number}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-slate-900 py-4">
                          {request.title}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 py-4">
                          <Badge
                            variant="outline"
                            className="text-xs border-[#E2E8F0] text-slate-600 bg-white"
                          >
                            {request.service_category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <Button
                            size="sm"
                            onClick={() => handleCreatePurchaseOrder(request)}
                            className="bg-[#2B3A9F] hover:bg-[#1E2A7A] text-white gap-2 shadow-md shadow-[#2B3A9F]/20 transition-all hover:shadow-lg"
                          >
                            Create Purchase Order
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
            <Button
              variant="outline"
              onClick={() => setApprovedRequestsDialogOpen(false)}
              className="border-[#E2E8F0] text-slate-700 hover:bg-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
