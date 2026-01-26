import { google } from 'googleapis';

const getAuth = (accessToken: string, refreshToken: string) => {
    const auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({ access_token: accessToken, refresh_token: refreshToken });
    return auth;
};

// Google Business Profile APIs are not all in the same "service" in the googleapis npm package
// but we can use the 'mybusinessbusinessinformation' and 'mybusinessreviews' if available
// or use generic request if not fully supported in the library version

export async function listBusinessAccounts(accessToken: string, refreshToken: string) {
    const auth = getAuth(accessToken, refreshToken);
    // Using the My Business Account Management API
    const mybusinessaccountmanagement = (google as any).mybusinessaccountmanagement({ version: 'v1', auth });
    const response = await mybusinessaccountmanagement.accounts.list();
    return response.data.accounts || [];
}

export async function listLocations(accessToken: string, refreshToken: string, accountName: string) {
    const auth = getAuth(accessToken, refreshToken);
    const mybusinessbusinessinformation = (google as any).mybusinessbusinessinformation({ version: 'v1', auth });
    const response = await mybusinessbusinessinformation.accounts.locations.list({
        parent: accountName,
        readMask: 'name,title,storeCode,regularHours'
    });
    return response.data.locations || [];
}

export async function listReviews(accessToken: string, refreshToken: string, locationName: string) {
    const auth = getAuth(accessToken, refreshToken);
    // The reviews API is often handled via a direct call because the Node SDK might not have them all or they have weird versions
    // But let's try 'mybusinessreviews'
    const mybusinessreviews = (google as any).mybusinessreviews({ version: 'v1', auth });
    const response = await mybusinessreviews.accounts.locations.reviews.list({
        parent: locationName
    });
    return response.data.reviews || [];
}

export async function replyToReview(accessToken: string, refreshToken: string, reviewName: string, reply: string) {
    const auth = getAuth(accessToken, refreshToken);
    const mybusinessreviews = (google as any).mybusinessreviews({ version: 'v1', auth });
    const response = await mybusinessreviews.accounts.locations.reviews.updateReply({
        name: `${reviewName}/reply`,
        requestBody: {
            comment: reply
        }
    });
    return response.data;
}
