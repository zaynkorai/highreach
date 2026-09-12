import test from "node:test";
import assert from "node:assert/strict";
import { useInboxStore } from "../stores/inbox-store.ts";
import type { Conversation, Message } from "../types/inbox.ts";

test("Inbox state & conversation business logic", async (t) => {
    // Reset store before tests
    useInboxStore.getState().actions.reset();

    await t.test("Initial store state has empty collections", () => {
        const state = useInboxStore.getState();
        assert.equal(state.conversations.length, 0);
        assert.equal(state.selectedId, null);
        assert.equal(state.messages.length, 0);
        assert.equal(state.isLoadingMessages, false);
    });

    await t.test("setConversations populates conversation list", () => {
        const mockConv: Conversation = {
            id: "conv-1",
            tenant_id: "tenant-1",
            contact_id: "contact-1",
            channel: "sms",
            status: "open",
            last_message_at: new Date().toISOString(),
            last_message_preview: "Hello there!",
            unread_count: 2,
            is_starred: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            contact: {
                id: "contact-1",
                first_name: "Alice",
                last_name: "Smith",
                phone: "+15551234567",
                email: "alice@example.com",
                tags: ["VIP"],
            },
        };

        useInboxStore.getState().actions.setConversations([mockConv]);
        const state = useInboxStore.getState();
        assert.equal(state.conversations.length, 1);
        assert.equal(state.conversations[0].id, "conv-1");
        assert.equal(state.conversations[0].unread_count, 2);
        assert.equal(state.conversations[0].last_message_preview, "Hello there!");
    });

    await t.test("markAsRead resets unread_count to 0 for target conversation", () => {
        useInboxStore.getState().actions.markAsRead("conv-1");
        const conv = useInboxStore.getState().conversations.find((c) => c.id === "conv-1");
        assert.ok(conv);
        assert.equal(conv.unread_count, 0);
    });

    await t.test("updateConversation performs partial merge without dropping properties", () => {
        useInboxStore.getState().actions.updateConversation({
            id: "conv-1",
            is_starred: true,
            status: "closed",
        });

        const conv = useInboxStore.getState().conversations.find((c) => c.id === "conv-1");
        assert.ok(conv);
        assert.equal(conv.is_starred, true);
        assert.equal(conv.status, "closed");
        assert.equal(conv.contact?.first_name, "Alice");
        assert.equal(conv.last_message_preview, "Hello there!");
    });

    await t.test("addMessage appends message when matching selectedId and deduplicates", () => {
        useInboxStore.getState().actions.setSelectedId("conv-1");

        const msg1: Message = {
            id: "msg-1",
            tenant_id: "tenant-1",
            conversation_id: "conv-1",
            direction: "outbound",
            channel: "sms",
            content: "First message",
            is_internal: false,
            metadata: {},
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
        };

        useInboxStore.getState().actions.addMessage(msg1, "conv-1");
        assert.equal(useInboxStore.getState().messages.length, 1);

        // Deduplication: adding exact same ID should not duplicate
        useInboxStore.getState().actions.addMessage(msg1, "conv-1");
        assert.equal(useInboxStore.getState().messages.length, 1);

        // Internal note message
        const noteMsg: Message = {
            id: "msg-2",
            tenant_id: "tenant-1",
            conversation_id: "conv-1",
            direction: "outbound",
            channel: "sms",
            content: "Call customer back at 2pm",
            is_internal: true,
            metadata: { is_internal: true },
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
        };

        useInboxStore.getState().actions.addMessage(noteMsg, "conv-1");
        assert.equal(useInboxStore.getState().messages.length, 2);
        assert.equal(useInboxStore.getState().messages[1].is_internal, true);
    });

    await t.test("addMessage ignores message intended for a different conversation", () => {
        const foreignMsg: Message = {
            id: "msg-99",
            tenant_id: "tenant-1",
            conversation_id: "conv-99",
            direction: "inbound",
            channel: "sms",
            content: "Wrong chat",
            is_internal: false,
            metadata: {},
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
        };

        useInboxStore.getState().actions.addMessage(foreignMsg, "conv-99");
        assert.equal(useInboxStore.getState().messages.length, 2);
        assert.ok(!useInboxStore.getState().messages.some((m) => m.id === "msg-99"));
    });
});
