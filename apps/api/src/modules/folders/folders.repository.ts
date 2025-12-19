import { asc } from 'drizzle-orm';

import { db } from '../../db';
import { folders } from '../../db/schema';

export type FolderRow = {
  id: number;
  parentId: number | null;
  name: string;
};

/**
 * Repository layer: DB queries only (no business logic).
 */

export async function findAllFolders(): Promise<FolderRow[]> {
  const rows = await db
    .select({
      id: folders.id,
      parentId: folders.parentId,
      name: folders.name,
    })
    .from(folders)
    .orderBy(asc(folders.id));

  return rows;
}
