import { Elysia } from 'elysia';

import { getFolderTree } from './folders.service';
import { getFolderItems } from './folder-items.service';
import { getChildren, getFolderPath, getRoots } from './folder-tree.service';

function parseId(id: string): number {
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) throw new Error('Invalid folder id');
  return n;
}

export const folderRoutes = new Elysia({
  name: 'folders.routes',
})
  .get('/api/v1/folders/tree', async () => {
    return await getFolderTree();
  })
  .get('/api/v1/folders/root', async () => {
    return await getRoots();
  })
  .get('/api/v1/folders/:id/children', async ({ params, set }) => {
    try {
      return await getChildren(parseId(params.id));
    } catch (e) {
      set.status = 400;
      return {
        error: { code: 'BAD_REQUEST', message: e instanceof Error ? e.message : 'Bad request' },
      };
    }
  })
  .get('/api/v1/folders/:id/path', async ({ params, set }) => {
    try {
      return await getFolderPath(parseId(params.id));
    } catch (e) {
      set.status = 400;
      return {
        error: { code: 'BAD_REQUEST', message: e instanceof Error ? e.message : 'Bad request' },
      };
    }
  })
  .get('/api/v1/folders/:id/items', async ({ params, set }) => {
    try {
      return await getFolderItems(parseId(params.id));
    } catch (e) {
      set.status = 400;
      return {
        error: { code: 'BAD_REQUEST', message: e instanceof Error ? e.message : 'Bad request' },
      };
    }
  });
