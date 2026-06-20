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
    // 1. Fetch liquidations
    const { data: liquidations, error: liquidationError } = await supabase
      .from("liquidations")
      .select("*")
      .order("liquidation_number", { ascending: true });

    if (liquidationError) throw liquidationError;

    if (!liquidations?.length) {
      return [];
    }

    // 2. Extract unique RFP IDs
    const rfpIds = [
      ...new Set(liquidations.map((l: any) => l.rfp_id).filter(Boolean)),
    ];

    if (!rfpIds.length) {
      return liquidations;
    }

    // 3. Fetch related RFPs
    const { data: rfps, error: rfpError } = await supabase
      .from("requests_for_payment")
      .select("id, order_number, supporting_documents")
      .in("id", rfpIds);

    if (rfpError) throw rfpError;

    if (!rfps?.length) {
      return liquidations.map((l: any) => ({
        ...l,
        supporting_documents: [],
        order_type: null,
        description: null,
        vehicle: null,
      }));
    }

    const orderNumbers = rfps.map((r: any) => r.order_number).filter(Boolean);

    // 4. Fetch service orders + purchase orders in parallel
    const [
      { data: serviceOrders, error: serviceError },
      { data: purchaseOrders, error: purchaseError },
    ] = await Promise.all([
      supabase
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
        .in("order_number", orderNumbers),

      supabase
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
        .in("order_number", orderNumbers),
    ]);

    if (serviceError) throw serviceError;
    if (purchaseError) throw purchaseError;

    // 5. Build lookup maps
    const serviceMap = new Map(
      (serviceOrders ?? []).map((order: any) => [order.order_number, order]),
    );

    const purchaseMap = new Map(
      (purchaseOrders ?? []).map((order: any) => [order.order_number, order]),
    );

    // 6. Build enriched RFP lookup
    const rfpLookup = new Map();

    for (const rfp of rfps) {
      const serviceOrder = serviceMap.get(rfp.order_number) as any;
      const purchaseOrder = purchaseMap.get(rfp.order_number) as any;

      let enriched = {
        supporting_documents: rfp.supporting_documents || [],
        order_type: null,
        description: null,
        vehicle: null,
      };

      if (serviceOrder) {
        enriched = {
          ...enriched,
          description: serviceOrder.service_request?.description ?? null,
          vehicle: serviceOrder.service_request?.vehicle ?? null,
        };
      } else if (purchaseOrder) {
        enriched = {
          ...enriched,
          description: purchaseOrder.purchase_request?.description ?? null,
          vehicle: purchaseOrder.purchase_request?.vehicle ?? null,
        };
      }

      rfpLookup.set(rfp.id, enriched);
    }

    // 7. Merge into liquidations
    return liquidations.map((liquidation: any) => ({
      ...liquidation,
      ...(rfpLookup.get(liquidation.rfp_id) ?? {
        supporting_documents: [],
        order_type: null,
        description: null,
        vehicle: null,
      }),
    }));
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
