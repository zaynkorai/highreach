import type { AppRole, AppPermission } from "@/lib/types/database";

/**
 * Centralized Permission Map
 *
 * This mirrors the database role_permissions table for client-side
 * and server-side checks WITHOUT hitting the DB. Keep in sync with
 * migration 20260226_002_create_role_permissions.sql.
 */

const ALL_PERMISSIONS: AppPermission[] = [
    'contacts.read', 'contacts.write', 'contacts.delete',
    'conversations.read', 'conversations.write',
    'forms.read', 'forms.write', 'forms.delete',
    'pipelines.read', 'pipelines.write', 'pipelines.delete',
    'calendars.read', 'calendars.write',
    'reputation.read', 'reputation.write',
    'automations.read', 'automations.write', 'automations.delete',
    'settings.read', 'settings.write',
    'team.read', 'team.invite', 'team.remove', 'team.change_role',
    'billing.read', 'billing.write',
];

// Admin gets everything except billing.write
const ADMIN_EXCLUDED: AppPermission[] = ['billing.write'];

const MEMBER_PERMISSIONS: AppPermission[] = [
    'contacts.read', 'contacts.write',
    'conversations.read', 'conversations.write',
    'forms.read',
    'pipelines.read', 'pipelines.write',
    'calendars.read', 'calendars.write',
    'reputation.read',
    'automations.read',
    'settings.read',
    'team.read',
];

export const ROLE_PERMISSIONS: Record<AppRole, ReadonlySet<AppPermission>> = {
    owner: new Set(ALL_PERMISSIONS),
    admin: new Set(ALL_PERMISSIONS.filter(p => !ADMIN_EXCLUDED.includes(p))),
    member: new Set(MEMBER_PERMISSIONS),
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: AppRole, permission: AppPermission): boolean {
    return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function hasAllPermissions(role: AppRole, permissions: AppPermission[]): boolean {
    return permissions.every(p => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function hasAnyPermission(role: AppRole, permissions: AppPermission[]): boolean {
    return permissions.some(p => hasPermission(role, p));
}

/**
 * Get all permissions for a role as an array.
 */
export function getPermissions(role: AppRole): AppPermission[] {
    return [...(ROLE_PERMISSIONS[role] ?? [])];
}
