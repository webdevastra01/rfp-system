"use client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BookOpen,
  Car,
  Shapes,
  Store,
  Landmark,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import ChartOfAccountsDialog from "./ChartOfAccountsDialog";
import TypesDialog from "./TypesDialog";
import UnitsDialog from "./UnitsDialog";
import AssetVehiclesDialog from "./AssetVehiclesDialog";
import SuppliersDialog from "./SuppliersDialog";
import BanksDialog from "./BanksDialog";
import PaymentMethodsDialog from "./PaymentMethodsDialog";
import { useState } from "react";
import { FinanceCardProps, FinanceSettingsProps } from "@/lib/interfaces";

export default function FinanceSettings({
  accounts,
  types,
  units,
  vehicles,
  vendors,
  banks,
  methods,
}: FinanceSettingsProps) {
  const [chartOfAccountsOpen, setChartOfAccountsOpen] = useState(false);
  const [typesOpen, setTypesOpen] = useState(false);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const [vehiclesOpen, setVehiclesOpen] = useState(false);
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [banksOpen, setBanksOpen] = useState(false);
  const [paymentMethodsOpen, setPaymentMethodsOpen] = useState(false);

  const financeCategories: FinanceCardProps[] = [
    {
      title: "Chart of Accounts",
      description:
        "Manage account titles, categories, and financial classifications.",
      icon: BookOpen,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      count: `${accounts.length} accounts`,
      onClick: () => setChartOfAccountsOpen(true),
    },
    {
      title: "Types and Categories",
      description:
        "Manage service categories and purchase types used in transactions.",
      icon: Shapes,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      count: `${types.length} types and or categories`,
      onClick: () => setTypesOpen(true),
    },
    {
      title: "Units",
      description:
        "Manage units of measurement used for products, services, and inventory.",
      icon: Shapes,
      color: "text-sky-600",
      bgColor: "bg-sky-50",
      count: `${units.length} units`,
      onClick: () => setUnitsOpen(true),
    },
    {
      title: "Asset Vehicles",
      description:
        "Track and manage company or partner vehicles registered as assets.",
      icon: Car,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      count: `${vehicles.length} vehicles`,
      onClick: () => setVehiclesOpen(true),
    },
    {
      title: "Suppliers & Vendors",
      description:
        "Manage supplier and vendor records, including contacts and payment terms.",
      icon: Store,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      count: `${vendors.length} vendors and or suppliers`,
      onClick: () => setSuppliersOpen(true),
    },
    {
      title: "Banks & Institutions",
      description:
        "Configure and manage bank accounts and financial institutions.",
      icon: Landmark,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50",
      count: `${banks.length} banks`,
      onClick: () => setBanksOpen(true),
    },
    {
      title: "Payment Methods",
      description:
        "Set up credit cards, digital wallets, and other payment methods.",
      icon: CreditCard,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      count: `${methods.length} methods`,
      onClick: () => setPaymentMethodsOpen(true),
    },
  ];

  const FinanceCard = ({ category }: { category: FinanceCardProps }) => {
    const cardContent = (
      <Card className="h-full border-0 shadow-sm hover:shadow-xl hover:shadow-[#2B3A9F]/10 transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-[#2B3A9F] bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div
              className={`p-3 rounded-xl ${category.bgColor} transition-transform group-hover:scale-110 duration-300`}
            >
              <category.icon className={`h-6 w-6 ${category.color}`} />
            </div>
            <div className="flex items-center gap-2">
              {category.count && (
                <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                  {category.count}
                </span>
              )}
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-[#2B3A9F] group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardTitle className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-[#2B3A9F] transition-colors">
            {category.title}
          </CardTitle>
          <CardDescription className="text-slate-500 leading-relaxed text-sm">
            {category.description}
          </CardDescription>
        </CardContent>
      </Card>
    );

    return (
      <button onClick={category.onClick} className="group text-left w-full">
        {cardContent}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Finance Settings</h1>
        <p className="text-slate-500 max-w-2xl">
          Configure chart of accounts, manage assets, vendors, and financial
          data structures
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500 mb-1">Total Accounts</p>
            <p className="text-2xl font-bold text-[#2B3A9F]">
              {accounts.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500 mb-1">Active Vendors</p>
            <p className="text-2xl font-bold text-emerald-600">
              {vendors.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500 mb-1">Partner Vehicles</p>
            <p className="text-2xl font-bold text-amber-600">
              {vehicles.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <p className="text-sm text-slate-500 mb-1">Bank Accounts</p>
            <p className="text-2xl font-bold text-cyan-600">{banks.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {financeCategories.map((category) => (
          <FinanceCard key={category.title} category={category} />
        ))}
      </div>

      <ChartOfAccountsDialog
        open={chartOfAccountsOpen}
        onOpenChange={setChartOfAccountsOpen}
        accounts={accounts}
      />
      <TypesDialog open={typesOpen} onOpenChange={setTypesOpen} types={types} />
      <UnitsDialog open={unitsOpen} onOpenChange={setUnitsOpen} units={units} />
      <AssetVehiclesDialog
        open={vehiclesOpen}
        onOpenChange={setVehiclesOpen}
        vehicles={vehicles}
      />
      <SuppliersDialog
        open={suppliersOpen}
        onOpenChange={setSuppliersOpen}
        vendors={vendors}
      />
      <BanksDialog open={banksOpen} onOpenChange={setBanksOpen} banks={banks} />
      <PaymentMethodsDialog
        open={paymentMethodsOpen}
        onOpenChange={setPaymentMethodsOpen}
        paymentMethods={methods}
      />
    </div>
  );
}
