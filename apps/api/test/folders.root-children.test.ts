import { describe, expect, it } from 'bun:test';

import { app } from '../src/index';
import { readJson } from './helpers';

describe('folders scalable endpoints', () => {
    it('GET /api/v1/folders/root returns roots with hasChildren boolean', async () => {
        const res = await app.handle(new Request('http://localhost/api/v1/folders/root'));
        expect(res.status).toBe(200);

        const roots = await readJson(res);
        expect(Array.isArray(roots)).toBe(true);

        if (roots.length > 0) {
            const r0 = roots[0];
            expect(typeof r0.id).toBe('string');
            expect(r0.parentId).toBe(null);
            expect(typeof r0.name).toBe('string');
            expect(typeof r0.hasChildren).toBe('boolean');
        }
    });

    it('GET /api/v1/folders/:id/children works for first root and hasChildren is boolean', async () => {
        const r = await app.handle(new Request('http://localhost/api/v1/folders/root'));
        const roots = await readJson(r);
        expect(roots.length).toBeGreaterThan(0);

        const rootId = roots[0].id;

        const res = await app.handle(new Request(`http://localhost/api/v1/folders/${rootId}/children`));
        expect(res.status).toBe(200);

        const kids = await readJson(res);
        expect(Array.isArray(kids)).toBe(true);

        for (const k of kids.slice(0, 5)) {
            expect(k.parentId).toBe(String(rootId));
            expect(typeof k.hasChildren).toBe('boolean');
        }
    });
});