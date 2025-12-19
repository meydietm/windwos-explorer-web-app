/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from 'bun:test';

import { app } from '../src/index';

describe('search pagination', () => {
  it('supports limit/offset without duplicates across pages', async () => {
    const q = 'report';

    const res1 = await app.handle(
      new Request(`http://localhost/api/v1/search?q=${q}&limit=30&offset=0`),
    );
    expect(res1.status).toBe(200);
    const p1 = await res1.json();

    const res2 = await app.handle(
      new Request(`http://localhost/api/v1/search?q=${q}&limit=30&offset=30`),
    );
    expect(res2.status).toBe(200);
    const p2 = await res2.json();

    const key = (r: any) => `${r.kind}:${r.id}`;
    const s1 = new Set(p1.results.map(key));
    const overlap = p2.results.filter((r: any) => s1.has(key(r)));

    // overlap boleh terjadi kalau dataset kecil, tapi dengan seed besar harusnya 0
    expect(overlap.length).toBe(0);
  });
});
