<script setup lang="ts"></script>

<template>
  <div class="h-screen flex flex-col bg-white text-slate-900">
    <header class="h-11 flex items-center px-3 border-b border-slate-200">
      <slot name="top" />
    </header>

    <div class="flex-1 flex overflow-hidden">
      <aside class="h-full w-[320px] shrink-0 overflow-auto border-r border-slate-200 sm:w-75">
        <slot name="left" />
      </aside>

      <main class="h-full flex-1 overflow-auto">
        <slot name="right" />
      </main>
    </div>
  </div>
</template>
