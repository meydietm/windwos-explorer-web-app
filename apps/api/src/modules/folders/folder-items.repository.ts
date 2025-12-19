import { asc, eq } from 'drizzle-orm';

import { db } from '../../db';
import { files, folders } from '../../db/schema';

export async function findDirectSubfolders(parentId: number) {
  return db
    .select({ id: folders.id, parentId: folders.parentId, name: folders.name })
    .from(folders)
    .where(eq(folders.parentId, parentId))
    .orderBy(asc(folders.name));
}

export async function findFilesInFolder(folderId: number) {
  return db
    .select({
      id: files.id,
      folderId: files.folderId,
      name: files.name,
      size: files.size,
      mimeType: files.mimeType,
    })
    .from(files)
    .where(eq(files.folderId, folderId))
    .orderBy(asc(files.name));
}
