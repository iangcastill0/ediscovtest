// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { IconDashboard, IconHelp, IconSitemap, IconBrandSlack, IconApps, IconArchive, IconBrandGoogle, IconBrandOffice, IconBox, IconPackages, IconBuildingBank, IconUser, IconStar, IconHeadset, IconLifebuoy, IconMessageCircle2 } from '@tabler/icons';

// constant
const icons = {
    IconDashboard,
    IconHelp,
    IconSitemap,
    IconBrandSlack,
    IconApps,
    IconArchive,
    IconBrandGoogle,
    IconBox,
    IconBrandOffice,
    IconPackages,
    IconBuildingBank,
    IconUser,
    IconStar,
    IconHeadset,
    IconMessageCircle2,
    IconLifebuoy
};

// ==============================|| SAMPLE PAGE & DOCUMENTATION MENU ITEMS ||============================== //

const other = {
    id: 'sample-docs-roadmap',
    type: 'group',
    children: [
        {
            id: 'dashboard',
            title: <FormattedMessage id="dashboard" />,
            type: 'item',
            url: '/dashboard',
            icon: icons.IconDashboard,
        },
        {
            id: 'flagged_collections',
            title: <FormattedMessage id="flagged-collections" />,
            type: 'item',
            url: '/flagged-collections',
            icon: icons.IconStar,
        },
        {
            id: 'archive',
            title: <FormattedMessage id="archive" />,
            type: 'item',
            url: '/archive/apps',
            icon: icons.IconArchive,
        },
        {
            id: 'saas-apps',
            title: <FormattedMessage id="saas-apps" />,
            type: 'collapse',
            icon: icons.IconApps,
            children: [
                {
                    id: 'slack',
                    title: <FormattedMessage id="slack" />,
                    type: 'item',
                    url: '/slack/team',
                    icon: icons.IconBrandSlack,
                },
                {
                    id: 'office365',
                    title: <FormattedMessage id="office365" />,
                    type: 'item',
                    url: '/ms365/apps',
                    icon: icons.IconBrandOffice,
                },
                {
                    id: 'google-workspace',
                    title: <FormattedMessage id="google-workspace" />,
                    type: 'item',
                    url: '/google/apps',
                    icon: icons.IconBrandGoogle,
                },
                {
                    id: 'dropbox',
                    title: <FormattedMessage id="dropbox" />,
                    type: 'item',
                    url: '/dropbox',
                    icon: icons.IconBox,
                },
                {
                    id: 'box-collector',
                    title: <FormattedMessage id="box-collector" />,
                    type: 'item',
                    url: '/box',
                    icon: icons.IconPackages,
                },
                
            ]
        },
        {
            id: 'billing',
            title: <FormattedMessage id="billing" />,
            type: 'item',
            url: '/billing',
            icon: icons.IconBuildingBank,
        },
        {
            id: 'account',
            title: <FormattedMessage id="account" />,
            type: 'item',
            url: '/user/profile',
            icon: icons.IconUser,
        },
        {
            id: 'support',
            title: <FormattedMessage id="support" />,
            type: 'item',
            url: '/user/support',
            icon: icons.IconLifebuoy,
        },
        // {
        //     id: 'documentation',
        //     title: <FormattedMessage id="documentation" />,
        //     type: 'item',
        //     url: '#',
        //     icon: icons.IconHelp,
        //     external: true,
        //     target: false
        // },
        // {
        //     id: 'roadmap',
        //     title: <FormattedMessage id="roadmap" />,
        //     type: 'item',
        //     url: '#',
        //     icon: icons.IconSitemap,
        //     external: true,
        //     target: false
        // }
    ]
};

export default other;
