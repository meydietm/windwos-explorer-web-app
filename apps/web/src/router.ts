import { createRouter, createWebHistory } from 'vue-router';

// Single-route app: either browse root (no selection) or open a folder by id.
const EmptyView = { template: '<div />' };

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: EmptyView },
    { path: '/folders/:id', name: 'folder', component: EmptyView },

    // optional: fallback kalau user akses URL random
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});
