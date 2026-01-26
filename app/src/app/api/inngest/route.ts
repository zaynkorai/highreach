
import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { helloWorld } from "@/inngest/functions/hello-world";
import { missedCallAutomation } from "@/inngest/functions/missed-call";
import { newLeadWelcome } from "@/inngest/functions/new-lead";
import { dealWonNotification } from "@/inngest/functions/deal-won";
import { reviewRequest } from "@/inngest/functions/review-request";
import { pushToExternalCalendar } from "@/inngest/functions/calendar-sync";
import { syncExternalEvents } from "@/inngest/functions/calendar-pull";

export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        helloWorld,
        missedCallAutomation,
        newLeadWelcome,
        dealWonNotification,
        reviewRequest,
        pushToExternalCalendar,
        syncExternalEvents
    ],
});
