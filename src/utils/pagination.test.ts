import { describe, expect, it } from 'vitest';
import { buildPageItems } from './pagination';

describe('buildPageItems', () => {
  it('returns a single page when the range is not usable', () => {
    expect(buildPageItems(1, 1)).toEqual([1]);
    expect(buildPageItems(Number.NaN, 4)).toEqual([1]);
  });

  it('shows the edges and a window around the current page', () => {
    expect(buildPageItems(1, 10)).toEqual([1, 2, 3, '...', 10]);
    expect(buildPageItems(5, 10)).toEqual([1, '...', 3, 4, 5, 6, 7, '...', 10]);
    expect(buildPageItems(10, 10)).toEqual([1, '...', 8, 9, 10]);
  });

  it('omits ellipses when the pages are contiguous', () => {
    expect(buildPageItems(2, 3)).toEqual([1, 2, 3]);
  });
});
