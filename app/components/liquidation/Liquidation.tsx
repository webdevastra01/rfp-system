"use client";

import { useRef, useState } from "react";
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
  DollarSign,
  Eye,
  ArrowRight,
  CreditCard,
  Calendar,
  User,
  Building2,
  Receipt,
  Check,
  X,
  Printer,
  Car,
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
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LiquidationEntry,
  LiquidationInterface,
  LiquidationPageProps,
  RequestForPaymentInterface,
} from "@/lib/interfaces";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { PrintLiquidation } from "./PrintLiquidation";
import FileGallery from "../FileGallery";

export default function Liquidation({
  rfps,
  liquidatedRFPs: initialLiquidations,
  onApprove,
  onReject,
  module,
}: LiquidationPageProps) {
  const [liquidations, setLiquidations] =
    useState<LiquidationInterface[]>(initialLiquidations);
  const [selectedLiquidation, setSelectedLiquidation] =
    useState<LiquidationInterface | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approvedRFPDialogOpen, setApprovedRFPDialogOpen] = useState(false);
  // Action confirmation dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approved" | "rejected" | null>(
    null,
  );
  // Loading states
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const router = useRouter();

  const { hasAction } = usePermissions();
  const pathname = usePathname();

  const printContentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printContentRef,
    documentTitle: selectedLiquidation
      ? `Liquidation_${selectedLiquidation.liquidation_number}`
      : "Liquidation_Details",
    pageStyle: `
      @media print {
        @page { size: A4; margin: 15mm; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-only { display: block !important; }
        .no-print { display: none !important; }
      }
    `,
  });

  let currentModule: "employee" | "finance" | null = null;
  if (pathname.startsWith("/home/employee-portal/requests")) {
    currentModule = "employee";
  } else if (pathname.startsWith("/home/finance")) {
    currentModule = "finance";
  }

  const moduleActions: Record<"employee" | "finance", string[]> = {
    employee: ["approve-reject-liq-emp"],
    finance: ["approve-reject-liq-fin"],
  };

  const canApproveReject =
    currentModule !== null &&
    moduleActions[currentModule].some((action) => hasAction(action));

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { bg: string; text: string; border: string; label: string }
    > = {
      liquidated: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        label: "Liquidated",
      },
      for_liquidation: {
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        border: "border-indigo-200",
        label: "For Liquidation",
      },
      submitted: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        label: "Submitted",
      },
      approved: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        label: "Approved",
      },
      rejected: {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        label: "Rejected",
      },
    };

    const config = statusConfig[status] || statusConfig.submitted;

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
        {config.label}
      </Badge>
    );
  };

  const handleView = (liquidation: LiquidationInterface) => {
    setSelectedLiquidation(liquidation);
    setViewDialogOpen(true);
  };

  const handleReviewRFP = () => {
    setApprovedRFPDialogOpen(true);
  };

  // Parse liquidation entries from JSON string
  const parseEntries = (
    entriesJson: string | LiquidationEntry[],
  ): LiquidationEntry[] => {
    if (Array.isArray(entriesJson)) return entriesJson;
    try {
      return JSON.parse(entriesJson);
    } catch {
      return [];
    }
  };

  // Format currency
  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(num || 0);
  };

  // Handle action click from table row
  const handleActionClick = (
    liquidation: LiquidationInterface,
    action: "approved" | "rejected",
  ) => {
    setSelectedLiquidation(liquidation);
    setActionType(action);
    setActionDialogOpen(true);
  };

  // Handle confirm action
  const handleConfirmAction = async () => {
    if (!selectedLiquidation || !actionType) return;

    if (actionType === "approved" && onApprove) {
      try {
        setIsApproving(true);
        await onApprove(selectedLiquidation.id);
        // Update local state
        setLiquidations((prev) =>
          prev.map((l) =>
            l.id === selectedLiquidation.id ? { ...l, status: "approved" } : l,
          ),
        );
        toast.success("Liquidation approved successfully", {
          description: `Liquidation ${selectedLiquidation.liquidation_number} has been approved.`,
        });
      } catch (error) {
        console.error("Failed to approve liquidation:", error);
        toast.error("Failed to approve liquidation", {
          description:
            "An error occurred while approving the liquidation. Please try again.",
        });
      } finally {
        setIsApproving(false);
      }
    } else if (actionType === "rejected" && onReject) {
      try {
        setIsRejecting(true);
        await onReject(selectedLiquidation.id);
        // Update local state
        setLiquidations((prev) =>
          prev.map((l) =>
            l.id === selectedLiquidation.id ? { ...l, status: "rejected" } : l,
          ),
        );
        toast.success("Liquidation rejected", {
          description: `Liquidation ${selectedLiquidation.liquidation_number} has been rejected.`,
        });
      } catch (error) {
        console.error("Failed to reject liquidation:", error);
        toast.error("Failed to reject liquidation", {
          description:
            "An error occurred while rejecting the liquidation. Please try again.",
        });
      } finally {
        setIsRejecting(false);
      }
    }

    setActionDialogOpen(false);
  };

  // Stats calculation
  const stats = [
    {
      title: "Total Requests",
      value: liquidations.length,
      icon: FileText,
      color: "text-[#2B3A9F]",
      bgColor: "bg-[#2B3A9F]/10",
    },
    {
      title: "For Liquidation",
      value: rfps.length,
      icon: DollarSign,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Submitted",
      value: liquidations.filter((l) => l.status === "submitted").length,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      title: "Liquidated",
      value: liquidations.filter((l) => l.status === "liquidated").length,
      icon: CheckCircle,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Rejected",
      value: liquidations.filter((l) => l.status === "rejected").length,
      icon: XCircle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
    },
  ];

  // Define columns matching LiquidationInterface
  const columns: Column<LiquidationInterface>[] = [
    {
      key: "liquidation_number",
      header: "Liquidation No.",
      width: "w-[160px]",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-mono text-sm font-semibold text-[#2B3A9F]">
            {row.liquidation_number}
          </span>
          <span className="text-[10px] text-slate-500">
            RFP: {row.rfp_number}
          </span>
        </div>
      ),
    },
    {
      key: "payable_to",
      header: "Payable To",
      width: "min-w-[180px]",
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-900">{row.payable_to}</span>
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
      key: "amounts",
      header: "Amounts",
      width: "w-[140px]",
      render: (row) => {
        const original = parseFloat(row.original_amount);
        const liquidated = parseFloat(row.total_liquidated);
        const hasVariance = original !== liquidated;

        return (
          <div className="flex flex-col">
            <span
              className={cn(
                "font-mono text-sm font-semibold",
                hasVariance ? "text-amber-600" : "text-emerald-600",
              )}
            >
              {formatCurrency(row.total_liquidated)}
            </span>
            {hasVariance && (
              <span className="text-xs text-slate-400 line-through">
                Orig: {formatCurrency(row.original_amount)}
              </span>
            )}
            {parseFloat(row.remaining_balance) > 0 && (
              <span className="text-[10px] text-rose-500">
                Bal: {formatCurrency(row.remaining_balance)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      width: "w-[120px]",
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "dateSubmitted",
      header: "Date Created",
      width: "w-[130px]",
      render: (row) => (
        <div className="flex items-center gap-1.5 text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm">
            {new Date(row.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      ),
    },
    {
      key: "requestor",
      header: "Requestor",
      width: "w-[140px]",
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm text-slate-700 truncate">
            {row.requested_by}
          </span>
        </div>
      ),
    },
  ];

  const filterOptions = [
    { value: "for_liquidation", label: "For Liquidation" },
    { value: "submitted", label: "Submitted" },
    { value: "liquidated", label: "Liquidated" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  const handleCreateLiquidation = (rfp: RequestForPaymentInterface) => {
    //console.log("Creating liquidation from RFP:", rfp.id);
    setApprovedRFPDialogOpen(false);
    router.push(`/home/${module}/liquidation/liquidate/${rfp.id}`);
  };

  const parseJournalEntries = (data: any) => {
    if (!data) return [];

    if (Array.isArray(data)) return data;

    if (typeof data === "string") {
      try {
        return JSON.parse(data);
      } catch {
        return [];
      }
    }

    return [];
  };

  return (
    <div className="min-h-screen p-6 md:p-8 bg-slate-50/50">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Liquidation</h1>
        <p className="text-slate-500">
          Manage and track all your liquidated requests in one place
        </p>
      </div>

      {/* Stats Grid - 5 columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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

      {/* Data Table Card */}
      <DataTableCard
        data={liquidations}
        columns={columns}
        keyExtractor={(row) => row.id}
        title="All Liquidated Requests"
        subtitle={`${liquidations.length} total liquidation requests in the system`}
        searchPlaceholder="Search liquidations..."
        searchable
        searchKeys={[
          "liquidation_number",
          "rfp_number",
          "requested_by",
          "department",
          "payable_to",
          "payment_method",
        ]}
        filterable
        filterKey="status"
        filterOptions={filterOptions}
        pagination
        defaultPageSize={5}
        headerActions={
          <Button
            className="bg-[#2B3A9F] hover:bg-[#2B3A9F]/90 text-white shadow-lg shadow-[#2B3A9F]/25 transition-all hover:shadow-xl hover:shadow-[#2B3A9F]/20"
            onClick={handleReviewRFP}
          >
            <Plus className="mr-2 h-4 w-4" />
            Review RFP requests
          </Button>
        }
        // Actions with conditional Approve/Reject buttons
        actions={(row) => (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleView(row)}
              className="h-8 px-3 text-xs font-medium border-slate-200 text-slate-700 hover:text-[#2B3A9F] hover:border-[#2B3A9F]/30 hover:bg-[#2B3A9F]/5"
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View
            </Button>
            {/* Conditional Approve/Reject buttons - only for submitted/for_liquidation status */}

            {canApproveReject &&
              (row.status === "submitted" ||
                row.status === "for_liquidation") && (
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

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-900">
              Liquidation Details
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {selectedLiquidation?.liquidation_number}
            </DialogDescription>
          </DialogHeader>

          <div ref={printContentRef} className="print-only">
            {selectedLiquidation && (
              <PrintLiquidation liquidation={selectedLiquidation} />
            )}
          </div>

          {selectedLiquidation && (
            <div className="space-y-6 py-4">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-600">
                  Status
                </span>
                {getStatusBadge(selectedLiquidation.status)}
              </div>

              {/* Main Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Liquidation Number
                  </p>
                  <p className="font-mono text-sm font-semibold text-[#2B3A9F]">
                    {selectedLiquidation.liquidation_number}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    RFP Reference
                  </p>
                  <p className="font-mono text-sm font-semibold text-slate-900">
                    {selectedLiquidation.rfp_number}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Payable To
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedLiquidation.payable_to}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Payment Method
                  </p>
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedLiquidation.payment_method}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Requestor
                  </p>
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-900">
                      {selectedLiquidation.requested_by}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Department
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedLiquidation.department}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    Date Created
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-900">
                      {new Date(
                        selectedLiquidation.created_at,
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Vehicle Information */}
              {selectedLiquidation.vehicle && (
                <div className="border rounded-lg p-4 bg-slate-50/50">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <Car className="h-4 w-4 text-[#2B3A9F]" />
                    Vehicle Information
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Plate Number
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedLiquidation.vehicle.plate_number}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Vehicle
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedLiquidation.vehicle.car_type}
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Owner
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedLiquidation.vehicle.owners_first_name}{" "}
                        {selectedLiquidation.vehicle.owners_last_name}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Financial Summary */}
              <div className="border rounded-lg p-4 bg-slate-50/50">
                <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-[#2B3A9F]" />
                  Financial Summary
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-xs text-slate-500 mb-1">
                      Original Amount
                    </p>
                    <p className="font-mono text-sm font-semibold text-slate-900">
                      {formatCurrency(selectedLiquidation.original_amount)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-xs text-slate-500 mb-1">Liquidated</p>
                    <p
                      className={cn(
                        "font-mono text-sm font-semibold",
                        parseFloat(selectedLiquidation.total_liquidated) <=
                          parseFloat(selectedLiquidation.original_amount)
                          ? "text-emerald-600"
                          : "text-rose-600",
                      )}
                    >
                      {formatCurrency(selectedLiquidation.total_liquidated)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border">
                    <p className="text-xs text-slate-500 mb-1">Remaining</p>
                    <p
                      className={cn(
                        "font-mono text-sm font-semibold",
                        parseFloat(selectedLiquidation.remaining_balance) === 0
                          ? "text-emerald-600"
                          : "text-amber-600",
                      )}
                    >
                      {formatCurrency(selectedLiquidation.remaining_balance)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Journal Entries */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Journal Entries (
                  {
                    parseJournalEntries(selectedLiquidation.journal_entries)
                      .length
                  }
                  )
                </h4>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs font-medium text-slate-600">
                          Account Title
                        </TableHead>
                        <TableHead className="text-xs font-medium text-slate-600">
                          Type
                        </TableHead>
                        <TableHead className="text-xs font-medium text-slate-600 text-right">
                          Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {parseJournalEntries(
                        selectedLiquidation.journal_entries,
                      ).map((entry: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="text-sm text-slate-700">
                            {entry.accountTitle}
                          </TableCell>

                          <TableCell className="text-sm capitalize">
                            <span
                              className={
                                entry.entryType === "debit"
                                  ? "text-emerald-600 font-medium"
                                  : "text-rose-600 font-medium"
                              }
                            >
                              {entry.entryType}
                            </span>
                          </TableCell>

                          <TableCell className="text-sm font-mono font-semibold text-right">
                            {formatCurrency(entry.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Liquidation Entries */}
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-3">
                  Liquidation Entries (
                  {parseEntries(selectedLiquidation.liquidation_entries).length}
                  )
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="text-xs font-medium text-slate-600">
                          Date
                        </TableHead>
                        <TableHead className="text-xs font-medium text-slate-600">
                          Description
                        </TableHead>
                        <TableHead className="text-xs font-medium text-slate-600 text-right">
                          Amount
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseEntries(
                        selectedLiquidation.liquidation_entries,
                      ).map((entry, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-sm">
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700">
                            {entry.description}
                            {entry.supplier && (
                              <span className="text-xs text-slate-500 block">
                                Supplier ID: {entry.supplier}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm font-mono font-semibold text-right">
                            {formatCurrency(entry.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Supporting Documents - Using your FileGallery */}
              {selectedLiquidation && (
                <>
                  {(() => {
                    const docs = selectedLiquidation.supporting_documents ?? [];
                    return docs.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#2B3A9F]" />
                          Supporting Documents
                        </h4>
                        <FileGallery documents={docs} />
                      </div>
                    ) : null;
                  })()}
                </>
              )}

              {/* Approval Info - shown if approved/rejected */}
              {selectedLiquidation.approved_by && (
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    {selectedLiquidation.status === "approved"
                      ? "Approval"
                      : selectedLiquidation.status === "rejected"
                        ? "Rejection"
                        : "Processing"}{" "}
                    Details
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedLiquidation.approved_by}
                      </p>
                      <p className="text-xs text-slate-500">
                        {selectedLiquidation.status === "approved"
                          ? "Approved on"
                          : selectedLiquidation.status === "rejected"
                            ? "Rejected on"
                            : "Processed on"}{" "}
                        {selectedLiquidation.approved_date
                          ? new Date(
                              selectedLiquidation.approved_date,
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "-"}
                      </p>
                    </div>
                    {selectedLiquidation.status === "approved" ? (
                      <CheckCircle className="h-8 w-8 text-emerald-600" />
                    ) : selectedLiquidation.status === "rejected" ? (
                      <XCircle className="h-8 w-8 text-rose-600" />
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="border-slate-200 text-slate-700"
            >
              Close
            </Button>

            <Button
              variant="outline"
              onClick={handlePrint}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print / PDF
            </Button>
            {/* Approve/Reject buttons in View Dialog footer */}
            {canApproveReject &&
              selectedLiquidation &&
              (selectedLiquidation.status === "submitted" ||
                selectedLiquidation.status === "for_liquidation") && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleActionClick(selectedLiquidation, "rejected");
                    }}
                    className="border-rose-200 text-rose-700 hover:bg-rose-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleActionClick(selectedLiquidation, "approved");
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

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {actionType === "approved" ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-600" />
              )}
              {actionType === "approved"
                ? "Approve Liquidation"
                : "Reject Liquidation"}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Are you sure you want to {actionType}{" "}
              <span className="font-semibold text-slate-900">
                {selectedLiquidation?.liquidation_number}
              </span>
              ?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setActionDialogOpen(false)}
              className="border-slate-200 text-slate-700"
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

      {/* Approved RFP Dialog */}
      <Dialog
        open={approvedRFPDialogOpen}
        onOpenChange={setApprovedRFPDialogOpen}
      >
        <DialogContent className="sm:max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 py-5 border-b bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900 tracking-tight">
                  Approved RFP Requests
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 mt-1">
                  Select an approved RFP request to liquidate
                </DialogDescription>
              </div>
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
              >
                {rfps.length} approved
              </Badge>
            </div>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(85vh-180px)] p-6">
            {rfps.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  No approved requests
                </h3>
                <p className="text-sm text-slate-500">
                  There are no approved RFP requests available at this time.
                </p>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-transparent border-b border-slate-200">
                      <TableHead className="font-semibold text-xs text-slate-600 py-4 w-40">
                        RFP Number
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-slate-600 py-4 w-48">
                        Payable To
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-slate-600 py-4 w-32">
                        Payment Method
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-slate-600 py-4 w-32 text-right">
                        Amount
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-slate-600 py-4 w-28 text-center">
                        Items
                      </TableHead>
                      <TableHead className="font-semibold text-xs text-slate-600 py-4 w-36 text-right">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfps.map((rfp) => (
                      <TableRow
                        key={rfp.id}
                        className="group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                      >
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-sm font-semibold text-[#2B3A9F]">
                              {rfp.rfp_number}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              PO: {rfp.order_number}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-900 line-clamp-1">
                              {rfp.payable_to}
                            </span>
                            <span className="text-xs text-slate-500">
                              {rfp.department}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm text-slate-700">
                              {rfp.payment_method}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <span className="font-mono text-sm font-semibold text-slate-900">
                            {new Intl.NumberFormat("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            }).format(Number(rfp.total_payable) || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                            {rfp.line_items?.length || 0} items
                          </span>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleCreateLiquidation(rfp)}
                            className="bg-[#2B3A9F] hover:bg-[#1E2A7A] text-white gap-2 shadow-sm transition-all"
                          >
                            Liquidate
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

          <DialogFooter className="px-6 py-4 border-t bg-slate-50">
            <Button
              variant="outline"
              onClick={() => setApprovedRFPDialogOpen(false)}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
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
