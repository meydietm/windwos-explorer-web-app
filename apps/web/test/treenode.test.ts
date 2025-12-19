import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import TreeNode from '../src/components/TreeNode.vue';

describe('TreeNode', () => {
    it('hides caret when hasChildren=false', () => {
        const w = mount(TreeNode as any, {
            props: {
                folder: { id: '1', parentId: null, name: 'Root', hasChildren: false },
                level: 0,
                childrenByParent: new Map(),
                selectedId: null,
                expanded: new Set(),
            },
        });

        const caret = w.get('[data-testid="tree-caret"]');
        // class invisible dipakai di template kamu
        expect(caret.classes()).toContain('invisible');
    });

    it('emits toggle when caret clicked (hasChildren=true)', async () => {
        const w = mount(TreeNode as any, {
            props: {
                folder: { id: '1', parentId: null, name: 'Root', hasChildren: true },
                level: 0,
                childrenByParent: new Map([['1', [{ id: '2', parentId: '1', name: 'Child', hasChildren: false }]]]),
                selectedId: null,
                expanded: new Set(),
            },
        });

        await w.get('[data-testid="tree-caret"]').trigger('click');
        expect(w.emitted('toggle')?.[0]?.[0]).toBe('1');
    });
});