// Tiny pathname router: / (home), /generate, /explore. No dependency needed for three pages.
import { useEffect, useState } from 'react';

export type Route = 'home' | 'generate' | 'explore';

export function routeFromLocation(pathname: string, search: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/generate') return 'generate';
  if (path === '/explore') return 'explore';
  // Share links from before the home page existed (/?colors=...) open the generator
  if (path === '/' && new URLSearchParams(search).has('colors')) return 'generate';
  return 'home';
}

export function navigate(href: string) {
  window.history.pushState(null, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function useRoute(): Route {
  const read = () => routeFromLocation(window.location.pathname, window.location.search);
  const [route, setRoute] = useState<Route>(read);
  useEffect(() => {
    const onPop = () => setRoute(read());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  return route;
}

/** Same-tab navigation for in-app links, keeping cmd/ctrl-click (new tab) working. */
export function linkProps(href: string) {
  return {
    href,
    onClick: (e: React.MouseEvent) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      navigate(href);
    },
  };
}
