import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import '@fontsource/geist/latin-400.css';
import '@fontsource/geist/latin-500.css';
import '@fontsource/geist/latin-600.css';
import '@fontsource/geist/latin-700.css';
import '@fontsource/geist-mono/latin-400.css';
import { routes } from './routing/routes';
import { getBasePath } from './lib/config/runtime';

const router = createBrowserRouter(routes, { basename: getBasePath() || '/' });
createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
