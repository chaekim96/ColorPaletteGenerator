import { describe, expect, it } from 'vitest';
import { decodeShareState, encodeShareState, ShareState } from './shareUrl';

describe('share URL', () => {
  it('round-trips the full state', () => {
    const state: ShareState = {
      colors: ['#0f2c1a', '#ff5a1f', '#93c5fd', '#f97316', '#f8fafc'],
      fonts: 'bricolage-dmsans',
      vibe: 'playful',
      base: '#ff5a1f',
      view: 'preview',
      mode: 'dark',
    };
    expect(decodeShareState(encodeShareState(state))).toEqual(state);
  });

  it('keeps links short by omitting defaults', () => {
    const query = encodeShareState({ colors: ['#111111', '#ffffff'], view: 'palette', mode: 'light', gradient: false });
    expect(query).toBe('colors=111111-ffffff');
  });

  it('produces a compact, readable link', () => {
    const query = encodeShareState({ colors: ['#0f2c1a', '#ff5a1f', '#93c5fd', '#f97316', '#f8fafc'], fonts: 'bricolage-dmsans', vibe: 'playful' });
    expect(query).toBe('colors=0f2c1a-ff5a1f-93c5fd-f97316-f8fafc&fonts=bricolage-dmsans&vibe=playful');
  });

  it('still opens legacy links from the original app', () => {
    expect(decodeShareState('?colors=FF0000-00FF00-0000FF&gradient=true&count=3')).toEqual({
      colors: ['#ff0000', '#00ff00', '#0000ff'],
      gradient: true,
    });
    expect(decodeShareState('?count=4')).toEqual({ count: 4 });
  });

  it('drops invalid values instead of failing', () => {
    expect(decodeShareState('?colors=zzzzzz-123&fonts=comic-sans&vibe=grumpy&base=red&view=x&mode=sepia&count=99')).toEqual({});
    expect(decodeShareState('?colors=111111')).toEqual({}); // too few colors
  });
});
