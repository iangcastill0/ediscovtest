import { memo } from 'react';

// material-ui
import { Typography } from '@mui/material';

// project imports
import NavGroup from './NavGroup';
import menuItem from 'menu-items';
import useAuth from 'hooks/useAuth';

// ==============================|| SIDEBAR MENU LIST ||============================== //

const MenuList = () => {
    const {user} = useAuth();
    // const [forceUpdate, setForceUpdate] = useState(false);
    const isAdmin = user && (user.roles.includes('admin') || user.roles.includes('superadmin'))
    const navItems = menuItem.items.map((item) => {
        if (!isAdmin && item.id === 'admin') return null
        switch (item.type) {
            case 'group':
                return <NavGroup key={item.id} item={item} />;
            default:
                return (
                    <Typography key={item.id} variant="h6" color="error" align="center">
                        Menu Items Error
                    </Typography>
                );
        }
    });

    return <>{navItems}</>;
};

export default memo(MenuList);
