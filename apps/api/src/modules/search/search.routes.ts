import { Elysia } from 'elysia';

import { searchAll } from './search.service';
import { findChildrenFolders } from './search.repository';

function parseIntParam(x: string | undefined, def: number, min: number, max: number) {
  const n = x == null ? def : Number(x);
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

export const searchRoutes = new Elysia({ name: 'search.routes' })
  .get('/api/v1/search', async ({ query, set }) => {
    const q = String(query.q ?? '').trim();
    if (q.length < 2) {
      set.status = 400;
      return { error: { code: 'BAD_REQUEST', message: 'Query must be at least 2 characters' } };
    }

    const limit = parseIntParam(query.limit as string | undefined, 30, 1, 100);
    const offset = parseIntParam(query.offset as string | undefined, 0, 0, 1_000_000);

    const rawTypes = String(query.types ?? 'folders,files')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const types = rawTypes.filter(
      (t): t is 'folders' | 'files' => t === 'folders' || t === 'files',
    );

    const safeTypes = types.length ? types : (['folders', 'files'] as const);

    return searchAll({ q, limit, offset, types: [...safeTypes] });
  })

  // (Opsional) kesiapan lazy mode
  .get('/api/v1/folders/:id/children', async ({ params, set }) => {
    const folderId = Number(params.id);
    if (!Number.isInteger(folderId) || folderId <= 0) {
      set.status = 400;
      return { error: { code: 'BAD_REQUEST', message: 'Invalid folder id' } };
    }

    const rows = await findChildrenFolders(folderId);
    return rows.map((r) => ({
      id: String(r.id),
      parentId: r.parentId === null ? null : String(r.parentId),
      name: r.name,
    }));
  });
