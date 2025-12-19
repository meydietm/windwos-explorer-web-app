<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import ExplorerShell from './components/ExplorerShell.vue';
import LeftPanel from './components/LeftPanel.vue';
import RightPanel from './components/RightPanel.vue';
import { useExplorerApi } from './composables/useExplorerApi';
import type { Folder } from './types/explorer';
import TopBar from './components/TopBar.vue';
import type { SearchResult } from './types/explorer';
import { useRoute, useRouter } from 'vue-router';
import { watch } from 'vue';

const TREE_MODE = (import.meta.env.VITE_TREE_MODE as 'full' | 'lazy' | undefined) ?? 'full';

const api = useExplorerApi();

const loading = ref(false);
const error = ref<string | null>(null);
const folders = ref<Folder[]>([]);

// requirement: right panel empty on first load
const selectedId = ref<string | null>(null);

// expand/collapse state (immutable updates supaya reactivity aman)
const expanded = ref<Set<string>>(new Set());

const globalQuery = ref('');
const searchLoading = ref(false);
const searchError = ref<string | null>(null);
const searchResults = ref<SearchResult[]>([]);
const SEARCH_LIMIT = 30;
const searchOffset = ref(0);
const searchHasMore = ref(false);

const route = useRoute();
const router = useRouter();

const isSyncingFromRoute = ref(false);

let searchSeq = 0;
let t: ReturnType<typeof setTimeout> | null = null;

function resetSearchState() {
  searchOffset.value = 0;
  searchResults.value = [];
  searchHasMore.value = false;
}

async function loadMoreSearch() {
  const q = globalQuery.value.trim();
  if (q.length < 2) return;
  if (searchLoading.value) return;
  if (!searchHasMore.value) return;

  searchLoading.value = true;
  searchError.value = null;

  try {
    const res = await api.search(q, SEARCH_LIMIT, searchOffset.value);
    // append + dedupe by kind:id (defensive)
    const key = (r: SearchResult) => `${r.kind}:${r.id}`;
    const existing = new Set(searchResults.value.map(key));
    const merged = [...searchResults.value];

    for (const r of res.results) {
      if (!existing.has(key(r))) {
        existing.add(key(r));
        merged.push(r);
      }
    }

    searchResults.value = merged;
    searchOffset.value += res.results.length;
    searchHasMore.value = res.results.length === SEARCH_LIMIT;
  } catch (e) {
    searchError.value = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    searchLoading.value = false;
  }
}

function clearSearch() {
  globalQuery.value = '';
}

const childrenByParent = ref<Map<string | null, Folder[]>>(new Map());

const byId = computed(() => {
  const m = new Map<string, Folder>();
  for (const f of folders.value) m.set(f.id, f);
  return m;
});

const roots = computed(() => childrenByParent.value.get(null) ?? []);

const childrenLoading = ref<Set<string>>(new Set());

async function loadChildrenLazy(parentId: string) {
  if (childrenByParent.value.has(parentId)) return;
  if (childrenLoading.value.has(parentId)) return;

  childrenLoading.value = new Set(childrenLoading.value).add(parentId);
  try {
    const kids = await api.getChildren(parentId);

    // merge into folders list + map
    const existing = new Set(folders.value.map((x) => x.id));
    const merged = [...folders.value];
    for (const k of kids) {
      if (!existing.has(k.id)) {
        existing.add(k.id);
        merged.push(k);
      }
    }
    folders.value = merged;

    const next = new Map(childrenByParent.value);
    next.set(parentId, kids);
    childrenByParent.value = next;
  } finally {
    const n = new Set(childrenLoading.value);
    n.delete(parentId);
    childrenLoading.value = n;
  }
}

function buildChildrenMap(list: Folder[]): Map<string | null, Folder[]> {
  const m = new Map<string | null, Folder[]>();

  for (const f of list) {
    const key = f.parentId;
    const arr = m.get(key);
    if (arr) arr.push(f);
    else m.set(key, [f]);
  }

  for (const arr of m.values()) arr.sort((a, b) => a.name.localeCompare(b.name));
  return m;
}

async function ensurePathLazy(targetId: string) {
  const path = await api.getPath(targetId);
  const nodes = path.folders;
  if (nodes.length === 0) return;

  // ensure roots
  if (!childrenByParent.value.has(null)) {
    const rs = await api.getRoots();
    childrenByParent.value = new Map([[null, rs]]);
    folders.value = rs;
  }

  // load each ancestor children so target becomes visible
  for (let i = 0; i < nodes.length - 1; i++) {
    const cur = nodes[i] as unknown as Folder;
    expanded.value = new Set(expanded.value).add(cur.id);
    await loadChildrenLazy(cur.id);
  }

  // also ensure target is in folders list
  const existing = new Set(folders.value.map((x) => x.id));
  const merged = [...folders.value];
  for (const n of nodes) {
    if (!existing.has(n.id)) {
      existing.add(n.id);
      merged.push(n);
    }
  }
  folders.value = merged;
}

async function openFolder(id: string) {
  selectedId.value = id;

  if (TREE_MODE === 'full') {
    expandToFolder(id);
    return;
  }

  await ensurePathLazy(id);
}

const selectedFolder = computed(() => {
  if (!selectedId.value) return null;
  return byId.value.get(selectedId.value) ?? null;
});

const selectedChildren = computed(() => {
  if (!selectedId.value) return [];
  return childrenByParent.value.get(selectedId.value) ?? [];
});

const breadcrumb = computed(() => {
  if (!selectedFolder.value) return [] as Folder[];

  const path: Folder[] = [];
  let cur: Folder | null = selectedFolder.value;

  // safety counter to avoid infinite loop if bad data
  let guard = 0;
  while (cur && guard++ < 1000) {
    path.push(cur);
    if (!cur.parentId) break;
    cur = byId.value.get(cur.parentId) ?? null;
  }

  return path.reverse();
});

function selectFolder(id: string) {
  selectedId.value = id;
}

async function toggleFolder(id: string) {
  const next = new Set(expanded.value);
  const willExpand = !next.has(id);
  if (willExpand) next.add(id);
  else next.delete(id);
  expanded.value = next;

  if (TREE_MODE === 'lazy' && willExpand) {
    await loadChildrenLazy(id);
  }
}

function expandToFolder(id: string) {
  const next = new Set(expanded.value);

  let cur = byId.value.get(id) ?? null;
  let guard = 0;

  // expand semua ancestor agar target terlihat
  while (cur && guard++ < 1000) {
    if (cur.parentId) next.add(cur.parentId);
    if (!cur.parentId) break;
    cur = byId.value.get(cur.parentId) ?? null;
  }

  expanded.value = next;
}

function openFolderFromSearch(id: string) {
  // pilih folder target
  selectedId.value = id;

  // expand ancestor
  expandToFolder(id);

  // optional UX: clear search setelah open
  clearSearch();
}

watch(
  globalQuery,
  (v) => {
    if (t) clearTimeout(t);

    const q = v.trim();
    if (q.length < 2) {
      searchLoading.value = false;
      searchError.value = null;
      resetSearchState();
      return;
    }

    t = setTimeout(async () => {
      const seq = ++searchSeq;
      searchLoading.value = true;
      searchError.value = null;
      resetSearchState();

      try {
        const res = await api.search(q, SEARCH_LIMIT, 0);
        if (seq !== searchSeq) return;
        searchResults.value = res.results;
        searchOffset.value = res.results.length;
        searchHasMore.value = res.results.length === SEARCH_LIMIT;
      } catch (e) {
        if (seq !== searchSeq) return;
        searchError.value = e instanceof Error ? e.message : 'Unknown error';
        resetSearchState();
      } finally {
        if (seq !== searchSeq) return;
        searchLoading.value = false;
      }
    }, 250);
  },
  { immediate: false },
);

watch(
  () => route.params.id,
  (id) => {
    const folderId = typeof id === 'string' ? id : null;

    isSyncingFromRoute.value = true;
    try {
      if (!folderId) {
        selectedId.value = null;
        return;
      }

      // hanya set kalau folder itu ada (menghindari state invalid)
      if (byId.value.get(folderId)) {
        openFolder(folderId);
      } else {
        // kalau folder belum ada karena data belum fetch, biarkan.
        // setelah folders loaded, kita akan coba sync sekali lagi.
        selectedId.value = folderId;
      }
    } finally {
      isSyncingFromRoute.value = false;
    }
  },
  { immediate: true },
);

watch(
  selectedId,
  async (id) => {
    if (isSyncingFromRoute.value) return;

    // kalau search mode sedang aktif dan kamu pilih openFolder, kita push route supaya back/forward tetap work.
    if (!id) {
      if (route.name !== 'home') await router.push({ name: 'home' });
      return;
    }

    if (route.params.id !== id) {
      await router.push({ name: 'folder', params: { id } });
    }
  },
  { flush: 'post' },
);

watch(
  () => byId.value.size,
  () => {
    const id = typeof route.params.id === 'string' ? route.params.id : null;
    if (!id) return;
    if (!byId.value.get(id)) return;

    // ensure expanded path after data ready
    expandToFolder(id);
  },
);

onMounted(async () => {
  loading.value = true;
  error.value = null;

  try {
    if (TREE_MODE === 'full') {
      folders.value = await api.getTree();

      // derive hasChildren in full mode
      const tmp = new Map<string, number>();
      for (const f of folders.value) {
        if (f.parentId) tmp.set(f.parentId, (tmp.get(f.parentId) ?? 0) + 1);
      }
      folders.value = folders.value.map((f) => ({ ...f, hasChildren: (tmp.get(f.id) ?? 0) > 0 }));

      // build indexes as usual
      childrenByParent.value = buildChildrenMap(folders.value);
    } else {
      // lazy: only roots at first
      const roots = await api.getRoots();
      folders.value = roots;
      // ensure map childrenByParent has null → roots
      childrenByParent.value = new Map([[null, roots]]);
    }
    // deep-link path expand after data ready
    const id = typeof route.params.id === 'string' ? route.params.id : null;
    if (id) {
      await openFolder(id); // openFolder dibuat async di bawah
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <ExplorerShell>
    <template #top>
      <TopBar
        v-model="globalQuery"
        :loading="searchLoading"
        :error="searchError"
        :count="searchResults.length"
        @clear="clearSearch"
      />
    </template>

    <template #left>
      <LeftPanel
        :loading="loading"
        :error="error"
        :roots="roots"
        :children-by-parent="childrenByParent"
        :selected-id="selectedId"
        :expanded="expanded"
        @select="selectFolder"
        @toggle="toggleFolder"
      />
    </template>

    <template #right>
      <RightPanel
        :selected-folder="selectedFolder"
        :breadcrumb="breadcrumb"
        :global-query="globalQuery"
        :search-loading="searchLoading"
        :search-error="searchError"
        :search-results="searchResults"
        :search-has-more="searchHasMore"
        @open-folder="
          (id) => {
            openFolder(id);
            clearSearch();
          }
        "
        @load-more-search="loadMoreSearch"
      />
    </template>
  </ExplorerShell>
</template>
