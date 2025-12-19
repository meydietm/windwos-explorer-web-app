import type { FolderNodeDTO, FolderPathDTO } from '@repo/shared';

import { getPathToRoot, listChildren, listRoots } from './folder-tree.repository';

function toNodeDTO(r: {
  id: number;
  parentId: number | null;
  name: string;
  hasChildren: boolean;
}): FolderNodeDTO {
  return {
    id: String(r.id),
    parentId: r.parentId === null ? null : String(r.parentId),
    name: r.name,
    hasChildren: !!r.hasChildren,
  };
}

export async function getRoots(): Promise<FolderNodeDTO[]> {
  const rows = await listRoots();
  return rows.map(toNodeDTO);
}

export async function getChildren(folderId: number): Promise<FolderNodeDTO[]> {
  const rows = await listChildren(folderId);
  return rows.map(toNodeDTO);
}

export async function getFolderPath(folderId: number): Promise<FolderPathDTO> {
  const rows = await getPathToRoot(folderId);

  // CTE result: target->...->root, so reverse it
  const folders = [...rows]
    .map((r): { id: number; parentId: number | null; name: string; hasChildren: boolean } => ({
      id: Number(r.id),
      parentId: r.parent_id === null ? null : Number(r.parent_id),
      name: String(r.name),
      hasChildren: Boolean(r.has_children),
    }))
    .reverse()
    .map(toNodeDTO);

  return { folders };
}
