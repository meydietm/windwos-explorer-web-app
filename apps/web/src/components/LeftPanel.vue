<script setup lang="ts">
import FolderTree from './FolderTree.vue';
import type { Folder } from '../types/explorer';
import { AlertTriangle, FolderOpen } from "lucide-vue-next";

type Props = {
  loading: boolean;
  error: string | null;
  roots: Folder[];
  childrenByParent: Map<string | null, Folder[]>;
  selectedId: string | null;
  expanded: Set<string>;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'select', id: string): void;
  (e: 'toggle', id: string): void;
}>();
</script>

<template>
  <div class="h-full p-2">
    <div class="flex items-center gap-2 px-1 pb-2">
      <FolderOpen class="h-4 w-4 text-slate-500" />
      <div class="text-sm font-semibold text-slate-900">Folders</div>
    </div>

    <div v-if="loading" class="px-1 text-sm text-slate-500">
      Loading folder tree…
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 p-3 text-red-900"
    >
      <div class="flex items-start gap-2">
        <AlertTriangle class="h-4 w-4 mt-0.5" />
        <div class="min-w-0">
          <div class="font-semibold">Failed to load</div>
          <div class="mt-1 text-sm opacity-90 wrap-break-words">{{ error }}</div>

          <div class="mt-3 text-sm text-red-900/90">
            <div class="font-medium">Pastikan:</div>
            <ul class="mt-1 list-disc pl-5 space-y-1">
              <li>
                API running di
                <code class="rounded bg-white/60 px-1 py-0.5 text-xs">http://localhost:3001</code>
              </li>
              <li>
                DB sudah
                <code class="rounded bg-white/60 px-1 py-0.5 text-xs">db:up</code>,
                <code class="rounded bg-white/60 px-1 py-0.5 text-xs">db:migrate</code>,
                <code class="rounded bg-white/60 px-1 py-0.5 text-xs">db:seed</code>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="mt-1 tree">
      <FolderTree
        :roots="props.roots"
        :children-by-parent="props.childrenByParent"
        :selected-id="props.selectedId"
        :expanded="props.expanded"
        @select="(id) => emit('select', id)"
        @toggle="(id) => emit('toggle', id)"
      />
    </div>
  </div>
</template>


<!-- <style scoped>
.wrap {
  padding: 10px 8px;
}
.title {
  font-weight: 700;
  margin: 2px 4px 10px;
}
.muted {
  opacity: 0.75;
  font-size: 14px;
  line-height: 1.4;
  margin: 0 4px;
}
.tree {
  padding: 0 2px 8px;
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
  margin-bottom: 10px;
  opacity: 0.9;
}
.error-hint ul {
  margin: 6px 0 0 18px;
}
</style> -->
