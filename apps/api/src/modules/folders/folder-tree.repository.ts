import { sql } from 'drizzle-orm';

import { db } from '../../db';

export type FolderRow = {
  id: number;
  parentId: number | null;
  name: string;
  hasChildren: boolean;
};

export async function listRoots(): Promise<FolderRow[]> {
  return db.execute(sql<FolderRow>`
        select
            f.id as id,
            f.parent_id as "parentId",
            f.name as name,
            exists (
                select 1
                from folders c
                where c.parent_id = f.id
            ) as "hasChildren"
        from folders f
        where f.parent_id is null
        order by f.name asc;
    `);
}

export async function listChildren(parentId: number): Promise<FolderRow[]> {
  return db.execute(sql<FolderRow>`
        select
            f.id as id,
            f.parent_id as "parentId",
            f.name as name,
            exists (
                select 1
                from folders c
                where c.parent_id = f.id
            ) as "hasChildren"
        from folders f
        where f.parent_id = ${parentId}
        order by f.name asc;
    `);
}

export async function getPathToRoot(folderId: number) {
  // Recursive CTE: start from node, walk to parent until root
  const rows = await db.execute(
    sql<{
      id: number;
      parent_id: number | null;
      name: string;
      has_children: boolean;
    }>`
            with recursive p as (
                select f.id, f.parent_id, f.name,
                    exists (select 1 from folders c where c.parent_id = f.id) as has_children
                from folders f
                where f.id = ${folderId}

                union all

                select parent.id, parent.parent_id, parent.name,
                    exists (select 1 from folders c where c.parent_id = parent.id) as has_children
                from folders parent
                join p on p.parent_id = parent.id
            )
            select * from p;
        `,
  );

  return rows;
}
