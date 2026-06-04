"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Calculator,
  Car,
  User,
  Fuel,
  MapPin,
  Calendar,
  Clock,
  ChevronRight,
  FileText,
  Check,
  Percent,
  Wallet,
  Receipt,
  Shield,
  Droplets,
  Moon,
  Sun,
  Building2,
  Plane,
  RotateCcw,
  ArrowLeftRight,
  UtensilsCrossed,
  Hotel,
  Gauge,
  Route,
  AlertCircle,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Classification,
  ClientType,
  ComputationMode,
  Coverage,
  DrivingTerm,
  EventType,
  FuelSetup,
  FuelType,
  QuotationLineItem,
  QuotationResult,
  Timeframe,
  TripType,
  VehicleCategory,
  WithDriverForm,
  WithoutDriverForm,
} from "@/lib/interfaces";
import QuotationModal from "./QuotationModal";

const VEHICLE_CATEGORIES: {
  value: VehicleCategory;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "compact", label: "Compact", icon: <Car className="h-4 w-4" /> },
  { value: "sedan", label: "Sedan", icon: <Car className="h-4 w-4" /> },
  { value: "mpv", label: "MPV", icon: <Car className="h-4 w-4" /> },
  { value: "suv", label: "SUV", icon: <Car className="h-4 w-4" /> },
  { value: "pickup", label: "Pick Up", icon: <Car className="h-4 w-4" /> },
  { value: "wagon", label: "Wagon", icon: <Car className="h-4 w-4" /> },
  { value: "van", label: "Van", icon: <Car className="h-4 w-4" /> },
];

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: "8h", label: "8 Hours" },
  { value: "12h", label: "12 Hours" },
  { value: "24h", label: "24 Hours" },
];

const CLASSIFICATIONS: { value: Classification; label: string }[] = [
  { value: "primo", label: "Primo" },
  { value: "budget-mile", label: "Budget Mile" },
  { value: "premium", label: "Premium" },
];

const FUEL_SETUPS: { value: FuelSetup; label: string }[] = [
  { value: "all-in", label: "All-in Charge for Fuel" },
  { value: "renter", label: "Renter's Fuel" },
];

const TRIP_TYPES: { value: TripType; label: string; icon: React.ReactNode }[] =
  [
    {
      value: "round-trip",
      label: "Round Trip",
      icon: <RotateCcw className="h-4 w-4" />,
    },
    {
      value: "pickup-dropoff",
      label: "Pick Up / Drop Off",
      icon: <ArrowLeftRight className="h-4 w-4" />,
    },
    {
      value: "airport-transfer",
      label: "Airport Transfer",
      icon: <Plane className="h-4 w-4" />,
    },
  ];

const EVENT_TYPES: {
  value: EventType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "regular", label: "Regular Day", icon: <Sun className="h-4 w-4" /> },
  { value: "holiday", label: "Holiday", icon: <Moon className="h-4 w-4" /> },
];

const CLIENT_TYPES: {
  value: ClientType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "individual",
    label: "Individual",
    icon: <User className="h-4 w-4" />,
  },
  {
    value: "corporate",
    label: "Corporate",
    icon: <Building2 className="h-4 w-4" />,
  },
];

const COVERAGES: { value: Coverage; label: string }[] = [
  { value: "davao", label: "Within Davao" },
  { value: "region", label: "Davao Region" },
  { value: "mindanao", label: "Mindanao" },
];

const DRIVING_TERMS: { value: DrivingTerm; label: string }[] = [
  { value: "long-term-parking", label: "Long Term Parking" },
  { value: "back-forth", label: "Back and Forth" },
];

const FUEL_TYPES: { value: FuelType; label: string }[] = [
  { value: "diesel", label: "Diesel" },
  { value: "gasoline", label: "Gasoline" },
];

// ─── Rate Engine (Mock Business Logic) ───────────────────────────────────────

const BASE_RATES: Record<VehicleCategory, Record<Classification, number>> = {
  compact: { primo: 1800, "budget-mile": 1500, premium: 2200 },
  sedan: { primo: 2200, "budget-mile": 1800, premium: 2800 },
  mpv: { primo: 2800, "budget-mile": 2400, premium: 3500 },
  suv: { primo: 3200, "budget-mile": 2800, premium: 4000 },
  pickup: { primo: 2500, "budget-mile": 2200, premium: 3000 },
  wagon: { primo: 2600, "budget-mile": 2300, premium: 3200 },
  van: { primo: 3500, "budget-mile": 3000, premium: 4200 },
};

const TIMEFRAME_MULTIPLIERS: Record<Timeframe, number> = {
  "8h": 0.6,
  "12h": 0.8,
  "24h": 1.0,
};

const COVERAGE_MULTIPLIERS: Record<Coverage, number> = {
  davao: 1.0,
  region: 1.25,
  mindanao: 1.5,
};

const EVENT_MULTIPLIERS: Record<EventType, number> = {
  regular: 1.0,
  holiday: 1.3,
};

const DRIVER_FEE_RATES: Record<VehicleCategory, number> = {
  compact: 800,
  sedan: 900,
  mpv: 1000,
  suv: 1100,
  pickup: 950,
  wagon: 1000,
  van: 1200,
};

const CDW_RATES: Record<VehicleCategory, number> = {
  compact: 300,
  sedan: 350,
  mpv: 400,
  suv: 450,
  pickup: 350,
  wagon: 400,
  van: 500,
};

function computeDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.max(1, diff + 1);
}

function computeWithoutDriverQuotation(
  form: WithoutDriverForm,
): QuotationResult {
  const days =
    form.timeframe === "24h" && form.startDate && form.endDate
      ? computeDays(form.startDate, form.endDate)
      : 1;

  const hours =
    form.timeframe === "8h" ? 8 : form.timeframe === "12h" ? 12 : 24;
  const totalHours = days * hours + form.additionalHours;

  const baseRate =
    form.vehicleCategory && form.classification
      ? (BASE_RATES[form.vehicleCategory]?.[form.classification] ?? 2000)
      : 2000;

  const tfMult = form.timeframe
    ? (TIMEFRAME_MULTIPLIERS[form.timeframe] ?? 1)
    : 1;

  const rentalRate = Math.round(baseRate * tfMult * days);

  const additionalHoursRate = Math.round(
    form.additionalHours * (baseRate * 0.08)
  );
  const cdwRate =
    form.cdw && form.vehicleCategory
      ? Math.round(CDW_RATES[form.vehicleCategory] ?? 350)
      : 0;

  const carwash = Math.round(rentalRate * 0.02);
  const deliveryFee = Math.round(rentalRate * 0.03);
  const pickupFee = Math.round(rentalRate * 0.03);
  const overtimePremium =
    form.additionalHours > 0 ? Math.round(additionalHoursRate * 0.15) : 0;
  const beyondHours =
    form.additionalHours > 4 ? Math.round(additionalHoursRate * 0.2) : 0;
  const hourlyExtension = Math.round(form.additionalHours * 150);

  const fuelConsumption = Math.round(form.distance * 0.12 * 10) / 10;
  const fuelCost = Math.round(fuelConsumption * (form.fuelPrice || 0));
  const excessKm = Math.max(0, form.distance - days * 100);
  const excessMileage = Math.round(excessKm * 15);

  // === Main Charges Subtotal ===
  const mainSubtotal =
    rentalRate +
    additionalHoursRate +
    cdwRate +
    carwash +
    deliveryFee +
    pickupFee +
    overtimePremium +
    beyondHours +
    hourlyExtension +
    excessMileage;

  const discount = Math.round(mainSubtotal * 0.05);

  const subtotalAfterDiscount = mainSubtotal - discount;

  // Additional Fees
  const prepaidReservation = Math.round(subtotalAfterDiscount * 0.3); // or use mainSubtotal
  const deposit = Math.round(subtotalAfterDiscount * 0.2);
  const terminalFee = Math.round(subtotalAfterDiscount * 0.035);
  const depositFee = Math.round(deposit * 0.035);

  const overallTotal =
    subtotalAfterDiscount +
    prepaidReservation +
    deposit +
    terminalFee +
    depositFee;

  return {
    mode: "without-driver",
    lineItems: [
      // Main Charges
      { label: "Rental Rate", value: rentalRate, icon: <Car className="h-4 w-4" /> },
      { 
        label: "Additional Hours", 
        value: additionalHoursRate, 
        note: `${form.additionalHours} hrs @ ₱150/hr`, 
        icon: <Clock className="h-4 w-4" /> 
      },
      { label: "CDW (Collision Damage Waiver)", value: cdwRate, icon: <Shield className="h-4 w-4" /> },
      { label: "Carwash", value: carwash, icon: <Droplets className="h-4 w-4" /> },
      { label: "Delivery Fee", value: deliveryFee, icon: <MapPin className="h-4 w-4" /> },
      { label: "Pick-up Fee", value: pickupFee, icon: <MapPin className="h-4 w-4" /> },
      { label: "Overtime Premium", value: overtimePremium, icon: <Clock className="h-4 w-4" /> },
      { label: "Beyond Operating Hours", value: beyondHours, icon: <Moon className="h-4 w-4" /> },
      { label: "Hourly Extension Rate", value: hourlyExtension, icon: <Gauge className="h-4 w-4" /> },
      { label: "Excess Mileage", value: excessMileage, note: `${excessKm} km excess`, icon: <Route className="h-4 w-4" /> },

      // Subtotal
      { label: "Subtotal", value: mainSubtotal, isSubtotal: true, icon: <Receipt className="h-4 w-4" /> },

      // Deduction
      { label: "Less: Discount (5%)", value: -discount, isDeduction: true, icon: <Percent className="h-4 w-4" /> },

      // Fees
      { label: "Prepaid / Reservation Fee", value: prepaidReservation, icon: <Wallet className="h-4 w-4" /> },
      { label: "Deposit (20%)", value: deposit, icon: <Wallet className="h-4 w-4" /> },
      { label: "Terminal Fee (3.5%)", value: terminalFee, icon: <Percent className="h-4 w-4" /> },
      { label: "Deposit Fee (3.5%)", value: depositFee, icon: <Percent className="h-4 w-4" /> },

      // Overall Total
      { 
        label: "Overall Total", 
        value: overallTotal, 
        isTotal: true, 
        isHighlight: true, 
        icon: <Calculator className="h-4 w-4" /> 
      },
    ],
    operationalDetails: [
      { label: "Total Days Rented", value: `${days} day${days > 1 ? "s" : ""}` },
      { label: "Total Hours Rented", value: `${totalHours} hours` },
      { label: "Fuel Consumption", value: `${fuelConsumption} L` },
      { label: "Fuel Cost", value: `₱${fuelCost.toLocaleString()}` },
      { label: "Excess Kilometer", value: `${excessKm} km` },
      { label: "Distance Traveled", value: `${form.distance} km` },
    ],
  };
}

function computeWithDriverQuotation(form: WithDriverForm): QuotationResult {
  const days =
    form.timeframe === "24h" && form.startDate && form.endDate
      ? computeDays(form.startDate, form.endDate)
      : 1;

  const hours =
    form.timeframe === "8h" ? 8 : form.timeframe === "12h" ? 12 : 24;

  const totalHours = days * hours + form.additionalHours;

  const baseRate =
    form.vehicleCategory && form.classification
      ? (BASE_RATES[form.vehicleCategory]?.[form.classification] ?? 2000)
      : 2000;

  const tfMult = form.timeframe
    ? (TIMEFRAME_MULTIPLIERS[form.timeframe] ?? 1)
    : 1;

  const covMult = form.coverage
    ? (COVERAGE_MULTIPLIERS[form.coverage] ?? 1)
    : 1;

  const eventMult = form.eventType
    ? (EVENT_MULTIPLIERS[form.eventType] ?? 1)
    : 1;

  // === Main Calculations ===
  const rentalRate = Math.round(baseRate * tfMult * covMult * eventMult * days);

  const driverRate = form.vehicleCategory
    ? (DRIVER_FEE_RATES[form.vehicleCategory] ?? 1000)
    : 1000;

  const driverFee = Math.round(driverRate * days * eventMult);

  const additionalHoursCar = Math.round(
    form.additionalHours * (baseRate * 0.08),
  );
  const additionalHoursDriver = Math.round(form.additionalHours * 200);

  const cdwRate = 0;
  const carwash = Math.round(rentalRate * 0.02);
  const accommodation = Math.round((form.accommodationFee || 0) * days);
  const meal = Math.round((form.mealFee || 0) * days);

  const fuelConsumption = Math.round(form.distance * 0.12 * 10) / 10;
  const fuelCost = Math.round(fuelConsumption * (form.fuelPrice || 0));
  const fuelCharge = form.fuelSetup === "all-in" ? fuelCost : 0;

  const excessKm = Math.max(0, form.distance - days * 100);
  const excessMileage = Math.round(excessKm * 15);

  const nightDiff =
    form.eventType === "holiday" ? Math.round(driverFee * 0.2) : 0;

  // === Subtotal ===
  const subtotal =
    rentalRate +
    additionalHoursCar +
    driverFee +
    additionalHoursDriver +
    carwash +
    accommodation +
    meal +
    fuelCharge +
    excessMileage +
    nightDiff;

  const discountPercent = form.clientType === "corporate" ? 0.08 : 0.03;
  const discount = Math.round(subtotal * discountPercent);

  const totalAfterDiscount = subtotal - discount;

  // Additional Fees
  const terminalFee = Math.round(totalAfterDiscount * 0.035);
  const reservationFee = Math.round(totalAfterDiscount * 0.05);

  const finalTotal = totalAfterDiscount + terminalFee + reservationFee;

  // === Line Items (Clean & Categorized) ===
  const lineItems: QuotationLineItem[] = [
    // Main Charges
    {
      label: "Rental Rate",
      value: rentalRate,
      icon: <Car className="h-4 w-4" />,
    },
    {
      label: "Additional Hours (Car)",
      value: additionalHoursCar,
      note: `${form.additionalHours} hrs`,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: "Driver's Fee",
      value: driverFee,
      note: `${days} day(s)`,
      icon: <User className="h-4 w-4" />,
    },
    {
      label: "Additional Hours (Driver)",
      value: additionalHoursDriver,
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: "Carwash",
      value: carwash,
      icon: <Droplets className="h-4 w-4" />,
    },
    {
      label: "Accommodation",
      value: accommodation,
      icon: <Hotel className="h-4 w-4" />,
    },
    {
      label: "Meal",
      value: meal,
      icon: <UtensilsCrossed className="h-4 w-4" />,
    },
    {
      label: "Fuel",
      value: fuelCharge,
      note: form.fuelSetup === "all-in" ? "All-in" : "Renter pays",
      icon: <Fuel className="h-4 w-4" />,
    },
    {
      label: "Excess Mileage",
      value: excessMileage,
      note: `${excessKm} km excess`,
      icon: <Route className="h-4 w-4" />,
    },
    {
      label: "Night Differential",
      value: nightDiff,
      icon: <Moon className="h-4 w-4" />,
    },

    // Subtotal
    {
      label: "Subtotal",
      value: subtotal,
      isSubtotal: true,
      icon: <Receipt className="h-4 w-4" />,
    },

    // Deduction
    {
      label: `Less: Discount (${discountPercent * 100}%)`,
      value: -discount,
      isDeduction: true,
      icon: <Percent className="h-4 w-4" />,
    },

    // Total
    {
      label: "Total",
      value: totalAfterDiscount,
      isTotal: true,
      icon: <Receipt className="h-4 w-4" />,
    },

    // Fees
    {
      label: "Terminal Fee (3.5%)",
      value: terminalFee,
      icon: <Percent className="h-4 w-4" />,
    },
    {
      label: "Reservation Fee (5%)",
      value: reservationFee,
      icon: <Wallet className="h-4 w-4" />,
    },

    // Overall Total
    {
      label: "Overall Total",
      value: finalTotal,
      isTotal: true,
      isHighlight: true,
      icon: <Calculator className="h-4 w-4" />,
    },
  ];

  // Corporate Markup (if applicable)
  if (form.clientType === "corporate") {
    const markup = Math.round(finalTotal * 0.1);
    const corporateTotal = finalTotal + markup;

    lineItems.push(
      {
        label: "Corporate Markup (10%)",
        value: markup,
        note: "Corporate handling fee",
        icon: <Percent className="h-4 w-4" />,
      },
      {
        label: "Corporate Final Total",
        value: corporateTotal,
        isTotal: true,
        isHighlight: true,
        icon: <Building2 className="h-4 w-4" />,
      },
    );
  }

  return {
    mode: "with-driver",
    lineItems,
    operationalDetails: [
      {
        label: "Total Days Rented",
        value: `${days} day${days > 1 ? "s" : ""}`,
      },
      { label: "Total Hours Rented", value: `${totalHours} hours` },
      { label: "Fuel Consumption", value: `${fuelConsumption} L` },
      { label: "Fuel Cost", value: `₱${fuelCost.toLocaleString()}` },
      { label: "Distance Traveled", value: `${form.distance} km` },
      { label: "Coverage Area", value: form.coverage?.toUpperCase() ?? "" },
      { label: "Trip Type", value: form.tripType?.replace("-", " ") ?? "" },
      { label: "Event Type", value: form.eventType ?? "" },
    ],
  };
}

// ─── Sub-Components ────────────────────────────────────────────────────────

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
        {title}
      </h3>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
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

function ModeSelector({
  mode,
  onChange,
}: {
  mode: ComputationMode;
  onChange: (m: ComputationMode) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <button
        onClick={() => onChange("without-driver")}
        className={`relative flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all duration-300 ${
          mode === "without-driver"
            ? "border-[#2B3A9F] bg-[#EEF2FF] shadow-sm"
            : "border-[#E2E8F0] bg-white hover:border-slate-300 hover:shadow-sm"
        }`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            mode === "without-driver"
              ? "bg-[#2B3A9F] text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <Car className="h-6 w-6" />
        </div>
        <div>
          <p
            className={`text-sm font-bold ${mode === "without-driver" ? "text-[#2B3A9F]" : "text-slate-900"}`}
          >
            Without Driver
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Self-drive rental with CDW options
          </p>
        </div>
        {mode === "without-driver" && (
          <div className="absolute right-4 top-4">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2B3A9F]">
              <Check className="h-3 w-3 text-white" />
            </div>
          </div>
        )}
      </button>

      <button
        onClick={() => onChange("with-driver")}
        className={`relative flex items-center gap-4 rounded-xl border-2 p-5 text-left transition-all duration-300 ${
          mode === "with-driver"
            ? "border-[#2B3A9F] bg-[#EEF2FF] shadow-sm"
            : "border-[#E2E8F0] bg-white hover:border-slate-300 hover:shadow-sm"
        }`}
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            mode === "with-driver"
              ? "bg-[#2B3A9F] text-white"
              : "bg-slate-100 text-slate-500"
          }`}
        >
          <User className="h-6 w-6" />
        </div>
        <div>
          <p
            className={`text-sm font-bold ${mode === "with-driver" ? "text-[#2B3A9F]" : "text-slate-900"}`}
          >
            With Driver
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Chauffeured service with full coverage
          </p>
        </div>
        {mode === "with-driver" && (
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

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function QuickQuotationPage() {
  const [mode, setMode] = useState<ComputationMode>("without-driver");
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [quotationResult, setQuotationResult] =
    useState<QuotationResult | null>(null);

  // Without Driver Form State
  const [wdForm, setWdForm] = useState<WithoutDriverForm>({
    vehicleCategory: "",
    timeframe: "",
    classification: "",
    startDate: "",
    endDate: "",
    additionalHours: 0,
    distance: 0,
    fuelPrice: 0,
    cdw: false,
  });

  // With Driver Form State
  const [wdriverForm, setWdriverForm] = useState<WithDriverForm>({
    vehicleCategory: "",
    timeframe: "",
    classification: "",
    startDate: "",
    endDate: "",
    additionalHours: 0,
    distance: 0,
    fuelPrice: 0,
    fuelSetup: "",
    tripType: "",
    eventType: "",
    clientType: "",
    coverage: "",
    drivingTerm: "",
    accommodationFee: 0,
    mealFee: 0,
    fuelType: "",
  });

  const showDateRange = useMemo(() => {
    const tf =
      mode === "without-driver" ? wdForm.timeframe : wdriverForm.timeframe;
    return tf === "24h";
  }, [mode, wdForm.timeframe, wdriverForm.timeframe]);

  const handleGenerate = useCallback(() => {
    if (mode === "without-driver") {
      const result = computeWithoutDriverQuotation(wdForm);
      setQuotationResult(result);
    } else {
      const result = computeWithDriverQuotation(wdriverForm);
      setQuotationResult(result);
    }
    setQuotationOpen(true);
  }, [mode, wdForm, wdriverForm]);

  const isFormValid = useMemo(() => {
    if (mode === "without-driver") {
      return (
        wdForm.vehicleCategory &&
        wdForm.timeframe &&
        wdForm.classification &&
        wdForm.distance >= 0
      );
    }
    return (
      wdriverForm.vehicleCategory &&
      wdriverForm.timeframe &&
      wdriverForm.classification &&
      wdriverForm.fuelSetup &&
      wdriverForm.tripType &&
      wdriverForm.eventType &&
      wdriverForm.clientType &&
      wdriverForm.coverage &&
      wdriverForm.drivingTerm &&
      wdriverForm.distance >= 0
    );
  }, [mode, wdForm, wdriverForm]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="mx-auto max-w-[1200px] p-6 md:p-8">
        {/* ─── Header ─────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#2B3A9F]">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Quick Quotation
              </h1>
            </div>
          </div>
          <p className="text-sm text-slate-500 ml-[52px]">
            Generate fleet rental quotations for self-drive or chauffeured
            services with full cost breakdown.
          </p>
        </div>

        {/* ─── Mode Selector ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <SectionHeader
            title="Computation Mode"
            subtitle="Select the rental service type"
          />
          <ModeSelector mode={mode} onChange={setMode} />
        </div>

        {/* ─── Form Sections ──────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Vehicle & Classification */}
          <FormCard>
            <SectionHeader
              title="Vehicle Configuration"
              subtitle="Select vehicle category and rental classification"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vehicle Category
                </Label>
                <Select
                  value={
                    mode === "without-driver"
                      ? wdForm.vehicleCategory
                      : wdriverForm.vehicleCategory
                  }
                  onValueChange={(v) => {
                    if (mode === "without-driver")
                      setWdForm((prev) => ({
                        ...prev,
                        vehicleCategory: v as VehicleCategory,
                      }));
                    else
                      setWdriverForm((prev) => ({
                        ...prev,
                        vehicleCategory: v as VehicleCategory,
                      }));
                  }}
                >
                  <SelectTrigger className="border-[#E2E8F0] bg-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          {cat.icon}
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Timeframe
                </Label>
                <Select
                  value={
                    mode === "without-driver"
                      ? wdForm.timeframe
                      : wdriverForm.timeframe
                  }
                  onValueChange={(v) => {
                    if (mode === "without-driver")
                      setWdForm((prev) => ({
                        ...prev,
                        timeframe: v as Timeframe,
                      }));
                    else
                      setWdriverForm((prev) => ({
                        ...prev,
                        timeframe: v as Timeframe,
                      }));
                  }}
                >
                  <SelectTrigger className="border-[#E2E8F0] bg-white">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEFRAMES.map((tf) => (
                      <SelectItem key={tf.value} value={tf.value}>
                        {tf.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Classification
                </Label>
                <Select
                  value={
                    mode === "without-driver"
                      ? wdForm.classification
                      : wdriverForm.classification
                  }
                  onValueChange={(v) => {
                    if (mode === "without-driver")
                      setWdForm((prev) => ({
                        ...prev,
                        classification: v as Classification,
                      }));
                    else
                      setWdriverForm((prev) => ({
                        ...prev,
                        classification: v as Classification,
                      }));
                  }}
                >
                  <SelectTrigger className="border-[#E2E8F0] bg-white">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSIFICATIONS.map((cls) => (
                      <SelectItem key={cls.value} value={cls.value}>
                        {cls.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Range (24h only) */}
            {showDateRange && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Start Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="date"
                      className="pl-10 border-[#E2E8F0]"
                      value={
                        mode === "without-driver"
                          ? wdForm.startDate
                          : wdriverForm.startDate
                      }
                      onChange={(e) => {
                        if (mode === "without-driver")
                          setWdForm((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }));
                        else
                          setWdriverForm((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }));
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    End Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="date"
                      className="pl-10 border-[#E2E8F0]"
                      value={
                        mode === "without-driver"
                          ? wdForm.endDate
                          : wdriverForm.endDate
                      }
                      onChange={(e) => {
                        if (mode === "without-driver")
                          setWdForm((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }));
                        else
                          setWdriverForm((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }));
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </FormCard>

          {/* Mode-Specific Fields */}
          {mode === "without-driver" ? (
            <>
              {/* CDW & Options */}
              <FormCard>
                <SectionHeader
                  title="Rental Options"
                  subtitle="Insurance and protection coverage"
                />
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="cdw"
                    checked={wdForm.cdw}
                    onCheckedChange={(checked) =>
                      setWdForm((prev) => ({
                        ...prev,
                        cdw: checked as boolean,
                      }))
                    }
                  />
                  <Label
                    htmlFor="cdw"
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    Include CDW (Collision Damage Waiver)
                  </Label>
                </div>
              </FormCard>

              {/* Operational Inputs */}
              <FormCard>
                <SectionHeader
                  title="Operational Details"
                  subtitle="Distance, fuel, and time adjustments"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Additional Hours
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="border-[#E2E8F0]"
                      value={wdForm.additionalHours || ""}
                      onChange={(e) =>
                        setWdForm((prev) => ({
                          ...prev,
                          additionalHours: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Distance (km)
                    </Label>
                    <div className="relative">
                      <Route className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        className="pl-10 border-[#E2E8F0]"
                        value={wdForm.distance || ""}
                        onChange={(e) =>
                          setWdForm((prev) => ({
                            ...prev,
                            distance: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Fuel Price (₱/L)
                    </Label>
                    <div className="relative">
                      <Fuel className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        className="pl-10 border-[#E2E8F0]"
                        value={wdForm.fuelPrice || ""}
                        onChange={(e) =>
                          setWdForm((prev) => ({
                            ...prev,
                            fuelPrice: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </FormCard>
            </>
          ) : (
            <>
              {/* Driver Configuration */}
              <FormCard>
                <SectionHeader
                  title="Driver Configuration"
                  subtitle="Service type, coverage, and client details"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Fuel Setup
                    </Label>
                    <Select
                      value={wdriverForm.fuelSetup}
                      onValueChange={(v) =>
                        setWdriverForm((prev) => ({
                          ...prev,
                          fuelSetup: v as FuelSetup,
                        }))
                      }
                    >
                      <SelectTrigger className="border-[#E2E8F0] bg-white">
                        <SelectValue placeholder="Select fuel setup" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_SETUPS.map((fs) => (
                          <SelectItem key={fs.value} value={fs.value}>
                            {fs.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Trip Type
                    </Label>
                    <Select
                      value={wdriverForm.tripType}
                      onValueChange={(v) =>
                        setWdriverForm((prev) => ({
                          ...prev,
                          tripType: v as TripType,
                        }))
                      }
                    >
                      <SelectTrigger className="border-[#E2E8F0] bg-white">
                        <SelectValue placeholder="Select trip type" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRIP_TYPES.map((tt) => (
                          <SelectItem key={tt.value} value={tt.value}>
                            <div className="flex items-center gap-2">
                              {tt.icon}
                              {tt.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Event Type
                    </Label>
                    <Select
                      value={wdriverForm.eventType}
                      onValueChange={(v) =>
                        setWdriverForm((prev) => ({
                          ...prev,
                          eventType: v as EventType,
                        }))
                      }
                    >
                      <SelectTrigger className="border-[#E2E8F0] bg-white">
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((et) => (
                          <SelectItem key={et.value} value={et.value}>
                            <div className="flex items-center gap-2">
                              {et.icon}
                              {et.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Client Type
                    </Label>
                    <Select
                      value={wdriverForm.clientType}
                      onValueChange={(v) =>
                        setWdriverForm((prev) => ({
                          ...prev,
                          clientType: v as ClientType,
                        }))
                      }
                    >
                      <SelectTrigger className="border-[#E2E8F0] bg-white">
                        <SelectValue placeholder="Select client type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLIENT_TYPES.map((ct) => (
                          <SelectItem key={ct.value} value={ct.value}>
                            <div className="flex items-center gap-2">
                              {ct.icon}
                              {ct.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Coverage Area
                    </Label>
                    <Select
                      value={wdriverForm.coverage}
                      onValueChange={(v) =>
                        setWdriverForm((prev) => ({
                          ...prev,
                          coverage: v as Coverage,
                        }))
                      }
                    >
                      <SelectTrigger className="border-[#E2E8F0] bg-white">
                        <SelectValue placeholder="Select coverage" />
                      </SelectTrigger>
                      <SelectContent>
                        {COVERAGES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Driving Term
                    </Label>
                    <Select
                      value={wdriverForm.drivingTerm}
                      onValueChange={(v) =>
                        setWdriverForm((prev) => ({
                          ...prev,
                          drivingTerm: v as DrivingTerm,
                        }))
                      }
                    >
                      <SelectTrigger className="border-[#E2E8F0] bg-white">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        {DRIVING_TERMS.map((dt) => (
                          <SelectItem key={dt.value} value={dt.value}>
                            {dt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </FormCard>

              {/* Driver Costs */}
              <FormCard>
                <SectionHeader
                  title="Driver Costs & Fuel"
                  subtitle="Per diem allowances and fuel configuration"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Accommodation Fee (₱/day)
                    </Label>
                    <div className="relative">
                      <Hotel className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="number"
                        min={0}
                        placeholder="0.00"
                        className="pl-10 border-[#E2E8F0]"
                        value={wdriverForm.accommodationFee || ""}
                        onChange={(e) =>
                          setWdriverForm((prev) => ({
                            ...prev,
                            accommodationFee: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Meal Fee (₱/day)
                    </Label>
                    <div className="relative">
                      <UtensilsCrossed className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="number"
                        min={0}
                        placeholder="0.00"
                        className="pl-10 border-[#E2E8F0]"
                        value={wdriverForm.mealFee || ""}
                        onChange={(e) =>
                          setWdriverForm((prev) => ({
                            ...prev,
                            mealFee: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Fuel Type
                    </Label>
                    <Select
                      value={wdriverForm.fuelType}
                      onValueChange={(v) =>
                        setWdriverForm((prev) => ({
                          ...prev,
                          fuelType: v as FuelType,
                        }))
                      }
                    >
                      <SelectTrigger className="border-[#E2E8F0] bg-white">
                        <SelectValue placeholder="Select fuel type" />
                      </SelectTrigger>
                      <SelectContent>
                        {FUEL_TYPES.map((ft) => (
                          <SelectItem key={ft.value} value={ft.value}>
                            {ft.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </FormCard>

              {/* Operational Inputs */}
              <FormCard>
                <SectionHeader
                  title="Operational Details"
                  subtitle="Distance, fuel price, and time adjustments"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Additional Hours
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="border-[#E2E8F0]"
                      value={wdriverForm.additionalHours || ""}
                      onChange={(e) =>
                        setWdriverForm((prev) => ({
                          ...prev,
                          additionalHours: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Distance (km)
                    </Label>
                    <div className="relative">
                      <Route className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        className="pl-10 border-[#E2E8F0]"
                        value={wdriverForm.distance || ""}
                        onChange={(e) =>
                          setWdriverForm((prev) => ({
                            ...prev,
                            distance: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Fuel Price (₱/L)
                    </Label>
                    <div className="relative">
                      <Fuel className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        className="pl-10 border-[#E2E8F0]"
                        value={wdriverForm.fuelPrice || ""}
                        onChange={(e) =>
                          setWdriverForm((prev) => ({
                            ...prev,
                            fuelPrice: Number(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </FormCard>
            </>
          )}

          {/* ─── Generate Action ─────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-4 pt-4">
            {!isFormValid && (
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <AlertCircle className="h-4 w-4" />
                Please complete all required fields
              </div>
            )}
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!isFormValid}
              className="gap-2 bg-[#2B3A9F] text-white hover:bg-[#1e2870] disabled:opacity-50"
            >
              <Calculator className="h-5 w-5" />
              Generate Quotation
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <QuotationModal
        open={quotationOpen}
        onOpenChange={setQuotationOpen}
        result={quotationResult}
      />
    </div>
  );
}
