import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { data } = body;

        // Ensure it's a call.hangup event
        if (data.event_type !== "call.hangup") {
            return NextResponse.json({ message: "Ignored event type" });
        }

        const { payload } = data;
        const { to, from, hangup_cause, direction } = payload;

        // Only handle incoming calls
        if (direction !== "incoming") {
            return NextResponse.json({ message: "Ignored outgoing call" });
        }

        // Simple filter: invalid hangup causes for "missed" call logic
        // 'normal_clearing' usually means the call was answered and ended normally.
        if (hangup_cause === "normal_clearing") {
            return NextResponse.json({ message: "Call was answered (normal_clearing)" });
        }

        const supabase = createAdminClient();

        // Find tenant by phone number
        // We assume the 'tenants' table has a 'phone' or 'phone_number' column.
        // Adjust column name if necessary after DB inspection.
        const { data: tenant, error } = await supabase
            .from("tenants")
            .select("id, name")
            .eq("phone", to)
            .single();

        if (error || !tenant) {
            console.error(`No tenant found for number ${to}: ${error?.message}`);
            return NextResponse.json({ message: "No tenant found" }, { status: 200 }); // Return 200 to satisfy webhook
        }

        // Trigger Inngest event
        await inngest.send({
            name: "call/missed",
            data: {
                tenant_id: tenant.id,
                tenant_name: tenant.name,
                from_number: from,
                to_number: to,
                hangup_cause,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
