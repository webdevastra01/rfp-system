import ReviewOrder from "@/app/components/review-orders/ReviewOrder";
import { Order } from "@/lib/interfaces";
import { createClient } from "@/lib/supabase/server";

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
    .order("order_number", { ascending: true });

  if (error) {
    console.error("Error fetching service orders:", error);
    return [];
  }

  const orders = data || [];

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

  // 2️⃣ Flatten results
  const flattened: Order[] = orders.map((o: any) => {
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
    .order("order_number", { ascending: true });

  if (error) {
    console.error("Error fetching purchase orders:", error);
    return [];
  }

  const orders = data || [];

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

async function getUnits(supabase: any) {
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

export default async function ReviewOrdersPage() {
  const supabase = await createClient();

  const orders = await getOrders(supabase);
  const units = await getUnits(supabase);

  return (
    <div>
      <ReviewOrder orders={orders} units={units} />
    </div>
  );
}
