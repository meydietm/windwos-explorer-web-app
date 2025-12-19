import { describe, expect, it } from 'bun:test';
import { eq } from 'drizzle-orm';

import { app } from '../src/index';
import { db } from '../src/db';
import { folders } from '../src/db/schema';

describe('folders path', () => {
  it('returns root -> target path', async () => {
    const downloads = await db
      .select({ id: folders.id })
      .from(folders)
      .where(eq(folders.name, 'Downloads'))
      .limit(1);

    expect(downloads[0]?.id).toBeTruthy();

    const res = await app.handle(
      new Request(`http://localhost/api/v1/folders/${downloads[0]!.id}/path`),
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.folders)).toBe(true);
    expect(json.folders.at(-1).name).toBe('Downloads');
  });
});
