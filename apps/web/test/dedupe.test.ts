import { describe, expect, it } from 'vitest';
import { appendDedup } from '../src/utils/dedupe';

describe('appendDedup', () => {
  it('dedupes by key', () => {
    const out = appendDedup([{ id: 1 }], [{ id: 1 }, { id: 2 }], (x) => String(x.id));

    expect(out.map((x) => x.id)).toEqual([1, 2]);
  });
});
