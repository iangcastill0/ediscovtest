// third-party
import { FormattedMessage } from 'react-intl';

// assets
import { IconChartArcs,IconUserCheck, IconBasket, IconMessages, IconLayoutKanban, IconMail, IconCalendar, IconNfc, IconCoins } from '@tabler/icons';

// constant
const icons = {
    IconChartArcs,
    IconUserCheck,
    IconBasket,
    IconMessages,
    IconLayoutKanban,
    IconMail,
    IconCalendar,
    IconNfc,
    IconCoins
};

// ==============================|| ADMIN MENU ITEMS ||============================== //

const admin = {
    id: 'admin',
    title: <FormattedMessage id="admin" />,
    type: 'group',
    children: [
        {
            id: 'statistics',
            title: <FormattedMessage id="statistics" />,
            type: 'item',
            icon: icons.IconChartArcs,
            url: '/admin/statistics'
        },
        {
            id: 'users',
            title: <FormattedMessage id="users" />,
            type: 'collapse',
            icon: icons.IconUserCheck,
            children: [
                {
                    id: 'user_management',
                    title: <FormattedMessage id="user-management" />,
                    type: 'item',
                    url: '/admin/user/management'
                },
                {
                    id: 'user_actions',
                    title: <FormattedMessage id="user-actions" />,
                    type: 'item',
                    url: '/admin/user/actions'
                },
            ]
        },
        {
            id: 'financial',
            title: <FormattedMessage id="financial" />,
            type: 'collapse',
            icon: icons.IconCoins,
            children: [
                {
                    id: 'subscription_plan',
                    title: <FormattedMessage id="subscription-plan" />,
                    type: 'item',
                    url: '/admin/financial/subscription-plan'
                },
                {
                    id: 'payment_history',
                    title: <FormattedMessage id="payment-history" />,
                    type: 'item',
                    url: '/admin/financial/payment-history'
                },
            ]
        },
        {
            id: 'adminsupport',
            title: <FormattedMessage id="adminsupport" />,
            type: 'item',
            icon: icons.IconMessages,
            url: '/admin/support'
        },
        // {
        //     id: 'customer',
        //     title: <FormattedMessage id="customer" />,
        //     type: 'collapse',
        //     icon: icons.IconBasket,
        //     children: [
        //         {
        //             id: 'customer-list',
        //             title: <FormattedMessage id="customer-list" />,
        //             type: 'item',
        //             url: '/customer/customer-list',
        //             breadcrumbs: false
        //         },
        //         {
        //             id: 'order-list',
        //             title: <FormattedMessage id="order-list" />,
        //             type: 'item',
        //             url: '/customer/order-list',
        //             breadcrumbs: false
        //         },
        //         {
        //             id: 'create-invoice',
        //             title: <FormattedMessage id="create-invoice" />,
        //             type: 'item',
        //             url: '/customer/create-invoice',
        //             breadcrumbs: false
        //         },
        //         {
        //             id: 'order-details',
        //             title: <FormattedMessage id="order-details" />,
        //             type: 'item',
        //             url: '/customer/order-details'
        //         },
        //         {
        //             id: 'product',
        //             title: <FormattedMessage id="product" />,
        //             type: 'item',
        //             url: '/customer/product',
        //             breadcrumbs: false
        //         },
        //         {
        //             id: 'product-review',
        //             title: <FormattedMessage id="product-review" />,
        //             type: 'item',
        //             url: '/customer/product-review',
        //             breadcrumbs: false
        //         }
        //     ]
        // },
        // {
        //     id: 'chat',
        //     title: <FormattedMessage id="chat" />,
        //     type: 'item',
        //     icon: icons.IconMessages,
        //     url: '/app/chat'
        // },
        // {
        //     id: 'kanban',
        //     title: 'Kanban',
        //     type: 'item',
        //     icon: icons.IconLayoutKanban,
        //     url: '/app/kanban/board'
        // },
        // {
        //     id: 'mail',
        //     title: <FormattedMessage id="mail" />,
        //     type: 'item',
        //     icon: icons.IconMail,
        //     url: '/app/mail'
        // },
        // {
        //     id: 'calendar',
        //     title: <FormattedMessage id="calendar" />,
        //     type: 'item',
        //     url: '/app/calendar',
        //     icon: icons.IconCalendar,
        //     breadcrumbs: false
        // }
    ]
};

export default admin;
