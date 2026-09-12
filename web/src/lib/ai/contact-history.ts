import { db } from "../db/index.ts";
import { sql } from "drizzle-orm";
import type {
    ContactHistoryContext,
    ContactProfile,
    OpportunityItem,
    AppointmentItem,
    ActivityItem,
    FormSubmissionItem,
    AssembleContextOptions,
} from "./types.ts";

/**
 * High-Performance Consolidated Contact History Assembler.
 * Replaces 5 separate database roundtrips with a single atomic JSON-aggregated query.
 */
export async function assembleContactHistory(
    tenantId: string,
    contactId?: string | null,
    options: Partial<AssembleContextOptions> = {}
): Promise<ContactHistoryContext> {
    // If no contact ID is provided, return empty/unidentified contact context immediately
    if (!contactId) {
        return {
            contactId: null,
            isKnownContact: false,
            profile: null,
            opportunities: [],
            appointments: [],
            activities: [],
            formSubmissions: [],
        };
    }

    const maxActivities = options.maxActivities ?? 10;
    const includeOpportunities = options.includeOpportunities !== false;
    const includeAppointments = options.includeAppointments !== false;
    const includeActivities = options.includeActivities !== false;
    const includeFormSubmissions = options.includeFormSubmissions !== false;

    try {
        const oppSubquery = includeOpportunities
            ? sql`(
                SELECT COALESCE(json_agg(opp_row), '[]'::json)
                FROM (
                    SELECT o.id, o.title, p.name as pipeline_name, ps.name as stage_name, ps.order_index, o.value, o.status, o.created_at
                    FROM opportunities o
                    JOIN pipeline_stages ps ON o.pipeline_stage_id = ps.id
                    JOIN pipelines p ON ps.pipeline_id = p.id
                    WHERE o.contact_id = c.id AND o.tenant_id = c.tenant_id
                    ORDER BY o.created_at DESC
                ) opp_row
            )`
            : sql`'[]'::json`;

        const aptSubquery = includeAppointments
            ? sql`(
                SELECT COALESCE(json_agg(apt_row), '[]'::json)
                FROM (
                    SELECT a.id, cal.name as calendar_name, a.start_time, a.end_time, a.status, a.location, a.notes
                    FROM appointments a
                    LEFT JOIN calendars cal ON a.calendar_id = cal.id
                    WHERE a.contact_id = c.id AND a.tenant_id = c.tenant_id
                    ORDER BY a.start_time DESC
                    LIMIT 5
                ) apt_row
            )`
            : sql`'[]'::json`;

        const actSubquery = includeActivities
            ? sql`(
                SELECT COALESCE(json_agg(act_row), '[]'::json)
                FROM (
                    SELECT ca.id, ca.type, ca.content, ca.metadata, ca.created_at, u.full_name as created_by_name
                    FROM contact_activities ca
                    LEFT JOIN users u ON ca.created_by = u.id
                    WHERE ca.contact_id = c.id AND ca.tenant_id = c.tenant_id
                    ORDER BY ca.created_at DESC
                    LIMIT ${maxActivities}
                ) act_row
            )`
            : sql`'[]'::json`;

        const subSubquery = includeFormSubmissions
            ? sql`(
                SELECT COALESCE(json_agg(sub_row), '[]'::json)
                FROM (
                    SELECT fs.id, f.name as form_name, fs.data, fs.submitted_at
                    FROM form_submissions fs
                    LEFT JOIN forms f ON fs.form_id = f.id
                    WHERE fs.contact_id = c.id AND fs.tenant_id = c.tenant_id
                    ORDER BY fs.submitted_at DESC
                    LIMIT 5
                ) sub_row
            )`
            : sql`'[]'::json`;

        const rawResult = await db.execute(sql`
            SELECT
                c.id,
                c.tenant_id,
                c.first_name,
                c.last_name,
                c.email,
                c.phone,
                c.tags,
                c.source,
                c.notes,
                c.created_at,
                c.updated_at,
                ${oppSubquery} as opportunities,
                ${aptSubquery} as appointments,
                ${actSubquery} as activities,
                ${subSubquery} as form_submissions
            FROM contacts c
            WHERE c.id = ${contactId}::uuid AND c.tenant_id = ${tenantId}::uuid
            LIMIT 1;
        `);

        const rows = (Array.isArray(rawResult) ? rawResult : (rawResult as any)?.rows || []) as any[];

        if (rows.length === 0) {
            return {
                contactId,
                isKnownContact: false,
                profile: null,
                opportunities: [],
                appointments: [],
                activities: [],
                formSubmissions: [],
            };
        }

        const row = rows[0];

        const profile: ContactProfile = {
            id: row.id,
            tenantId: row.tenant_id,
            firstName: row.first_name,
            lastName: row.last_name,
            fullName: [row.first_name, row.last_name].filter(Boolean).join(" "),
            email: row.email,
            phone: row.phone,
            tags: Array.isArray(row.tags) ? row.tags : [],
            source: row.source,
            notes: row.notes,
            createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
            updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at),
        };

        const opportunityItems: OpportunityItem[] = (row.opportunities || []).map((o: any) => ({
            id: o.id,
            title: o.title,
            pipelineName: o.pipeline_name,
            stageName: o.stage_name,
            orderIndex: o.order_index,
            value: Number(o.value) || 0,
            status: o.status,
            createdAt: typeof o.created_at === "string" ? o.created_at : new Date(o.created_at).toISOString(),
        }));

        const appointmentItems: AppointmentItem[] = (row.appointments || []).map((a: any) => ({
            id: a.id,
            calendarName: a.calendar_name,
            startTime: typeof a.start_time === "string" ? a.start_time : new Date(a.start_time).toISOString(),
            endTime: typeof a.end_time === "string" ? a.end_time : new Date(a.end_time).toISOString(),
            status: a.status,
            location: a.location,
            notes: a.notes,
        }));

        const activityItems: ActivityItem[] = (row.activities || []).map((act: any) => ({
            id: act.id,
            type: act.type,
            content: act.content,
            metadata: (act.metadata || {}) as Record<string, unknown>,
            createdAt: typeof act.created_at === "string" ? act.created_at : new Date(act.created_at).toISOString(),
            createdByName: act.created_by_name,
        }));

        const submissionItems: FormSubmissionItem[] = (row.form_submissions || []).map((sub: any) => ({
            id: sub.id,
            formName: sub.form_name || "Website Form",
            data: (sub.data || {}) as Record<string, unknown>,
            submittedAt: typeof sub.submitted_at === "string" ? sub.submitted_at : new Date(sub.submitted_at).toISOString(),
        }));

        return {
            contactId: row.id,
            isKnownContact: true,
            profile,
            opportunities: opportunityItems,
            appointments: appointmentItems,
            activities: activityItems,
            formSubmissions: submissionItems,
        };
    } catch (err) {
        console.warn("Consolidated contact history query failed, returning safe empty context:", err);
        return {
            contactId,
            isKnownContact: false,
            profile: null,
            opportunities: [],
            appointments: [],
            activities: [],
            formSubmissions: [],
        };
    }
}
