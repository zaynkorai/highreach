import type {
    TenantKnowledgeContext,
    ContactHistoryContext,
    ActiveThreadContext,
    FormattedPromptContext,
    ChatRole,
} from "./types.ts";

/**
 * Fast token estimation heuristic (~4 characters per token for English / Markdown).
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

/**
 * Builds the structured Markdown system prompt context block combining Tenant Knowledge,
 * Contact History, and Active Thread overview.
 */
export function buildSystemPromptContext(
    tenant: TenantKnowledgeContext,
    contact: ContactHistoryContext,
    thread: ActiveThreadContext
): string {
    const sections: string[] = [];

    // ─────────────────────────────────────────────────────────────
    // 1. BUSINESS PROFILE & KNOWLEDGE BASE
    // ─────────────────────────────────────────────────────────────
    const businessDetails: string[] = [
        `### BUSINESS PROFILE & OPERATING CONTEXT`,
        `- **Business Name**: ${tenant.name}`,
        tenant.phoneNumber ? `- **Phone Number**: ${tenant.phoneNumber}` : null,
        tenant.industry ? `- **Industry / Category**: ${tenant.industry}` : null,
        `- **Primary Timezone**: ${tenant.timezone}`,
    ].filter(Boolean) as string[];

    if (tenant.businessHours.length > 0) {
        businessDetails.push(`\n**Operating Hours**:`);
        for (const h of tenant.businessHours) {
            businessDetails.push(`  - ${h.dayName}: ${h.open} – ${h.close}`);
        }
    }

    if (tenant.knowledgeChunks.length > 0) {
        businessDetails.push(`\n**Grounded Knowledge & Verified Facts**:`);
        tenant.knowledgeChunks.forEach((chunk, idx) => {
            businessDetails.push(`> [Fact ${idx + 1}] (${chunk.sourceType.toUpperCase()} - "${chunk.title}"):`);
            businessDetails.push(`> ${chunk.content.replace(/\n/g, "\n> ")}`);
        });
    }

    sections.push(businessDetails.join("\n"));

    // ─────────────────────────────────────────────────────────────
    // 2. CONTACT PROFILE & CRM HISTORY
    // ─────────────────────────────────────────────────────────────
    const contactDetails: string[] = [
        `### CUSTOMER PROFILE & CRM HISTORY`,
    ];

    if (contact.isKnownContact && contact.profile) {
        const p = contact.profile;
        contactDetails.push(`- **Contact Name**: ${p.fullName || p.firstName}`);
        if (p.phone) contactDetails.push(`- **Phone**: ${p.phone}`);
        if (p.email) contactDetails.push(`- **Email**: ${p.email}`);
        if (p.tags.length > 0) contactDetails.push(`- **Tags**: ${p.tags.join(", ")}`);
        if (p.source) contactDetails.push(`- **Lead Source**: ${p.source}`);
        if (p.notes) contactDetails.push(`- **CRM Notes**: ${p.notes}`);

        // Active Deals / Opportunities
        if (contact.opportunities.length > 0) {
            contactDetails.push(`\n**Pipeline Deals**:`);
            for (const opp of contact.opportunities) {
                const valStr = opp.value > 0 ? ` ($${opp.value.toLocaleString()})` : "";
                contactDetails.push(`  - "${opp.title}"${valStr} | Stage: ${opp.stageName} [Status: ${opp.status}]`);
            }
        }

        // Calendar Appointments
        if (contact.appointments.length > 0) {
            contactDetails.push(`\n**Appointments & Bookings**:`);
            for (const apt of contact.appointments) {
                contactDetails.push(
                    `  - ${apt.calendarName || "Meeting"}: ${apt.startTime} (Status: ${apt.status})` +
                    (apt.location ? ` @ ${apt.location}` : "")
                );
            }
        }

        // Interaction Timeline / Notes
        if (contact.activities.length > 0) {
            contactDetails.push(`\n**Recent Activity & Timeline**:`);
            for (const act of contact.activities.slice(0, 5)) {
                const author = act.createdByName ? ` (by ${act.createdByName})` : "";
                contactDetails.push(`  - [${act.type.toUpperCase()}] ${act.content || "Activity logged"}${author} on ${act.createdAt}`);
            }
        }

        // Form Submissions
        if (contact.formSubmissions.length > 0) {
            contactDetails.push(`\n**Form Submissions**:`);
            for (const sub of contact.formSubmissions) {
                contactDetails.push(`  - Form "${sub.formName}" submitted at ${sub.submittedAt}: ${JSON.stringify(sub.data)}`);
            }
        }
    } else {
        contactDetails.push(
            `- **Status**: Unregistered / New prospective lead. No previous CRM history exists for this identifier.`
        );
    }

    sections.push(contactDetails.join("\n"));

    // ─────────────────────────────────────────────────────────────
    // 3. ACTIVE THREAD CONVERSATIONAL CONTEXT
    // ─────────────────────────────────────────────────────────────
    const threadDetails: string[] = [
        `### ACTIVE CONVERSATION CONTEXT`,
        `- **Channel**: ${thread.channel.toUpperCase()}`,
        `- **Thread Status**: ${thread.status.toUpperCase()}`,
        `- **Total Messages in Thread**: ${thread.totalMessagesCount}`,
        thread.hasInboundReplyPending
            ? `- **Awaiting Response**: YES (Customer has sent the latest message and awaits assistance).`
            : `- **Awaiting Response**: NO (Last message was sent by the business or thread is inactive).`,
    ];

    sections.push(threadDetails.join("\n"));

    return sections.join("\n\n---\n\n");
}

/**
 * Formats active thread messages into standard chat completion message objects
 * suitable for LLMs (OpenAI, Anthropic, Vercel AI SDK).
 */
export function buildChatMessages(
    thread: ActiveThreadContext
): Array<{ role: ChatRole; content: string }> {
    return thread.messages.map((m) => ({
        role: m.role,
        content: m.content,
    }));
}

/**
 * Creates the complete prompt context object, estimating tokens and trimming
 * if necessary to fit the specified token budget.
 */
export function buildPromptContext(
    tenant: TenantKnowledgeContext,
    contact: ContactHistoryContext,
    thread: ActiveThreadContext,
    maxTokens: number = 4000
): FormattedPromptContext {
    let systemPromptSnippet = buildSystemPromptContext(tenant, contact, thread);
    let formattedMessages = buildChatMessages(thread);

    let systemTokens = estimateTokens(systemPromptSnippet);
    let messageTokens = formattedMessages.reduce((sum, m) => sum + estimateTokens(m.content) + 4, 0);
    let totalTokens = systemTokens + messageTokens;

    // If total exceeds maxTokens, trim messages from the start of thread (oldest first)
    if (totalTokens > maxTokens && formattedMessages.length > 1) {
        while (formattedMessages.length > 1 && totalTokens > maxTokens) {
            const removed = formattedMessages.shift();
            if (removed) {
                totalTokens -= estimateTokens(removed.content) + 4;
            }
        }
    }

    return {
        systemPromptSnippet,
        formattedMessages,
        estimatedTokenCount: totalTokens,
    };
}
