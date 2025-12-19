import { eq } from 'drizzle-orm';
import { db, sql } from './index';
import { files, folders } from './schema';

/**
 * Seed folders with a small-but-deep tree.
 *
 * Goals (for technical test):
 * - multiple roots
 * - varying breadth
 * - depth 6+
 */

async function createFolder(name: string, parentId: number | null): Promise<number> {
  const rows = await db
    .insert(folders)
    .values({ name, parentId })
    .returning({ id: folders.id });

  const row = rows[0];
  if (!row) throw new Error(`Insert folder failed: ${name}`);
  return row.id;
}

async function createChildren<const Names extends readonly string[]>(
  parentId: number,
  names: Names
): Promise<{ [K in keyof Names]: number }> {
  const rows = await db
    .insert(folders)
    .values(names.map((name) => ({ name, parentId })))
    .returning({ id: folders.id, name: folders.name });

  const byName = new Map(rows.map((r) => [r.name, r.id] as const));

  const ids = names.map((n) => byName.get(n));
  const missing = names.filter((_, i) => ids[i] === undefined);

  if (missing.length) {
    throw new Error(`Insert children failed for parentId=${parentId}. Missing: ${missing.join(", ")}`);
  }

  return ids as unknown as { [K in keyof Names]: number };
}

async function main() {
  // Reset table for repeatable seeds.
  await sql`TRUNCATE TABLE folders RESTART IDENTITY CASCADE`;

  // Root level
  const thisPc = await createFolder('This PC', null);
  const workspaces = await createFolder('Workspaces', null);
  const network = await createFolder('Network', null);
  const recycleBin = await createFolder('Recycle Bin', null);

  // This PC -> disks
  const [diskC, diskD] = await createChildren(thisPc, ['Local Disk (C:)', 'Data (D:)'] as const);

  // C: deep path (depth 7)
  const users = await createFolder('Users', diskC);
  const meydie = await createFolder('Meydie', users);
  const [documents, downloads, desktop] = await createChildren(meydie, [
    'Documents',
    'Downloads',
    'Desktop',
  ] as const);
  const year2025 = await createFolder('2025', downloads);
  const december = await createFolder('December', year2025);
  await createChildren(december, ['Invoices', 'Screenshots', 'Temp'] as const);
  await createChildren(documents, ['Thesis', 'CV', 'Certificates', 'Notes'] as const);
  await createChildren(desktop, ['Shortcuts', 'Wallpapers'] as const);

  const thisPcId = (
    await db.select({ id: folders.id }).from(folders).where(eq(folders.name, 'This PC'))
  )[0]?.id;

  if (thisPcId) {
    const desktopId = (
      await db.select({ id: folders.id }).from(folders).where(eq(folders.name, 'Desktop'))
    )[0]?.id;
    const documentsId = (
      await db.select({ id: folders.id }).from(folders).where(eq(folders.name, 'Documents'))
    )[0]?.id;
    const downloadsId = (
      await db.select({ id: folders.id }).from(folders).where(eq(folders.name, 'Downloads'))
    )[0]?.id;

    const seedFiles: Array<{
      folderId: number;
      name: string;
      size?: number | null;
      mimeType?: string | null;
    }> = [];

    if (desktopId) {
      seedFiles.push(
        { folderId: desktopId, name: 'todo.txt', size: 1800, mimeType: 'text/plain' },
        { folderId: desktopId, name: 'meeting-notes.md', size: 5400, mimeType: 'text/markdown' },
      );
    }

    if (documentsId) {
      seedFiles.push(
        { folderId: documentsId, name: 'proposal.pdf', size: 842_120, mimeType: 'application/pdf' },
        {
          folderId: documentsId,
          name: 'resume.docx',
          size: 144_000,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        },
      );
    }

    if (downloadsId) {
      seedFiles.push(
        {
          folderId: downloadsId,
          name: 'installer.exe',
          size: 25_600_000,
          mimeType: 'application/octet-stream',
        },
        { folderId: downloadsId, name: 'dataset.csv', size: 3_200_000, mimeType: 'text/csv' },
      );

      const BATCH = 500;

      function chunk<T>(arr: T[], size: number) {
        const out: T[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      }

      if (downloadsId) {
        // subfolders
        const extraFolders = Array.from({ length: 60 }).map((_, i) => ({
          parentId: downloadsId,
          name: `Batch-${String(i + 1).padStart(2, '0')}`,
        }));

        await db.insert(folders).values(extraFolders);

        // files untuk load more
        const manyFiles: Array<{
          folderId: number;
          name: string;
          size?: number | null;
          mimeType?: string | null;
        }> = [];

        for (let i = 1; i <= 500; i++) {
          manyFiles.push({
            folderId: downloadsId,
            name: `report-${String(i).padStart(4, '0')}.pdf`,
            size: 200_000 + i * 10,
            mimeType: 'application/pdf',
          });
        }

        for (let i = 1; i <= 300; i++) {
          manyFiles.push({
            folderId: downloadsId,
            name: `dataset-${String(i).padStart(4, '0')}.csv`,
            size: 50_000 + i * 15,
            mimeType: 'text/csv',
          });
        }

        for (const part of chunk(manyFiles, BATCH)) {
          await db.insert(files).values(part);
        }
      }
    }

    if (seedFiles.length) {
      await db.insert(files).values(seedFiles);
    }
  }

  // D: breadth (projects)
  const projects = await createFolder('Projects', diskD);
  await createChildren(projects, [
    'explorer-like-web',
    'laravel-backoffice',
    'sentiment-lstm-research',
    'aqua-sense-iot',
    'portfolio',
    'experiments',
    'docs',
  ] as const);

  // Workspaces -> multiple nested groups
  const [personal, freelance, campus] = await createChildren(workspaces, [
    'Personal',
    'Freelance',
    'Campus',
  ] as const);
  await createChildren(personal, ['Finance', 'Learning', 'Photos'] as const);
  const [clientsA, clientsB] = await createChildren(freelance, ['Clients-A', 'Clients-B'] as const);
  await createChildren(clientsA, ['Branding', 'WebApps', 'Invoices'] as const);
  await createChildren(clientsB, ['Drafts', 'Handover'] as const);
  const [semester5, semester6] = await createChildren(campus, ['Semester-5', 'Semester-6'] as const);
  await createChildren(semester5, ['ML', 'OS', 'Database', 'Networks'] as const);
  await createChildren(semester6, ['Research', 'Thesis', 'Internship'] as const);

  // Network -> a couple nodes
  const [nas, shared, printers] = await createChildren(network, ['NAS', 'Shared', 'Printers'] as const);
  await createChildren(nas, ['Backups', 'Media', 'Archive'] as const);
  await createChildren(shared, ['Team', 'Public'] as const);
  await createChildren(printers, ['OfficePrinter-01', 'OfficePrinter-02'] as const);

  // Recycle bin intentionally empty (but exists as a root)
  void recycleBin;

  const rows = (await db.execute('SELECT COUNT(*)::text as count FROM folders')) as { count: string }[];

  const count = Number(rows[0]?.count ?? "0");
  console.log(`✅ Seed complete. folders=${count}`);
  await sql.end({ timeout: 5 });
}

main().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  try {
    await sql.end({ timeout: 5 });
  } catch {
    // ignore
  }
  process.exit(1);
});
