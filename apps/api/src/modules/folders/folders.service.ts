import type { FolderDTO } from '@repo/shared';

import { findAllFolders } from './folders.repository';

/**
 * Service layer: business logic + mapping to DTOs.
 */

export async function getFolderTree(): Promise<FolderDTO[]> {
  const rows = await findAllFolders();

  // We intentionally return a flat list.
  // The web app can build an in-memory tree efficently from this.
  return rows.map((r) => ({
    id: String(r.id),
    parentId: r.parentId === null ? null : String(r.parentId),
    name: r.name,
  }));
}
