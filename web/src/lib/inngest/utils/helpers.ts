export function getByDotNotation(obj: Record<string, any> | null | undefined, path: string): any {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current: any = obj;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (current == null) return undefined;

        // Exact match
        if (current[part] !== undefined) {
            current = current[part];
            continue;
        }

        // CamelCase / snake_case fallbacks
        const camelCase = part.replace(/_([a-z])/g, (_, g) => g.toUpperCase());
        const snakeCase = part.replace(/[A-Z]/g, (g) => `_${g.toLowerCase()}`);

        if (current[camelCase] !== undefined) {
            current = current[camelCase];
        } else if (current[snakeCase] !== undefined) {
            current = current[snakeCase];
        } else if (part === "name" && (current.firstName || current.first_name)) {
            // Computed full name fallback
            const first = current.firstName || current.first_name || "";
            const last = current.lastName || current.last_name || "";
            return [first, last].filter(Boolean).join(" ").trim() || undefined;
        } else {
            return undefined;
        }
    }

    return current;
}

export function formatTemplate(template: string, data: Record<string, any>): string {
    if (!template) return "";
    return template.replace(/\{\{(.*?)\}\}/g, (match, path) => {
        const value = getByDotNotation(data, path.trim());
        return value !== undefined && value !== null ? String(value) : match;
    });
}

export function evaluateCondition(config: Record<string, any>, data: Record<string, any>): boolean {
    const { field, operator, value } = config;
    if (!field || !operator) return false;

    const actualValue = getByDotNotation(data, field);
    const strValue = String(actualValue ?? "").toLowerCase();
    const compareValue = String(value ?? "").toLowerCase();

    switch (operator) {
        case "equals":
            return strValue === compareValue;
        case "not_equals":
            return strValue !== compareValue;
        case "contains":
            return strValue.includes(compareValue);
        case "not_contains":
        case "does_not_contain":
            return !strValue.includes(compareValue);
        case "starts_with":
            return strValue.startsWith(compareValue);
        case "ends_with":
            return strValue.endsWith(compareValue);
        case "is_empty":
            return actualValue == null || strValue.trim() === "";
        case "is_not_empty":
            return actualValue != null && strValue.trim() !== "";
        case "greater_than":
            return Number(actualValue) > Number(value);
        case "less_than":
            return Number(actualValue) < Number(value);
        default:
            return false;
    }
}

export function convertToWaitTime(duration: number | string, unit: string): string {
    const parsed = typeof duration === "number" ? duration : parseInt(String(duration), 10);
    const num = isNaN(parsed) || parsed < 1 ? 1 : Math.floor(parsed);
    const u = unit === "minutes" ? "m" : unit === "seconds" ? "s" : unit === "hours" ? "h" : unit === "weeks" ? "w" : "d";
    return `${num}${u}`;
}
