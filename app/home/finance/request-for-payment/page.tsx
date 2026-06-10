import RequestForPayment from "@/app/components/request-for-payment/RequestForPayment";
import { Order } from "@/lib/interfaces";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getServiceOrders(supabase: any): Promise<Order[]> {
  const { data, error } = await supabase
    .from("service_orders")
    .select(
      `
      *,
      service_requests(
        *,
        service_category:types(name),
        company:companies(name),
        department:departments(name),
        vehicle:vehicles(vehicle_id, plate_number, car_type, owners_first_name, owners_last_name),
        payment_method:payment_methods(name),
        requested_by:users(first_name, last_name)
      ),
      order_prepared_by:users(first_name, last_name)
    `,
    )
    .eq("status", "approved")
    .order("order_number", { ascending: true });

  if (error) {
    console.error("Error fetching service orders:", error);
    return [];
  }

  const orders = data || [];

  // Collect all order numbers to check for existing RFPs
  const orderNumbers = orders.map((o: any) => o.order_number).filter(Boolean);

  // Check which orders have RFPs
  let rfpMap: Record<string, boolean> = {};
  if (orderNumbers.length > 0) {
    const { data: rfps, error: rfpError } = await supabase
      .from("requests_for_payment")
      .select("order_number")
      .in("order_number", orderNumbers);

    if (rfpError) {
      console.error("Error checking RFPs:", rfpError);
    } else {
      // Create a map of order_number -> has_rfp
      rfpMap = (rfps || []).reduce((acc: Record<string, boolean>, rfp: any) => {
        acc[rfp.order_number] = true;
        return acc;
      }, {});
    }
  }

  // 1️⃣ Collect all file IDs from service_requests
  const allFileIds = orders
    .flatMap((o: any) => o.service_requests?.supporting_documents || [])
    .filter(Boolean);

  let fileMap: Record<number, any> = {};

  if (allFileIds.length > 0) {
    const { data: files } = await supabase
      .from("files")
      .select("file_id, type, url")
      .in("file_id", allFileIds);

    fileMap = Object.fromEntries((files || []).map((f: any) => [f.file_id, f]));
  }

  // 2️⃣ Flatten results and FILTER OUT orders that already have RFPs
  const flattened: Order[] = orders
    .filter((o: any) => !rfpMap[o.order_number]) // Exclude orders with existing RFPs
    .map((o: any) => {
      const r = o.service_requests;

      return {
        id: o.id,
        order_number: o.order_number,

        title: r?.title || "",
        description: r?.description || "",

        service_category: r?.service_category?.name || "",
        priority_level: r?.priority_level || "",

        company: r?.company?.name || "",
        department: r?.department?.name || "",

        preferred_date: r?.preferred_date || "",
        expected_completion: r?.expected_completion || "",

        preferred_vendor: r?.preferred_vendor || "",
        contact_person: r?.contact_person || "",

        required_by: r?.required_by || "",

        payment_method: r?.payment_method?.name || "",

        status: o.status,

        vehicle: r?.vehicle || null,

        requested_by: r?.requested_by
          ? `${r.requested_by.first_name} ${r.requested_by.last_name}`
          : "",

        order_prepared_by: o.order_prepared_by
          ? `${o.order_prepared_by.first_name} ${o.order_prepared_by.last_name}`
          : "",

        // Check if RFP exists for this order
        has_rfp: false, // Always false since we filtered these out

        // convert file IDs → URLs
        supporting_documents: (r?.supporting_documents || [])
          .map((id: number) => fileMap[id]?.url)
          .filter(Boolean),

        // normalize items
        items: (r?.items || []).map((i: any) => ({
          name: i.name,
          description: i.description,
          unit: i.unit,
          quantity: String(i.quantity),
          unitPrice: String(i.unitPrice),
        })),

        journal_entries: o.journal_entries || [],
      };
    });

  return flattened;
}

async function getPurchaseOrders(supabase: any): Promise<Order[]> {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(
      `
      *,
      purchase_requests(
        *,
        purchase_category:types(name),
        company:companies(name),
        department:departments(name),
        vehicle:vehicles(vehicle_id, plate_number, car_type, owners_first_name, owners_last_name),
        payment_method:payment_methods(name),
        requested_by:users(first_name, last_name)
      ),
      order_prepared_by:users(first_name, last_name)
    `,
    )
    .eq("status", "approved")
    .order("order_number", { ascending: true });

  if (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }

  const orders = data || [];

  // Collect all order numbers to check for existing RFPs
  const orderNumbers = orders.map((o: any) => o.order_number).filter(Boolean);

  // Check which orders have RFPs
  let rfpMap: Record<string, boolean> = {};
  if (orderNumbers.length > 0) {
    const { data: rfps, error: rfpError } = await supabase
      .from("requests_for_payment")
      .select("order_number")
      .in("order_number", orderNumbers);

    if (rfpError) {
      console.error("Error checking RFPs:", rfpError);
    } else {
      // Create a map of order_number -> has_rfp
      rfpMap = (rfps || []).reduce((acc: Record<string, boolean>, rfp: any) => {
        acc[rfp.order_number] = true;
        return acc;
      }, {});
    }
  }

  // 1️⃣ Collect all file IDs from purchase_requests
  const allFileIds = orders
    .flatMap((o: any) => o.purchase_requests?.supporting_documents || [])
    .filter(Boolean);

  let fileMap: Record<number, any> = {};

  if (allFileIds.length > 0) {
    const { data: files } = await supabase
      .from("files")
      .select("file_id, type, url")
      .in("file_id", allFileIds);

    fileMap = Object.fromEntries((files || []).map((f: any) => [f.file_id, f]));
  }

  // 2️⃣ Flatten results and FILTER OUT orders that already have RFPs
  const flattened: Order[] = orders
    .filter((o: any) => !rfpMap[o.order_number]) // Exclude orders with existing RFPs
    .map((o: any) => {
      const r = o.purchase_requests;

      return {
        id: o.id,
        order_number: o.order_number,

        title: r?.title || "",
        description: r?.description || "",

        service_category: r?.purchase_category?.name || "",
        priority_level: r?.priority_level || "",

        company: r?.company?.name || "",
        department: r?.department?.name || "",

        preferred_date: r?.preferred_date || "",
        expected_completion: r?.expected_completion || "",

        preferred_vendor: r?.preferred_vendor || "",
        contact_person: r?.contact_person || "",

        required_by: r?.required_by || "",

        payment_method: r?.payment_method?.name || "",

        status: o.status,

        vehicle: r?.vehicle || null,

        requested_by: r?.requested_by
          ? `${r.requested_by.first_name} ${r.requested_by.last_name}`
          : "",

        order_prepared_by: o.order_prepared_by
          ? `${o.order_prepared_by.first_name} ${o.order_prepared_by.last_name}`
          : "",

        // Check if RFP exists for this order
        has_rfp: false, // Always false since we filtered these out

        // convert file IDs → URLs
        supporting_documents: (r?.supporting_documents || [])
          .map((id: number) => fileMap[id]?.url)
          .filter(Boolean),

        // normalize items
        items: (r?.items || []).map((i: any) => ({
          name: i.name,
          description: i.description,
          unit: i.unit,
          quantity: String(i.quantity),
          unitPrice: String(i.unitPrice),
        })),

        journal_entries: o.journal_entries || [],
      };
    });

  return flattened;
}

async function getOrders(supabase: any): Promise<Order[]> {
  const [serviceOrders, purchaseOrders] = await Promise.all([
    getServiceOrders(supabase),
    getPurchaseOrders(supabase),
  ]);

  const merged = [...serviceOrders, ...purchaseOrders];

  // optional sorting
  merged.sort((a, b) => Number(a.order_number) - Number(b.order_number));

  return merged;
}

// async function getRPFs(supabase: any) {
//   const { data, error } = await supabase
//     .from("requests_for_payment")
//     .select("*")
//     .order("rfp_number", { ascending: true });
//   if (error) {
//     console.error("Error fetching RFPs:", error);
//     return [];
//   }
//   return data || [];
// }

async function approveRFP(id: string) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const approver = user?.user_metadata?.full_name;

  const { error } = await supabase
    .from("requests_for_payment")
    .update({
      status: "approved",
      approved_by: approver,
      approved_date: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error approving RFP:", error);
    throw new Error("Failed to approve RFP");
  }

  revalidatePath("/request-for-payment");
}

async function rejectRFP(id: string) {
  "use server";

  const supabase = await createClient();

  const { error } = await supabase
    .from("requests_for_payment")
    .update({
      status: "rejected",
    })
    .eq("id", id);

  if (error) {
    console.error("Error rejecting RFP:", error);
    throw new Error("Failed to reject RFP");
  }

  revalidatePath("/request-for-payment");
}

export async function getRFPsWithOrderDetails(supabase: any) {
  // 1. Fetch RFPs
  const { data: rfps, error: rfpError } = await supabase
    .from("requests_for_payment")
    .select("*");

  if (rfpError) throw rfpError;
  if (!rfps?.length) return [];

  const orderNumbers = rfps.map((r: any) => r.order_number);

  // 2. Fetch matching Service Orders
  const { data: serviceOrders, error: serviceError } = await supabase
    .from("service_orders")
    .select(
      `
      order_number,
      service_request:service_request_id (
        id,
        description,
        vehicle:vehicles (
          plate_number,
          car_type,
          owners_first_name,
          owners_last_name
        )
      )
    `,
    )
    .in("order_number", orderNumbers);

  if (serviceError) throw serviceError;

  // 3. Fetch matching Purchase Orders
  const { data: purchaseOrders, error: purchaseError } = await supabase
    .from("purchase_orders")
    .select(
      `
      order_number,
      purchase_request:purchase_request_id (
        id,
        description,
        vehicle:vehicles (
          plate_number,
          car_type,
          owners_first_name,
          owners_last_name
        )
      )
    `,
    )
    .in("order_number", orderNumbers);

  if (purchaseError) throw purchaseError;

  // 4. Create lookup maps
  const serviceMap = new Map(
    (serviceOrders ?? []).map((order: any) => [order.order_number, order]),
  );

  const purchaseMap = new Map(
    (purchaseOrders ?? []).map((order: any) => [order.order_number, order]),
  );

  // 5. Merge everything together
  return rfps.map((rfp: any) => {
    const serviceOrder = serviceMap.get(rfp.order_number) as any;
    const purchaseOrder = purchaseMap.get(rfp.order_number) as any;

    if (serviceOrder) {
      return {
        ...rfp,
        order_type: "service",
        description: serviceOrder.service_request?.description ?? null,
        vehicle: serviceOrder.service_request?.vehicle ?? null,
      };
    }

    if (purchaseOrder) {
      return {
        ...rfp,
        order_type: "purchase",
        description: purchaseOrder.purchase_request?.description ?? null,
        vehicle: purchaseOrder.purchase_request?.vehicle ?? null,
      };
    }

    return {
      ...rfp,
      order_type: null,
      description: null,
      vehicle: null,
    };
  });
}

export default async function RequestForPaymentPage() {
  const supabase = await createClient();

  const orders = await getOrders(supabase);
  //const rfps = await getRPFs(supabase);

  const rfpExportData = await getRFPsWithOrderDetails(supabase);

  console.log(rfpExportData);

  return (
    <div>
      <RequestForPayment
        orders={orders}
        rfps={rfpExportData}
        rfpExportData={rfpExportData}
        onApprove={approveRFP}
        onReject={rejectRFP}
        module="finance"
      />
    </div>
  );
}
