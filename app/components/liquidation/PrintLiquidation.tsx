import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LiquidationEntry, LiquidationInterface } from "@/lib/interfaces";

const COMPANY_INFO = {
  name: "ASTRA BUSINESS SOLUTIONS, INC.",
  address: "iHub at Pines Place, Pioneer Drive, Bajada",
  city: "Davao City 8000",
  phone: "+63 (82) 985-571-3768",
  logo: "/astra_logo_small.png",
};

const formatCurrency = (amount: string | number) => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(num || 0);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const PrintLiquidation = ({
  liquidation,
}: {
  liquidation: LiquidationInterface;
}) => {
  const entries = Array.isArray(liquidation.liquidation_entries)
    ? liquidation.liquidation_entries
    : JSON.parse(liquidation.liquidation_entries || "[]");

  return (
    <div className="bg-white text-black w-[210mm] min-h-[297mm] mx-auto p-8 box-border text-sm leading-tight font-serif">
      {/* Header */}
      <header className="border-b-2 border-black pb-4 mb-6 flex justify-between">
        <div className="flex gap-4 items-center">
          {/* Logo */}
          <img
            src={COMPANY_INFO.logo}
            alt="Logo"
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider">
              {COMPANY_INFO.name}
            </h1>
            <p className="text-xs text-gray-600">
              {COMPANY_INFO.address}, {COMPANY_INFO.city}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Liquidation No.
          </p>
          <p className="text-2xl font-bold font-mono">
            {liquidation.liquidation_number}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date().toLocaleDateString()}
          </p>
        </div>
      </header>

      <h2 className="text-center text-2xl font-bold mb-8 tracking-widest">
        LIQUIDATION REPORT
      </h2>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
        <div>
          <p className="font-semibold">Payable To</p>
          <p>{liquidation.payable_to}</p>
          <p className="text-xs text-gray-600 mt-1">{liquidation.department}</p>
        </div>
        <div>
          <p className="font-semibold">RFP Reference</p>
          <p className="font-mono">{liquidation.rfp_number}</p>
        </div>
        <div>
          <p className="font-semibold">Requestor</p>
          <p>{liquidation.requested_by}</p>
        </div>
        <div>
          <p className="font-semibold">Date Created</p>
          <p>{formatDate(liquidation.created_at)}</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="border border-gray-400 p-4 mb-8">
        <h3 className="font-bold mb-3">Financial Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-600">Original Amount</p>
            <p className="font-mono font-semibold">
              {formatCurrency(liquidation.original_amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Liquidated</p>
            <p className="font-mono font-semibold text-emerald-700">
              {formatCurrency(liquidation.total_liquidated)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Remaining Balance</p>
            <p className="font-mono font-semibold">
              {formatCurrency(liquidation.remaining_balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Entries Table */}
      <div className="mb-8">
        <h3 className="font-bold mb-2">Liquidation Entries</h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry: LiquidationEntry, idx: number) => (
              <TableRow key={idx}>
                <TableCell>
                  {new Date(entry.date).toLocaleDateString()}
                </TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell>{entry.supplier || "-"}</TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(entry.amount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer / Approval */}
      {liquidation.approved_by && (
        <div className="mt-12 border-t pt-6 text-center text-sm">
          <p>
            Approved by:{" "}
            <span className="font-semibold">{liquidation.approved_by}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {liquidation.approved_date
              ? formatDate(liquidation.approved_date)
              : ""}
          </p>
        </div>
      )}

      <div className="text-center text-xs text-gray-500 mt-12">
        System Generated • Confidential
      </div>
    </div>
  );
};
