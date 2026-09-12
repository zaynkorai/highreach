import { db } from "../db/index.ts";
import { sql } from "drizzle-orm";
import type { ActiveThreadContext, ThreadMessage, ChatRole, AssembleContextOptions } from "./types.ts";

/**
 * High-Performance Consolidated Active Thread Assembler.
 * Combines target conversation lookup and message extraction into a single atomic database query.
 */
export async function assembleActiveThread(
    tenantId: string,
    contactId?: string | null,
    conversationId?: string | null,
    options: Partial<AssembleContextOptions> = {}
): Promise<ActiveThreadContext> {
    const maxMessages = options.maxThreadMessages ?? 20;

    // Fast-exit if neither conversationId nor contactId is provided
    if (!conversationId && !contactId) {
        return {
            conversationId: null,
            channel: "sms",
            status: "open",
            lastMessageAt: null,
            messages: [],
            totalMessagesCount: 0,
            hasInboundReplyPending: false,
        };
    }

    try {
        const whereClause = conversationId
            ? sql`c.id = ${conversationId}::uuid AND c.tenant_id = ${tenantId}::uuid`
            : sql`c.contact_id = ${contactId}::uuid AND c.tenant_id = ${tenantId}::uuid`;

        const orderByClause = conversationId
            ? sql``
            : sql`ORDER BY c.last_message_at DESC NULLS LAST`;

        const rawResult = await db.execute(sql`
            SELECT
                c.id as conv_id,
                c.channel,
                c.status,
                c.last_message_at,
                c.created_at as conv_created_at,
                (
                    SELECT COALESCE(json_agg(m_row), '[]'::json)
                    FROM (
                        SELECT m.id, m.conversation_id, m.direction, m.channel, m.content, m.sent_at, m.created_at, m.metadata
                        FROM messages m
                        WHERE m.conversation_id = c.id AND m.tenant_id = c.tenant_id
                        ORDER BY m.created_at ASC
                    ) m_row
                ) as raw_messages
            FROM conversations c
            WHERE ${whereClause}
            ${orderByClause}
            LIMIT 1;
        `);

        const rows = (Array.isArray(rawResult) ? rawResult : (rawResult as any)?.rows || []) as any[];

        if (rows.length === 0) {
            return {
                conversationId: null,
                channel: "sms",
                status: "open",
                lastMessageAt: null,
                messages: [],
                totalMessagesCount: 0,
                hasInboundReplyPending: false,
            };
        }

        const conv = rows[0];
        const channel = conv.channel || "sms";
        const status = conv.status || "open";
        const lastMessageAt = conv.last_message_at
            ? (conv.last_message_at instanceof Date ? conv.last_message_at.toISOString() : String(conv.last_message_at))
            : (conv.conv_created_at instanceof Date ? conv.conv_created_at.toISOString() : String(conv.conv_created_at));

        const rawMsgs = (conv.raw_messages || []) as any[];
        const totalMessagesCount = rawMsgs.length;

        const mappedMessages: ThreadMessage[] = rawMsgs.map((m: any) => {
            const meta = (m.metadata || {}) as Record<string, unknown>;
            const isInternal = meta.is_internal === true;
            const direction = (m.direction || "inbound") as "inbound" | "outbound";

            let role: ChatRole = "user";
            if (isInternal) {
                role = "system";
            } else if (direction === "outbound") {
                role = "assistant";
            } else {
                role = "user";
            }

            const sentAt = m.sent_at
                ? (m.sent_at instanceof Date ? m.sent_at.toISOString() : String(m.sent_at))
                : (m.created_at instanceof Date ? m.created_at.toISOString() : String(m.created_at));

            return {
                id: m.id,
                conversationId: m.conversation_id,
                direction,
                role,
                channel: m.channel || channel,
                content: m.content,
                sentAt,
                metadata: meta,
            };
        });

        // Apply Sliding Window (retain most recent maxMessages)
        const windowedMessages = mappedMessages.length > maxMessages
            ? mappedMessages.slice(mappedMessages.length - maxMessages)
            : mappedMessages;

        const lastMsg = mappedMessages.length > 0 ? mappedMessages[mappedMessages.length - 1] : null;
        const hasInboundReplyPending = lastMsg ? lastMsg.direction === "inbound" && lastMsg.role !== "system" : false;

        return {
            conversationId: conv.conv_id,
            channel,
            status,
            lastMessageAt,
            messages: windowedMessages,
            totalMessagesCount,
            hasInboundReplyPending,
        };
    } catch (err) {
        console.warn("Consolidated active thread query failed, returning safe empty thread:", err);
        return {
            conversationId: null,
            channel: "sms",
            status: "open",
            lastMessageAt: null,
            messages: [],
            totalMessagesCount: 0,
            hasInboundReplyPending: false,
        };
    }
}
