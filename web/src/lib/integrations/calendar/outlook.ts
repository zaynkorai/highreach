import { Client } from '@microsoft/microsoft-graph-client';
import type { NormalizedExternalEvent } from './google';

export const OUTLOOK_SCOPES = [
    'https://graph.microsoft.com/Calendars.ReadWrite',
    'https://graph.microsoft.com/User.Read',
    'offline_access'
];

const getRedirectUri = () => `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/outlook/callback`;

export async function getAuthUrl(state: string) {
    const clientId = process.env.OUTLOOK_CLIENT_ID || '';
    const redirectUri = encodeURIComponent(getRedirectUri());
    const scope = encodeURIComponent(OUTLOOK_SCOPES.join(' '));
    const encodedState = encodeURIComponent(state);

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&scope=${scope}&state=${encodedState}`;
}

export interface OutlookTokenResponse {
    accessToken: string;
    refreshToken: string | null;
    expiresIn: number;
    expiresAt: Date;
    scopes: string[];
    userEmail?: string;
}

export async function exchangeCodeForTokens(code: string): Promise<OutlookTokenResponse> {
    const clientId = process.env.OUTLOOK_CLIENT_ID || '';
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET || '';

    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: getRedirectUri(),
        grant_type: 'authorization_code',
        scope: OUTLOOK_SCOPES.join(' '),
    });

    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to exchange Outlook token: ${errText}`);
    }

    const data = await res.json();
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

    // Fetch user email via Microsoft Graph /me
    let userEmail: string | undefined;
    try {
        const meRes = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${data.access_token}` }
        });
        if (meRes.ok) {
            const meData = await meRes.json();
            userEmail = meData.mail || meData.userPrincipalName;
        }
    } catch (e) {
        console.warn('Could not fetch Outlook user profile:', e);
    }

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || null,
        expiresIn: data.expires_in || 3600,
        expiresAt,
        scopes: data.scope ? data.scope.split(' ') : OUTLOOK_SCOPES,
        userEmail,
    };
}

export async function refreshOutlookToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string | null; expiresAt: Date }> {
    const clientId = process.env.OUTLOOK_CLIENT_ID || '';
    const clientSecret = process.env.OUTLOOK_CLIENT_SECRET || '';

    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: OUTLOOK_SCOPES.join(' '),
    });

    const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Failed to refresh Outlook token: ${errText}`);
    }

    const data = await res.json();
    const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000);

    return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt,
    };
}

// Retain legacy method name for compatibility
export async function getTokens(code: string) {
    return await exchangeCodeForTokens(code);
}

export async function getCalendarEvents(
    accessToken: string,
    timeMin?: Date,
    timeMax?: Date
): Promise<NormalizedExternalEvent[]> {
    const client = Client.init({
        authProvider: (done) => done(null, accessToken)
    });

    const startIso = (timeMin || new Date()).toISOString();
    const endIso = (timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString();

    // Use calendarView to expand recurring events properly
    const response = await client.api('/me/calendar/calendarView')
        .query({
            startDateTime: startIso,
            endDateTime: endIso,
            $top: 250,
            $select: 'id,subject,start,end'
        })
        .get();

    const items = response.value || [];
    const normalized: NormalizedExternalEvent[] = [];

    for (const item of items) {
        if (!item.id || !item.start?.dateTime || !item.end?.dateTime) continue;

        // Outlook returns dateTime strings in the specified timezone (UTC by default in Graph if not requested)
        const start = new Date(item.start.dateTime + (item.start.timeZone === 'UTC' ? 'Z' : ''));
        const end = new Date(item.end.dateTime + (item.end.timeZone === 'UTC' ? 'Z' : ''));

        normalized.push({
            id: item.id,
            title: item.subject || "Busy",
            start,
            end,
        });
    }

    return normalized;
}

export async function createCalendarEvent(accessToken: string, event: any) {
    const client = Client.init({
        authProvider: (done) => done(null, accessToken)
    });

    const response = await client.api('/me/calendar/events')
        .post(event);

    return response;
}
