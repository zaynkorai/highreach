export function getByDotNotation(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((prev, curr) => prev?.[curr], obj);
}

export function formatTemplate(template: string, data: Record<string, any>): string {
    if (!template) return "";
    return template.replace(/\{\{(.*?)\}\}/g, (match, path) => {
        const value = getByDotNotation(data, path.trim());
        return value !== undefined ? String(value) : match;
    });
}

export function evaluateCondition(config: Record<string, any>, data: Record<string, any>): boolean {
    const { field, operator, value } = config;
    if (!field || !operator) return false;

    const actualValue = getByDotNotation(data, field);
    const strValue = String(actualValue ?? "").toLowerCase();
    const compareValue = String(value ?? "").toLowerCase();

    switch (operator) {
        case "equals": return strValue === compareValue;
        case "not_equals": return strValue !== compareValue;
        case "contains": return strValue.includes(compareValue);
        case "does_not_contain": return !strValue.includes(compareValue);
        case "starts_with": return strValue.startsWith(compareValue);
        case "is_empty": return actualValue == null || strValue.trim() === "";
        case "is_not_empty": return actualValue != null && strValue.trim() !== "";
        default: return false;
    }
}

export function convertToWaitTime(duration: number, unit: string): string {
    const u = unit === "minutes" ? "m" : unit === "seconds" ? "s" : unit === "hours" ? "h" : "d";
    return `${duration}${u}`;
}
