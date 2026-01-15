export function sanitizeString(str: string) {
    return str.replace(/[<>:"/\\|?*]/g, "_");
}
