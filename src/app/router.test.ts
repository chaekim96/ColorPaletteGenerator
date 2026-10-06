import { describe, expect, it } from 'vitest';
import { routeFromLocation } from './router';

describe('routeFromLocation', () => {
  it('maps paths to pages', () => {
    expect(routeFromLocation('/', '')).toBe('home');
    expect(routeFromLocation('/generate', '?colors=111111-ffffff')).toBe('generate');
    expect(routeFromLocation('/explore/', '')).toBe('explore');
    expect(routeFromLocation('/nope', '')).toBe('home');
  });

  it('keeps old share links working', () => {
    expect(routeFromLocation('/', '?colors=264653-2a9d8f-e9c46a&gradient=false&count=3')).toBe('generate');
    expect(routeFromLocation('/', '?utm_source=x')).toBe('home');
  });
});
