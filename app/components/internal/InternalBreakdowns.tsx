"use client";

import React, { useState, useMemo } from "react";
import {
  Car,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  CreditCard,
  Percent,
  Wallet,
  Receipt,
  Calculator,
  ChevronRight,
  Check,
  Shield,
  Droplets,
  Route,
  Hotel,
  UtensilsCrossed,
  Fuel,
  Moon,
  Sun,
  Building2,
  ArrowLeftRight,
  RotateCcw,
  Plane,
  AlertCircle,
  BadgeDollarSign,
  FileText,
  Users,
  Navigation,
  Tag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const primaryColor = "#2B3A9F";

// ─── Sub-Components (Matching Quick Quotation Style) ───────────────────────

function SectionHeader({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
          {title}
        </h3>
      </div>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500 ml-6">{subtitle}</p>}
    </div>
  );
}

function FormCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border border-[#E2E8F0] shadow-sm ${className}`}>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
}

function InputWithIcon({
  icon: Icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input className="pl-10 border-[#E2E8F0]" {...props} />
    </div>
  );
}

function CostLineItem({
  label,
  value,
  onChange,
  readOnly = false,
  note,
  icon: Icon,
  isSubtotal = false,
  isTotal = false,
  isDeduction = false,
  isHighlight = false,
}: {
  label: string;
  value: number;
  onChange?: (val: number) => void;
  readOnly?: boolean;
  note?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isDeduction?: boolean;
  isHighlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 ${
        isSubtotal ? "border-t border-slate-200 pt-4 mt-2" : ""
      } ${isTotal ? "border-t-2 border-[#2B3A9F] pt-5 mt-3" : ""}`}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        <span
          className={`text-sm ${
            isSubtotal
              ? "font-semibold text-slate-900"
              : isTotal
                ? "text-lg font-bold text-[#2B3A9F]"
                : isDeduction
                  ? "text-slate-600"
                  : "text-slate-700"
          }`}
        >
          {label}
        </span>
        {note && (
          <span className="text-xs text-slate-400">{note}</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {readOnly ? (
          <span
            className={`text-right font-mono ${
              isSubtotal
                ? "font-semibold text-slate-900"
                : isTotal
                  ? "text-xl font-bold text-[#2B3A9F]"
                  : isDeduction
                    ? "text-emerald-600"
                    : "text-slate-700"
            }`}
          >
            {isDeduction && value !== 0 ? "-" : ""}₱{value.toLocaleString()}
          </span>
        ) : (
          <div className="relative w-40">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              ₱
            </span>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={value || ""}
              onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
              className="pl-7 text-right border-[#E2E8F0]"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ModeSelector({
  mode,
  onChange,
}: {
  mode: "without" | "with";
  onChange: (m: "without" | "with") => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        onClick={() => onChange("without")}
        className={`relative flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all duration-300 ${
          mode === "without"
            ? "border-[#2B3A9F] bg-[#EEF2FF] shadow-sm"
            : "border-[#E2E8F0] bg-white hover:border-slate-300 hover:shadow-sm"
        }`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            mode === "without"
              ? "bg-[#2B3A9F] text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <Car className="h-6 w-6" />
        </div>
        <div>
          <p
            className={`text-sm font-bold ${
              mode === "without" ? "text-[#2B3A9F]" : "text-slate-900"
            }`}
          >
            Without Driver
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Self-drive rental breakdown
          </p>
        </div>
        {mode === "without" && (
          <div className="absolute right-4 top-4">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2B3A9F]">
              <Check className="h-3 w-3 text-white" />
            </div>
          </div>
        )}
      </button>

      <button
        onClick={() => onChange("with")}
        className={`relative flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all duration-300 ${
          mode === "with"
            ? "border-[#2B3A9F] bg-[#EEF2FF] shadow-sm"
            : "border-[#E2E8F0] bg-white hover:border-slate-300 hover:shadow-sm"
        }`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            mode === "with"
              ? "bg-[#2B3A9F] text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <User className="h-6 w-6" />
        </div>
        <div>
          <p
            className={`text-sm font-bold ${
              mode === "with" ? "text-[#2B3A9F]" : "text-slate-900"
            }`}
          >
            With Driver
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Chauffeured service breakdown
          </p>
        </div>
        {mode === "with" && (
          <div className="absolute right-4 top-4">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2B3A9F]">
              <Check className="h-3 w-3 text-white" />
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────

export default function InternalBreakdownPage() {
  const [mode, setMode] = useState<"without" | "with">("without");
  const [isCorporate, setIsCorporate] = useState(false);

  // Without Driver State
  const [withoutData, setWithoutData] = useState({
    quotationNumber: "QT-20260702-001",
    invoiceDate: "2026-07-02",
    bookingDate: "2026-07-01",
    salesInCharge: "Juan Dela Cruz",
    contactNumber: "+63 917 123 4567",
    email: "sales@carent.ph",
    birthday: "1990-05-15",
    address: "123 Main Street, Makati City, Philippines",
    altPerson: "",
    altContact: "",
    clientName: "Maria Santos",
    social: "maria.santos.fb",
    from: "Manila",
    to: "Baguio",
    car: "Toyota Innova",
    travelDate: "2026-07-05",
    endDate: "2026-07-08",
    days: 4,
    time: "09:00",
    cdw: "Included",
    category: "MPV",
    rentalRate: 4500,
    additionalHours: 0,
    cdwFee: 0,
    carwash: 500,
    deliveryFee: 800,
    pickupFee: 800,
    otPremium: 0,
    beyondHours: 0,
    hourlyExtension: 0,
    discount: 0,
    prepaid: 5000,
    deposit: 10000,
    terminalFees: 1500,
  });

  // With Driver State
  const [withData, setWithData] = useState({
    quotationNumber: "QT-20260702-002",
    type: "Individual" as "Individual" | "Corporate",
    coverage: "Full Coverage",
    paymentType: "Bank Transfer",
    bookingDate: "2026-07-02",
    salesInCharge: "Ana Reyes",
    driverName: "Roberto Lim",
    driverContact: "+63 915 987 6543",
    clientContact: "+63 917 555 1234",
    clientName: "Carlos Mendoza",
    social: "carlos.mendoza.gmail",
    from: "Cebu City",
    to: "Mactan",
    timeStart: "08:00",
    totalDistance: 120,
    event: "Corporate Meeting",
    carType: "Sedan",
    assignedCar: "Toyota Camry 2025 - ABC 1234",
    startDate: "2026-07-10",
    days: 3,
    endDate: "2026-07-13",
    timeDuration: "24 hours",
    contractType: "All-in Charge",
    tripType: "Round Trip",
    termRentalDate: "2026-07-10",
    pickupDate: "2026-07-10",
    dropoffDate: "2026-07-13",
    pickupTime: "08:00",
    returnTime: "20:00",
    rentalRate: 8500,
    additionalHours: 0,
    cdw: 1200,
    carwash: 800,
    driverFee: 2500,
    driverAdditionalHours: 0,
    accommodation: 0,
    meal: 1200,
    fuel: 0,
    excessMileage: 0,
    nightDifferential: 800,
    discount: 0,
    terminalFees: 2000,
  });

  const updateWithout = (field: keyof typeof withoutData, value: any) => {
    setWithoutData((prev) => ({ ...prev, [field]: value }));
  };

  const updateWith = (field: keyof typeof withData, value: any) => {
    setWithData((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Calculations ──────────────────────────────────────────────────────

  const withoutCalculations = useMemo(() => {
    const subtotal =
      withoutData.rentalRate +
      withoutData.additionalHours * 800 +
      withoutData.cdwFee +
      withoutData.carwash +
      withoutData.deliveryFee +
      withoutData.pickupFee +
      withoutData.otPremium +
      withoutData.beyondHours * 1200 +
      withoutData.hourlyExtension * 650;

    const totalBeforePrepaid = subtotal - withoutData.discount;
    const grandTotal = totalBeforePrepaid - withoutData.prepaid;
    const overall = grandTotal + withoutData.deposit + withoutData.terminalFees;
    const terminalPercent = Math.round(overall * 0.035);

    return { subtotal, totalBeforePrepaid, grandTotal, overall, terminalPercent };
  }, [withoutData]);

  const withCalculations = useMemo(() => {
    let subtotal =
      withData.rentalRate +
      withData.additionalHours * 900 +
      withData.cdw +
      withData.carwash +
      withData.driverFee +
      withData.driverAdditionalHours * 600 +
      withData.accommodation +
      withData.meal +
      withData.fuel +
      withData.excessMileage * 12 +
      withData.nightDifferential;

    if (isCorporate && withData.type === "Corporate") {
      subtotal = Math.round(subtotal * 1.2);
    }

    const total = subtotal - withData.discount;
    const overall = total + withData.terminalFees;

    return { subtotal, total, overall };
  }, [withData, isCorporate]);

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1200px] p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2B3A9F]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Internal Breakdown
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 ml-[52px]">
            Detailed quotation and booking confirmation breakdown for fleet
            rental services.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="mb-8">
          <SectionHeader
            title="Service Mode"
            subtitle="Select the rental service type for breakdown"
          />
          <ModeSelector mode={mode} onChange={setMode} />
        </div>

        {/* ─── WITHOUT DRIVER CONTENT ───────────────────────────────────── */}
        {mode === "without" && (
          <div className="space-y-6">
            {/* Client Information */}
            <FormCard>
              <SectionHeader
                title="Client Information"
                subtitle="Contact and booking details"
                icon={User}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Quotation Number
                  </Label>
                  <InputWithIcon
                    icon={Tag}
                    value={withoutData.quotationNumber}
                    onChange={(e) =>
                      updateWithout("quotationNumber", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Invoice Date
                  </Label>
                  <InputWithIcon
                    icon={Calendar}
                    type="date"
                    value={withoutData.invoiceDate}
                    onChange={(e) =>
                      updateWithout("invoiceDate", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Booking Date
                  </Label>
                  <InputWithIcon
                    icon={Calendar}
                    type="date"
                    value={withoutData.bookingDate}
                    onChange={(e) =>
                      updateWithout("bookingDate", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Client Name
                  </Label>
                  <InputWithIcon
                    icon={User}
                    value={withoutData.clientName}
                    onChange={(e) =>
                      updateWithout("clientName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contact Number
                  </Label>
                  <InputWithIcon
                    icon={Phone}
                    value={withoutData.contactNumber}
                    onChange={(e) =>
                      updateWithout("contactNumber", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email Address
                  </Label>
                  <InputWithIcon
                    icon={Mail}
                    type="email"
                    value={withoutData.email}
                    onChange={(e) => updateWithout("email", e.target.value)}
                  />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Complete Address
                  </Label>
                  <InputWithIcon
                    icon={MapPin}
                    value={withoutData.address}
                    onChange={(e) =>
                      updateWithout("address", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Social / Messenger
                  </Label>
                  <InputWithIcon
                    icon={Users}
                    value={withoutData.social}
                    onChange={(e) =>
                      updateWithout("social", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Alternative Contact
                  </Label>
                  <InputWithIcon
                    icon={User}
                    placeholder="Name"
                    value={withoutData.altPerson}
                    onChange={(e) =>
                      updateWithout("altPerson", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Alt Contact Number
                  </Label>
                  <InputWithIcon
                    icon={Phone}
                    value={withoutData.altContact}
                    onChange={(e) =>
                      updateWithout("altContact", e.target.value)
                    }
                  />
                </div>
              </div>
            </FormCard>

            {/* Trip & Vehicle Details */}
            <FormCard>
              <SectionHeader
                title="Trip & Vehicle Details"
                subtitle="Destination, vehicle, and schedule information"
                icon={MapPin}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    From
                  </Label>
                  <InputWithIcon
                    icon={Navigation}
                    value={withoutData.from}
                    onChange={(e) => updateWithout("from", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    To
                  </Label>
                  <InputWithIcon
                    icon={MapPin}
                    value={withoutData.to}
                    onChange={(e) => updateWithout("to", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Vehicle
                  </Label>
                  <InputWithIcon
                    icon={Car}
                    value={withoutData.car}
                    onChange={(e) => updateWithout("car", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Category
                  </Label>
                  <InputWithIcon
                    icon={Tag}
                    value={withoutData.category}
                    onChange={(e) =>
                      updateWithout("category", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Travel Date
                  </Label>
                  <InputWithIcon
                    icon={Calendar}
                    type="date"
                    value={withoutData.travelDate}
                    onChange={(e) =>
                      updateWithout("travelDate", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    End Date
                  </Label>
                  <InputWithIcon
                    icon={Calendar}
                    type="date"
                    value={withoutData.endDate}
                    onChange={(e) =>
                      updateWithout("endDate", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Days
                  </Label>
                  <InputWithIcon
                    icon={Clock}
                    type="number"
                    value={withoutData.days}
                    onChange={(e) =>
                      updateWithout(
                        "days",
                        parseInt(e.target.value) || 1
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Pickup Time
                  </Label>
                  <InputWithIcon
                    icon={Clock}
                    type="time"
                    value={withoutData.time}
                    onChange={(e) => updateWithout("time", e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-5">
                <div className="space-y-2 max-w-xs">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    CDW Status
                  </Label>
                  <InputWithIcon
                    icon={Shield}
                    value={withoutData.cdw}
                    onChange={(e) => updateWithout("cdw", e.target.value)}
                  />
                </div>
              </div>
            </FormCard>

            {/* Cost Breakdown */}
            <FormCard>
              <SectionHeader
                title="Cost Breakdown"
                subtitle="Itemized charges and financial summary"
                icon={DollarSign}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Editable Line Items */}
                <div className="space-y-1">
                  <CostLineItem
                    label="Rental Rate"
                    value={withoutData.rentalRate}
                    onChange={(v) => updateWithout("rentalRate", v)}
                    icon={Car}
                  />
                  <CostLineItem
                    label="Additional Hours"
                    value={withoutData.additionalHours}
                    onChange={(v) => updateWithout("additionalHours", v)}
                    note="× ₱800/hr"
                    icon={Clock}
                  />
                  <CostLineItem
                    label="CDW"
                    value={withoutData.cdwFee}
                    onChange={(v) => updateWithout("cdwFee", v)}
                    icon={Shield}
                  />
                  <CostLineItem
                    label="Car Wash"
                    value={withoutData.carwash}
                    onChange={(v) => updateWithout("carwash", v)}
                    icon={Droplets}
                  />
                  <CostLineItem
                    label="Delivery Fee"
                    value={withoutData.deliveryFee}
                    onChange={(v) => updateWithout("deliveryFee", v)}
                    icon={MapPin}
                  />
                  <CostLineItem
                    label="Pick-up Fee"
                    value={withoutData.pickupFee}
                    onChange={(v) => updateWithout("pickupFee", v)}
                    icon={MapPin}
                  />
                  <CostLineItem
                    label="OT Premium"
                    value={withoutData.otPremium}
                    onChange={(v) => updateWithout("otPremium", v)}
                    icon={Clock}
                  />
                  <CostLineItem
                    label="Beyond Operating Hours"
                    value={withoutData.beyondHours}
                    onChange={(v) => updateWithout("beyondHours", v)}
                    note="× ₱1,200"
                    icon={Moon}
                  />
                  <CostLineItem
                    label="Hourly Extension"
                    value={withoutData.hourlyExtension}
                    onChange={(v) => updateWithout("hourlyExtension", v)}
                    note="× ₱650"
                    icon={Clock}
                  />
                </div>

                {/* Right: Summary */}
                <div className="border-l border-slate-200 pl-0 lg:pl-8 space-y-4">
                  <CostLineItem
                    label="Subtotal"
                    value={withoutCalculations.subtotal}
                    readOnly
                    isSubtotal
                    icon={Receipt}
                  />
                  <CostLineItem
                    label="Less: Discount"
                    value={withoutData.discount}
                    onChange={(v) => updateWithout("discount", v)}
                    isDeduction
                    icon={Percent}
                  />
                  <CostLineItem
                    label="Prepaid / Reservation Fee"
                    value={withoutData.prepaid}
                    onChange={(v) => updateWithout("prepaid", v)}
                    icon={Wallet}
                  />

                  <CostLineItem
                    label="Total (before deposit)"
                    value={withoutCalculations.totalBeforePrepaid}
                    readOnly
                    isSubtotal
                    icon={Receipt}
                  />

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Deposit (Refundable)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                          ₱
                        </span>
                        <Input
                          type="number"
                          value={withoutData.deposit}
                          onChange={(e) =>
                            updateWithout(
                              "deposit",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="pl-7 border-[#E2E8F0]"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Terminal Fees
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                          ₱
                        </span>
                        <Input
                          type="number"
                          value={withoutData.terminalFees}
                          onChange={(e) =>
                            updateWithout(
                              "terminalFees",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="pl-7 border-[#E2E8F0]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <CostLineItem
                      label="Overall Total"
                      value={withoutCalculations.overall}
                      readOnly
                      isTotal
                      isHighlight
                      icon={Calculator}
                    />
                    <p className="text-xs text-slate-400 mt-1 text-right">
                      3.5% terminal fee if paid via card: ₱
                      {withoutCalculations.terminalPercent.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </FormCard>
          </div>
        )}

        {/* ─── WITH DRIVER CONTENT ──────────────────────────────────────── */}
        {mode === "with" && (
          <div className="space-y-6">
            {/* Corporate Toggle */}
            <div className="flex justify-end">
              <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
                <Building2 className="h-4 w-4 text-slate-500" />
                <Label className="text-sm font-medium text-slate-700">
                  Corporate Client
                </Label>
                <Switch
                  checked={isCorporate}
                  onCheckedChange={setIsCorporate}
                />
                {isCorporate && (
                  <Badge className="bg-[#2B3A9F] text-white hover:bg-[#1e2870]">
                    20% Markup
                  </Badge>
                )}
              </div>
            </div>

            {/* Client & Driver Info */}
            <FormCard>
              <SectionHeader
                title="Client & Driver Details"
                subtitle="Contact information and assignment details"
                icon={Users}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Quotation #
                  </Label>
                  <InputWithIcon
                    icon={Tag}
                    value={withData.quotationNumber}
                    onChange={(e) =>
                      updateWith("quotationNumber", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Booking Date
                  </Label>
                  <InputWithIcon
                    icon={Calendar}
                    type="date"
                    value={withData.bookingDate}
                    onChange={(e) =>
                      updateWith("bookingDate", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Client Type
                  </Label>
                  <Select
                    value={withData.type}
                    onValueChange={(v) => updateWith("type", v as any)}
                  >
                    <SelectTrigger className="border-[#E2E8F0] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Individual
                        </div>
                      </SelectItem>
                      <SelectItem value="Corporate">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Corporate
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Client Name
                  </Label>
                  <InputWithIcon
                    icon={User}
                    value={withData.clientName}
                    onChange={(e) =>
                      updateWith("clientName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Client Contact
                  </Label>
                  <InputWithIcon
                    icon={Phone}
                    value={withData.clientContact}
                    onChange={(e) =>
                      updateWith("clientContact", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Social / Messenger
                  </Label>
                  <InputWithIcon
                    icon={Users}
                    value={withData.social}
                    onChange={(e) => updateWith("social", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Sales In-Charge
                  </Label>
                  <InputWithIcon
                    icon={User}
                    value={withData.salesInCharge}
                    onChange={(e) =>
                      updateWith("salesInCharge", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Driver Name
                  </Label>
                  <InputWithIcon
                    icon={User}
                    value={withData.driverName}
                    onChange={(e) =>
                      updateWith("driverName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Driver Contact
                  </Label>
                  <InputWithIcon
                    icon={Phone}
                    value={withData.driverContact}
                    onChange={(e) =>
                      updateWith("driverContact", e.target.value)
                    }
                  />
                </div>
              </div>
            </FormCard>

            {/* Trip Details */}
            <FormCard>
              <SectionHeader
                title="Trip Details"
                subtitle="Route, vehicle, and schedule information"
                icon={MapPin}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    From
                  </Label>
                  <InputWithIcon
                    icon={Navigation}
                    value={withData.from}
                    onChange={(e) => updateWith("from", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    To
                  </Label>
                  <InputWithIcon
                    icon={MapPin}
                    value={withData.to}
                    onChange={(e) => updateWith("to", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Assigned Car
                  </Label>
                  <InputWithIcon
                    icon={Car}
                    value={withData.assignedCar}
                    onChange={(e) =>
                      updateWith("assignedCar", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Car Type
                  </Label>
                  <InputWithIcon
                    icon={Tag}
                    value={withData.carType}
                    onChange={(e) => updateWith("carType", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Start Date
                  </Label>
                  <InputWithIcon
                    icon={Calendar}
                    type="date"
                    value={withData.startDate}
                    onChange={(e) =>
                      updateWith("startDate", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    End Date
                  </Label>
                  <InputWithIcon
                    icon={Calendar}
                    type="date"
                    value={withData.endDate}
                    onChange={(e) =>
                      updateWith("endDate", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Days
                  </Label>
                  <InputWithIcon
                    icon={Clock}
                    type="number"
                    value={withData.days}
                    onChange={(e) =>
                      updateWith("days", parseInt(e.target.value) || 1)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Pickup Time
                  </Label>
                  <InputWithIcon
                    icon={Clock}
                    type="time"
                    value={withData.pickupTime}
                    onChange={(e) =>
                      updateWith("pickupTime", e.target.value)
                    }
                  />
                </div>
              </div>
            </FormCard>

            {/* Cost Breakdown */}
            <FormCard>
              <SectionHeader
                title="Cost Breakdown"
                subtitle="Itemized charges and financial summary"
                icon={DollarSign}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Editable Line Items */}
                <div className="space-y-1">
                  <CostLineItem
                    label="Rental Rate"
                    value={withData.rentalRate}
                    onChange={(v) => updateWith("rentalRate", v)}
                    icon={Car}
                  />
                  <CostLineItem
                    label="Additional Hours (Vehicle)"
                    value={withData.additionalHours}
                    onChange={(v) => updateWith("additionalHours", v)}
                    note="× ₱900/hr"
                    icon={Clock}
                  />
                  <CostLineItem
                    label="CDW"
                    value={withData.cdw}
                    onChange={(v) => updateWith("cdw", v)}
                    icon={Shield}
                  />
                  <CostLineItem
                    label="Carwash"
                    value={withData.carwash}
                    onChange={(v) => updateWith("carwash", v)}
                    icon={Droplets}
                  />
                  <CostLineItem
                    label="Driver's Fee"
                    value={withData.driverFee}
                    onChange={(v) => updateWith("driverFee", v)}
                    icon={User}
                  />
                  <CostLineItem
                    label="Driver Additional Hours"
                    value={withData.driverAdditionalHours}
                    onChange={(v) => updateWith("driverAdditionalHours", v)}
                    note="× ₱600/hr"
                    icon={Clock}
                  />
                  <CostLineItem
                    label="Accommodation"
                    value={withData.accommodation}
                    onChange={(v) => updateWith("accommodation", v)}
                    icon={Hotel}
                  />
                  <CostLineItem
                    label="Meal"
                    value={withData.meal}
                    onChange={(v) => updateWith("meal", v)}
                    icon={UtensilsCrossed}
                  />
                  <CostLineItem
                    label="Fuel"
                    value={withData.fuel}
                    onChange={(v) => updateWith("fuel", v)}
                    icon={Fuel}
                  />
                  <CostLineItem
                    label="Excess Mileage"
                    value={withData.excessMileage}
                    onChange={(v) => updateWith("excessMileage", v)}
                    note="× ₱12/km"
                    icon={Route}
                  />
                  <CostLineItem
                    label="Night Differential"
                    value={withData.nightDifferential}
                    onChange={(v) => updateWith("nightDifferential", v)}
                    icon={Moon}
                  />
                </div>

                {/* Right: Summary */}
                <div className="border-l border-slate-200 pl-0 lg:pl-8 space-y-4">
                  <div>
                    <CostLineItem
                      label="Subtotal"
                      value={withCalculations.subtotal}
                      readOnly
                      isSubtotal
                      icon={Receipt}
                    />
                    {isCorporate && withData.type === "Corporate" && (
                      <p className="text-xs text-[#2B3A9F] ml-6">
                        Includes 20% corporate markup
                      </p>
                    )}
                  </div>

                  <CostLineItem
                    label="Less: Discount"
                    value={withData.discount}
                    onChange={(v) => updateWith("discount", v)}
                    isDeduction
                    icon={Percent}
                  />

                  <CostLineItem
                    label="Total Rental"
                    value={withCalculations.total}
                    readOnly
                    isSubtotal
                    icon={Receipt}
                  />

                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Terminal Fees
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₱
                      </span>
                      <Input
                        type="number"
                        value={withData.terminalFees}
                        onChange={(e) =>
                          updateWith(
                            "terminalFees",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="pl-7 border-[#E2E8F0]"
                      />
                    </div>
                  </div>

                  <div className="pt-6">
                    <CostLineItem
                      label="Overall Total"
                      value={withCalculations.overall}
                      readOnly
                      isTotal
                      isHighlight
                      icon={Calculator}
                    />
                  </div>
                </div>
              </div>
            </FormCard>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-4 pt-8">
          <Button
            size="lg"
            className="gap-2 bg-[#2B3A9F] text-white hover:bg-[#1e2870]"
          >
            <Calculator className="h-5 w-5" />
            Save Breakdown
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}