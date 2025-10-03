import { lazy } from 'react';
import { useRoutes } from 'react-router-dom';

// routes
import LoginRoutes from './LoginRoutes';
import MainRoutes from './MainRoutes';
import NoAuthMainRoutes from './NoAuthMainRoutes';
import Loadable from 'ui-component/Loadable';
import NoAuthRoutes from './NoAuthRoutes';
import AdminRoutes from './AdminRoutes';


// ==============================|| ROUTING RENDER ||============================== //
const PagesLanding = Loadable(lazy(() => import('views/pages/landing')));

export default function ThemeRoutes() {
    return useRoutes([{ path: '/', element: <PagesLanding /> }, NoAuthRoutes, LoginRoutes, MainRoutes, NoAuthMainRoutes, AdminRoutes]);
}
