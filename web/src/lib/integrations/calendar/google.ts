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

export async function getCalendarEvents(accessToken: string, refreshToken: string, calendarId: string = 'primary', timeMin: Date) {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
    });

    return response.data.items;
}

export async function createCalendarEvent(accessToken: string, refreshToken: string, calendarId: string = 'primary', event: any) {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });

    const calendar = google.calendar({ version: 'v3', auth });
    const response = await calendar.events.insert({
        calendarId,
        requestBody: event,
    });

    return response.data;
}
