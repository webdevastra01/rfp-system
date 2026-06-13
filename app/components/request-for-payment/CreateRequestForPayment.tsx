"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  CreateRequestForPaymentPageProps,
  Item,
  LineItem,
  statusConfig,
} from "@/lib/interfaces";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileText,
  ImageIcon,
  Landmark,
  Package,
  Phone,
  Plus,
  Receipt,
  Save,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SearchableCombobox } from "../inputs/SearchableCombobox";
import { toast } from "sonner"; // Added Sonner toast
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

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

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) || 0 : value;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(num);
}

export default function CreateRequestForPayment({
  order,
  chargeToOptions,
  module,
}: CreateRequestForPaymentPageProps) {
  console.log("Fetched Items:", JSON.stringify(order?.items, null, 2));
  // Line Items State
  const [lineItems, setLineItems] = useState<LineItem[]>(
    () =>
      order?.items?.map((item) => ({
        id: crypto.randomUUID(),
        invoice_number: "",
        particulars: item.description || item.name,
        qty: item.quantity,
        price: item.unitPrice,
        totalAmount: (
          (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)
        ).toString(),
        chargeTo: order.company || "",
      })) || [],
  );
  const [particulars, setParticulars] = useState("");
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");
  const [chargeTo, setChargeTo] = useState("");

  // Additional Fields
  const [dueDate, setDueDate] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [vendorContact, setVendorContact] = useState("");

  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  const getFileName = (url: string) => {
    try {
      const pathname = new URL(url).pathname;
      return decodeURIComponent(pathname.split("/").pop() || "Document");
    } catch {
      return "Document";
    }
  };

  const isImage = (url: string) => {
    try {
      const pathname = new URL(url).pathname;
      return /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(pathname);
    } catch {
      return /\.(jpg|jpeg|png|gif|webp|avif|svg)(?:\?|$)/i.test(url);
    }
  };

  const isPdf = (url: string) => {
    try {
      return /\.pdf$/i.test(new URL(url).pathname);
    } catch {
      return /\.pdf(?:\?|$)/i.test(url);
    }
  };

  const totalLineItems = useMemo(
    () =>
      lineItems.reduce(
        (sum, item) => sum + (parseFloat(item.totalAmount) || 0),
        0,
      ),
    [lineItems],
  );

  const router = useRouter();

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const handleEditLineItem = (item: LineItem) => {
    setEditingItemId(item.id);

    setInvoiceNumber(item.invoice_number);
    setParticulars(item.particulars);
    setQty(item.qty);
    setPrice(item.price);
    setChargeTo(item.chargeTo);
  };

  const handleSaveLineItem = () => {
    if (!particulars || !qty || !price) {
      toast.error("Missing required fields", {
        description: "Please fill in particulars, quantity, and price.",
      });
      return;
    }

    const total = (parseFloat(qty) || 0) * (parseFloat(price) || 0);

    if (editingItemId) {
      setLineItems((prev) =>
        prev.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                invoice_number: invoiceNumber,
                particulars,
                qty,
                price,
                totalAmount: total.toString(),
                chargeTo,
              }
            : item,
        ),
      );

      toast.success("Line item updated");
    } else {
      const newItem: LineItem = {
        id: crypto.randomUUID(),
        invoice_number: invoiceNumber,
        particulars,
        qty,
        price,
        totalAmount: total.toString(),
        chargeTo,
      };

      setLineItems((prev) => [...prev, newItem]);

      toast.success("Line item added");
    }

    resetForm();
  };

  const handleDeleteLineItem = (id: string) => {
    const item = lineItems.find((i) => i.id === id);
    setLineItems(lineItems.filter((item) => item.id !== id));

    toast.info("Line item removed", {
      description: item ? `${item.particulars} deleted` : "Item deleted",
    });
  };

  const handleClearAllItems = () => {
    if (lineItems.length === 0) return;

    setLineItems([]);
    toast.info("All items cleared", {
      description: `${lineItems.length} line item(s) removed.`,
    });
  };

  // Auto-calculate total when qty or price changes
  const calculatedTotal = useMemo(() => {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(price) || 0;
    return (q * p).toFixed(2);
  }, [qty, price]);

  const calculateTotal = (items: Item[]): number => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  const poTotal = calculateTotal(order?.items || []);
  const difference = poTotal - totalLineItems;
  const isMatched = Math.abs(difference) < 0.01;
  const isOver = difference < 0;

  async function handleCreateRFP() {
    const supabase = createClient();

    if (!order) return;

    if (lineItems.length === 0) {
      toast.error("No line items", {
        description: "Please add at least one line item before submitting.",
      });
      return;
    }

    if (!dueDate) {
      toast.error("Due date required", {
        description: "Please select a due date for the payment.",
      });
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Creating Request for Payment...", {
      description: "Please wait while we save your request.",
    });

    try {
      // Convert line items to JSON structure
      const itemsPayload = lineItems.map((item) => ({
        invoice_number: item.invoice_number,
        particulars: item.particulars,
        qty: parseFloat(item.qty),
        price: parseFloat(item.price),
        total_amount: parseFloat(item.totalAmount),
        charge_to: item.chargeTo,
      }));

      const { error } = await supabase.from("requests_for_payment").insert({
        order_id: order.id,
        order_number: order.order_number ?? order.id,
        payable_to: order.preferred_vendor,
        payment_method: order.payment_method,
        due_date: dueDate,
        request_date: order.preferred_date,
        contact_number: vendorContact,
        department: order.department,
        line_items: itemsPayload, // JSONB column
        requested_by: order.requested_by,
        total_payable: totalLineItems.toString(),
      });

      if (error) throw error;

      // Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success("Request for Payment created successfully!", {
        description: `RFP for ${order.order_number} has been submitted.`,
        duration: 5000,
      });

      // Optional reset
      setLineItems([]);
      setVendorContact("");
      setDueDate("");

      // Redirect
      router.push(`/home/${module}/request-for-payment`);
    } catch (err) {
      // Dismiss loading and show error
      toast.dismiss(loadingToast);
      toast.error("Failed to create request for payment", {
        description:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.",
        duration: 5000,
      });
      console.error(err);
    }
  }

  if (!order) {
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
                No order found.
              </p>
              <Link href="/home/finance/request-for-payment">
                <Button className="bg-[#2B3A9F] hover:bg-[#1E2A7A] text-white">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Orders
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const StatusIcon = statusConfig[order.status].icon;

  const resetForm = () => {
    setEditingItemId(null);
    setInvoiceNumber("");
    setParticulars("");
    setQty("");
    setPrice("");
    setChargeTo("");
  };

  const DocumentThumbnail = ({
    url,
    index,
  }: {
    url: string;
    index: number;
  }) => {
    if (isImage(url)) {
      return (
        <Image
          src={url}
          alt={`Document ${index + 1}`}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      );
    }

    return (
      <div className="h-32 flex items-center justify-center bg-slate-100">
        <FileText className="h-10 w-10 text-blue-500" aria-hidden="true" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <Link href={`/home/${module}/request-for-payment`}>
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
                Order Details
              </h1>
              <p className="text-sm text-[#64748B] mt-1">
                Viewing{" "}
                <span className="font-semibold text-[#2B3A9F]">
                  {order.order_number}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 print:hidden">
          {/* Left Column - Main Content */}
          <div className="xl:col-span-2 space-y-6">
            {/* Order Overview */}
            <Card className="border-[#E2E8F0] shadow-sm overflow-hidden pt-0">
              <CardHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0] pt-4">
                <div className="flex items-center gap-3">
                  {" "}
                  <div className="flex-1">
                    <CardTitle className="text-2xl font-bold text-[#1E293B] mb-2">
                      {order.title}
                    </CardTitle>
                    <CardDescription className="text-base text-[#64748B] leading-relaxed">
                      {order.description}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "px-3 py-1.5 font-semibold border-2",
                      statusConfig[order.status]?.bgColor,
                      statusConfig[order.status]?.color,
                      statusConfig[order.status]?.borderColor,
                    )}
                  >
                    <StatusIcon className="mr-1.5 h-3.5 w-3.5" />
                    {statusConfig[order.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DetailItem
                    label="Request Type"
                    value={order.service_category}
                    icon={Package}
                    highlight
                  />
                  <DetailItem
                    label="Department"
                    value={order.department}
                    icon={Building2}
                  />
                  <DetailItem
                    label="Ordered By"
                    value={order.requested_by}
                    icon={User}
                  />
                  <DetailItem
                    label="Payable To"
                    value={order.preferred_vendor}
                    icon={Building2}
                  />
                  <DetailItem
                    label="Total Payable"
                    value={formatCurrency(poTotal)}
                    icon={Banknote}
                    highlight
                  />
                  <DetailItem
                    label="Payment Method"
                    value={order.payment_method}
                    icon={Landmark}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#E2E8F0] shadow-sm pt-0">
              <CardHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0] pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#2B3A9F] text-white">
                    <FileText className="h-5 w-5" />
                  </div>

                  <div>
                    <CardTitle>Supporting Documents</CardTitle>
                    <CardDescription>
                      Uploaded attachments for this service order
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6">
                {order.supporting_documents?.length ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {order.supporting_documents.map((url, index) => (
                      <button
                        key={url}
                        onClick={() => setSelectedDocument(url)}
                        className="group relative overflow-hidden rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 h-32 w-full"
                        aria-label={`View document ${index + 1}`}
                      >
                        {isImage(url) ? (
                          <Image
                            src={url}
                            alt={`Document ${index + 1}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="h-full flex items-center justify-center bg-slate-100">
                            <FileText
                              className="h-10 w-10 text-blue-500"
                              aria-hidden="true"
                            />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No supporting documents attached.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="border-[#E2E8F0] shadow-sm pt-0">
              <CardHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0] pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#2B3A9F] text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-[#1E293B]">
                      Additional Information
                    </CardTitle>
                    <CardDescription className="text-[#64748B]">
                      Payment details and vendor contact
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2.5">
                    <Label className="text-sm font-bold text-[#475569] flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#2B3A9F]" />
                      Vendor Contact Number
                    </Label>
                    <Input
                      type="tel"
                      placeholder="+63 XXX-XXX-XXXX"
                      value={vendorContact}
                      onChange={(e) => setVendorContact(e.target.value)}
                      className="bg-white border-[#E2E8F0] focus-visible:ring-[#2B3A9F] focus-visible:border-[#2B3A9F] h-11 transition-colors"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-sm font-bold text-[#475569] flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#2B3A9F]" />
                      Due Date
                    </Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-white border-[#E2E8F0] focus-visible:ring-[#2B3A9F] focus-visible:border-[#2B3A9F] h-11 transition-colors"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="border-[#E2E8F0] shadow-sm overflow-hidden pt-0">
              <CardHeader className="bg-[#F8FAFC] border-b border-[#E2E8F0] pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg  bg-[#2B3A9F] text-white shadow-sm backdrop-blur-sm">
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-[#1E293B]">
                      Line Items
                    </CardTitle>
                    <CardDescription className="text-[#64748B]">
                      Add particulars, quantities, and pricing
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Input Form */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  {/* Invoice Number - Full width on mobile, 6 cols on md */}
                  <div className="md:col-span-6 space-y-2.5">
                    <Label className="text-sm font-bold text-[#475569] flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-[#04397C]" />
                      Invoice Number
                    </Label>
                    <Input
                      type="text"
                      placeholder="INV-XXXX-XXXX"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="bg-white border-[#E2E8F0] focus-visible:ring-[#04397C] focus-visible:border-[#04397C] h-11 transition-colors"
                    />
                  </div>

                  {/* Particulars - Full width on mobile, 6 cols on md */}
                  <div className="md:col-span-6 space-y-2.5">
                    <Label className="text-sm font-bold text-[#475569]">
                      Particulars
                    </Label>
                    <Input
                      placeholder="Item description..."
                      value={particulars}
                      onChange={(e) => setParticulars(e.target.value)}
                      className="bg-white border-[#E2E8F0] focus-visible:ring-[#04397C] focus-visible:border-[#04397C] h-11 transition-colors"
                    />
                  </div>

                  {/* Qty - 3 cols */}
                  <div className="md:col-span-3 space-y-2.5">
                    <Label className="text-sm font-bold text-[#475569]">
                      Qty
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="bg-white border-[#E2E8F0] focus-visible:ring-[#04397C] focus-visible:border-[#04397C] h-11 text-center font-mono transition-colors"
                    />
                  </div>

                  {/* Price - 3 cols */}
                  <div className="md:col-span-3 space-y-2.5">
                    <Label className="text-sm font-bold text-[#475569]">
                      Price
                    </Label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-white border-[#E2E8F0] focus-visible:ring-[#04397C] focus-visible:border-[#04397C] h-11 font-mono transition-colors"
                    />
                  </div>

                  {/* Total - 3 cols (read-only) */}
                  <div className="md:col-span-3 space-y-2.5">
                    <Label className="text-sm font-bold text-[#475569]">
                      Total
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={formatCurrency(calculatedTotal)}
                        disabled
                        className="bg-[#F1F5F9] border-[#E2E8F0] h-11 font-mono font-semibold text-[#04397C] pr-8 transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">
                        PHP
                      </span>
                    </div>
                  </div>

                  {/* Charge To - 9 cols */}
                  <div className="md:col-span-9 space-y-2.5">
                    <Label className="text-sm font-bold text-[#475569] flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#04397C]" />
                      Charge To
                    </Label>
                    <SearchableCombobox
                      value={chargeTo}
                      options={chargeToOptions}
                      displayKey="label"
                      valueKey="value"
                      placeholder="Select who to charge..."
                      searchPlaceholder="Search company or owner..."
                      onSelect={(value) => setChargeTo(value)}
                    />
                  </div>

                  {/* Add Button - 3 cols */}
                  <div className="md:col-span-3 flex items-end">
                    <Button
                      onClick={handleSaveLineItem}
                      disabled={!particulars || !qty || !price}
                      className="w-full bg-[#04397C] hover:bg-[#032d61] text-white transition-colors"
                    >
                      {editingItemId ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Item
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F1F5F9] hover:bg-[#F1F5F9] border-b-2 border-[#04397C]">
                        <TableHead className="w-12 text-center font-bold text-[#475569]">
                          Invoice Number
                        </TableHead>
                        <TableHead className="font-bold text-[#475569]">
                          Particulars
                        </TableHead>
                        <TableHead className="w-20 text-center font-bold text-[#475569]">
                          Qty
                        </TableHead>
                        <TableHead className="w-32 text-right font-bold text-[#475569]">
                          Price
                        </TableHead>
                        <TableHead className="w-32 text-right font-bold text-[#04397C]">
                          Total
                        </TableHead>
                        <TableHead className="font-bold text-[#475569]">
                          Charge To
                        </TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lineItems.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-12 text-[#64748B]"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className="p-4 rounded-full bg-[#F1F5F9] border border-[#E2E8F0]">
                                <Package className="h-8 w-8 text-[#94A3B8]" />
                              </div>
                              <p className="text-sm max-w-xs">
                                No line items yet. Fill the form above and click
                                &quot;Add Item&quot; to get started.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        lineItems.map((item, index) => (
                          <TableRow
                            key={item.id}
                            onClick={() => handleEditLineItem(item)}
                            className={cn(
                              "group cursor-pointer hover:bg-[#F8FAFC] transition-colors border-b border-[#E2E8F0] last:border-b-0",
                              editingItemId === item.id &&
                                "bg-[#EEF2FF] border-[#04397C]",
                            )}
                          >
                            <TableCell className="text-center text-[#64748B] font-medium">
                              {item.invoice_number}
                            </TableCell>
                            <TableCell className="font-semibold text-[#1E293B]">
                              {item.particulars}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EEF2FF] text-[#04397C]">
                                {item.qty}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-mono text-[#64748B]">
                              {formatCurrency(item.price)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-[#04397C]">
                              {formatCurrency(item.totalAmount)}
                            </TableCell>
                            <TableCell className="text-[#64748B]">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                                {chargeToOptions.find(
                                  (option) => option.value === item.chargeTo,
                                )?.value || item.chargeTo}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteLineItem(item.id)}
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FEE2E2] hover:text-[#CE2A28]"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {lineItems.length > 0 && (
                        <TableRow className="bg-[#F8FAFC] font-bold border-t-2 border-[#04397C]">
                          <TableCell
                            colSpan={4}
                            className="text-right text-[#1E293B] text-base pr-4"
                          >
                            TOTAL
                          </TableCell>
                          <TableCell className="text-right font-mono text-base text-[#059669] pr-4">
                            {formatCurrency(totalLineItems)}
                          </TableCell>
                          <TableCell colSpan={2}></TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary/Actions */}
          <div className="space-y-6 ">
            {/* Summary Card */}
            <Card className="border-[#E2E8F0] shadow-sm overflow-hidden sticky top-20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-[#1E293B] flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#2B3A9F] text-white">
                    <Banknote className="h-4 w-4" />
                  </div>
                  Payment Summary
                </CardTitle>
                <CardDescription className="text-[#64748B]">
                  Request for Payment Summary
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* PO Total Payable - From original order */}
                <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]">
                  <span className="text-sm font-medium text-[#64748B]">
                    PO Total Payable
                  </span>
                  <span className="font-mono font-semibold text-[#1E293B]">
                    {formatCurrency(poTotal)}
                  </span>
                </div>

                {/* Line Items Subtotal - Calculated from entries */}
                <div className="flex justify-between items-center py-2 border-b border-[#E2E8F0]">
                  <span className="text-sm text-[#64748B]">
                    Line Items Subtotal
                  </span>
                  <span className="font-mono font-semibold text-[#1E293B]">
                    {formatCurrency(totalLineItems)}
                  </span>
                </div>

                {/* Difference - Conditional styling */}
                <div
                  className={cn(
                    "flex justify-between items-center py-3 px-3 rounded-xl border",
                    isMatched
                      ? "bg-[#ECFDF5] border-[#6EE7B7]"
                      : isOver
                        ? "bg-[#FEE2E2] border-[#FCA5A5]"
                        : "bg-[#FEF3C7] border-[#FCD34D]",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isMatched ? (
                      <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                    ) : isOver ? (
                      <XCircle className="h-4 w-4 text-[#DC2626]" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-[#D97706]" />
                    )}
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        isMatched
                          ? "text-[#059669]"
                          : isOver
                            ? "text-[#DC2626]"
                            : "text-[#D97706]",
                      )}
                    >
                      {isMatched
                        ? "Matched"
                        : isOver
                          ? "Over Budget"
                          : "Remaining"}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "font-mono font-bold",
                      isMatched
                        ? "text-[#059669]"
                        : isOver
                          ? "text-[#DC2626]"
                          : "text-[#D97706]",
                    )}
                  >
                    {isMatched ? "₱0.00" : formatCurrency(Math.abs(difference))}
                  </span>
                </div>

                <Separator className="bg-[#E2E8F0]" />

                {/* Final Total */}
                <div className="flex justify-between items-center py-2">
                  <span className="font-bold text-[#1E293B] text-base">
                    Final Total
                  </span>
                  <span className="font-mono font-bold text-xl text-[#2B3A9F]">
                    {formatCurrency(totalLineItems)}
                  </span>
                </div>

                {/* Alert message when not matched */}
                {!isMatched && lineItems.length > 0 && (
                  <div
                    className={cn(
                      "p-3 rounded-lg text-sm",
                      isOver
                        ? "bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]"
                        : "bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>
                        {isOver
                          ? `Line items exceed PO amount by ${formatCurrency(Math.abs(difference))}`
                          : `Remaining balance of ${formatCurrency(Math.abs(difference))} will need to be allocated`}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card className="border-[#E2E8F0] shadow-sm overflow-hidden sticky top-130">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg text-[#1E293B]">
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleClearAllItems}
                  className="w-full border-[#E2E8F0] hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#FCA5A5] transition-all h-11"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Items
                </Button>
                <Button
                  disabled={lineItems.length === 0}
                  className="w-full bg-[#2B3A9F] hover:bg-[#1E2A7A] text-white h-11 shadow-lg shadow-[#2B3A9F]/25 transition-all hover:shadow-xl hover:shadow-[#2B3A9F]/30 disabled:shadow-none disabled:bg-[#CBD5E1] disabled:text-[#64748B]"
                  onClick={handleCreateRFP}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save & Submit
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Dialog
        open={!!selectedDocument}
        onOpenChange={() => setSelectedDocument(null)}
      >
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 border border-slate-200 shadow-2xl overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-5 py-3.5 border-b bg-white shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                {selectedDocument && isImage(selectedDocument) ? (
                  <ImageIcon className="h-4 w-4 text-blue-500 shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <DialogTitle className="text-sm font-medium text-slate-700 truncate">
                  {selectedDocument && getFileName(selectedDocument)}
                </DialogTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-slate-500 hover:text-slate-900"
                  onClick={() => window.open(selectedDocument || "", "_blank")}
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Open
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-slate-500 hover:text-slate-900"
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

          {/* Viewer */}
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
