import { lazy } from 'react';

// project imports
import Loadable from 'ui-component/Loadable';
import MinimalLayout from 'layout/MinimalLayout';

// maintenance routing
const MaintenanceError = Loadable(lazy(() => import('views/pages/maintenance/Error')));
const SlackInstallationError = Loadable(lazy(() => import('views/pages/maintenance/SlackInstallError')));
const MS365InstallationError = Loadable(lazy(() => import('views/pages/maintenance/MS365InstallError')));
const GoogleInstallationError = Loadable(lazy(() => import('views/pages/maintenance/GoogleInstallError')));
const InvitationStatus = Loadable(lazy(() => import('views/pages/maintenance/InvitationStatus')));
const Congrats = Loadable(lazy(() => import('views/pages/maintenance/Congrats')));
const Service = Loadable(lazy(() => import('views/pages/maintenance/Service')));
const Policy = Loadable(lazy(() => import('views/pages/maintenance/Policy')));
const Support = Loadable(lazy(() => import('views/pages/maintenance/Support')));
// const MaintenanceComingSoon1 = Loadable(lazy(() => import('views/pages/maintenance/ComingSoon/ComingSoon1')));
// const MaintenanceComingSoon2 = Loadable(lazy(() => import('views/pages/maintenance/ComingSoon/ComingSoon2')));
// const MaintenanceUnderConstruction = Loadable(lazy(() => import('views/pages/maintenance/UnderConstruction')));

// landing & contact-us routing
// const PagesContactUS = Loadable(lazy(() => import('views/pages/contact-us')));
// const PagesFaqs = Loadable(lazy(() => import('views/pages/saas-pages/Faqs')));
// const PagesPrivacyPolicy = Loadable(lazy(() => import('views/pages/saas-pages/PrivacyPolicy')));

// ==============================|| AUTHENTICATION ROUTING ||============================== //

const NoAuthRoutes = {
    path: '/',
    element: <MinimalLayout />,
    children: [
        {
            path: '/pages/error',
            element: <MaintenanceError />
        },
        // {
        //     path: '/pages/under-construction',
        //     element: <MaintenanceUnderConstruction />
        // },
        {
            path: '/slack/error-installation',
            element: <SlackInstallationError />
        },
        {
            path: '/ms365/installation/error/:errorCode',
            element: <MS365InstallationError />
        },
        {
            path: '/google/error/:errorCode',
            element: <GoogleInstallationError />
        },
        {
            path: '/invite/status/:code',
            element: <InvitationStatus />
        },
        {
            path: '/congratulations',
            element: <Congrats />
        },
        // {
        //     path: '/pages/contact-us',
        //     element: <PagesContactUS />
        // },
        // {
        //     path: '/pages/faqs',
        //     element: <PagesFaqs />
        // },
        // {
        //     path: '/pages/privacy-policy',
        //     element: <PagesPrivacyPolicy />
        // }
        {
            path: '/terms',
            element: <Service />
        },
        {
            path: '/policy',
            element: <Policy />
        },
        {
            path: '/support',
            element: <Support />
        },
    ]
};

export default NoAuthRoutes;
