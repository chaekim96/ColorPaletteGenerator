import { App } from './App';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { useRoute } from './router';
import { Toaster } from './components/ui/sonner';

export default function Root() {
  const route = useRoute();
  return (
    <>
      {route === 'home' && <Home />}
      {route === 'explore' && <Explore />}
      {route === 'generate' && <App />}
      <Toaster />
    </>
  );
}
