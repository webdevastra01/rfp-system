import PurchaseOrder from "@/app/components/purchase-orders/PurchaseOrder";
import { Order, Request } from "@/lib/interfaces";
import { createClient } from "@/lib/supabase/server";

async function getApprovedRequests(supabase: any): Promise<Request[]> {
  // 1️⃣ Get all request IDs that already have service orders
  const { data: existingOrders, error: orderError } = await supabase
    .from("purchase_orders")
    .select("purchase_request_id");

  if (orderError) {
    console.error("Error fetching service orders:", orderError);
    return [];
  }

  const orderedRequestIds =
    existingOrders?.map((o: any) => o.purchase_request_id).filter(Boolean) ??
    [];

  // 2️⃣ Build query for approved requests
  let query = supabase
    .from("purchase_requests")
    .select(
      `
      *,
      purchase_category:types(name),
      company:companies(name),
      department:departments(name),
      vehicle:vehicles(vehicle_id, plate_number, car_type, owners_first_name, owners_last_name),
      payment_method:payment_methods(name)
    `,
    )
    .eq("status", "approved");

  // Exclude requests that already have service orders
  if (orderedRequestIds.length > 0) {
    query = query.not("id", "in", `(${orderedRequestIds.join(",")})`);
  }

  const { data, error } = await query.order("request_number", {
    ascending: true,
  });

  if (error) {
    console.error("Error fetching requests:", error);
    return [];
  }

  const requests = data || [];

  // 3️⃣ Collect all file IDs
  const allFileIds = requests
    .flatMap((r: any) => r.supporting_documents || [])
    .filter(Boolean);

  let fileMap: Record<number, any> = {};

  if (allFileIds.length > 0) {
    const { data: files } = await supabase
      .from("files")
      .select("file_id, type, url")
      .in("file_id", allFileIds);

    fileMap = Object.fromEntries((files || []).map((f: any) => [f.file_id, f]));
  }

  // 4️⃣ Transform into your Request interface
  const flattened: Request[] = requests.map((r: any) => ({
    id: r.id,
    request_number: r.request_number,
    title: r.title,
    description: r.description,

    service_category: r.purchase_category?.name || "",
    priority_level: r.priority_level,

    company: r.company?.name || "",
    department: r.department?.name || "",

    preferred_date: r.preferred_date,
    expected_completion: r.expected_completion,

    preferred_vendor: r.preferred_vendor,
    contact_person: r.contact_person,

    required_by: r.required_by,

    payment_method: r.payment_method?.name || "",

    status: r.status,

    vehicle: r.vehicle || null,

    // convert file IDs → URLs
    supporting_documents: (r.supporting_documents || [])
      .map((id: number) => fileMap[id]?.url)
      .filter(Boolean),

    // normalize items
    items: (r.items || []).map((i: any) => ({
      name: i.name,
      description: i.description,
      unit: i.unit,
      quantity: String(i.quantity),
      unitPrice: String(i.unitPrice),
    })),
  }));

  return flattened;
}

async function getOrders(supabase: any): Promise<Order[]> {
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
    .order("order_number", { ascending: true });

  if (error) {
    console.error("Error fetching service orders:", error);
    return [];
  }

  const orders = data || [];

  // 1️⃣ Collect all file IDs from service_requests
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

  // 2️⃣ Flatten results
  const flattened: Order[] = orders.map((o: any) => {
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

      preferred_date: r?.preferred_date || null,
      expected_completion: r?.expected_completion || null,

      preferred_vendor: r?.preferred_vendor || "",
      contact_person: r?.contact_person || "",

      required_by: r?.required_by || null,

      payment_method: r?.payment_method?.name || "",

      status: o.status,
      rejection_reason: o.rejection_reason || "",

      vehicle: r?.vehicle || null,

      requested_by: r?.requested_by
        ? `${r.requested_by.first_name} ${r.requested_by.last_name}`
        : "",

      order_prepared_by: o.order_prepared_by
        ? `${o.order_prepared_by.first_name} ${o.order_prepared_by.last_name}`
        : "",

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

async function getunits(supabase: any) {
  const { data, error } = await supabase
    .from("units")
    .select("unit_id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching units:", error);
    return [];
  }

  return data || [];
}

export default async function PurchaseOrderPage() {
  const supabase = await createClient();

  const requests = await getApprovedRequests(supabase);
  const orders = await getOrders(supabase);
  const units = await getunits(supabase);

  return (
    <div>
      <PurchaseOrder requests={requests} orders={orders} units={units} />
    </div>
  );
}
