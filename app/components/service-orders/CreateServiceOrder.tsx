"use client";
import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Calendar,
  User,
  DollarSign,
  FileText,
  Truck,
  CreditCard,
  Package,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Plus,
  ArrowLeftRight,
  Trash2,
  Save,
  Coins,
  Receipt,
  Wallet,
  Calculator,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import {
  Item,
  JournalEntry,
  priorityConfig,
  RequestDetailsPageProps,
  statusConfig,
} from "@/lib/interfaces";
import { cn } from "@/lib/utils";

// Helper to calculate total from items
const calculateTotal = (items: Item[]): number => {
  return items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    return sum + qty * price;
  }, 0);
};

// Helper to format currency
const formatCurrency = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null || value === "") return "₱0.00";
  if (typeof value === "number")
    return isNaN(value)
      ? "₱0.00"
      : new Intl.NumberFormat("en-PH", {
          style: "currency",
          currency: "PHP",
        }).format(value);

  const cleanedValue = value
    .toString()
    .replace(/[₱$,\s]/g, "")
    .trim();
  if (!cleanedValue) return "₱0.00";

  const numValue = parseFloat(cleanedValue);
  return isNaN(numValue)
    ? "₱0.00"
    : new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
      }).format(numValue);
};

function DetailItem({
  label,
  value,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div
      className={cn(
        "flex items-start gap-3 py-3 px-3 rounded-lg transition-colors",
        highlight
          ? "bg-[#EEF2FF] border border-[#2B3A9F]/20"
          : "hover:bg-slate-50",
      )}
    >
      {Icon && (
        <div
          className={cn(
            "p-2 rounded-lg shrink-0",
            highlight
              ? "bg-[#2B3A9F] text-white"
              : "bg-[#EEF2FF] text-[#2B3A9F]",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-0.5">
          {label}
        </p>
        <p
          className={cn(
            "text-sm font-semibold truncate",
            highlight ? "text-[#2B3A9F]" : "text-[#1E293B]",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

export default function RequestDetailsPage({
  request,
  accounts,
  units,
}: RequestDetailsPageProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accountTitle, setAccountTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [entryType, setEntryType] = useState<"debit" | "credit">("debit");

  const handleAddRow = () => {
    if (!accountTitle || !amount) return;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newId =
      entries.length > 0 ? Math.max(...entries.map((e) => e.id)) + 1 : 1;

    const newEntry: JournalEntry = {
      id: newId,
      accountTitle,
      amount: parsedAmount,
      entryType,
    };
    setEntries([...entries, newEntry]);
    setAccountTitle("");
    setAmount("");
    setEntryType("debit");
  };

  const handleDeleteEntry = (id: number) => {
    setEntries(entries.filter((entry) => entry.id !== id));
  };

  const totalDebits = entries
    .filter((e) => e.entryType === "debit")
    .reduce((sum, e) => sum + (isNaN(e.amount) ? 0 : e.amount), 0);

  const totalCredits = entries
    .filter((e) => e.entryType === "credit")
    .reduce((sum, e) => sum + (isNaN(e.amount) ? 0 : e.amount), 0);

  const isBalanced = totalDebits === totalCredits && entries.length > 0;

  // Calculate total amount from items
  const totalAmount = useMemo(
    () => calculateTotal(request.items),
    [request.items],
  );

  async function handleCreateServiceOrder() {
    if (!request?.id) return;

    if (entries.length === 0 || totalDebits !== totalCredits) {
      console.warn("Entries must exist and be balanced");
      return;
    }

    const storedUser = localStorage.getItem("userCache");
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (!user?.profile.user_id) {
      console.error("User not authenticated");
      return;
    }

    try {
      const supabase = createClient();

      const journalEntriesPayload = entries.map((entry) => ({
        accountTitle: entry.accountTitle,
        entryType: entry.entryType,
        amount: entry.amount,
      }));

      const { data, error } = await supabase
        .from("service_orders")
        .insert({
          service_request_id: request.id,
          order_prepared_by: user.profile.user_id,
          journal_entries: journalEntriesPayload,
          status: "for approval",
        })
        .select()
        .single();

      if (error) throw error;

      console.log("Service Order created:", data);

      // optional UI reset
      setEntries([]);
    } catch (err) {
      console.error("Service Order Creation failed:", err);
    }
  }

  const getUnitName = (unitId: string) => {
    const unit = units?.find((u) => u.unit_id === unitId);
    return unit?.name || unitId;
  };

  if (!request) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <Card className="border-dashed border-2 border-[#CBD5E1] bg-white/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="p-4 rounded-full bg-[#FEE2E2] mb-4">
                <AlertCircle className="h-8 w-8 text-[#DC2626]" />
              </div>
              <h2 className="text-xl font-bold text-[#1E293B] mb-2">
                Request Not Found
              </h2>
              <p className="text-[#64748B] text-center max-w-md mb-6">
                The requested service order could not be found or may have been
                removed.
              </p>
              <Link href="/home/finance/service-orders">
                <Button className="bg-[#2B3A9F] hover:bg-[#1E2A7A] text-white">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Requests
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[request.status]?.icon || AlertCircle;
  const isVehicleRequest = request.service_category === "Vehicle Maintenance";

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/home/finance/service-orders">
              <Button
                variant="outline"
                size="icon"
                className="border-[#E2E8F0] hover:bg-[#EEF2FF] hover:text-[#2B3A9F] hover:border-[#2B3A9F]/30 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-[#1E293B] tracking-tight">
                Request Details
              </h1>
              <p className="text-sm text-[#64748B] mt-1">
                Viewing{" "}
                <span className="font-semibold text-[#2B3A9F]">
                  {request.request_number}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:hidden">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Request Overview Card */}
            <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-[#2B3A9F] via-[#3B4DB8] to-[#14B8A6]" />
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-[#1E293B] mb-2">
                      {request.title}
                    </CardTitle>
                    <CardDescription className="text-base text-[#64748B] leading-relaxed">
                      {request.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-3 py-1.5 font-semibold border-2",
                        statusConfig[request.status]?.bgColor,
                        statusConfig[request.status]?.color,
                        statusConfig[request.status]?.borderColor,
                      )}
                    >
                      <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                      {statusConfig[request.status]?.label || request.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-3 py-1.5 font-semibold border-2",
                        priorityConfig[request.priority_level]?.bgColor,
                        priorityConfig[request.priority_level]?.color,
                        priorityConfig[request.priority_level]?.borderColor,
                      )}
                    >
                      {request.priority_level} Priority
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem
                    label="Service Category"
                    value={request.service_category}
                    icon={Package}
                    highlight
                  />
                  <DetailItem
                    label="Department"
                    value={request.department}
                    icon={Building2}
                  />
                  <DetailItem
                    label="Preferred Date"
                    value={new Date(request.preferred_date).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                    icon={Calendar}
                  />
                  <DetailItem
                    label="Required By"
                    value={new Date(request.required_by).toLocaleDateString(
                      "en-US",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      },
                    )}
                    icon={Calendar}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Details */}
            {isVehicleRequest && request.vehicle?.plate_number && (
              <Card className="border-[#E2E8F0] shadow-sm">
                <CardHeader className="bg-gradient-to-r from-[#F59E0B]/10 to-transparent border-b border-[#E2E8F0]">
                  <CardTitle className="flex items-center gap-2 text-[#1E293B]">
                    <div className="p-2 rounded-lg bg-[#F59E0B] text-white">
                      <Truck className="h-5 w-5" />
                    </div>
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DetailItem
                      label="Plate Number"
                      value={request.vehicle.plate_number}
                      icon={Receipt}
                      highlight
                    />
                    <DetailItem
                      label="Vehicle Type"
                      value={request.vehicle.car_type}
                      icon={Truck}
                    />
                    <DetailItem
                      label="Owner Name"
                      value={`${request.vehicle.owners_first_name} ${request.vehicle.owners_last_name}`.trim()}
                      icon={User}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items Table */}
            <Card className="border-[#E2E8F0] shadow-sm">
              <CardHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#2B3A9F] text-white">
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-[#1E293B]">
                        Requested Items
                      </CardTitle>
                      <CardDescription className="text-[#64748B]">
                        {request.items.length} item
                        {request.items.length !== 1 ? "s" : ""} in this request
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9] border-b-2 border-[#E2E8F0]">
                        <TableHead className="w-12 text-center font-bold text-[#475569]">
                          #
                        </TableHead>
                        <TableHead className="font-bold text-[#475569]">
                          Item
                        </TableHead>
                        <TableHead className="font-bold text-[#475569]">
                          Description
                        </TableHead>
                        <TableHead className="text-center font-bold text-[#475569]">
                          Qty
                        </TableHead>
                        <TableHead className="text-right font-bold text-[#475569]">
                          Unit Price
                        </TableHead>
                        <TableHead className="text-right font-bold text-[#2B3A9F]">
                          Total
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {request.items.map((item, index) => {
                        const qty = parseFloat(item.quantity) || 0;
                        const price = parseFloat(item.unitPrice) || 0;
                        const total = qty * price;
                        return (
                          <TableRow
                            key={index}
                            className="hover:bg-[#F8FAFC] transition-colors border-b border-[#E2E8F0] last:border-b-0"
                          >
                            <TableCell className="text-center font-medium text-[#64748B]">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-semibold text-[#1E293B]">
                              {item.name}
                            </TableCell>
                            <TableCell className="text-[#64748B]">
                              {item.description}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF2FF] text-[#2B3A9F]">
                                {item.quantity}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-[#64748B]">
                              {formatCurrency(item.unitPrice)} / {getUnitName(item.unit)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-[#2B3A9F]">
                              {formatCurrency(total)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-end">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-[#E2E8F0] min-w-[200px]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-[#64748B] font-medium">
                        Total Estimated Cost
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-[#059669] font-mono">
                      {formatCurrency(totalAmount)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            {request.supporting_documents.length > 0 && (
              <Card className="border-[#E2E8F0] shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#1E293B]">
                    <div className="p-2 rounded-lg bg-[#8B5CF6] text-white">
                      <FileText className="h-5 w-5" />
                    </div>
                    Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {request.supporting_documents.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-4 rounded-xl border border-[#E2E8F0] bg-white hover:border-[#2B3A9F]/30 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() =>
                          window.open(file, "_blank", "noopener,noreferrer")
                        }
                      >
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#2B3A9F] to-[#3B4DB8] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1E293B] truncate">
                            {file.split("/").pop() || file}
                          </p>
                          <p className="text-xs text-[#64748B]">
                            Click to view
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-[#64748B] group-hover:text-[#2B3A9F] transition-colors" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Requester Info */}
            <Card className="border-[#E2E8F0] shadow-sm overflow-hidden">
              <div className="h-1 bg-[#2B3A9F]" />
              <CardHeader className="pb-4">
                <CardTitle className="text-base text-[#1E293B] flex items-center gap-2">
                  <User className="h-4 w-4 text-[#2B3A9F]" />
                  Request Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <Avatar className="h-14 w-14 border-2 border-[#2B3A9F]/20">
                    <AvatarFallback className="bg-gradient-to-br from-[#2B3A9F] to-[#3B4DB8] text-white text-lg font-bold">
                      {request.requested_by?.slice(0, 2).toUpperCase() || "RQ"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1E293B] truncate">
                      {request.requested_by}
                    </p>
                    <p className="text-sm text-[#64748B]">
                      {request.department}
                    </p>
                  </div>
                </div>
                <Separator className="bg-[#E2E8F0]" />
                <DetailItem
                  label="Company"
                  value={request.company}
                  icon={Building2}
                />
              </CardContent>
            </Card>

            {/* Vendor Info */}
            <Card className="border-[#E2E8F0] shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-base text-[#1E293B] flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#14B8A6]" />
                  Vendor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailItem
                  label="Preferred Vendor"
                  value={request.preferred_vendor}
                  icon={Building2}
                  highlight
                />
                <DetailItem
                  label="Contact Person"
                  value={request.contact_person}
                  icon={User}
                />
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card className="border-[#E2E8F0] shadow-sm bg-gradient-to-b from-white to-[#F8FAFC]">
              <CardHeader className="pb-4">
                <CardTitle className="text-base text-[#1E293B] flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-[#F59E0B]" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailItem
                  label="Payment Method"
                  value={request.payment_method}
                  icon={CreditCard}
                />
                <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-[#D97706]" />
                    <span className="text-xs font-bold text-[#D97706] uppercase tracking-wider">
                      Amount Due
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-[#92400E] font-mono">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Journal Entry Section */}
        <div className="mt-8 print:hidden">
          <Card className="border-[#E2E8F0] shadow-lg overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-[#2B3A9F] via-[#8B5CF6] to-[#14B8A6]" />
            <CardHeader className="pb-6 bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#2B3A9F] to-[#3B4DB8] shadow-lg shadow-[#2B3A9F]/25">
                    <Calculator className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-[#1E293B]">
                      Journal Entry
                    </CardTitle>
                    <CardDescription className="text-[#64748B]">
                      Record double-entry bookkeeping transaction
                    </CardDescription>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="px-4 py-1.5 font-semibold bg-[#EEF2FF] text-[#2B3A9F] border-[#2B3A9F]/30"
                >
                  Accounting
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* Input Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="space-y-2.5">
                  <Label className="text-sm font-bold text-[#475569] flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#2B3A9F]" />
                    Account Title
                  </Label>
                  <Select value={accountTitle} onValueChange={setAccountTitle}>
                    <SelectTrigger className="w-full bg-white border-[#E2E8F0] focus:ring-[#2B3A9F] focus:border-[#2B3A9F] h-11">
                      <SelectValue placeholder="Select account..." />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem
                          key={account.account_id}
                          value={account.name}
                        >
                          <span className="text-[#64748B]">
                            {account.account_type}
                          </span>
                          <span className="mx-2 text-[#CBD5E1]">•</span>
                          <span className="font-medium text-[#1E293B]">
                            {account.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-sm font-bold text-[#475569] flex items-center gap-2">
                    <Coins className="h-4 w-4 text-[#2B3A9F]" />
                    Amount
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white border-[#E2E8F0] focus:ring-[#2B3A9F] focus:border-[#2B3A9F] h-11 font-mono text-[#1E293B]"
                  />
                </div>

                <div className="space-y-2.5">
                  <Label className="text-sm font-bold text-[#475569] flex items-center gap-2">
                    <ArrowLeftRight className="h-4 w-4 text-[#2B3A9F]" />
                    Entry Type
                  </Label>
                  <Select
                    value={entryType}
                    onValueChange={(value: "debit" | "credit") =>
                      setEntryType(value)
                    }
                  >
                    <SelectTrigger className="w-full bg-white border-[#E2E8F0] focus:ring-[#2B3A9F] focus:border-[#2B3A9F] h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                          <span className="font-medium text-[#059669]">
                            Debit
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="credit">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                          <span className="font-medium text-[#DC2626]">
                            Credit
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleAddRow}
                  disabled={!accountTitle || !amount}
                  className="bg-[#2B3A9F] hover:bg-[#1E2A7A] text-white px-6 h-11 shadow-lg shadow-[#2B3A9F]/25 transition-all hover:shadow-xl hover:shadow-[#2B3A9F]/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry to Table
                </Button>
              </div>

              <Separator className="bg-[#E2E8F0]" />

              {/* Entries Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-[#475569]">
                    Journal Entries{" "}
                    <span className="text-[#64748B] font-normal">
                      ({entries.length})
                    </span>
                  </Label>
                  {entries.length > 0 && (
                    <Badge
                      variant={isBalanced ? "default" : "destructive"}
                      className={cn(
                        "px-4 py-1.5 font-bold",
                        isBalanced
                          ? "bg-[#D1FAE5] text-[#059669] hover:bg-[#D1FAE5] border border-[#6EE7B7]"
                          : "bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]",
                      )}
                    >
                      {isBalanced ? (
                        <>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />{" "}
                          Balanced
                        </>
                      ) : (
                        <>
                          <AlertCircle className="mr-1.5 h-3.5 w-3.5" />{" "}
                          Unbalanced
                        </>
                      )}
                    </Badge>
                  )}
                </div>

                <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9] border-b-2 border-[#E2E8F0]">
                        <TableHead className="w-12 text-center font-bold text-[#475569]">
                          #
                        </TableHead>
                        <TableHead className="font-bold text-[#475569]">
                          Account Title
                        </TableHead>
                        <TableHead className="w-40 text-right font-bold text-[#059669]">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="h-4 w-4" />
                            Debit
                          </div>
                        </TableHead>
                        <TableHead className="w-40 text-right font-bold text-[#DC2626]">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingDown className="h-4 w-4" />
                            Credit
                          </div>
                        </TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entries.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-12 text-[#64748B]"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-4 rounded-full bg-[#F1F5F9]">
                                <Calculator className="h-8 w-8 text-[#94A3B8]" />
                              </div>
                              <p className="text-sm">
                                No entries yet. Fill the form above to add
                                transactions.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        entries.map((entry, index) => (
                          <TableRow
                            key={entry.id}
                            className="group hover:bg-[#F8FAFC] transition-colors border-b border-[#E2E8F0] last:border-b-0"
                          >
                            <TableCell className="text-center text-[#64748B] font-medium">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-semibold text-[#1E293B] capitalize">
                              {entry.accountTitle.replace(/-/g, " ")}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-mono font-semibold",
                                entry.entryType === "debit"
                                  ? "text-[#059669] bg-[#ECFDF5]"
                                  : "text-[#CBD5E1]",
                              )}
                            >
                              {entry.entryType === "debit"
                                ? formatCurrency(entry.amount)
                                : "—"}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-mono font-semibold",
                                entry.entryType === "credit"
                                  ? "text-[#DC2626] bg-[#FEF2F2]"
                                  : "text-[#CBD5E1]",
                              )}
                            >
                              {entry.entryType === "credit"
                                ? formatCurrency(entry.amount)
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteEntry(entry.id)}
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FEE2E2] hover:text-[#DC2626]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {entries.length > 0 && (
                        <TableRow className="bg-[#F8FAFC] font-bold border-t-2 border-[#E2E8F0]">
                          <TableCell></TableCell>
                          <TableCell className="text-[#1E293B] text-base">
                            TOTAL
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-mono text-base",
                              totalDebits === totalCredits
                                ? "text-[#059669]"
                                : "text-[#D97706]",
                            )}
                          >
                            {formatCurrency(totalDebits)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-mono text-base",
                              totalDebits === totalCredits
                                ? "text-[#DC2626]"
                                : "text-[#D97706]",
                            )}
                          >
                            {formatCurrency(totalCredits)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary Card */}
                {entries.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <div
                      className={cn(
                        "rounded-xl p-5 min-w-[280px] space-y-3 border-2 shadow-sm",
                        isBalanced
                          ? "bg-[#ECFDF5] border-[#6EE7B7]"
                          : "bg-[#FEF3C7] border-[#FCD34D]",
                      )}
                    >
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#475569] font-medium flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                          Total Debits
                        </span>
                        <span className="font-mono font-bold text-[#059669]">
                          {formatCurrency(totalDebits)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#475569] font-medium flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                          Total Credits
                        </span>
                        <span className="font-mono font-bold text-[#DC2626]">
                          {formatCurrency(totalCredits)}
                        </span>
                      </div>
                      <Separator
                        className={isBalanced ? "bg-[#6EE7B7]" : "bg-[#FCD34D]"}
                      />
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#1E293B] text-sm">
                          Difference
                        </span>
                        <span
                          className={cn(
                            "font-mono font-bold text-lg",
                            isBalanced ? "text-[#059669]" : "text-[#D97706]",
                          )}
                        >
                          {formatCurrency(Math.abs(totalDebits - totalCredits))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F0]">
                <Button
                  variant="outline"
                  onClick={() => setEntries([])}
                  className="border-[#E2E8F0] hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#FCA5A5] transition-all"
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submit Action */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              onClick={handleCreateServiceOrder}
              disabled={!isBalanced || entries.length === 0}
              className={cn(
                "px-8 h-12 text-base font-semibold shadow-lg transition-all",
                isBalanced && entries.length > 0
                  ? "bg-[#2B3A9F] hover:bg-[#1E2A7A] text-white shadow-[#2B3A9F]/25 hover:shadow-xl hover:shadow-[#2B3A9F]/30"
                  : "bg-[#CBD5E1] text-[#64748B] cursor-not-allowed",
              )}
            >
              <Save className="h-5 w-5 mr-2" />
              Submit as Service Order
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
