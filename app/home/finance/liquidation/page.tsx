import Liquidation from "@/app/components/liquidation/Liquidation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function getApprovedRFPs(supabase: any) {
  const { data, error } = await supabase
    .from("requests_for_payment")
    .select("*")
    .eq("status", "approved")
    .order("rfp_number", { ascending: true });

  if (error) {
    console.error("Error fetching RFPs:", error);
    return [];
  }

  return data || [];
}

async function getLiquidatedRFPs(supabase: any) {
  try {
    // =========================
    // Helpers (safe + reusable)
    // =========================
    const normalizeJSON = (value: any) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      }
      return [];
    };

    // =========================
    // 1. Fetch liquidations
    // =========================
    const { data: liquidations, error: liquidationError } = await supabase
      .from("liquidations")
      .select("*")
      .order("liquidation_number", { ascending: true });

    if (liquidationError) throw liquidationError;
    if (!liquidations?.length) return [];

    // =========================
    // 2. Extract RFP IDs
    // =========================
    const rfpIds = [
      ...new Set(liquidations.map((l: any) => l.rfp_id).filter(Boolean)),
    ];

    if (!rfpIds.length) return liquidations;

    // =========================
    // 3. Fetch RFPs
    // =========================
    const { data: rfps, error: rfpError } = await supabase
      .from("requests_for_payment")
      .select("id, order_number, supporting_documents");

    if (rfpError) throw rfpError;
    if (!rfps?.length) {
      return liquidations.map((l: any) => ({
        ...l,
        supporting_documents: [],
        order_type: null,
        description: null,
        vehicle: null,
        journal_entries: [],
      }));
    }

    const rfpMap = new Map(rfps.map((r: any) => [r.id, r]));

    // =========================
    // 4. Extract order numbers
    // =========================
    const orderNumbers = [
      ...new Set(rfps.map((r: any) => r.order_number).filter(Boolean)),
    ];

    if (!orderNumbers.length) {
      return liquidations.map((l: any) => ({
        ...l,
        supporting_documents:
          (rfpMap.get(l.rfp_id) as any)?.supporting_documents ?? [],
        order_type: null,
        description: null,
        vehicle: null,
        journal_entries: [],
      }));
    }

    // =========================
    // 5. Fetch SO + PO in parallel
    // =========================
    const [
      { data: serviceOrders, error: serviceError },
      { data: purchaseOrders, error: purchaseError },
    ] = await Promise.all([
      supabase
        .from("service_orders")
        .select(
          `
          order_number,
          journal_entries,
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
        .in("order_number", orderNumbers),

      supabase
        .from("purchase_orders")
        .select(
          `
          order_number,
          journal_entries,
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
        .in("order_number", orderNumbers),
    ]);

    if (serviceError) throw serviceError;
    if (purchaseError) throw purchaseError;

    // =========================
    // 6. Build lookup maps
    // =========================
    const serviceMap = new Map(
      (serviceOrders ?? []).map((o: any) => [o.order_number, o]),
    );

    const purchaseMap = new Map(
      (purchaseOrders ?? []).map((o: any) => [o.order_number, o]),
    );

    // =========================
    // 7. Enrich RFPs
    // =========================
    const rfpLookup = new Map<number, any>();

    for (const rfp of rfps) {
      const serviceOrder = serviceMap.get(rfp.order_number) as any;
      const purchaseOrder = purchaseMap.get(rfp.order_number) as any;

      const soEntries = normalizeJSON(serviceOrder?.journal_entries);
      const poEntries = normalizeJSON(purchaseOrder?.journal_entries);

      const enriched = {
        supporting_documents: rfp.supporting_documents ?? [],

        order_type: serviceOrder
          ? "service_order"
          : purchaseOrder
            ? "purchase_order"
            : null,

        description:
          serviceOrder?.service_request?.description ??
          purchaseOrder?.purchase_request?.description ??
          null,

        vehicle:
          serviceOrder?.service_request?.vehicle ??
          purchaseOrder?.purchase_request?.vehicle ??
          null,

        // ✅ SAFE MERGE (SO + PO)
        journal_entries: [...soEntries, ...poEntries],
      };

      rfpLookup.set(rfp.id, enriched);
    }

    // =========================
    // 8. Merge into liquidations
    // =========================
    return liquidations.map((liquidation: any) => {
      const enriched = rfpLookup.get(liquidation.rfp_id);

      return {
        ...liquidation,
        supporting_documents: enriched?.supporting_documents ?? [],

        order_type: enriched?.order_type ?? null,
        description: enriched?.description ?? null,
        vehicle: enriched?.vehicle ?? null,
        journal_entries: enriched?.journal_entries ?? [],
      };
    });
  } catch (error) {
    console.error("Error fetching liquidated RFPs:", error);
    return [];
  }
}

async function approveLiquidation(id: string) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const approver = user?.user_metadata?.full_name;

  const { error } = await supabase
    .from("liquidations")
    .update({
      status: "liquidated",
      approved_date: new Date().toISOString(),
      approved_by: approver,
    })
    .eq("id", id);

  if (error) {
    console.error("Error approving liquidation:", error);
    throw new Error("Failed to approve liquidation");
  }

  revalidatePath("/liquidation");
}

async function rejectLiquidation(id: string) {
  "use server";

  const supabase = await createClient();

  const { error } = await supabase
    .from("liquidations")
    .update({
      status: "rejected",
    })
    .eq("id", id);

  if (error) {
    console.error("Error rejecting liquidation:", error);
    throw new Error("Failed to reject liquidation");
  }

  revalidatePath("/liquidation");
}

export default async function LiquidationPage() {
  const supabase = await createClient();

  const rfps = await getApprovedRFPs(supabase);
  const liquidatedRFPs = await getLiquidatedRFPs(supabase);

  return (
    <div>
      <Liquidation
        rfps={rfps}
        liquidatedRFPs={liquidatedRFPs}
        onApprove={approveLiquidation}
        onReject={rejectLiquidation}
        module="finance"
      />
    </div>
  );
}
