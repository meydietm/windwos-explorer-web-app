import { describe, expect, it } from 'bun:test';

import { app } from '../src/index';
import { readJson } from './helpers';

describe('folders path & items', () => {
    it('GET /api/v1/folders/:id/path returns root -> target path', async () => {
        // ambil satu root dulu
        const rootsRes = await app.handle(new Request('http://localhost/api/v1/folders/root'));
        const roots = await readJson(rootsRes);
        expect(roots.length).toBeGreaterThan(0);

        const targetId = roots[0].id;

        const res = await app.handle(new Request(`http://localhost/api/v1/folders/${targetId}/path`));
        expect(res.status).toBe(200);

        const json = await readJson(res);
        expect(Array.isArray(json.folders)).toBe(true);
        expect(json.folders.length).toBeGreaterThan(0);
        expect(json.folders.at(-1).id).toBe(String(targetId));
    });

    it('GET /api/v1/folders/:id/items returns folders + files arrays', async () => {
        const rootsRes = await app.handle(new Request('http://localhost/api/v1/folders/root'));
        const roots = await readJson(rootsRes);
        expect(roots.length).toBeGreaterThan(0);

        const id = roots[0].id;

        const res = await app.handle(new Request(`http://localhost/api/v1/folders/${id}/items`));
        expect(res.status).toBe(200);

        const json = await readJson(res);
        expect(Array.isArray(json.folders)).toBe(true);
        expect(Array.isArray(json.files)).toBe(true);
    });
});