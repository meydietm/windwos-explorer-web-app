export type Folder = {
  id: string;
  parentId: string | null;
  name: string;
  hasChildren?: boolean;
};

export type FolderPath = {
  folders: Folder[];
};

export type FileItem = {
  id: string;
  folderId: string;
  name: string;
  size: number | null;
  mimeType: string | null;
};

export type FolderItems = {
  folders: Folder[];
  files: FileItem[];
};

export type SearchResult =
  | { kind: 'folder'; id: string; name: string; parentId: string | null }
  | {
      kind: 'file';
      id: string;
      name: string;
      folderId: string;
      size: number | null;
      mimeType: string | null;
    };

export type SearchResponse = {
  q: string;
  limit: number;
  offset: number;
  results: SearchResult[];
};
