export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday

export interface Calendar {
    id: string;
    tenant_id: string;
    name: string;
    slug: string;
    description: string | null;
    timezone: string;
    duration_minutes: number;
    buffer_minutes: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CalendarAvailability {
    id: string;
    calendar_id: string;
    day_of_week: DayOfWeek;
    start_time: string; // "HH:MM:SS"
    end_time: string;   // "HH:MM:SS"
}

export interface CalendarOverride {
    id: string;
    calendar_id: string;
    date: string; // "YYYY-MM-DD"
    is_unavailable: boolean;
    start_time: string | null;
    end_time: string | null;
    created_at: string;
}

export type AppointmentStatus = 'confirmed' | 'cancelled' | 'rescheduled' | 'no_show' | 'completed';

export interface Appointment {
    id: string;
    calendar_id: string;
    tenant_id: string;
    contact_id: string;
    start_time: string; // ISO 8601
    end_time: string;   // ISO 8601
    status: AppointmentStatus;
    location: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    // Joins
    contact?: {
        first_name: string | null;
        last_name: string | null;
        email: string | null;
        phone: string | null;
    };
    calendar?: {
        name: string;
    };
}
