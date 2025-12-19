import type { SearchResponseDTO } from '@repo/shared';

import { searchUnion } from './search.repository';


export async function searchAll(params: {
  q: string;
  limit: number;
  offset: number;
  types: Array<'folders' | 'files'>;
}): Promise<SearchResponseDTO> {
  const q = params.q.trim();
  const includeFolders = params.types.includes('folders');
  const includeFiles = params.types.includes('files');

  const rows = await searchUnion({
    q,
    limit: params.limit,
    offset: params.offset,
    includeFolders,
    includeFiles,
  });

  return {
    q,
    limit: params.limit,
    offset: params.offset,
    results: rows.map((r) =>
      r.kind === 'folder'
        ? { kind: 'folder', id: r.id, name: r.name, parentId: r.parentId }
        : {
            kind: 'file',
            id: r.id,
            name: r.name,
            folderId: r.folderId!,
            size: r.size ?? null,
            mimeType: r.mimeType ?? null,
          },
    ),
  };
}
