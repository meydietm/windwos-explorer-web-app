<script setup lang="ts">
import { computed } from 'vue';
import { Search, X } from "lucide-vue-next";

type Props = {
  modelValue: string;
  loading: boolean;
  error: string | null;
  count: number;
};

const props = defineProps<Props>();

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void; (e: 'clear'): void }>();

const hint = computed(() => {
  if (props.loading) return 'Searching…';
  if (props.error) return 'Search error';
  if (props.modelValue.trim().length >= 2) return `${props.count} results`;
  return 'Type to search folders & files \n (min 2 chars)';
});
</script>

<template>
  <div class="w-full grid grid-cols-[90px_1fr_120px] items-center gap-3">
    <div class="font-extrabold text-slate-900">Explorer</div>

    <div class="relative">
      <!-- icon kiri -->
      <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      <input
        data-testid="global-search"
        class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
        :value="props.modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        placeholder="Search…"
      />

      <button
        v-if="props.modelValue"
        class="clear-button absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        type="button"
        aria-label="Clear search"
        @click="emit('clear')"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <div
      class="text-right text-xs"
      :class="props.error ? 'text-red-700' : 'text-slate-500'"
    >
      {{ hint }}
    </div>
  </div>
</template>

<!-- <style scoped>
.bar {
  width: 100%;
  display: grid;
  grid-template-columns: 90px 1fr 220px;
  gap: 10px;
  align-items: center;
}

.brand {
  font-weight: 800;
}

.searchWrap {
  position: relative;
}

.search {
  width: 100%;
  padding: 8px 0px 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: transparent;
  color: inherit;
}

.clear {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  cursor: pointer;
  opacity: 0.8;
}

.hint {
  font-size: 12px;
  opacity: 0.75;
  text-align: right;
}

.hint.err {
  opacity: 0.95;
}
</style> -->
