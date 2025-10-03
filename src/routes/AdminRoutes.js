import { lazy } from 'react';

// project imports
import AdminGuard from 'utils/route-guard/AdminGuard';
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';

// sample page routing
const Statistics = Loadable(lazy(() => import('views/admin/pages/dashboard')));
const UserManagement = Loadable(lazy(() => import('views/admin/pages/users/UserManagement')));
const UserActions = Loadable(lazy(() => import('views/admin/pages/users/UserActions')));
const Subscriptions = Loadable(lazy(() => import('views/admin/pages/financial/Subscriptions')));
const PaymentHistory = Loadable(lazy(() => import('views/admin/pages/financial/PaymentHistory')));
const AdminSupport = Loadable(lazy(() => import('views/admin/pages/support')));

// ==============================|| MAIN ROUTING ||============================== //

const AdminRoutes = {
    path: '/',
    element: (
        <AdminGuard>
            <MainLayout />
        </AdminGuard>
    ),
    children: [
        {
            path: '/admin/statistics',
            element: <Statistics />
        },
        {
            path: '/admin/user/management',
            element: <UserManagement />
        },
        {
            path: '/admin/user/actions',
            element: <UserActions />
        },
        {
            path: '/admin/support',
            element: <AdminSupport />
        },
        {
            path: '/admin/financial/subscription-plan',
            element: <Subscriptions />
        },
        {
            path: '/admin/financial/payment-history',
            element: <PaymentHistory />
        },
    ]
};

export default AdminRoutes;
