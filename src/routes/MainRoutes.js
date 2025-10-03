import { lazy } from 'react';
import { useLocation } from 'react-router-dom';

// project imports
import AuthGuard from 'utils/route-guard/AuthGuard';
import MainLayout from 'layout/MainLayout';
import Loadable from 'ui-component/Loadable';
import { element } from 'prop-types';

// sample page routing
const Dashboard = Loadable(lazy(() => import('views/dashboard')));
const Archive = Loadable(lazy(() => import('views/pages/archive')));
const ArchiveLogs = Loadable(lazy(() => import('views/pages/archive/Logs')));
const CronSetting = Loadable(lazy(() => import('views/pages/archive/CronSetting')));
const ArchiveSlackView = Loadable(lazy(() => import('views/pages/archive/slack/workspace')));
const ArchivePublicChannelMessages = Loadable(lazy(() => import('views/pages/archive/slack/public-messages')));
const ArchivePrivateChannelMessages = Loadable(lazy(() => import('views/pages/archive/slack/private-messages')));
const ArchiveDirectMessages = Loadable(lazy(() => import('views/pages/archive/slack/direct-messages')));
const ArchiveGroupMessages = Loadable(lazy(() => import('views/pages/archive/slack/group-messages')));
const Slack = Loadable(lazy(() => import('views/pages/slack')));
const SlackView = Loadable(lazy(() => import('views/pages/slack/workspace')));
const SlackMembers = Loadable(lazy(() => import('views/pages/slack/workspace/Members')));
const PublicChannelMessages = Loadable(lazy(() => import('views/pages/slack/public-messages')));
const PrivateChannelMessages = Loadable(lazy(() => import('views/pages/slack/private-messages')));
const DirectMessages = Loadable(lazy(() => import('views/pages/slack/direct-messages')));
const GroupMessages = Loadable(lazy(() => import('views/pages/slack/group-messages')));
const Profile = Loadable(lazy(() => import('views/pages/profile')));
const CommingSoon = Loadable(lazy(() => import('views/pages/comming-soon')));
const SearchResult = Loadable(lazy(() => import('views/pages/SearchResult')));
// Microsoft 365
const Ms365 = Loadable(lazy(() => import('views/pages/ms365')));
const MSUsers = Loadable(lazy(() => import('views/pages/ms365/workspace')));
const Ms365Panel = Loadable(lazy(() => import('views/pages/ms365/workspace/WorkspacePanel')));
const Outlook = Loadable(lazy(() => import('views/pages/ms365/outlook')));
const Onedrive = Loadable(lazy(() => import('views/pages/ms365/onedrive')));
const MsLogs = Loadable(lazy(() => import('views/pages/ms365/mslogs')));
const Sharepoint = Loadable(lazy(() => import('views/pages/ms365/sharepoint')));
const Teams = Loadable(lazy(() => import('views/pages/ms365/teams')));
const Discovery = Loadable(lazy(() => import('views/pages/ms365/discovery')));
const Custodians = Loadable(lazy(() => import('views/pages/ms365/discovery/CustodiansChannel')));
const Searches = Loadable(lazy(() => import('views/pages/ms365/discovery/SearchesChannel')));
const ReviewSet = Loadable(lazy(() => import('views/pages/ms365/discovery/ReviewSetChannel')));
const ExportReview = Loadable(lazy(() => import('views/pages/ms365/discovery/ExportReviewChannel')));

// Google
const Gmail = Loadable(lazy(() => import('views/pages/google/gmail/index_v2')));
const Logs = Loadable(lazy(() => import('views/pages/google/logs')));
const Drive = Loadable(lazy(() => import('views/pages/google/drive')));
const Calendar = Loadable(lazy(() => import('views/pages/google/calendar')));
const Chat = Loadable(lazy(() => import('views/pages/google/chat')));
const GoogleUsers = Loadable(lazy(() => import('views/pages/google/workspace')));
const GooglePanel = Loadable(lazy(() => import('views/pages/google/workspace/WorkspacePanel')));

// Dropbox
const Dropbox = Loadable(lazy(() => import('views/pages/dropbox')));
const DropboxMembers = Loadable(lazy(() => import('views/pages/dropbox/members')));
const DropboxTabs = Loadable(lazy(() => import('views/pages/dropbox/files')));

// Box
const BoxChannel = Loadable(lazy(() => import('views/pages/box')));
const BoxMembers = Loadable(lazy(() => import('views/pages/box/members')));

const ArchiveOutlookView = Loadable(lazy(() => import('views/pages/archive/microsoft/outlook')));
const ArchiveOneDriveView = Loadable(lazy(() => import('views/pages/archive/microsoft/onedrive')));
const ArchiveGmailView = Loadable(lazy(() => import('views/pages/archive/google/gmail')));
const ArchiveDriveView = Loadable(lazy(() => import('views/pages/archive/google/drive/index_v2')));
const ArchiveDropboxView = Loadable(lazy(() => import('views/pages/archive/dropbox')));
const ArchiveFlaggedCollectionView = Loadable(lazy(() => import('views/pages/archive/flaggedcollections')));

// Flagged Collections
const FlaggedCollections = Loadable(lazy(() => import('views/pages/flaggeddata')));
const FlaggedCollectionView = Loadable(lazy(() => import('views/pages/flaggeddata/FlaggedView')));

const Support = Loadable(lazy(() => import('views/pages/support')));

// ==============================|| MAIN ROUTING ||============================== //

const SearchResultWrapper = () => {
    const location = useLocation();
    return <SearchResult key={location.search} />;
};

const MainRoutes = {
    path: '/',
    element: (
        <AuthGuard>
            <MainLayout />
        </AuthGuard>
    ),
    children: [
        {
            path: '/',
            element: <Dashboard />
        },
        {
            path: '/archive',
            children: [
                {
                    path: '/archive/apps/',
                    element: <Archive />,
                },
                {
                    path: '/archive/logs/',
                    element: <ArchiveLogs />,
                },
                {
                    path: '/archive/settings/',
                    element: <CronSetting />,
                },
                {
                    path: '/archive/Slack/:id/backup/:backupId',
                    element: <ArchiveSlackView />
                },
                {
                    path: '/archive/Slack/:teamId/public-channel/:name/:channelId/backup/:backupId',
                    element: <ArchivePublicChannelMessages />
                },
                {
                    path: '/archive/Slack/:teamId/private-channel/:name/:channelId/backup/:backupId',
                    element: <ArchivePrivateChannelMessages />
                },
                {
                    path: '/archive/Slack/:teamId/direct-messages/:userId/backup/:backupId',
                    element: <ArchiveDirectMessages />
                },
                {
                    path: '/archive/Slack/:teamId/user-groups/:name/:channelId/backup/:backupId',
                    element: <ArchiveGroupMessages />
                },
                {
                    path: '/archive/Outlook/:id/backup/:backupId',
                    element: <ArchiveOutlookView />
                },
                {
                    path: '/archive/OneDrive/:id/backup/:backupId',
                    element: <ArchiveOneDriveView />
                },
                {
                    path: '/archive/Gmail/:id/backup/:backupId',
                    element: <ArchiveGmailView />
                },
                {
                    path: '/archive/Drive/:id/backup/:backupId',
                    element: <ArchiveDriveView />
                },
                {
                    path: '/archive/Dropbox/:workspaceId/backup/:archiveId',
                    element: <ArchiveDropboxView />
                },
                {
                    path: '/archive/FlaggedCollections/:collectionId/backup/:archiveId',
                    element: <ArchiveFlaggedCollectionView />
                },
            ]
        },
        {
            path: '/dashboard',
            element: <Dashboard />
        },
        {
            path: '/flagged-collections',
            children: [
                {
                    path: '/flagged-collections',
                    element: <FlaggedCollections />
                },
                {
                    path: '/flagged-collections/:collectionId',
                    element: <FlaggedCollectionView />
                },
            ],
        },
        {
            path: '/slack/team',
            children: [
                {
                    path: '/slack/team/',
                    element: <Slack />,
                },
                {
                    path: '/slack/team/:id',
                    element: <SlackMembers />
                },
                {
                    path: '/slack/team/:teamId/users/:userId',
                    element: <SlackView />
                },
                {
                    path: '/slack/team/:teamId/users/:userId/public-channel/:name/:channelId',
                    element: <PublicChannelMessages />
                },
                {
                    path: '/slack/team/:teamId/users/:userId/private-channel/:name/:channelId',
                    element: <PrivateChannelMessages />
                },
                {
                    path: '/slack/team/:teamId/direct-messages/:userId',
                    element: <DirectMessages />
                },
                {
                    path: '/slack/team/:teamId/users/:userId/user-groups/:name/:channelId',
                    element: <GroupMessages />
                },
            ]
        },
        {
            path: '/ms365',
            children: [
                {
                    path: '/ms365/apps/',
                    element: <Ms365 />,
                },
                {
                    path: '/ms365/workspace/:workspaceId',
                    element: <MSUsers />
                },
                {
                    path: '/ms365/workspace/:workspaceId/user/:userId',
                    element: <Ms365Panel />
                },
                {
                    path: '/ms365/:workspaceId/users/:userId/outlook/',
                    element: <Outlook />,
                },
                {
                    path: '/ms365/:workspaceId/users/:userId/onedrive/',
                    element: <Onedrive />,
                },
                {
                    path: '/ms365/users/:userId/mslogs/',
                    element: <MsLogs />,
                },
                {
                    path: '/ms365/users/:userId/sharepoint/',
                    element: <Sharepoint />,
                },
                {
                    path: '/ms365/users/:userId/teams/',
                    element: <Teams />,
                },
                {
                    path: '/ms365/eDiscovery/',
                    element: <Discovery />,
                },
                {
                    path: '/ms365/eDiscovery/custodians',
                    element: <Custodians />,
                },
                {
                    path: '/ms365/eDiscovery/searches',
                    element: <Searches />,
                },
                {
                    path: '/ms365/eDiscovery/reviewSet',
                    element: <ReviewSet />,
                },
                {
                    path: '/ms365/eDiscovery/export',
                    element: <ExportReview />,
                },
            ]
        },
        {
            path: '/google',
            children: [
                {
                    path: '/google/workspace/:workspaceId',
                    element: <GoogleUsers />
                },
                {
                    path: '/google/workspace/:workspaceId/user/:userId',
                    element: <GooglePanel />
                },
                {
                    path: '/google/workspace/:workspaceId/users/:userId/gmail/',
                    element: <Gmail />,
                },
                {
                    path: '/google/workspace/:workspaceId/users/:userId/logs/',
                    element: <Logs />,
                },
                {
                    path: '/google/workspace/:workspaceId/users/:userId/drive/',
                    element: <Drive />,
                },
                {
                    path: '/google/workspace/:workspaceId/users/:userId/calendar/',
                    element: <Calendar />,
                },
                {
                    path: '/google/workspace/:workspaceId/users/:userId/chat/',
                    element: <Chat />,
                },
            ]
        },
        {
            path: '/search',
            element: <SearchResultWrapper />
        },
        // {
        //     path: '/office365',
        //     element: <CommingSoon />
        // },
        // {
        //     path: '/microsoft365',
        //     element: <CommingSoon />
        // },
        // {
        //     path: '/google-workspace',
        //     element: <CommingSoon />
        // },
        {
            path: '/dropbox',
            children: [
                {
                    path: '/dropbox',
                    element: <Dropbox />
                },
                {
                    path: '/dropbox/workspace/:workspaceId',
                    element: <DropboxMembers />
                },
                {
                    path: '/dropbox/workspace/:workspaceId/users/:userId/tabs',
                    element: <DropboxTabs />
                },
            ]
        },
        {
            path: '/box',
            children: [
                {
                    path: '/box',
                    element: <BoxChannel />
                },
                {
                    path: '/box/workspace/:workspaceId',
                    element: <BoxMembers />
                },
                {
                    path: '/box/workspace/:workspaceId/users/:userId/tabs',
                    element: <DropboxTabs />
                },
            ]
        },
        {
            path: '/user/profile',
            element: <Profile />
        },
        {
            path: '/user/support',
            element: <Support />
        }
    ]
};

export default MainRoutes;
