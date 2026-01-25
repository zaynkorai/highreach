import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
    // We don't throw here to avoid crashing the build if key is missing
    // but we should log a warning in development
    if (process.env.NODE_ENV === 'development') {
        console.warn('Missing RESEND_API_KEY environment variable');
    }
}

export const resend = new Resend(process.env.RESEND_API_KEY);
