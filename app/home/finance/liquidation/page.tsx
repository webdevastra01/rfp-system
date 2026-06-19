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
  // Fetch liquidations
  const { data: liquidations, error } = await supabase
    .from("liquidations")
    .select("*")
    .order("liquidation_number", { ascending: true });

  if (error) {
    console.error("Error fetching liquidated RFPs:", error);
    return [];
  }

  if (!liquidations?.length) return [];

  // Get unique rfp_ids
  const rfpIds = [
    ...new Set(liquidations.map((l: any) => l.rfp_id).filter(Boolean)),
  ];

  if (rfpIds.length === 0) {
    return liquidations.map((l: any) => ({ ...l, supporting_documents: [] }));
  }

  // Fetch supporting documents from rfp table
  const { data: rfps, error: rfpError } = await supabase
    .from("requests_for_payment")
    .select("id, supporting_documents")
    .in("id", rfpIds);

  if (rfpError) {
    console.error("Error fetching RFPs for documents:", rfpError);
  }

  // Create lookup map
  const rfpMap = new Map(
    (rfps || []).map((r: any) => [r.id, r.supporting_documents || []]),
  );

  // Merge supporting_documents into each liquidation
  return liquidations.map((liquidation: any) => ({
    ...liquidation,
    supporting_documents: rfpMap.get(liquidation.rfp_id) || [],
  }));
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
