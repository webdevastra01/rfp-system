import { Item, Request } from "@/lib/interfaces";
import {
  CreditCard,
  MapPin,
  Package,
  Phone,
  TableIcon,
  Car,
} from "lucide-react";
import Image from "next/image";

const COMPANY_INFO = {
  name: "Astra Business Solutions",
  tagline: "Innovative Business Solutions",
  address: "iHub at Pines Place, Pioneer Dr, Bajada",
  city: "Davao City",
  country: "Philippines",
  postalCode: "8000",
  phone: "+63 985-571-3768",
  email: "info@technova-solutions.com",
  logo: "/astra_logo_small.png", // Replace with your actual logo path
};

// Printable Content Component
export const PrintPurchaseOrder = ({
  request,
  formatCurrency,
  purchaseOrderNumber,
}: {
  request: Request;
  formatCurrency: (value: string | number | undefined | null) => string;
  purchaseOrderNumber: string;
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  // Check if vehicle details exist
  const hasVehicleDetails =
    request.vehicle?.plate_number?.trim() ||
    request.vehicle?.car_type?.trim() ||
    request.vehicle?.owners_first_name?.trim() ||
    request.vehicle?.owners_last_name?.trim();

  const ownerFullName = [
    request.vehicle?.owners_first_name,
    request.vehicle?.owners_last_name,
  ]
    .filter(Boolean)
    .join(" ");

  const calculateTotal = (items: Item[]): number => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  return (
    <div className="print-content bg-white text-black min-h-[277mm] w-[210mm] mx-auto p-[15mm] box-border text-[12px] leading-normal flex flex-col">
      {/* HEADER */}
      <div className="border-b-2 border-blue-900 pb-3 mb-4 flex justify-between items-start">
        <div className="flex gap-3 items-center">
          <Image
            src="/astra_logo_small.png"
            alt="Logo"
            width={48}
            height={48}
            priority
            className="rounded"
          />
          <div>
            <h1 className="text-lg font-bold text-blue-900 uppercase tracking-wide">
              {COMPANY_INFO.name}
            </h1>
            <p className="text-[10px] text-gray-600 italic">
              {COMPANY_INFO.tagline}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-[10px] text-gray-600">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {COMPANY_INFO.address}, {COMPANY_INFO.city}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {COMPANY_INFO.phone}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border-2 border-blue-900 rounded-lg px-4 py-2 text-center min-w-35">
          <p className="text-[10px] text-gray-600 uppercase font-bold">
            Purchase Order
          </p>
          <p className="text-lg font-bold text-blue-900">
            {purchaseOrderNumber}
          </p>
          <p className="text-[10px] text-gray-500">{today}</p>
        </div>
      </div>

      {/* TITLE & STATUS */}
      <div className="text-center mb-5">
        <h2 className="text-xl font-bold text-gray-900 uppercase tracking-widest inline-block px-8 pb-1">
          Official Purchase Order
        </h2>
      </div>

      {/* Purchase INFO */}
      <div className="mb-5">
        <h3 className="text-sm font-bold text-blue-900 uppercase border-b-2 border-blue-200 mb-2 pb-1 flex items-center gap-2">
          <Package className="h-4 w-4" />
          Purchase Details
        </h3>
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <h4 className="text-base font-bold text-gray-900 mb-1">
            {request.title}
          </h4>
          <p className="text-gray-700 text-sm mb-3">{request.description}</p>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div className="flex">
              <span className="font-semibold text-gray-600 w-28">
                Purchase Type:
              </span>
              <span>{request.service_category}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-600 w-28">
                Department:
              </span>
              <span>{request.department}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-600 w-28">
                Date Submitted:
              </span>
              <span>{formatDate(request.prepared_at || "")}</span>
            </div>
            <div className="flex">
              <span className="font-semibold text-gray-600 w-28">
                Required By:
              </span>
              <span className="text-red-700 font-semibold">
                {formatDate(request.requested_by)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* VEHICLE DETAILS - Conditional Section */}
      {hasVehicleDetails && (
        <div className="mb-5">
          <h3 className="text-sm font-bold text-blue-900 uppercase border-b-2 border-blue-200 mb-2 pb-1 flex items-center gap-2">
            <Car className="h-4 w-4" />
            Vehicle Details
          </h3>
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {request.vehicle.plate_number?.trim() && (
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-28">
                    Plate Number:
                  </span>
                  <span className="font-mono font-medium">
                    {request.vehicle.plate_number}
                  </span>
                </div>
              )}
              {request.vehicle.car_type?.trim() && (
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-28">
                    Vehicle Type:
                  </span>
                  <span>{request.vehicle.car_type}</span>
                </div>
              )}
              {ownerFullName && (
                <div className="flex">
                  <span className="font-semibold text-gray-600 w-28">
                    Owner:
                  </span>
                  <span>{ownerFullName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ITEMS TABLE */}
      <div className="mb-5">
        <h3 className="text-sm font-bold text-blue-900 uppercase border-b-2 border-blue-200 mb-2 pb-1 flex items-center gap-2">
          <TableIcon className="h-4 w-4" />
          Line Items ({request.items.length} items)
        </h3>
        <table className="w-full border-collapse border-2 border-gray-400">
          <thead>
            <tr className="bg-blue-50">
              <th className="border-2 border-gray-400 px-2 py-2 text-center font-bold text-gray-800 w-10">
                #
              </th>
              <th className="border-2 border-gray-400 px-2 py-2 text-left font-bold text-gray-800">
                Item Description
              </th>
              <th className="border-2 border-gray-400 px-2 py-2 text-center font-bold text-gray-800 w-16">
                Qty
              </th>
              <th className="border-2 border-gray-400 px-2 py-2 text-right font-bold text-gray-800 w-24">
                Unit Price
              </th>
              <th className="border-2 border-gray-400 px-2 py-2 text-right font-bold text-gray-800 w-24">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {request.items.map((item, index) => {
              const qty = parseFloat(item.quantity) || 0;
              const price =
                parseFloat(item.unitPrice.replace(/[$,]/g, "")) || 0;
              const total = qty * price;
              return (
                <tr key={index} className="bg-white">
                  <td className="border-2 border-gray-400 px-2 py-2 text-center font-medium">
                    {index + 1}
                  </td>
                  <td className="border-2 border-gray-400 px-2 py-2">
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </td>
                  <td className="border-2 border-gray-400 px-2 py-2 text-center">
                    {item.quantity}{" "}
                    <span className="text-xs uppercase">{item.unit}</span>
                  </td>
                  <td className="border-2 border-gray-400 px-2 py-2 text-right font-mono">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="border-2 border-gray-400 px-2 py-2 text-right font-mono font-bold">
                    {formatCurrency(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex justify-end mt-3">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-4 py-2 min-w-50">
            <div className="flex justify-between items-center">
              <span className="font-bold text-blue-900">TOTAL AMOUNT:</span>
              <span className="font-mono font-bold text-lg text-blue-900">
                {formatCurrency(calculateTotal(request.items))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PARTIES - Side by Side */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="border-2 border-gray-300 rounded-lg p-3">
          <h4 className="font-bold text-blue-900 text-xs uppercase border-b border-gray-200 mb-2 pb-1">
            Requestor / Client
          </h4>
          <p className="font-bold text-base text-gray-900">
            {request.requested_by}
          </p>
          <p className="text-xs text-gray-600">
            {request.department} Department
          </p>
          <p className="text-xs text-gray-600">{request.company}</p>
          <div className="mt-3 pt-2 border-t border-gray-200">
            <p className="text-[10px] text-gray-500 uppercase font-semibold">
              Authorized Signature
            </p>
            <div className="h-10 border-b-2 border-gray-400 mt-1"></div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-500">
                Date: ___________
              </span>
            </div>
          </div>
        </div>

        <div className="border-2 border-gray-300 rounded-lg p-3">
          <h4 className="font-bold text-blue-900 text-xs uppercase border-b border-gray-200 mb-2 pb-1">
            Supplier
          </h4>
          <p className="font-bold text-base text-gray-900">
            {request.preferred_vendor}
          </p>
          <p className="text-xs text-gray-600">
            Contact: {request.contact_person}
          </p>
          <p className="text-xs text-gray-600 flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            {request.payment_method}
          </p>
          <div className="mt-3 pt-2 border-t border-gray-200">
            <p className="text-[10px] text-gray-500 uppercase font-semibold">
              Vendor Acknowledgment
            </p>
            <div className="h-10 border-b-2 border-gray-400 mt-1"></div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-500">
                Date: ___________
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TERMS & CONDITIONS */}
      <div className="mb-5">
        <h3 className="text-xs font-bold text-gray-700 uppercase border-b border-gray-300 mb-2 pb-1">
          Terms & Conditions
        </h3>
        <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
          <li>Goods must be delivered by the required date specified above.</li>
          <li>All goods shall meet specifications and quality standards.</li>
          <li>
            Invoices must reference this Purchase Order number for payment
            processing.
          </li>
          <li>
            Any changes to scope must be approved in writing by the authorized
            requestor.
          </li>
          <li>
            {COMPANY_INFO.name} reserves the right to inspect all work before
            final payment.
          </li>
        </ol>
      </div>

      {/* SPACER - Pushes footer to bottom when content is short */}
      <div className="grow"></div>

      {/* FOOTER */}
      <div className="pt-3 border-t-2 border-blue-900">
        <div className="flex justify-between items-center text-[10px] text-gray-500">
          <div>
            <p className="font-semibold text-blue-900">{COMPANY_INFO.name}</p>
          </div>
          <div className="text-center">
            <p>This is an official document. Please retain for your records.</p>
            <p>Generated on {today} | Page 1 of 1</p>
          </div>
          <div className="text-right">
            <p>Questions? Contact Finance</p>
            <p>{COMPANY_INFO.phone}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
