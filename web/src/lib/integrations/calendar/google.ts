import { google } from 'googleapis';

const getGoogleOAuthClient = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
    );
};

export const GOOGLE_SCOPES = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/business.manage'
];

export function getAuthUrl(state: string) {
    return getGoogleOAuthClient().generateAuthUrl({
        access_type: 'offline',
        scope: GOOGLE_SCOPES,
        state,
        prompt: 'consent'
    });
}

export async function getTokens(code: string) {
    const { tokens } = await getGoogleOAuthClient().getToken(code);
    return tokens;
}

export interface NormalizedExternalEvent {
    id: string;
    title: string;
    start: Date;
    end: Date;
}

export async function refreshGoogleToken(refreshToken: string) {
    const oauth2Client = getGoogleOAuthClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials;
}

export async function getCalendarEvents(
    accessToken: string,
    refreshToken?: string | null,
    calendarId: string = 'primary',
    timeMin?: Date,
    timeMax?: Date
): Promise<NormalizedExternalEvent[]> {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken || undefined });

    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.list({
        calendarId,
        timeMin: timeMin ? timeMin.toISOString() : new Date().toISOString(),
        timeMax: timeMax ? timeMax.toISOString() : undefined,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
    });

    const items = response.data.items || [];
    const normalized: NormalizedExternalEvent[] = [];

    for (const item of items) {
        if (!item.id) continue;
        const startStr = item.start?.dateTime || item.start?.date;
        const endStr = item.end?.dateTime || item.end?.date;
        if (!startStr || !endStr) continue;

        const start = new Date(startStr);
        let end = new Date(endStr);
        // All-day event end dates in Google Calendar are exclusive (start of next day)
        if (item.start?.date && !item.start?.dateTime) {
            // All day
            end = new Date(endStr);
        }

        normalized.push({
            id: item.id,
            title: item.summary || "Busy",
            start,
            end,
        });
    }

    return normalized;
}

export async function createCalendarEvent(accessToken: string, refreshToken?: string | null, calendarId: string = 'primary', event?: any) {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken || undefined });

    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
    });

    return response.data;
}

