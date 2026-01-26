import * as msal from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';

function getPca() {
    const client_id = process.env.OUTLOOK_CLIENT_ID;
    const client_secret = process.env.OUTLOOK_CLIENT_SECRET;

    if (!client_id || !client_secret) {
        // During build, these might be missing. We shouldn't throw here
        // if this code is just being imported/scanned.
        console.warn("OUTLOOK_CLIENT_ID or OUTLOOK_CLIENT_SECRET is missing.");
    }

    return new msal.ConfidentialClientApplication({
        auth: {
            clientId: client_id || 'dummy-id',
            clientSecret: client_secret || 'dummy-secret',
            authority: "https://login.microsoftonline.com/common",
        }
    });
}

const getRedirectUri = () => `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/outlook/callback`;

export const OUTLOOK_SCOPES = [
    'https://graph.microsoft.com/Calendars.ReadWrite',
    'https://graph.microsoft.com/User.Read',
    'offline_access'
];

export async function getAuthUrl(state: string) {
    return await getPca().getAuthCodeUrl({
        scopes: OUTLOOK_SCOPES,
        redirectUri: getRedirectUri(),
        state,
    });
}

export async function getTokens(code: string) {
    const response = await getPca().acquireTokenByCode({
        code,
        scopes: OUTLOOK_SCOPES,
        redirectUri: getRedirectUri(),
    });
    return response;
}

export async function getCalendarEvents(accessToken: string) {
    const client = Client.init({
        authProvider: (done) => done(null, accessToken)
    });

    const response = await client.api('/me/calendar/events')
        .select('subject,start,end,location')
        .get();

    return response.value;
}

export async function createCalendarEvent(accessToken: string, event: any) {
    const client = Client.init({
        authProvider: (done) => done(null, accessToken)
    });

    const response = await client.api('/me/calendar/events')
        .post(event);

    return response;
}
