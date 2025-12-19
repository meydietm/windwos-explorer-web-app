export type FolderDTO = {
  id: string;
  parentId: string | null;
  name: string;
};

export type FolderNodeDTO = FolderDTO & {
  hasChildren: boolean;
};

export type FolderPathDTO = {
  folders: FolderNodeDTO[]; // root -> target
};

export type FileDTO = {
  id: string;
  folderId: string;
  name: string;
  size: number | null;
  mimeType: string | null;
};

export type FolderItemsDTO = {
  folders: FolderDTO[];
  files: FileDTO[];
};

export type SearchResultDTO =
  | { kind: 'folder'; id: string; name: string; parentId: string | null }
  | {
      kind: 'file';
      id: string;
      name: string;
      folderId: string;
      size: number | null;
      mimeType: string | null;
    };

export type SearchResponseDTO = {
  q: string;
  limit: number;
  offset: number;
  results: SearchResultDTO[];
};

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
