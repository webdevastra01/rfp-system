"use client";

import { useState, useMemo, useRef } from "react";
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
  Printer,
  DollarSign,
  Package,
  Building2,
  Truck,
  User,
  Calendar,
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
import {
  colors,
  Item,
  Order,
  Request,
  ReviewOrderProps,
} from "@/lib/interfaces";
import { PrintServiceOrder } from "../service-orders/PrintServiceOrderPage";
import { useReactToPrint } from "react-to-print";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
};

// Format currency
const formatCurrency = (value: string | number | undefined | null): string => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
};

export default function ReviewOrder({ orders, units }: ReviewOrderProps) {
  const [orderList, setOrderList] = useState<Order[]>(orders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const supabase = createClient();

  // Ref for print content
  const contentRef = useRef<HTMLDivElement>(null);

  // Setup react-to-print hook
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: selectedOrder?.order_number
      ? `Order_${selectedOrder.order_number}`
      : "Order_Details",
    pageStyle: `
      @media print {
        @page { size: A4; margin: 10mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-content { padding: 0 !important; }
      }
    `,
  });

  const getStatusBadge = (
    status: Order["status"],
    rejectionReason?: string,
  ) => {
    const styles: Record<string, string> = {
      "for approval": "bg-amber-50 text-amber-700 border-amber-200",
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
        {status === "for approval"
          ? "For Approval"
          : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );

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

  const handleActionClick = (order: Order, action: "approved" | "rejected") => {
    setSelectedOrder(order);
    setActionType(action);
    setActionDialogOpen(true);
    if (action === "rejected") setRejectionReason(""); // reset reason
  };

  const handleConfirmAction = async () => {
    if (!selectedOrder || !actionType) return;

    if (actionType === "rejected" && !rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    await handleUpdateStatus(
      selectedOrder,
      actionType,
      actionType === "rejected" ? rejectionReason.trim() : undefined,
    );

    setActionDialogOpen(false);
    setRejectionReason("");
    setSelectedOrder(null);
    setActionType(null);
  };

  // Updated handleUpdateStatus
  async function handleUpdateStatus(
    order: Order,
    status: "approved" | "rejected",
    rejectionReason?: string,
  ) {
    try {
      const isServiceOrder = order.order_number.startsWith("SO");
      const table = isServiceOrder ? "service_orders" : "purchase_orders";

      const updatePayload: any = { status };

      if (status === "rejected" && rejectionReason) {
        updatePayload.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from(table)
        .update(updatePayload)
        .eq("id", order.id);

      if (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status", {
          description:
            error.message || "An error occurred while updating the order.",
        });
        return;
      }

      const orderType = isServiceOrder ? "Service Order" : "Purchase Order";

      toast.success(
        status === "approved"
          ? `${orderType} approved successfully`
          : `${orderType} rejected successfully`,
        {
          description: `${orderType} ${order.order_number} has been ${status}.`,
        },
      );

      setOrderList((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status,
                ...(status === "rejected" && {
                  rejection_reason: rejectionReason,
                }),
              }
            : o,
        ),
      );
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Unexpected error occurred");
    }
  }

  // Stats calculation - Updated to match ServiceOrder
  const stats = useMemo(
    () => [
      {
        title: "Total Orders",
        value: orderList.length,
        icon: FileText,
        color: "text-[#2B3A9F]",
        bgColor: "bg-[#EEF2FF]",
      },
      {
        title: "For Approval",
        value: orderList.filter((r) => r.status === "for approval").length,
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-50",
      },
      {
        title: "Approved",
        value: orderList.filter((r) => r.status === "approved").length,
        icon: CheckCircle,
        color: "text-emerald-600",
        bgColor: "bg-emerald-50",
      },
      {
        title: "Rejected",
        value: orderList.filter((r) => r.status === "rejected").length,
        icon: XCircle,
        color: "text-rose-600",
        bgColor: "bg-rose-50",
      },
    ],
    [orderList],
  );

  // Define columns - Enhanced to match ServiceOrder
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
    { value: "for approval", label: "For Approval" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const getUnitName = (unitId: string) => {
    const unit = units?.find((u) => u.unit_id === unitId);
    return unit?.name || unitId;
  };

  function mapOrderToRequest(order: Order): Request {
    return {
      id: order.id,
      request_number: order.order_number,
      title: order.title,
      description: order.description,
      service_category: order.service_category,
      priority_level: order.priority_level,
      company: order.company,
      department: order.department,
      preferred_date: order.preferred_date,
      expected_completion: order.expected_completion,
      supporting_documents: [...order.supporting_documents],
      vehicle: order.vehicle,
      preferred_vendor: order.preferred_vendor,
      contact_person: order.contact_person,
      required_by: order.required_by,
      payment_method: order.payment_method,
      items: order.items.map((i) => ({ ...i })),
      status: order.status,
      requested_by: order.requested_by,
    };
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8">
      {/* Header - Updated to match ServiceOrder */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          Service and Purchase Orders
        </h1>
        <p className="text-slate-500">
          Manage and track all incoming service and purchase orders in one place
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
      <DataTableCard<Order>
        data={orderList}
        columns={columns}
        keyExtractor={(row) => row.id}
        title="All Service and Purchase Orders"
        subtitle="Manage and track all incoming service and purchase orders"
        searchPlaceholder="Search orders..."
        searchable
        searchKeys={[
          "order_number",
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
            {row.status === "for approval" && (
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

      {/* View Dialog - Updated to match ServiceOrder */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">
                  Order Details
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

            {/* Rejection Reason */}
            {selectedOrder?.status === "rejected" &&
              selectedOrder.rejection_reason?.trim() && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="font-medium text-red-700">Rejection Reason:</p>
                  <p className="mt-1 text-red-600">
                    {selectedOrder.rejection_reason}
                  </p>
                </div>
              )}
          </DialogHeader>

          {/* Hidden Printable Content */}
          {selectedOrder && (
            <div className="hidden">
              <div ref={contentRef}>
                <PrintServiceOrder
                  request={mapOrderToRequest(selectedOrder)}
                  formatCurrency={formatCurrency}
                  serviceOrderNumber={selectedOrder.order_number}
                  units={units}
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
                      {selectedOrder.preferred_vendor}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">
                      Contact Person
                    </p>
                    <p className="font-semibold text-slate-900">
                      {selectedOrder.contact_person}
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
                            className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F8FAFC] transition-colors"
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
                  <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#2B3A9F]" />
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

          <DialogFooter className="border-t border-[#E2E8F0] pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="border-[#E2E8F0] text-slate-700 hover:bg-[#F8FAFC]"
            >
              Close
            </Button>
            {selectedOrder?.status === "for approval" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleActionClick(selectedOrder, "rejected");
                  }}
                  className="border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleActionClick(selectedOrder, "approved");
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
              {actionType === "approved" ? "Approve Order" : "Reject Order"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Are you sure you want to{" "}
              {actionType === "approved" ? "approve" : "reject"}{" "}
              <span className="font-semibold text-slate-900">
                {selectedOrder?.order_number}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>

          {/* Rejection Reason Input */}
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
                placeholder="Enter reason for rejecting this order..."
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
