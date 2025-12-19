import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import RightPanel from '../src/components/RightPanel.vue';

describe('RightPanel (search mode)', () => {
    it('shows load more button and emits event', async () => {
        const w = mount(RightPanel, {
            props: {
                selectedFolder: null,
                breadcrumb: [],

                globalQuery: 'report',
                searchLoading: false,
                searchError: null,
                searchResults: [
                    { kind: 'file', id: '1', name: 'report-0001.pdf', folderId: '10', size: 123, mimeType: 'application/pdf' },
                ],
                searchHasMore: true,
            },
        });

        expect(w.find('[data-testid="search-results"]').exists()).toBe(true);
        expect(w.find('[data-testid="search-load-more"]').exists()).toBe(true);

        await w.get('[data-testid="search-load-more"]').trigger('click');
        expect(w.emitted('load-more-search')?.length).toBe(1);
    });
});