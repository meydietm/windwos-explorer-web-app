import { asc, eq, ilike, sql } from 'drizzle-orm';

import { db } from '../../db';
import { files, folders } from '../../db/schema';

type SearchRow = {
  kind: "folder" | "file";
  id: string;
  name: string;
  parentId: string | null;
  folderId: string | null;
  size: number | null;
  mimeType: string | null;
};

export async function searchFolders(q: string, limit: number, offset: number) {
  return db
    .select({ id: folders.id, parentId: folders.parentId, name: folders.name })
    .from(folders)
    .where(ilike(folders.name, `%${q}%`))
    .orderBy(asc(folders.name))
    .limit(limit)
    .offset(offset);
}

export async function searchFiles(q: string, limit: number, offset: number) {
  return db
    .select({
      id: files.id,
      folderId: files.folderId,
      name: files.name,
      size: files.size,
      mimeType: files.mimeType,
    })
    .from(files)
    .where(ilike(files.name, `%${q}%`))
    .orderBy(asc(files.name))
    .limit(limit)
    .offset(offset);
}

// (Opsional) direct subfolders untuk lazy mode
export async function findChildrenFolders(parentId: number) {
  return db
    .select({ id: folders.id, parentId: folders.parentId, name: folders.name })
    .from(folders)
    .where(eq(folders.parentId, parentId))
    .orderBy(asc(folders.name));
}

export async function searchUnion(params: {
  q: string;
  limit: number;
  offset: number;
  includeFolders: boolean;
  includeFiles: boolean;
}): Promise<SearchRow[]> {
  const pattern = `%${params.q}%`;

  // Build SQL conditionally (avoid union part if excluded)
  if (params.includeFolders && !params.includeFiles) {
    return db.execute(
      sql<SearchRow>`
                select
                    'folder' as kind,
                    f.id::text as id,
                    f.name as name,
                    f.parent_id::text as "parentId",
                    null::text as "folderId",
                    null::int as "size",
                    null::text as "mimeType"
                from folders f
                where f.name ilike ${pattern}
                order by f.name asc
                limit ${params.limit} offset ${params.offset};
            `,
    );
  }

  if (!params.includeFolders && params.includeFiles) {
    return db.execute(
      sql<{
        kind: 'file';
        id: string;
        name: string;
        parentId: null;
        folderId: string;
        size: number | null;
        mimeType: string | null;
      }>`
                select
                    'file' as kind,
                    x.id::text as id,
                    x.name as name,
                    null::text as "parentId",
                    x.folder_id::text as "folderId",
                    x.size as size,
                    x.mime_type as "mimeType"
                from files x
                where x.name ilike ${pattern}
                order by x.name asc
                limit ${params.limit} offset ${params.offset};
            `,
    );
  }
  // both
  return db.execute(
    sql<{
      kind: 'folder' | 'file';
      id: string;
      name: string;
      parentId: string | null;
      folderId: string | null;
      size: number | null;
      mimeType: string | null;
    }>`
            select * from (
                select
                    'folder' as kind,
                    f.id::text as id,
                    f.name as name,
                    f.parent_id::text as "parentId",
                    null::text as "folderId",
                    null::int as "size",
                    null::text as "mimeType"
                from folders f
                where f.name ilike ${pattern}

                union all

                select
                    'file' as kind,
                    x.id::text as id,
                    x.name as name,
                    null::text as "parentId",
                    x.folder_id::text as "folderId",
                    x.size as size,
                    x.mime_type as "mimeType"
                from files x
                where x.name ilike ${pattern}
            ) t
            order by
                case when t.kind = 'folder' then 0 else 1 end,
                t.name asc
            limit ${params.limit} offset ${params.offset};
        `,
  );
}
