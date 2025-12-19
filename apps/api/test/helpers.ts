export async function readJson(res: Response) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(`Invalid JSON. status=${res.status} body=${text.slice(0, 500)}`);
    }
}

export type Resource = { kind?: string; id: string | number };

export function key(r: Resource): string {
    return `${r.kind ?? 'x'}:${r.id}`;
}