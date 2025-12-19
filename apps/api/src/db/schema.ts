import {
  bigint,
  bigserial,
  index,
  integer,
  pgTable,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const folders = pgTable(
  'folders',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    parentId: bigint('parent_id', { mode: 'number' }),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    parentIdx: index('folders_parent_id_idx').on(t.parentId),
  }),
);

export const files = pgTable(
  'files',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    folderId: bigint('folder_id', { mode: 'number' })
      .notNull()
      .references(() => folders.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    size: integer('size'),
    mimeType: varchar('mime_type', { length: 120 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    folderIdx: index('files_folder_id_idx').on(t.folderId),
  }),
);
