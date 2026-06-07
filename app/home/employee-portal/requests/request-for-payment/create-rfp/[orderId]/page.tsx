import CreateRequestForPayment from "@/app/components/request-for-payment/CreateRequestForPayment";
import { ChargeToOptions, Order } from "@/lib/interfaces";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ orderId: string }>;
}

async function getServiceOrder(
  supabase: any,
  id: string,
): Promise<Order | null> {
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
        requested_by:users(first_name, last_name),
        order_prepared_by:users(first_name, last_name)
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching service order:", error);
    return null;
  }

  if (!data || !data.service_requests) return null;

  const sr = data.service_requests;

  // Fetch supporting documents
  const fileIds: number[] = (sr.supporting_documents || []).filter(Boolean);
  let fileMap: Record<number, any> = {};

  if (fileIds.length) {
    const { data: files, error: fileError } = await supabase
      .from("files")
      .select("file_id, type, url")
      .in("file_id", fileIds);

    if (fileError) {
      console.error("Error loading files:", fileError);
    }

    fileMap = Object.fromEntries(
      (files || []).map((file: any) => [file.file_id, file]),
    );
  }

  return {
    id: data.id,
    order_number: data.order_number,

    title: sr.title,
    description: sr.description,

    service_category: sr.service_category?.name ?? "",
    priority_level: sr.priority_level,

    company: sr.company?.name ?? "",
    department: sr.department?.name ?? "",

    preferred_date: sr.preferred_date,
    expected_completion: sr.expected_completion,
    preferred_vendor: sr.preferred_vendor,
    contact_person: sr.contact_person,
    required_by: sr.required_by,

    payment_method: sr.payment_method?.name ?? "",

    status: data.status,

    vehicle: sr.vehicle ?? null,

    supporting_documents: fileIds
      .map((fileId) => fileMap[fileId]?.url)
      .filter(Boolean),

    items: (sr.items || []).map((item: any) => ({
      name: item.name,
      description: item.description,
      unit: item.unit,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
    })),

    requested_by: sr.requested_by
      ? `${sr.requested_by.first_name} ${sr.requested_by.last_name}`
      : "",

    order_prepared_by: sr.order_prepared_by
      ? `${sr.order_prepared_by.first_name} ${sr.order_prepared_by.last_name}`
      : "",
  };
}

async function getPurchaseOrder(
  supabase: any,
  id: string,
): Promise<Order | null> {
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
        requested_by:users(first_name, last_name),
        order_prepared_by:users(first_name, last_name)
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching purchase order:", error);
    return null;
  }

  if (!data || !data.purchase_requests) return null;

  const pr = data.purchase_requests;

  // Supporting documents
  const fileIds: number[] = (pr.supporting_documents || []).filter(Boolean);
  let fileMap: Record<number, any> = {};

  if (fileIds.length) {
    const { data: files, error: fileError } = await supabase
      .from("files")
      .select("file_id, type, url")
      .in("file_id", fileIds);

    if (fileError) {
      console.error("Error loading files:", fileError);
    }

    fileMap = Object.fromEntries(
      (files || []).map((file: any) => [file.file_id, file]),
    );
  }

  return {
    id: data.id,
    order_number: data.order_number,

    title: pr.title,
    description: pr.description,

    service_category: pr.purchase_category?.name ?? "",
    priority_level: pr.priority_level,

    company: pr.company?.name ?? "",
    department: pr.department?.name ?? "",

    preferred_date: pr.preferred_date,
    expected_completion: pr.expected_completion,
    preferred_vendor: pr.preferred_vendor,
    contact_person: pr.contact_person,
    required_by: pr.required_by,

    payment_method: pr.payment_method?.name ?? "",

    status: data.status,

    vehicle: pr.vehicle ?? null,

    supporting_documents: fileIds
      .map((fileId) => fileMap[fileId]?.url)
      .filter(Boolean),

    items: (pr.items || []).map((item: any) => ({
      name: item.name,
      description: item.description,
      unit: item.unit,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
    })),

    requested_by: pr.requested_by
      ? `${pr.requested_by.first_name} ${pr.requested_by.last_name}`
      : "",

    order_prepared_by: pr.order_prepared_by
      ? `${pr.order_prepared_by.first_name} ${pr.order_prepared_by.last_name}`
      : "",
  };
}

async function getOrder(supabase: any, id: string): Promise<Order | null> {
  try {
    const serviceOrder = await getServiceOrder(supabase, id);
    if (serviceOrder) return serviceOrder;

    const purchaseOrder = await getPurchaseOrder(supabase, id);
    if (purchaseOrder) return purchaseOrder;

    return null;
  } catch (err) {
    console.error("Error fetching order:", err);
    return null;
  }
}

async function getChargeToOptions(supabase: any): Promise<ChargeToOptions[]> {
  const { data: companiesData, error: companiesError } = await supabase
    .from("companies")
    .select("name")
    .order("name", { ascending: true });

  if (companiesError) {
    console.error("Error fetching companies:", companiesError);
  }

  const { data: ownersData, error: ownersError } = await supabase
    .from("vehicles")
    .select("owners_first_name, owners_last_name")
    .order("owners_first_name", { ascending: true });

  if (ownersError) {
    console.error("Error fetching vehicle owners:", ownersError);
  }

  function normalizeName(value: string) {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
  }

  const uniqueOptionsMap = new Map<string, ChargeToOptions>();

  // Companies
  for (const company of companiesData || []) {
    if (!company.name) continue;

    const name = company.name.trim();
    const key = normalizeName(name);

    if (!uniqueOptionsMap.has(key)) {
      uniqueOptionsMap.set(key, {
        label: name,
        value: name,
      });
    }
  }

  for (const owner of ownersData || []) {
  const fullName = `${owner.owners_first_name || ""} ${
    owner.owners_last_name || ""
  }`.trim();

  if (!fullName) continue;

  const key = normalizeName(fullName);

  if (uniqueOptionsMap.has(key)) {
    console.log("DUPLICATE FOUND:", {
      fullName,
      key,
    });
    continue;
  }

  uniqueOptionsMap.set(key, {
    label: fullName,
    value: fullName,
  });
}

  // 👇 Add this
  const result = Array.from(uniqueOptionsMap.values());

return Array.from(
  new Map(
    result.map((item) => [
      item.value.trim().toLowerCase(),
      item,
    ])
  ).values()
);
}

export default async function CreateRequestForPaymentPage({
  params,
}: PageProps) {
  const { orderId } = await params;
  const supabase = await createClient();

  const order = await getOrder(supabase, orderId);
  const options = await getChargeToOptions(supabase);

  return (
    <div>
      <CreateRequestForPayment
        order={order}
        chargeToOptions={options}
        module="employee-portal/requests"
      />
    </div>
  );
}
