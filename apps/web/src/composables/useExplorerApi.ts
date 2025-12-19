import type { Folder, FolderItems, FolderPath, SearchResponse } from '../types/explorer';

type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
};

export function useExplorerApi() {
  async function parseOrThrow<T>(res: Response): Promise<T> {
    if (!res.ok) {
      let msg = `Request failed (${res.status})`;
      try {
        const body = (await res.json()) as ApiError;
        if (body?.error?.message) msg = body.error.message;
      } catch {
        // ignore
      }
      throw new Error(msg);
    }
    return (await res.json()) as T;
  }

  async function getTree(): Promise<Folder[]> {
    const res = await fetch('/api/v1/folders/tree', {
      method: 'GET',
      headers: {
        accept: 'application/json',
      },
    });
    return parseOrThrow<Folder[]>(res);
  }

  async function getFolderItems(folderId: string): Promise<FolderItems> {
    const res = await fetch(`/api/v1/folders/${folderId}/items`, {
      method: 'GET',
      headers: { accept: 'application/json' },
    });
    return parseOrThrow<FolderItems>(res);
  }

  async function search(q: string, limit = 30, offset = 0): Promise<SearchResponse> {
    const u = new URL('/api/v1/search', window.location.origin);
    u.searchParams.set('q', q);
    u.searchParams.set('limit', String(limit));
    u.searchParams.set('offset', String(offset));

    const res = await fetch(u.pathname + u.search, {
      method: 'GET',
      headers: { accept: 'application/json' },
    });

    return parseOrThrow<SearchResponse>(res);
  }

  async function getRoots(): Promise<Folder[]> {
    const res = await fetch('/api/v1/folders/root', {
      headers: { accept: 'application/json' },
    });
    return parseOrThrow<Folder[]>(res);
  }

  async function getChildren(folderId: string): Promise<Folder[]> {
    const res = await fetch(`/api/v1/folders/${folderId}/children`, {
      headers: { accept: 'application/json' },
    });
    return parseOrThrow<Folder[]>(res);
  }

  async function getPath(folderId: string): Promise<FolderPath> {
    const res = await fetch(`/api/v1/folders/${folderId}/path`, {
      headers: { accept: 'application/json' },
    });
    return parseOrThrow<FolderPath>(res);
  }

  return { getTree, getFolderItems, search, getRoots, getChildren, getPath };
}
