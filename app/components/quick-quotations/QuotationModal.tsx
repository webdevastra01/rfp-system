import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QuotationResult } from "@/lib/interfaces";
import { Check, Copy, Download, FileText, Printer, Save } from "lucide-react";

const formatCurrency = (value: number): string => {
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function QuotationModal({
  open,
  onOpenChange,
  result,
  onSave,
  isSaving = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: QuotationResult | null;
  onSave?: () => void;
  isSaving?: boolean;
}) {
  if (!result) return null;

  const regularItems = result.lineItems.filter(
    (li) => !li.isTotal && !li.isHighlight && !li.isSubtotal,
  );

  const subtotalItem = result.lineItems.find((li) => li.isSubtotal);

  const totalItems = result.lineItems.filter(
    (li) => li.isTotal || li.isHighlight,
  );

  const depositItems = regularItems.filter((item) =>
    item.label.toLowerCase().includes("deposit"),
  );

  // Get the final overall total (usually the last highlight item)
  const overallTotal =
    totalItems.find(
      (item) =>
        item.label.toLowerCase().includes("overall") || item.isHighlight,
    ) || totalItems[totalItems.length - 1];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl w-full h-[90vh] overflow-hidden bg-white p-0 flex flex-col">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 border-b bg-white px-8 py-5">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-slate-900">
                <FileText className="h-6 w-6 text-[#2B3A9F]" />
                Quotation Breakdown
              </DialogTitle>

              <Badge
                variant="outline"
                className="bg-[#EEF2FF] text-[#2B3A9F] border-[#2B3A9F]/30 px-3 py-1"
              >
                {result.mode === "with-driver"
                  ? "With Driver"
                  : "Without Driver"}
              </Badge>
            </div>

            <DialogDescription className="text-slate-500 mt-1">
              Generated on{" "}
              {new Date().toLocaleDateString("en-PH", { dateStyle: "long" })} at{" "}
              {new Date().toLocaleTimeString("en-PH", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-8">
          {/* Operational Summary */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
              Operational Summary
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-5">
              {result.operationalDetails.map((detail, idx) => (
                <div key={idx}>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400">
                    {detail.label}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 mt-1">
                    {detail.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-slate-200"></div>
              <p className="text-sm font-semibold text-slate-800 tracking-wide uppercase">
                Cost Breakdown
              </p>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT COLUMN */}
              <div className="space-y-8">
                {/* Main Charges */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                    Main Charges
                  </p>
                  <div className="rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full">
                      <tbody className="divide-y divide-slate-100">
                        {regularItems
                          .filter((item) => !item.isDeduction)
                          .map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="w-5 flex-shrink-0 text-lg text-slate-400">
                                    {item.icon}
                                  </span>
                                  <span className="text-sm text-slate-700">
                                    {item.label}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-sm text-slate-900">
                                {formatCurrency(item.value)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subtotal */}
                {subtotalItem && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-slate-900">
                        {subtotalItem.label}
                      </span>
                      <span className="text-xl font-bold text-slate-900 font-mono">
                        {formatCurrency(subtotalItem.value)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-8">
                {/* Deposit */}
                {depositItems.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                      Deposit
                    </p>
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full">
                        <tbody className="divide-y divide-slate-100">
                          {regularItems
                            .filter(
                              (item) =>
                                item.label.toLowerCase() === "deposit (20%)",
                            )
                            .map((item, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-400 text-lg flex-shrink-0 w-5">
                                      {item.icon}
                                    </span>
                                    <span className="text-sm text-slate-700">
                                      {item.label}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-right font-mono text-sm text-slate-900">
                                  {formatCurrency(item.value)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Fees */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                    Fees
                  </p>
                  <div className="rounded-2xl border border-slate-100 overflow-hidden">
                    <table className="w-full">
                      <tbody className="divide-y divide-slate-100">
                        {regularItems
                          .filter((item) => {
                            const lbl = item.label.toLowerCase();
                            return (
                              lbl.includes("fee") ||
                              lbl.includes("prepaid") ||
                              lbl.includes("terminal") ||
                              lbl.includes("reservation")
                            );
                          })
                          .map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-slate-400 text-lg flex-shrink-0 w-5">
                                    {item.icon}
                                  </span>
                                  <span className="text-sm text-slate-700">
                                    {item.label}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-sm text-slate-900">
                                {formatCurrency(item.value)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Deductions */}
                {regularItems.some((item) => item.isDeduction) && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
                      Deductions
                    </p>
                    <div className="rounded-2xl border border-slate-100 overflow-hidden">
                      <table className="w-full">
                        <tbody className="divide-y divide-slate-100">
                          {regularItems
                            .filter((item) => item.isDeduction)
                            .map((item, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-400 text-lg flex-shrink-0 w-5">
                                      {item.icon}
                                    </span>
                                    <span className="text-sm text-slate-600">
                                      {item.label}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-3 text-right font-mono text-sm text-rose-600">
                                  −{formatCurrency(Math.abs(item.value))}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Overall Total - Full Width & Prominent */}
                    {overallTotal && (
                      <div className="mt-10">
                        <div className="rounded-3xl bg-[#EEF2FF] border-2 border-[#2B3A9F]/30 px-8 py-8 text-center">
                          <p className="text-[#2B3A9F] font-medium text-sm tracking-widest uppercase">
                            {overallTotal.label}
                          </p>
                          <p className="text-4xl font-bold text-[#2B3A9F] font-mono tracking-tighter mt-2">
                            {formatCurrency(overallTotal.value)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="border-t px-8 py-5 bg-white">
          <div className="flex flex-wrap gap-3 w-full">
            <Button variant="outline" className="gap-2" size="sm">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" className="gap-2" size="sm">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="gap-2" size="sm">
              <Copy className="h-4 w-4" />
              Copy
            </Button>

            {/* SAVE BUTTON */}
            {onSave && (
              <Button
                onClick={onSave}
                disabled={isSaving}
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 ml-auto"
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Quotation"}
              </Button>
            )}

            <Button
              size="sm"
              className="gap-2 bg-[#2B3A9F] hover:bg-[#1e2870]"
              onClick={() => onOpenChange(false)}
            >
              <Check className="h-4 w-4" />
              Confirm & Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
