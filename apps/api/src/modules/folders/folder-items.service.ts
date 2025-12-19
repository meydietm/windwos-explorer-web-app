import type { FolderItemsDTO } from '@repo/shared';

import { findDirectSubfolders, findFilesInFolder } from './folder-items.repository';

export async function getFolderItems(folderId: number): Promise<FolderItemsDTO> {
  const [subfolders, folderFiles] = await Promise.all([
    findDirectSubfolders(folderId),
    findFilesInFolder(folderId),
  ]);

  return {
    folders: subfolders.map((f) => ({
      id: String(f.id),
      parentId: f.parentId === null ? null : String(f.parentId),
      name: f.name,
    })),
    files: folderFiles.map((x) => ({
      id: String(x.id),
      folderId: String(x.folderId),
      name: x.name,
      size: x.size ?? null,
      mimeType: x.mimeType ?? null,
    })),
  };
}
