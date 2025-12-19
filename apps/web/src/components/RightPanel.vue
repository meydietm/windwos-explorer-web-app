<script setup lang="ts">
import { computed, watchEffect, ref } from 'vue';
import {
  Folder as FolderIcon,
  File as FileIcon,
  FileText,
  FileSpreadsheet,
  Search as SearchIcon,
  AlertTriangle,
} from "lucide-vue-next";

import { useExplorerApi } from '../composables/useExplorerApi';
import type { FileItem, Folder, FolderItems, SearchResult } from '../types/explorer';

type Props = {
  selectedFolder: Folder | null;
  breadcrumb: Folder[];

  globalQuery: string;
  searchLoading: boolean;
  searchError: string | null;
  searchResults: SearchResult[];
  searchHasMore: boolean;
};

const emit = defineEmits<{
  (e: 'open-folder', id: string): void;
  (e: 'load-more-search'): void;
}>();

const props = defineProps<Props>();

const api = useExplorerApi();

const loading = ref(false);
const error = ref<string | null>(null);
const items = ref<FolderItems>({ folders: [], files: [] });

const query = ref('');
const sort = ref<'name-asc' | 'name-desc'>('name-asc');

function sortByName<T extends { name: string }>(arr: T[]): T[] {
  const out = [...arr];
  out.sort((a, b) =>
    sort.value === 'name-asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
  );
  return out;
}

const filteredFolders = computed(() => {
  const q = query.value.trim().toLowerCase();
  const base = q
    ? items.value.folders.filter((f) => f.name.toLowerCase().includes(q))
    : items.value.folders;
  return sortByName(base);
});

const filteredFiles = computed(() => {
  const q = query.value.trim().toLowerCase();
  const base = q
    ? items.value.files.filter((f) => f.name.toLowerCase().includes(q))
    : items.value.files;
  return sortByName(base);
});

function prettySize(n: number | null): string {
  if (n == null) return '';
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

function iconForFile(f: FileItem): string {
  const name = f.name.toLowerCase();
  if (name.endsWith('.pdf')) return '📄';
  if (name.endsWith('.doc') || name.endsWith('.docx')) return '📝';
  if (name.endsWith('.csv')) return '🧾';
  if (name.endsWith('.md') || name.endsWith('.txt')) return '📄';
  if (name.endsWith('.exe')) return '🧰';
  return '📄';
}

function fileIconFor(mime?: string | null) {
  if (!mime) return FileIcon;
  const m = mime.toLowerCase();
  if (m.includes("pdf")) return FileText;
  if (m.includes("csv")) return FileSpreadsheet;
  return FileIcon;
}

watchEffect(async () => {
  if (props.globalQuery.trim().length >= 2) {
    // search mode aktif → jangan fetch items folder
    return;
  }
  // first load requirement: if no selected folder, right panel empty
  if (!props.selectedFolder) {
    items.value = { folders: [], files: [] };
    error.value = null;
    loading.value = false;
    query.value = '';
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    items.value = await api.getFolderItems(props.selectedFolder.id);
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error';
    items.value = { folders: [], files: [] };
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-3 space-y-3">
    <div class="text-sm font-semibold text-slate-900">Contents</div>

    <!-- SEARCH MODE -->
    <div v-if="props.globalQuery.trim().length >= 2" data-testid="search-results" class="space-y-3">
      <div class="text-sm text-slate-600">
        Search results for: <span class="font-semibold text-slate-900">{{ props.globalQuery }}</span>
      </div>

      <div v-if="props.searchLoading" class="text-sm text-slate-500">
        Searching…
      </div>

      <div
        v-else-if="props.searchError"
        class="rounded-lg border border-red-200 bg-red-50 p-3 text-red-900"
      >
        <div class="flex items-start gap-2">
          <AlertTriangle class="h-4 w-4 mt-0.5" />
          <div>
            <div class="font-semibold">Search failed</div>
            <div class="text-sm opacity-90">{{ props.searchError }}</div>
          </div>
        </div>
      </div>

      <div
        v-else-if="props.searchResults.length === 0"
        class="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600"
      >
        No results.
      </div>

      <div v-else class="space-y-3">
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <button
            data-testid="search-item"
            v-for="r in props.searchResults"
            :key="r.kind + ':' + r.id"
            type="button"
            class="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
            @click="emit('open-folder', r.kind === 'folder' ? r.id : r.folderId)"
            @keydown.enter.prevent="emit('open-folder', r.kind === 'folder' ? r.id : r.folderId)"
          >
            <div class="mt-0.5">
              <FolderIcon v-if="r.kind === 'folder'" class="h-5 w-5 text-slate-500" />
              <component
                v-else
                :is="fileIconFor((r as any).mimeType ?? null)"
                class="h-5 w-5 text-slate-500"
              />
            </div>

            <div class="min-w-0">
              <div class="truncate text-sm font-medium text-slate-900">
                {{ r.name }}
              </div>
              <div class="text-xs text-slate-500">
                {{ r.kind === 'folder' ? 'Folder' : 'File' }}
              </div>
            </div>
          </button>
        </div>

        <div v-if="props.searchHasMore" class="flex justify-center">
          <button
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
            data-testid="search-load-more"
            type="button"
            @click="emit('load-more-search')"
          >
            Load more
          </button>
        </div>
      </div>
    </div>

    <!-- BROWSE MODE -->
    <div v-else class="space-y-3">
      <div
        v-if="!props.selectedFolder"
        class="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600"
      >
        Pilih folder di panel kiri untuk menampilkan direct items di panel kanan.
      </div>

      <div v-else class="space-y-3">
        <!-- breadcrumb -->
        <div class="flex flex-wrap items-center gap-2 text-sm text-slate-700">
          <template v-for="(b, idx) in props.breadcrumb" :key="b.id">
            <span class="truncate max-w-60">{{ b.name }}</span>
            <span v-if="idx < props.breadcrumb.length - 1" class="text-slate-400">›</span>
          </template>
        </div>

        <!-- toolbar -->
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div class="relative flex-1">
            <SearchIcon class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              v-model="query"
              class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Search in this folder…"
            />
          </div>

          <select
            v-model="sort"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="name-asc">Name (A → Z)</option>
            <option value="name-desc">Name (Z → A)</option>
          </select>
        </div>

        <div v-if="loading" class="text-sm text-slate-500">Loading items…</div>

        <div
          v-else-if="error"
          class="rounded-lg border border-red-200 bg-red-50 p-3 text-red-900"
        >
          <div class="flex items-start gap-2">
            <AlertTriangle class="h-4 w-4 mt-0.5" />
            <div>
              <div class="font-semibold">Failed to load items</div>
              <div class="text-sm opacity-90">{{ error }}</div>
            </div>
          </div>
        </div>

        <div v-else>
          <div
            v-if="filteredFolders.length === 0 && filteredFiles.length === 0"
            class="rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600"
          >
            No items.
          </div>

          <div v-else class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <!-- folders -->
            <button
              v-for="f in filteredFolders"
              :key="f.id"
              type="button"
              class="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              @dblclick="emit('open-folder', f.id)"
              @keydown.enter.prevent="emit('open-folder', f.id)"
            >
              <FolderIcon class="h-5 w-5 text-slate-500 mt-0.5" />
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-slate-900">{{ f.name }}</div>
                <div class="text-xs text-slate-500">Folder</div>
              </div>
            </button>

            <!-- files -->
            <div
              v-for="x in filteredFiles"
              :key="x.id"
              class="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
            >
              <component :is="fileIconFor(x.mimeType ?? null)" class="h-5 w-5 text-slate-500 mt-0.5" />
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-slate-900">{{ x.name }}</div>
                <div class="text-xs text-slate-500">{{ prettySize(x.size) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<!-- <style scoped>
.wrap {
  padding: 12px;
}
.title {
  font-weight: 700;
  margin-bottom: 8px;
}

.breadcrumb {
  opacity: 0.9;
  margin-bottom: 10px;
  font-size: 13px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sep {
  opacity: 0.7;
  margin: 0 6px;
}

.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.search {
  flex: 1;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: transparent;
  color: inherit;
}

.select {
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: transparent;
  color: inherit;
}

.muted {
  opacity: 0.75;
  font-size: 14px;
}

.empty {
  border: 1px dashed rgba(148, 163, 184, 0.5);
  border-radius: 10px;
  padding: 12px;
  font-size: 14px;
  opacity: 0.85;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.card {
  display: grid;
  grid-template-columns: 30px 1fr;
  grid-template-rows: auto auto;
  column-gap: 10px;
  row-gap: 2px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 12px;
}

.icon {
  grid-row: 1 / span 2;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.meta {
  opacity: 0.7;
  font-size: 12px;
}

.error {
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 10px;
  padding: 12px;
}
.error-title {
  font-weight: 800;
  margin-bottom: 6px;
}
.error-msg {
  opacity: 0.9;
}
.more {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}
.btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
</style> -->
