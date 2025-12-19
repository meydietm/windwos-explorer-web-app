<script setup lang="ts">
import TreeNode from './TreeNode.vue';
import type { Folder } from '../types/explorer';

type Props = {
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

function hasChildren(id: string): boolean {
  const children = props.childrenByParent.get(id);
  return !!children && children.length > 0;
}
</script>

<template>
  <div class="tree">
    <TreeNode
      v-for="root in props.roots"
      :key="root.id"
      :folder="root"
      :level="0"
      :children-by-parent="props.childrenByParent"
      :selected-id="props.selectedId"
      :expanded="props.expanded"
      :has-children="hasChildren(root.id)"
      @select="(id) => emit('select', id)"
      @toggle="(id) => emit('toggle', id)"
    />

    <div v-if="props.roots.length === 0" class="empty">(No folders)</div>
  </div>
</template>

<style scoped>
.tree {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.empty {
  opacity: 0.7;
  font-size: 14px;
  padding: 6px;
}
</style>
