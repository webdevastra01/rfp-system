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
  Route,
  AlertCircle,
  CreditCard,
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
import {
  BaseFormState,
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
} from "@/lib/interfaces";

import {
  RATES,
  getVehiclePricing,
  calculateBeyondOperatingHoursFee,
} from "@/lib/formula";
import QuotationModal from "./QuotationModal";
import { Switch } from "@/components/ui/switch";

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

function computeDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 1;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  return Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

const categoryMap = {
  compact: "Compact",
  sedan: "Sedan",
  mpv: "MPV",
  suv: "SUV",
  pickup: "Pick-up",
  wagon: "Wagon",
  van: "Van",
} as const;

const classificationMap = {
  "budget-mile": "Budget Mile",
  primo: "Primo",
  premium: "Premium",
} as const;

function computeWithoutDriverQuotation(form: BaseFormState): QuotationResult {
  const days =
    form.timeframe === "24h" && form.startDate && form.endDate
      ? computeDays(form.startDate, form.endDate)
      : 1;

  const hours =
    form.timeframe === "8h" ? 8 : form.timeframe === "12h" ? 12 : 24;
  const totalHours = days * hours + form.additionalHours;

  const category =
    categoryMap[form.vehicleCategory as keyof typeof categoryMap];

  const classification =
    classificationMap[form.classification as keyof typeof classificationMap];

  const pricing = getVehiclePricing(category, hours, classification);

  const rentalRate = pricing.rental_rate! * days;

  const additionalHoursRate = form.additionalHours * pricing.excess_hourly_rate;

  const beyondHoursFee =
    form.beyondOperatingHours && form.startDate && form.endDate
      ? calculateBeyondOperatingHoursFee(
          new Date(form.startDate),
          new Date(form.endDate),
          500,
        ).fee
      : 0;

  const cdwRate = form.cdw ? pricing.cdw * days : 0;

  const carwash = pricing.carwash_fee;

  const deliveryFee = 0;
  const pickupFee = 0;

  const fuelConsumption = Math.round(form.distance * 0.12 * 10) / 10;

  const fuelCost = 0;
  const excessKm = Math.max(0, form.distance - days * 100);
  const excessMileage = excessKm * pricing.excess_km_rate;

  // === Main Charges Subtotal ===
  const mainSubtotal =
    rentalRate +
    additionalHoursRate +
    cdwRate +
    carwash +
    deliveryFee +
    pickupFee +
    beyondHoursFee +
    excessMileage;

  const discountPercent = Number(form.discountPercent || 0) || 0;
  const discountAmount = Math.round(mainSubtotal * (discountPercent / 100));
  const discountedSubtotal = mainSubtotal - discountAmount;

  // === Terminal Fee (with optional deposit inclusion) ===
  const pm = form.paymentMethod;
  const method = Array.isArray(pm)
    ? ((pm as ("cash" | "card")[])[0] ?? undefined)
    : typeof pm === "string"
      ? (pm as "cash" | "card")
      : undefined;

  const depositAmount = Math.round(Number(form.deposit || 0) || 0);

  let terminalBase = discountedSubtotal;
  if (method === "card" && form.includeDepositInTerminalFee) {
    terminalBase += depositAmount;
  }

  const terminalFee = method === "card" ? Math.round(terminalBase * 0.035) : 0;

  const overallTotal = discountedSubtotal + terminalFee + depositAmount;

  return {
    mode: "without-driver",
    lineItems: [
      // ... (your lineItems stay exactly the same)
      {
        label: "Rental Rate",
        value: rentalRate,
        icon: <Car className="h-4 w-4" />,
      },
      {
        label: "Additional Hours",
        value: additionalHoursRate,
        note: `${form.additionalHours} hrs @ ₱${pricing.excess_hourly_rate}/hr`,
        icon: <Clock className="h-4 w-4" />,
      },
      {
        label: "CDW (Collision Damage Waiver)",
        value: cdwRate,
        icon: <Shield className="h-4 w-4" />,
      },
      {
        label: "Carwash",
        value: carwash,
        icon: <Droplets className="h-4 w-4" />,
      },
      {
        label: "Delivery Fee",
        value: deliveryFee,
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        label: "Pick-up Fee",
        value: pickupFee,
        icon: <MapPin className="h-4 w-4" />,
      },
      {
        label: "Beyond Operating Hours",
        value: beyondHoursFee,
        icon: <Moon className="h-4 w-4" />,
      },
      {
        label: "Excess Mileage",
        value: excessMileage,
        note: `${excessKm} km @ ₱${pricing.excess_km_rate}/km`,
        icon: <Route className="h-4 w-4" />,
      },

      {
        label: "Subtotal",
        value: mainSubtotal,
        isSubtotal: true,
        icon: <Receipt className="h-4 w-4" />,
      },
      {
        label: `Less: Discount (${discountPercent}%)`,
        value: -discountAmount,
        isDeduction: true,
        icon: <Percent className="h-4 w-4" />,
      },
      ...(terminalFee > 0
        ? [
            {
              label: "Terminal Fee (Card 3.5%)",
              value: terminalFee,
              icon: <CreditCard className="h-4 w-4" />,
            },
          ]
        : []),

      ...(depositAmount > 0
        ? [
            {
              label: "Deposit",
              value: depositAmount,
              icon: <Wallet className="h-4 w-4" />,
            },
          ]
        : []),

      {
        label: "Overall Total",
        value: overallTotal,
        isTotal: true,
        isHighlight: true,
        icon: <Calculator className="h-4 w-4" />,
      },
    ],
    operationalDetails: [
      {
        label: "Total Days Rented",
        value: `${days} day${days > 1 ? "s" : ""}`,
      },
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

  const category =
    categoryMap[form.vehicleCategory as keyof typeof categoryMap];

  const classification =
    classificationMap[form.classification as keyof typeof classificationMap];

  const pricing = getVehiclePricing(category, hours, classification);

  const baseRate = pricing.rental_rate ?? 0;

  const covMult = form.coverage
    ? (COVERAGE_MULTIPLIERS[form.coverage] ?? 1)
    : 1;

  const eventMult = form.eventType
    ? (EVENT_MULTIPLIERS[form.eventType] ?? 1)
    : 1;

  // === Main Calculations ===
  const rentalRate = Math.round(baseRate * covMult * eventMult * days);

  const driverRate = form.vehicleCategory
    ? (DRIVER_FEE_RATES[form.vehicleCategory] ?? 1000)
    : 1000;

  const driverFee = Math.round(driverRate * days * eventMult);

  const additionalHoursCar = Math.round(
    form.additionalHours * (baseRate * 0.08),
  );
  const additionalHoursDriver = Math.round(form.additionalHours * 200);
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

  const discountPercent = Number(form.discountPercent || 0) || 0;
  const discountAmount = Math.round(subtotal * (discountPercent / 100));

  const subtotalAfterDiscount = subtotal - discountAmount;

  // === Terminal Fee (Safe for empty tuple / array / string) ===
  const pm = form.paymentMethod;
  const method = Array.isArray(pm)
    ? ((pm as ("cash" | "card")[])[0] ?? undefined)
    : typeof pm === "string"
      ? (pm as "cash" | "card")
      : undefined;

  const depositAmount = Math.round(Number(form.deposit || 0) || 0);

  let terminalBase = subtotalAfterDiscount;
  if (method === "card" && form.includeDepositInTerminalFee) {
    terminalBase += depositAmount;
  }

  const terminalFee = method === "card" ? Math.round(terminalBase * 0.035) : 0;

  const finalTotal = subtotalAfterDiscount + terminalFee + depositAmount;

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
      note: `${excessKm} km @ ₱${pricing.excess_km_rate}/km`,
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

    // Deduction / Discount
    {
      label: `Less: Discount (${discountPercent}%)`,
      value: -discountAmount,
      isDeduction: true,
      icon: <Percent className="h-4 w-4" />,
    },

    // Terminal fee (only for Card)
    ...(terminalFee > 0
      ? [
          {
            label: "Terminal Fee (Card 3.5%)",
            value: terminalFee,
            icon: <CreditCard className="h-4 w-4" />,
          },
        ]
      : []),

    // Deposit (separate line item, excluded from total due)
    ...(depositAmount > 0
      ? [
          {
            label: "Deposit",
            value: depositAmount,
            icon: <Wallet className="h-4 w-4" />,
          },
        ]
      : []),

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
  const [wdForm, setWdForm] = useState<BaseFormState>({
    vehicleCategory: "",
    timeframe: "",
    classification: "",
    startDate: "",
    endDate: "",
    additionalHours: 0,
    distance: 0,

    deposit: "2000",
    discountPercent: "",
    paymentMethod: [],

    includeDepositInTerminalFee: true,

    beyondOperatingHours: false,
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

    deposit: "",
    discountPercent: "",
    paymentMethod: [],

    includeDepositInTerminalFee: true,

    beyondOperatingHours: false,
    cdw: false,
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
        (wdForm.vehicleCategory === "van" ? true : !!wdForm.classification) &&
        wdForm.distance >= 0
      );
    }

    return (
      wdriverForm.vehicleCategory &&
      wdriverForm.timeframe &&
      (wdriverForm.vehicleCategory === "van"
        ? true
        : !!wdriverForm.classification) &&
      wdriverForm.fuelSetup &&
      wdriverForm.tripType &&
      wdriverForm.eventType &&
      wdriverForm.clientType &&
      wdriverForm.coverage &&
      wdriverForm.drivingTerm &&
      wdriverForm.distance >= 0
    );
  }, [mode, wdForm, wdriverForm]);

  const availableClassifications = useMemo(() => {
    const selectedCategory =
      mode === "without-driver"
        ? wdForm.vehicleCategory
        : wdriverForm.vehicleCategory;

    if (!selectedCategory) return [];

    const category = categoryMap[selectedCategory];

    const config = RATES[category];

    if ("rate" in config) {
      return [];
    }

    return Object.keys(config.rates ?? {});
  }, [mode, wdForm.vehicleCategory, wdriverForm.vehicleCategory]);

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
                {(mode === "without-driver"
                  ? wdForm.vehicleCategory !== "van"
                  : wdriverForm.vehicleCategory !== "van") && (
                  <>
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
                        {availableClassifications.map((cls) => (
                          <SelectItem
                            key={cls}
                            value={
                              cls === "Budget Mile"
                                ? "budget-mile"
                                : cls.toLowerCase()
                            }
                          >
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
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

                {/* CDW Switch */}
                <div className="flex items-center justify-between py-2">
                  <Label
                    htmlFor="cdw"
                    className="text-sm text-slate-700 cursor-pointer"
                  >
                    Include CDW (Collision Damage Waiver)
                  </Label>
                  <Switch
                    id="cdw"
                    checked={wdForm.cdw}
                    onCheckedChange={(checked) =>
                      setWdForm((prev) => ({
                        ...prev,
                        cdw: checked,
                      }))
                    }
                  />
                </div>

                {/* Beyond Operating Hours Switch */}
                <div className="flex items-center justify-between py-2">
                  <div className="flex flex-col">
                    <Label
                      htmlFor="beyond-hours"
                      className="text-sm text-slate-700 cursor-pointer"
                    >
                      Beyond Operating Hours
                    </Label>
                    <span className="text-xs text-slate-500">
                      Allow pickup/return outside standard hours
                    </span>
                  </div>
                  <Switch
                    id="beyond-hours"
                    checked={wdForm.beyondOperatingHours}
                    onCheckedChange={(checked) =>
                      setWdForm((prev) => ({
                        ...prev,
                        beyondOperatingHours: checked,
                      }))
                    }
                  />
                </div>
              </FormCard>

              {/* Operational Inputs */}
              <FormCard>
                <SectionHeader
                  title="Operational Details"
                  subtitle="Distance and time adjustments"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Additional Hours */}
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

                  {/* Distance (km) */}
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
                </div>
              </FormCard>

              {/* Financial Settings */}
              <FormCard>
                <SectionHeader
                  title="Financial Settings"
                  subtitle="Apply deposit, discount, and terminal fees"
                />

                <div className="space-y-4">
                  {/* Deposit (₱) */}
                  <div className="space-y-1.5">
                    <Label htmlFor="deposit" className="text-sm text-slate-700">
                      Deposit (₱)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ₱
                      </span>
                      <Input
                        id="deposit"
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={wdForm.deposit}
                        onChange={(e) =>
                          setWdForm((prev) => ({
                            ...prev,
                            deposit: e.target.value,
                          }))
                        }
                        className="pl-7"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Added to the quotation total and shown as a separate line
                      item.
                    </p>
                  </div>

                  {/* Discount (%) */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="discountPercent"
                      className="text-sm text-slate-700"
                    >
                      Discount (%)
                    </Label>
                    <div className="relative">
                      <Input
                        id="discountPercent"
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        placeholder="0.00"
                        value={wdForm.discountPercent}
                        onChange={(e) =>
                          setWdForm((prev) => ({
                            ...prev,
                            discountPercent: e.target.value,
                          }))
                        }
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="paymentMethod"
                      className="text-sm text-slate-700"
                    >
                      Payment Method
                    </Label>
                    <Select
                      value={
                        Array.isArray(wdForm.paymentMethod)
                          ? (wdForm.paymentMethod as string[])[0] || ""
                          : wdForm.paymentMethod || ""
                      }
                      onValueChange={(v) => {
                        const newValue = v as "cash" | "card";
                        setWdForm((prev) => ({
                          ...prev,
                          paymentMethod: [newValue], // Now typed safely
                          includeDepositInTerminalFee:
                            newValue === "card"
                              ? (prev.includeDepositInTerminalFee ?? true)
                              : false,
                        }));
                      }}
                    >
                      <SelectTrigger className="border-[#E2E8F0] bg-white">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">
                          Card (3.5% terminal fee)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conditional Toggle - Include Deposit in 3.5% Terminal Fee */}
                  {wdForm.paymentMethod?.includes("card") && (
                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-slate-700">
                          Include deposit in 3.5% terminal fee
                        </p>
                        <p className="text-xs text-slate-500">
                          If enabled, the 3.5% fee will be calculated on
                          (subtotal + deposit)
                        </p>
                      </div>
                      <Switch
                        checked={wdForm.includeDepositInTerminalFee ?? true}
                        onCheckedChange={(checked) =>
                          setWdForm((prev) => ({
                            ...prev,
                            includeDepositInTerminalFee: checked,
                          }))
                        }
                      />
                    </div>
                  )}
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
