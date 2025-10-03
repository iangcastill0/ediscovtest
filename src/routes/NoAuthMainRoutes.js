import { lazy } from 'react';

// project imports
import NoAuthGuard from 'utils/route-guard/NoAuthGuard';
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';

// Google
const Google = Loadable(lazy(() => import('views/pages/google')));
const Billing = Loadable(lazy(() => import('views/pages/billing')));

// ==============================|| NO MAIN ROUTING ||============================== //

const NoMainRoutes = {
    path: '/',
    element: (
        <NoAuthGuard>
            <MainLayout />
        </NoAuthGuard>
    ),
    children: [
        {
            path: '/google',
            children: [
                {
                    path: '/google/apps/',
                    element: <Google />,
                },
            ]
        },
        {
            path: '/billing',
            element: <Billing />
        },
    ]
};

export default NoMainRoutes;
