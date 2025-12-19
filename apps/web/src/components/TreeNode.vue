<script setup lang="ts">
import { computed } from "vue";
import type { Folder } from "../types/explorer";
import { ChevronRight, ChevronDown, Folder as FolderIcon } from "lucide-vue-next";

type Props = {
  folder: Folder;
  level: number;
  childrenByParent: Map<string | null, Folder[]>;
  selectedId: string | null;
  expanded: Set<string>;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "select", id: string): void;
  (e: "toggle", id: string): void;
}>();

const isExpanded = computed(() => props.expanded.has(props.folder.id));
const isSelected = computed(() => props.selectedId === props.folder.id);
const children = computed(() => props.childrenByParent.get(props.folder.id) ?? []);

function onToggle(e: MouseEvent) {
  e.stopPropagation();
  if (!props.folder.hasChildren) return;
  emit("toggle", props.folder.id);
}

function onSelect() {
  emit("select", props.folder.id);
}
</script>

<template>
  <div>
    <div
      data-testid="tree-row"
      :data-folder-id="props.folder.id"
      class="row flex items-center gap-1 rounded-md pr-2 py-1 select-none cursor-pointer
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
      :class="isSelected
        ? 'bg-blue-100/70 hover:bg-blue-100/70'
        : 'hover:bg-slate-100'"
      :style="{ paddingLeft: `${10 + props.level * 14}px` }"
      role="button"
      :aria-selected="isSelected"
      tabindex="0"
      @click="onSelect"
      @keydown.enter.prevent="onSelect"
    >
      <button
        data-testid="tree-caret"
        class="caret h-5 w-5 grid place-items-center rounded hover:bg-slate-200 text-slate-600
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
        :class="{ invisible: !props.folder.hasChildren }"
        type="button"
        aria-label="Toggle"
        :aria-expanded="props.folder.hasChildren ? isExpanded : undefined"
        @click="onToggle"
      >
        <ChevronDown v-if="props.folder.hasChildren && isExpanded" class="h-4 w-4" />
        <ChevronRight v-else-if="props.folder.hasChildren" class="h-4 w-4" />
      </button>

      <FolderIcon class="h-4 w-4 text-slate-500" />
      <span class="truncate text-sm text-slate-900">{{ props.folder.name }}</span>
    </div>

    <div v-if="props.folder.hasChildren && isExpanded" class="children flex flex-col gap-0.5">
      <TreeNode
        v-for="c in children"
        :key="c.id"
        :folder="c"
        :level="props.level + 1"
        :children-by-parent="props.childrenByParent"
        :selected-id="props.selectedId"
        :expanded="props.expanded"
        @select="(id) => emit('select', id)"
        @toggle="(id) => emit('toggle', id)"
      />
    </div>
  </div>
</template>