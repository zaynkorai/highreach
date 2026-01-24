export type ChannelType = 'sms' | 'email' | 'facebook' | 'instagram';
export type MessageDirection = 'inbound' | 'outbound';

export interface Conversation {
    id: string;
    tenant_id: string;
    contact_id: string;
    channel: ChannelType;
    status: 'open' | 'closed';
    last_message_at: string;
    last_message_preview?: string;
    unread_count: number;
    created_at: string;
    updated_at: string;

    // Virtual fields (joined)
    contact?: {
        first_name: string;
        last_name: string | null;
        phone: string | null;
        email: string | null;
    };
}

export interface Message {
    id: string;
    tenant_id: string;
    conversation_id: string;
    direction: MessageDirection;
    channel: ChannelType;
    content: string;
    metadata: Record<string, any>;
    sent_at: string;
    created_at: string;
}
