"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Car,
  FileText,
  Plus,
  Save,
  Trash2,
  Building2,
  CreditCard,
  Hash,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Download,
  ImageIcon,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CreateLiquidationPageProps } from "@/lib/interfaces";
import { SearchableCombobox } from "../inputs/SearchableCombobox";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LiquidationEntry {
  id: string;
  date: string;
  plateNumber: string;
  supplier: string;
  description: string;
  glAccount: string;
  amount: number;
}

const parseAmount = (value: string | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  const cleaned = value.toString().replace(/[₱$,\s]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (value: number | string | null | undefined): string => {
  const num = parseAmount(value);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
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

export default function CreateLiquidation({
  rfp,
  vehicles,
  accounts,
  vendors,
  module,
}: CreateLiquidationPageProps) {
  const [date, setDate] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [description, setDescription] = useState("");
  const [glAccount, setGlAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [supportingDocs, setSupportingDocs] = useState<string[]>(
    rfp?.supporting_documents || []
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const [entries, setEntries] = useState<LiquidationEntry[]>([]);

  const isImage = (url: string): boolean => {
    if (!url) return false;
    const cleanUrl = url.split("?")[0];
    const ext = cleanUrl.split(".").pop()?.toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"].includes(ext || "");
  };

  const getFileName = (url: string): string => {
    if (!url) return "Document";
    try {
      let name = url.split("/").pop() || "Document";
      name = name.split("?")[0];
      return decodeURIComponent(name);
    } catch {
      return "Document";
    }
  };

  // File Upload - Store signed URL in DB
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${fileExt}`;
        const filePath = `documents/liquidations/${rfp.id}/${fileName}`;

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });

        if (uploadError) throw uploadError;

        // Generate signed URL
        const { data: urlData } = await supabase.storage
          .from("documents")
          .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days expiry

        if (urlData?.signedUrl) {
          newUrls.push(urlData.signedUrl);
        }
      }

      const updatedDocs = [...supportingDocs, ...newUrls];
      setSupportingDocs(updatedDocs);

      const { error: updateError } = await supabase
        .from("requests_for_payment")
        .update({ supporting_documents: updatedDocs })
        .eq("id", rfp.id);

      if (updateError) throw updateError;

      toast.success(`${newUrls.length} file(s) uploaded successfully`);
    } catch (error) {
      toast.error("Upload failed", {
        description: error instanceof Error ? error.message : "Please try again",
      });
      console.error(error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveDocument = async (urlToRemove: string) => {
    const newDocs = supportingDocs.filter((url) => url !== urlToRemove);
    setSupportingDocs(newDocs);

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("requests_for_payment")
        .update({ supporting_documents: newDocs })
        .eq("id", rfp.id);

      if (error) throw error;
      toast.success("Document removed");
    } catch (error) {
      toast.error("Failed to remove document");
      setSupportingDocs(supportingDocs); // revert
    }
  };

  const handleAddEntry = () => {
    if (!date || !amount || !supplier || !glAccount) {
      toast.error("Missing required fields", {
        description: "Please fill in date, supplier, GL account, and amount.",
      });
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      toast.error("Invalid amount", {
        description: "Amount must be greater than zero.",
      });
      return;
    }

    const currentRemaining =
      parseAmount(rfp?.total_payable) -
      entries.reduce((sum, e) => sum + e.amount, 0);

    const newRemaining = currentRemaining - amountValue;

    const newEntry: LiquidationEntry = {
      id: `ENTRY-${Date.now()}`,
      date,
      plateNumber,
      supplier,
      description: description || "-",
      glAccount,
      amount: amountValue,
    };

    setEntries([...entries, newEntry]);

    setDate("");
    setPlateNumber("");
    setSupplier("");
    setDescription("");
    setGlAccount("");
    setAmount("");

    if (newRemaining < 0) {
      const overAmount = Math.abs(newRemaining);
      toast.warning("Entry added with over-liquidation", {
        description: `${supplier} - ${formatCurrency(amountValue)}. Exceeds by ${formatCurrency(overAmount)}.`,
        icon: <AlertTriangle className="h-4 w-4" />,
      });
    } else if (newRemaining === 0) {
      toast.success("Entry added - Fully Liquidated", {
        description: `${supplier} - ${formatCurrency(amountValue)}. Balance is now zero.`,
        icon: <CheckCircle2 className="h-4 w-4" />,
      });
    } else {
      toast.success("Entry added", {
        description: `${supplier} - ${formatCurrency(amountValue)}. Remaining: ${formatCurrency(newRemaining)}.`,
      });
    }
  };

  const handleDeleteEntry = (id: string) => {
    const entry = entries.find((e) => e.id === id);
    setEntries(entries.filter((e) => e.id !== id));

    if (entry) {
      toast.info("Entry removed", {
        description: `${entry.supplier} - ${formatCurrency(entry.amount)} deleted`,
      });
    }
  };

  const handleClearAllEntries = () => {
    if (entries.length === 0) return;

    const count = entries.length;
    setEntries([]);

    toast.info("All entries cleared", {
      description: `${count} liquidation entry(ies) removed.`,
    });
  };

  const selectedPlateNumber = vehicles?.find(
    (p) => p.vehicle_id === plateNumber,
  );

  const totalLiquidated = entries.reduce((sum, e) => sum + e.amount, 0);
  const originalAmount = parseAmount(rfp?.total_payable);
  const remainingBalance = originalAmount - totalLiquidated;
  const isBalanced = remainingBalance === 0;
  const isOverLiquidated = remainingBalance < 0;

  const handleLiquidate = async () => {
    if (entries.length === 0) {
      toast.error("No entries to submit", {
        description: "Please add at least one liquidation entry.",
      });
      return;
    }

    const supabase = createClient();

    const loadingToast = toast.loading("Submitting liquidation...", {
      description: "Please wait while we process your request.",
    });

    try {
      const liquidationEntries = entries.map((entry) => {
        const vehicle = vehicles?.find(
          (v) => v.vehicle_id === entry.plateNumber,
        );

        return {
          date: entry.date,
          plate_number: vehicle?.plate_number || entry.plateNumber || null,
          car_type: vehicle?.car_type || null,
          owners_first_name: vehicle?.owners_first_name || null,
          owners_last_name: vehicle?.owners_last_name || null,
          supplier: entry.supplier,
          description: entry.description,
          gl_account: entry.glAccount,
          amount: entry.amount,
        };
      });

      const { error } = await supabase.from("liquidations").insert({
        rfp_id: rfp.id,
        rfp_number: rfp.rfp_number,
        requested_by: rfp.requested_by,
        department: rfp.department,
        payable_to: rfp.payable_to,
        payment_method: rfp.payment_method,
        original_amount: originalAmount,
        total_liquidated: totalLiquidated,
        remaining_balance: remainingBalance,
        liquidation_entries: liquidationEntries,
        status: "submitted",
      });

      if (error) throw error;

      const { error: rfpError } = await supabase
        .from("requests_for_payment")
        .update({ status: "liquidated" })
        .eq("id", rfp.id);

      if (rfpError) throw rfpError;

      toast.dismiss(loadingToast);

      if (isOverLiquidated) {
        toast.success("Liquidation submitted (Over-liquidated)", {
          description: `${rfp.rfp_number} liquidated with ${formatCurrency(totalLiquidated)}. Exceeds original by ${formatCurrency(Math.abs(remainingBalance))}.`,
          duration: 6000,
        });
      } else if (isBalanced) {
        toast.success("Liquidation submitted successfully!", {
          description: `${rfp.rfp_number} fully liquidated with ${formatCurrency(totalLiquidated)}.`,
          duration: 5000,
        });
      } else {
        toast.success("Liquidation submitted (Partial)", {
          description: `${rfp.rfp_number} liquidated with ${formatCurrency(totalLiquidated)}. Remaining: ${formatCurrency(remainingBalance)}.`,
          duration: 5000,
        });
      }

      setEntries([]);
      router.push(`/home/${module}/liquidation`);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("Failed to submit liquidation", {
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
        duration: 5000,
      });
      console.error("Liquidation failed:", error);
    }
  };

  if (!rfp) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-dashed border-slate-300">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-[#2B3A9F]/10 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-[#2B3A9F]" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Request Not Found
              </h2>
              <p className="text-slate-500 text-center max-w-md mb-6">
                No RFP request provided. Please select an approved RFP to
                liquidate.
              </p>
              <Link href="/home/finance/liquidation">
                <Button className="bg-[#2B3A9F] hover:bg-[#2B3A9F]/90 text-white">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Liquidation
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <Link href={`/home/${module}/liquidation`}>
              <Button
                variant="outline"
                size="icon"
                className="border-slate-300 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4 text-slate-700" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Create Liquidation
              </h1>
              <p className="text-sm text-slate-500">
                Liquidating {rfp.rfp_number} • {rfp.payable_to}
              </p>
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
          >
            {rfp.status === "approved" ? "Approved" : rfp.status}
          </Badge>
        </div>

        {/* RFP Summary Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#2B3A9F]" />
              Original RFP Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-medium">
                  Requested By
                </p>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#2B3A9F]/10 flex items-center justify-center text-[10px] font-bold text-[#2B3A9F]">
                    {rfp.requested_by
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    {rfp.requested_by}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-medium">
                  Department
                </p>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">
                    {rfp.department}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-medium">
                  Original Amount
                </p>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-mono font-semibold text-slate-900">
                    {formatCurrency(rfp.total_payable)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-medium">
                  Payment Method
                </p>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">
                    {rfp.payment_method}
                  </span>
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <p className="text-xs text-slate-500 uppercase font-medium">
                  Payable To
                </p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-900">
                    {rfp.payable_to}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-medium">
                  Request Date
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">
                    {formatDate(rfp.request_date)}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-slate-500 uppercase font-medium">
                  Due Date
                </p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700">
                    {formatDate(rfp.due_date)}
                  </span>
                </div>
              </div>
            </div>

            <div
              className={`mt-4 p-3 rounded-lg border ${
                isBalanced
                  ? "bg-emerald-50 border-emerald-200"
                  : isOverLiquidated
                    ? "bg-rose-50 border-rose-200"
                    : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isBalanced ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : isOverLiquidated ? (
                    <XCircle className="h-4 w-4 text-rose-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      isBalanced
                        ? "text-emerald-700"
                        : isOverLiquidated
                          ? "text-rose-700"
                          : "text-amber-700"
                    }`}
                  >
                    {isBalanced
                      ? "Fully Liquidated"
                      : isOverLiquidated
                        ? "Over Liquidated"
                        : "Remaining to Liquidate"}
                  </span>
                </div>
                <span
                  className={`font-mono font-bold ${
                    isBalanced
                      ? "text-emerald-700"
                      : isOverLiquidated
                        ? "text-rose-700"
                        : "text-amber-700"
                  }`}
                >
                  {formatCurrency(Math.abs(remainingBalance))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supporting Documents Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#2B3A9F]" />
                Supporting Documents
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="border-[#2B3A9F]/30 text-[#2B3A9F] hover:bg-[#2B3A9F]/10 hover:text-[#2B3A9F]"
              >
                {uploading ? "Uploading..." : "Add File"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              multiple
              className="hidden"
            />

            {supportingDocs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {supportingDocs.map((url, index) => (
                  <div
                    key={index}
                    className="group relative overflow-hidden rounded-lg border border-slate-200 hover:border-[#2B3A9F]/50 transition-all h-32"
                  >
                    <button
                      onClick={() => setSelectedDocument(url)}
                      className="w-full h-full focus:outline-none focus:ring-2 focus:ring-[#2B3A9F]/30 rounded-lg"
                    >
                      {isImage(url) ? (
                        <Image
                          src={url}
                          alt={getFileName(url)}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center bg-slate-50 gap-2">
                          <FileText className="h-8 w-8 text-slate-400" />
                          <span className="text-xs text-slate-500 font-medium px-2 text-center truncate w-full">
                            {getFileName(url)}
                          </span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDocument(url);
                      }}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <FileText className="h-10 w-10 text-slate-300" />
                <p className="text-sm text-slate-500">No supporting documents attached.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Entry Form */}
        <Card className="border-l-4 border-l-[#2B3A9F] shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#2B3A9F]/10 rounded-lg">
                <Plus className="h-5 w-5 text-[#2B3A9F]" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Add Liquidation Entry
                </CardTitle>
                <p className="text-sm text-slate-500 mt-0.5">
                  Record expenses against this request
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-200 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    Date
                  </Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-white border-slate-300 focus:border-[#2B3A9F] focus:ring-2 focus:ring-[#2B3A9F]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    Supplier
                  </Label>
                  <SearchableCombobox
                    value={supplier}
                    onSelect={(value, item) => setSupplier(value)}
                    options={vendors.map((v) => ({
                      id: v.vendor_id,
                      name: v.name,
                    }))}
                    placeholder="Select supplier"
                    searchPlaceholder="Search suppliers..."
                    emptyMessage="No suppliers found."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    Description
                  </Label>
                  <Input
                    placeholder="e.g., Fuel for client meeting"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-white border-slate-300 focus:border-[#2B3A9F] focus:ring-2 focus:ring-[#2B3A9F]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Hash className="h-4 w-4 text-slate-400" />
                    GL Account
                  </Label>
                  <SearchableCombobox
                    value={glAccount}
                    onSelect={(value, item) => setGlAccount(value)}
                    options={accounts.map((acc) => ({
                      id: acc.account_id,
                      name: acc.name,
                    }))}
                    placeholder="Select account"
                    searchPlaceholder="Search accounts..."
                    emptyMessage="No accounts found."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    Amount
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white border-slate-300 focus:border-[#2B3A9F] focus:ring-2 focus:ring-[#2B3A9F]/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Car className="h-4 w-4 text-slate-400" />
                    Plate Number{" "}
                    <span className="text-slate-400 font-normal">
                      (optional)
                    </span>
                  </Label>
                  <SearchableCombobox
                    value={plateNumber}
                    onSelect={(value, item) => setPlateNumber(value)}
                    options={vehicles.map((v) => ({
                      id: v.vehicle_id,
                      name: v.plate_number,
                      subtitle: v.car_type,
                    }))}
                    placeholder="Select plate"
                    searchPlaceholder="Search plate numbers..."
                    emptyMessage="No vehicles found."
                    optional
                    optionalLabel="No vehicle"
                  />
                </div>
              </div>

              {selectedPlateNumber && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">
                      Car Type
                    </Label>
                    <div className="h-10 px-3 rounded-md border border-slate-200 bg-slate-100 text-slate-700 text-sm flex items-center">
                      {selectedPlateNumber.car_type}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">
                      Owner&apos;s First Name
                    </Label>
                    <div className="h-10 px-3 rounded-md border border-slate-200 bg-slate-100 text-slate-700 text-sm flex items-center">
                      {selectedPlateNumber.owners_first_name}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">
                      Owner&apos;s Last Name
                    </Label>
                    <div className="h-10 px-3 rounded-md border border-slate-200 bg-slate-100 text-slate-700 text-sm flex items-center">
                      {selectedPlateNumber.owners_last_name}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleAddEntry}
                disabled={
                  !date ||
                  !supplier ||
                  !glAccount ||
                  !amount ||
                  parseFloat(amount) <= 0
                }
                className="bg-[#2B3A9F] hover:bg-[#1e2a7a] text-white shadow-md shadow-[#2B3A9F]/20 transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>

            <Separator className="bg-slate-200" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold text-slate-800">
                    Liquidation Entries
                  </Label>
                  <Badge
                    variant="secondary"
                    className="bg-slate-100 text-slate-700 font-medium"
                  >
                    {entries.length}
                  </Badge>
                </div>
                {entries.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Total Liquidated:</span>
                    <span className="font-mono font-semibold text-[#2B3A9F] text-base">
                      {formatCurrency(totalLiquidated)}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                      <TableHead className="w-28 text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Date
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Plate No.
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Supplier
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Description
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        GL Account
                      </TableHead>
                      <TableHead className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Amount
                      </TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-12 text-slate-400"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-slate-50 rounded-full">
                              <AlertCircle className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="text-sm text-slate-500">
                              No entries yet. Fill the form above to add
                              expenses.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      entries.map((entry) => (
                        <TableRow
                          key={entry.id}
                          className="group hover:bg-slate-50/80 border-b border-slate-100 last:border-0"
                        >
                          <TableCell className="text-sm text-slate-700 font-medium">
                            {entry.date}
                          </TableCell>
                          <TableCell className="font-mono text-sm text-slate-900">
                            {entry.plateNumber || "—"}
                          </TableCell>
                          <TableCell className="text-sm text-slate-700">
                            {entry.supplier}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {entry.description || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {entry.glAccount}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold text-slate-900">
                            {formatCurrency(entry.amount)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 hover:text-rose-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {entries.length > 0 && (
                      <>
                        <TableRow className="bg-slate-50/90 border-t-2 border-slate-200">
                          <TableCell
                            colSpan={5}
                            className="text-right text-sm font-semibold text-slate-700 py-3"
                          >
                            Total Liquidated
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-bold text-[#2B3A9F] py-3">
                            {formatCurrency(totalLiquidated)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow className="bg-slate-50/50">
                          <TableCell
                            colSpan={5}
                            className="text-right text-sm text-slate-600 py-3"
                          >
                            Original RFP Amount
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-slate-900 py-3">
                            {formatCurrency(originalAmount)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                        <TableRow
                          className={`border-t-2 ${
                            isBalanced
                              ? "bg-emerald-50/80 border-emerald-200"
                              : isOverLiquidated
                                ? "bg-rose-50/80 border-rose-200"
                                : "bg-amber-50/80 border-amber-200"
                          }`}
                        >
                          <TableCell
                            colSpan={5}
                            className="text-right text-sm font-bold py-3"
                          >
                            <span
                              className={
                                isBalanced
                                  ? "text-emerald-700"
                                  : isOverLiquidated
                                    ? "text-rose-700"
                                    : "text-amber-700"
                              }
                            >
                              {isBalanced
                                ? "Balance"
                                : isOverLiquidated
                                  ? "Over Liquidated"
                                  : "Remaining Balance"}
                            </span>
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono text-sm font-bold py-3 ${
                              isBalanced
                                ? "text-emerald-700"
                                : isOverLiquidated
                                  ? "text-rose-700"
                                  : "text-amber-700"
                            }`}
                          >
                            {formatCurrency(Math.abs(remainingBalance))}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={handleClearAllEntries}
                disabled={entries.length === 0}
                className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                Clear All
              </Button>
              <Button
                onClick={handleLiquidate}
                disabled={entries.length === 0}
                className="bg-[#2B3A9F] hover:bg-[#1e2a7a] text-white shadow-md shadow-[#2B3A9F]/20 transition-all disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                Submit Liquidation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Viewer Dialog */}
      <Dialog
        open={!!selectedDocument}
        onOpenChange={() => setSelectedDocument(null)}
      >
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 border border-slate-200 shadow-2xl overflow-hidden">
          <DialogHeader className="px-5 py-3.5 border-b bg-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {selectedDocument && isImage(selectedDocument) ? (
                  <ImageIcon className="h-4 w-4 text-blue-500" />
                ) : (
                  <FileText className="h-4 w-4 text-red-500" />
                )}
                <DialogTitle className="text-sm font-medium text-slate-700 truncate">
                  {selectedDocument && getFileName(selectedDocument)}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(selectedDocument || "", "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Open
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = selectedDocument || "";
                    a.download = selectedDocument
                      ? getFileName(selectedDocument)
                      : "";
                    a.click();
                  }}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 bg-slate-50/50 overflow-hidden">
            {selectedDocument && isImage(selectedDocument) ? (
              <div className="relative w-full h-full">
                <Image
                  src={selectedDocument}
                  alt="Document preview"
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 1280px) 95vw, 1280px"
                  priority
                />
              </div>
            ) : (
              <iframe
                src={selectedDocument || ""}
                className="w-full h-full bg-white"
                title="Document preview"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
