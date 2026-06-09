"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  Download,
  CreditCard,
  Printer,
  Check,
  X,
  Wallet, // Added for liquidated status
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
import { useReactToPrint } from "react-to-print";
import { PrintRequestForPayment } from "@/app/components/request-for-payment/PrintRequestForPayment";
import { cn } from "@/lib/utils";
import {
  RequestForPaymentInterface,
  RequestForPaymentProps,
} from "@/lib/interfaces";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { exportRFPExcel } from "@/lib/csv/generateRFPCSV";

export default function RequestForPayment({
  rfps,
  rfpExportData,
  orders = [],
  onApprove,
  onReject,
  module,
}: RequestForPaymentProps) {
  const [rfpList, setRfpList] = useState<RequestForPaymentInterface[]>(rfps);
  const [selectedRfp, setSelectedRfp] =
    useState<RequestForPaymentInterface | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approvedPODialogOpen, setApprovedPODialogOpen] = useState(false);
  // ✅ Action confirmation dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(
    null,
  );
  // ✅ Loading states for approve/reject actions
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const router = useRouter();

  const { hasAction } = usePermissions();
  const pathname = usePathname();

  let currentModule: "employee" | "finance" | null = null;
  if (pathname.startsWith("/home/employee-portal/requests")) {
    currentModule = "employee";
  } else if (pathname.startsWith("/home/finance")) {
    currentModule = "finance";
  }

  const moduleActions: Record<"employee" | "finance", string[]> = {
    employee: ["approve-reject-rfp-emp"],
    finance: ["approve-reject-rfp-fin"],
  };

  const canApproveReject =
    currentModule !== null &&
    moduleActions[currentModule].some((action) => hasAction(action));

  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: selectedRfp
      ? `RFP_${selectedRfp.rfp_number}`
      : "RFP_Details",
    pageStyle: `
      @media print {
        @page { size: A4; margin: 15mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-only { display: block !important; }
        .no-print { display: none !important; }
      }
    `,
  });

  const exportToExcel = async () => {
  await exportRFPExcel(rfpExportData);
};

  // ✅ Updated status config to handle "liquidated" status
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      "for approval": "bg-amber-50 text-amber-700 border-amber-200",
      submitted: "bg-amber-50 text-amber-700 border-amber-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      rejected: "bg-rose-50 text-rose-700 border-rose-200",
      liquidated: "bg-blue-50 text-blue-700 border-blue-200", // Added liquidated style
    };

    const icons: Record<string, React.ReactNode> = {
      "for approval": <Clock className="h-3 w-3 mr-1" />,
      submitted: <Clock className="h-3 w-3 mr-1" />,
      approved: <CheckCircle className="h-3 w-3 mr-1" />,
      rejected: <XCircle className="h-3 w-3 mr-1" />,
      liquidated: <Wallet className="h-3 w-3 mr-1" />, // Added liquidated icon
    };

    return (
      <Badge
        className={cn(
          styles[status] || "bg-slate-50 text-slate-700 border-slate-200",
          "border font-semibold flex items-center",
        )}
        variant="secondary"
      >
        {icons[status]}
        {status === "for approval"
          ? "For Approval"
          : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // ✅ Safe number parsing for total_payable (string | number)
  const parseAmount = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return isNaN(value) ? 0 : value;
    const parsed = parseFloat(value.toString().replace(/[₱$,\s]/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  };

  const formatCurrency = (
    value: string | number | null | undefined,
  ): string => {
    const num = parseAmount(value);
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(num);
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleView = (rfp: RequestForPaymentInterface) => {
    setSelectedRfp(rfp);
    setViewDialogOpen(true);
  };

  const handleReviewOrders = () => {
    setApprovedPODialogOpen(true);
  };

  const handleCreateRFP = (
    order: NonNullable<RequestForPaymentProps["orders"]>[number],
  ) => {
    setApprovedPODialogOpen(false);
    router.push(`/home/${module}/request-for-payment/create-rfp/${order.id}`);
  };

  // ✅ Handle action click from table row
  const handleActionClick = (
    rfp: RequestForPaymentInterface,
    action: "approved" | "rejected",
  ) => {
    setSelectedRfp(rfp);
    setActionType(action);
    setActionDialogOpen(true);
  };

  // ✅ Handle confirm action
  const handleConfirmAction = async () => {
    if (!selectedRfp || !actionType) return;

    if (actionType === "approved" && onApprove) {
      try {
        setIsApproving(true);
        await onApprove(selectedRfp.id);
        // Update local state
        setRfpList((prev) =>
          prev.map((r) =>
            r.id === selectedRfp.id ? { ...r, status: "approved" } : r,
          ),
        );
        toast.success("Request for Payment approved successfully", {
          description: `Request for Payment ${selectedRfp.rfp_number} has been approved.`,
        });
      } catch (error) {
        console.error("Failed to approve RFP:", error);
        toast.error("Failed to approve Request for Payment", {
          description: `Request for Payment ${selectedRfp.rfp_number} failed to be approved.`,
        });
      } finally {
        setIsApproving(false);
      }
    } else if (actionType === "rejected" && onReject) {
      try {
        setIsRejecting(true);
        await onReject(selectedRfp.id);
        // Update local state
        toast.success("Request for Payment rejected", {
          description: `Request for Payment ${selectedRfp.rfp_number} has been rejected.`,
        });
        setRfpList((prev) =>
          prev.map((r) =>
            r.id === selectedRfp.id ? { ...r, status: "rejected" } : r,
          ),
        );
      } catch (error) {
        console.error("Failed to reject RFP:", error);
        toast.error("Failed to reject Request for Payment", {
          description: `Request for Payment ${selectedRfp.rfp_number} failed to be rejected.`,
        });
      } finally {
        setIsRejecting(false);
      }
    }

    setActionDialogOpen(false);
    setSelectedRfp(null);
    setActionType(null);
  };

  // ✅ Stats using actual data fields - Updated to include liquidated
  const stats = [
    {
      title: "Total Requests",
      value: rfpList.length,
      icon: FileText,
      color: "text-[#2B3A9F]",
      bgColor: "bg-[#EEF2FF]",
    },
    {
      title: "For Approval",
      value: rfpList.filter(
        (r) => r.status === "for approval" || r.status === "submitted",
      ).length,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Approved",
      value: rfpList.filter((r) => r.status === "approved").length,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Liquidated",
      value: rfpList.filter((r) => r.status === "liquidated").length,
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Rejected",
      value: rfpList.filter((r) => r.status === "rejected").length,
      icon: XCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  ];

  // ✅ Updated columns to use actual data fields
  const columns: Column<RequestForPaymentInterface>[] = [
    {
      key: "rfp_number",
      header: "RFP #",
      width: "w-[160px]",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm font-semibold text-[#2B3A9F]">
            {row.rfp_number}
          </span>
          <span className="text-[10px] text-slate-500">
            PO: {row.order_number}
          </span>
        </div>
      ),
    },
    {
      key: "payable_to",
      header: "Payable To",
      width: "min-w-[200px]",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 text-sm line-clamp-1">
            {row.payable_to}
          </span>
          <span className="text-xs text-slate-500">{row.department}</span>
        </div>
      ),
    },
    {
      key: "payment_method",
      header: "Payment Method",
      width: "w-[130px]",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <CreditCard className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm text-slate-700">{row.payment_method}</span>
        </div>
      ),
    },
    {
      key: "requested_by",
      header: "Requestor",
      width: "w-[160px]",
      render: (row) => (
        <div className="flex items-start gap-2">
          <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
            {row.requested_by
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm text-slate-900">
              {row.requested_by}
            </span>
            <span className="text-xs text-slate-500">{row.department}</span>
          </div>
        </div>
      ),
    },
    {
      key: "total_payable",
      header: "Amount",
      width: "w-[130px]",
      render: (row) => (
        <div className="text-right">
          <span className="font-mono text-sm font-semibold text-slate-900">
            {formatCurrency(row.total_payable)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "w-[140px]",
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "created_at",
      header: "Date Created",
      width: "w-[120px]",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          {formatDate(row.created_at)}
        </div>
      ),
    },
  ];

  const filterOptions = [
    { value: "for approval", label: "For Approval" },
    { value: "approved", label: "Approved" },
    { value: "liquidated", label: "Liquidated" }, // Added liquidated filter
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-8">
      {/* Header - Updated to match ReviewOrder */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          Requests for Payment
        </h1>
        <p className="text-slate-500">
          Manage payment authorizations and track RFP status
        </p>
      </div>

      {/* Stats Grid - Updated to 5 columns on large screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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

      {/* Data Table - Updated styling and actions */}
      <DataTableCard<RequestForPaymentInterface>
        data={rfpList}
        columns={columns}
        keyExtractor={(row) => row.id}
        title="Payment Requests"
        subtitle={`${rfpList.length} total requests in the system`}
        searchPlaceholder="Search by RFP number, payable to, requestor, or department..."
        searchable
        searchKeys={[
          "rfp_number",
          "order_number",
          "payable_to",
          "requested_by",
          "department",
          "payment_method",
        ]}
        filterable
        filterKey="status"
        filterOptions={filterOptions}
        pagination
        defaultPageSize={5}
        headerActions={
          <div className="flex gap-2">
            <Button
              onClick={exportToExcel}
              className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-[#2B3A9F] transition-colors shadow-sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Export to Excel
            </Button>

            <Button
              onClick={handleReviewOrders}
              className="bg-[#2B3A9F] hover:bg-[#2B3A9F]/80 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create RFP from Approved POs
            </Button>
          </div>
        }
        // ✅ Updated actions with conditional Approve/Reject buttons
        // Liquidated RFPs don't show approve/reject actions
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
            {/* ✅ Conditional Approve/Reject buttons - exclude liquidated */}
            {canApproveReject &&
              (row.status === "for approval" || row.status === "submitted") && (
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
            {/* Optional: Add a liquidation action for approved RFPs */}
            {row.status === "approved" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  router.push(`/home/${module}/liquidation/liquidate/${row.id}`)
                }
                className="h-8 px-3 text-xs font-medium border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all"
              >
                <Wallet className="h-3.5 w-3.5 mr-1.5" />
                Liquidate
              </Button>
            )}
          </div>
        )}
      />

      {/* View Dialog - Updated styling */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl p-0 gap-0 overflow-hidden max-h-[90vh]">
          {/* Screen Header */}
          <DialogHeader className="px-6 py-5 border-b bg-slate-50 no-print">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DialogTitle className="text-lg font-semibold text-slate-900">
                    RFP Details
                  </DialogTitle>
                  {selectedRfp && getStatusBadge(selectedRfp.status)}
                </div>
                <DialogDescription className="text-sm text-slate-500">
                  Reference:{" "}
                  <span className="font-mono font-medium text-slate-700">
                    {selectedRfp?.rfp_number}
                  </span>
                </DialogDescription>
              </div>
              {selectedRfp && (
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Total Amount
                  </p>
                  <p className="text-2xl font-bold font-mono text-slate-900">
                    {formatCurrency(selectedRfp.total_payable)}
                  </p>
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Print Content */}
          <div ref={printContentRef} className="print-only">
            {selectedRfp && <PrintRequestForPayment rfp={selectedRfp} />}
          </div>

          {/* Screen Content */}
          {selectedRfp && (
            <div className="overflow-y-auto max-h-[calc(90vh-180px)] no-print">
              <div className="p-6 space-y-6">
                {/* Payee & Payment Info */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <User className="h-3.5 w-3.5" />
                      Payee Information
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Payable To
                        </label>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedRfp.payable_to}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Contact Number
                        </label>
                        <p className="text-sm text-slate-700">
                          {selectedRfp.contact_number}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Department
                        </label>
                        <p className="text-sm text-slate-700">
                          {selectedRfp.department}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <CreditCard className="h-3.5 w-3.5" />
                      Payment Details
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Method
                        </label>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedRfp.payment_method}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Due Date
                        </label>
                        <p className="text-sm text-slate-700 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatDate(selectedRfp.due_date)}
                        </p>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase font-semibold block">
                          Order Reference
                        </label>
                        <p className="text-sm font-mono text-slate-700">
                          {selectedRfp.order_number}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requestor Info */}
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    Request Information
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Requested By
                      </label>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedRfp.requested_by}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Request Date
                      </label>
                      <p className="text-sm text-slate-700">
                        {formatDate(selectedRfp.request_date)}
                      </p>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 uppercase font-semibold block mb-1">
                        Created At
                      </label>
                      <p className="text-sm text-slate-700">
                        {formatDate(selectedRfp.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                {selectedRfp.line_items?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5" />
                      Itemized Expenses
                    </h4>
                    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-[#F8FAFC]">
                          <TableRow className="border-b border-[#E2E8F0]">
                            <TableHead className="text-[10px] font-bold text-slate-600 uppercase w-32">
                              Invoice #
                            </TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-600 uppercase">
                              Particulars
                            </TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-600 uppercase text-center w-16">
                              Qty
                            </TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-600 uppercase text-right w-28">
                              Unit Price
                            </TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-600 uppercase text-right w-28">
                              Amount
                            </TableHead>
                            <TableHead className="text-[10px] font-bold text-slate-600 uppercase w-28">
                              Charge To
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedRfp.line_items.map((item, idx) => (
                            <TableRow
                              key={item.invoice_number || idx}
                              className="text-[11px] border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F8FAFC] transition-colors"
                            >
                              <TableCell className="font-mono text-slate-600">
                                {item.invoice_number}
                              </TableCell>
                              <TableCell className="text-slate-900">
                                {item.particulars}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.qty}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(item.price)}
                              </TableCell>
                              <TableCell className="text-right font-mono font-medium text-slate-900">
                                {formatCurrency(item.total_amount)}
                              </TableCell>
                              <TableCell className="text-slate-600">
                                {item.charge_to || "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-end mt-3">
                      <div className="bg-[#2B3A9F] text-white px-4 py-2 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-300">
                            Total Payable
                          </span>
                          <span className="text-lg font-bold font-mono">
                            {formatCurrency(selectedRfp.total_payable)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Approval Info */}
                {selectedRfp.approved_by && (
                  <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                      {selectedRfp.status === "approved"
                        ? "Approval"
                        : selectedRfp.status === "rejected"
                          ? "Rejection"
                          : "Processing"}{" "}
                      Details
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedRfp.approved_by}
                        </p>
                        <p className="text-xs text-slate-500">
                          {selectedRfp.status === "approved"
                            ? "Approved on"
                            : selectedRfp.status === "rejected"
                              ? "Rejected on"
                              : "Processed on"}{" "}
                          {formatDate(selectedRfp.approved_date)}
                        </p>
                      </div>
                      {selectedRfp.status === "approved" ? (
                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                      ) : selectedRfp.status === "rejected" ? (
                        <XCircle className="h-8 w-8 text-rose-600" />
                      ) : (
                        <Wallet className="h-8 w-8 text-blue-600" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer - Updated to match ReviewOrder */}
          <DialogFooter className="px-6 py-4 border-t border-[#E2E8F0] bg-slate-50 no-print gap-2">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="border-[#E2E8F0] text-slate-700 hover:bg-[#F8FAFC]"
            >
              Close
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePrint()}
              className="border-[#E2E8F0] hover:bg-[#EEF2FF] hover:text-[#2B3A9F] hover:border-[#2B3A9F]/30 transition-all"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print / PDF
            </Button>
            {/* ✅ Also add Approve/Reject in View Dialog footer */}
            {canApproveReject &&
              selectedRfp &&
              (selectedRfp.status === "for approval" ||
                selectedRfp.status === "submitted") && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleActionClick(selectedRfp, "rejected");
                    }}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleActionClick(selectedRfp, "approved");
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </>
              )}
            {/* Liquidate button for approved RFPs */}
            {selectedRfp && selectedRfp.status === "approved" && (
              <Button
                onClick={() => {
                  setViewDialogOpen(false);
                  router.push(`/home/finance/liquidation/${selectedRfp.id}`);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Wallet className="h-4 w-4 mr-2" />
                Liquidate
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog - Matching ReviewOrder */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {actionType === "approved" ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-600" />
              )}
              {actionType === "approved" ? "Approve RFP" : "Reject RFP"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Are you sure you want to {actionType}{" "}
              <span className="font-semibold text-slate-900">
                {selectedRfp?.rfp_number}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              className="border-[#E2E8F0] text-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={isApproving || isRejecting}
              className={
                actionType === "approved"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }
            >
              {isApproving || isRejecting ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : actionType === "approved" ? (
                "Approve"
              ) : (
                "Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={approvedPODialogOpen}
        onOpenChange={setApprovedPODialogOpen}
      >
        <DialogContent className="sm:max-w-3xl max-h-[85vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-5 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Approved Orders
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1">
                  Select an approved SO or PO to generate a new payment request
                </DialogDescription>
              </div>
              <Badge
                variant="secondary"
                className="bg-indigo-50 text-[#2B3A9F] border border-[#2B3A9F]/20 font-semibold"
              >
                {orders.length} available
              </Badge>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-6">
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#EEF2FF] rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-[#2B3A9F]" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    No approved orders
                  </h3>
                  <p className="text-sm text-slate-500">
                    There are no approved orders available at this time.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-b border-slate-200 hover:bg-transparent">
                      <TableHead className="font-bold text-xs text-slate-600 py-4 w-40">
                        PO Reference
                      </TableHead>
                      <TableHead className="font-bold text-xs text-slate-600 py-4">
                        Description
                      </TableHead>
                      <TableHead className="font-bold text-xs text-slate-600 py-4 w-40">
                        Type
                      </TableHead>
                      <TableHead className="font-bold text-xs text-slate-600 py-4 text-right w-40">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="group hover:bg-slate-50 transition-colors border-b border-slate-200 last:border-b-0"
                      >
                        <TableCell className="font-mono text-sm text-[#2B3A9F] font-semibold py-4">
                          {order.order_number}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-slate-900 py-4">
                          <span className="truncate max-w-[250px] block">
                            {order.description}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600 py-4">
                          <Badge
                            variant="outline"
                            className="text-xs border-slate-200 text-slate-600 bg-white"
                          >
                            {order.service_category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <Button
                            size="sm"
                            onClick={() => handleCreateRFP(order)}
                            className="bg-[#2B3A9F] hover:bg-[#1E2A7A] text-white gap-2 shadow-md shadow-[#2B3A9F]/20 transition-all hover:shadow-lg"
                          >
                            Create RFP
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <Button
              variant="outline"
              onClick={() => setApprovedPODialogOpen(false)}
              className="border-slate-200 text-slate-700 hover:bg-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
