import ReviewRequest from "@/app/components/review-requests/ReviewRequest";
import { Request } from "@/lib/interfaces";
import { createClient } from "@/lib/supabase/server";

async function getServiceRequests(supabase: any): Promise<Request[]> {
  const { data, error } = await supabase
    .from("service_requests")
    .select(
      `
      *,
      service_category:types(name),
      company:companies(name),
      department:departments(name),
      vehicle:vehicles(vehicle_id, plate_number, car_type, owners_first_name, owners_last_name),
      payment_method:payment_methods(name),
      requested_by:users(first_name, last_name)
    `,
    )
    .order("request_number", { ascending: true });

  if (error) {
    console.error("Error fetching requests:", error);
    return [];
  }

  const requests = data || [];

  // 1️⃣ Collect all file IDs
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

  // 2️⃣ Transform into your Request interface
  const flattened: Request[] = requests.map((r: any) => ({
    id: r.id,
    request_number: r.request_number,
    title: r.title,
    description: r.description,

    service_category: r.service_category?.name || "",
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
    rejection_reason: r.rejection_reason || "",

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

    // full name
    requested_by: r.requested_by
      ? `${r.requested_by.first_name} ${r.requested_by.last_name}`
      : "",
  }));

  return flattened;
}

async function getPurchaseRequests(supabase: any): Promise<Request[]> {
  const { data, error } = await supabase
    .from("purchase_requests")
    .select(
      `
      *,
      purchase_category:types(name),
      company:companies(name),
      department:departments(name),
      vehicle:vehicles(vehicle_id, plate_number, car_type, owners_first_name, owners_last_name),
      payment_method:payment_methods(name),
      requested_by:users(first_name, last_name)
    `,
    )
    .order("request_number", { ascending: true });

  if (error) {
    console.error("Error fetching requests:", error);
    return [];
  }

  const requests = data || [];

  // 1️⃣ Collect all file IDs
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

  // 2️⃣ Transform into your Request interface
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
    rejection_reason: r.rejection_reason || "",

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

    // full name
    requested_by: r.requested_by
      ? `${r.requested_by.first_name} ${r.requested_by.last_name}`
      : "",
  }));

  return flattened;
}

async function getAllRequests(supabase: any): Promise<Request[]> {
  const [serviceRequests, purchaseRequests] = await Promise.all([
    getServiceRequests(supabase),
    getPurchaseRequests(supabase),
  ]);

  const merged = [...serviceRequests, ...purchaseRequests];

  // optional sorting
  merged.sort((a, b) => Number(a.request_number) - Number(b.request_number));

  return merged;
}

export default async function ReviewRequestsPage() {
  const supabase = await createClient();

  const requests = await getAllRequests(supabase);

  return (
    <div>
      <ReviewRequest requests={requests} />
    </div>
  );
}
