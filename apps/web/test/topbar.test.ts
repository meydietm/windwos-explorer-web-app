import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import TopBar from '../src/components/TopBar.vue';

describe('TopBar', () => {
    it('emits update:modelValue when typing and emits clear', async () => {
        const w = mount(TopBar, {
            props: {
                modelValue: '',
                loading: false,
                error: null,
                count: 0,
            },
        });

        const input = w.get('[data-testid="global-search"]');
        await input.setValue('report');

        const updates = w.emitted('update:modelValue');
        expect(updates?.length).toBeGreaterThan(0);
        expect(updates?.at(-1)?.[0]).toBe('report');

        // set modelValue agar tombol clear muncul
        await w.setProps({ modelValue: 'report' });

        await w.get('button.clear-button').trigger('click');
        expect(w.emitted('clear')?.length).toBe(1);
    });
});