// material-ui
import { useTheme } from '@mui/material/styles';
import { Avatar, Box, Button, Link } from '@mui/material';

// project imports
import AnimateButton from 'ui-component/extended/AnimateButton';
import LogoSection from '../LogoSection';
import SearchSection from './SearchSection';
import MobileSection from './MobileSection';
import ProfileSection from './ProfileSection';
// import LocalizationSection from './LocalizationSection';
// import MegaMenuSection from './MegaMenuSection';
import NotificationSection from './NotificationSection';
import { useDispatch, useSelector } from 'store';
import { openDrawer } from 'store/slices/menu';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// assets
import { IconMenu2 } from '@tabler/icons';
import { useContext } from 'react';
import JWTContext from 'contexts/JWTContext';

// ==============================|| MAIN NAVBAR / HEADER ||============================== //

const getDiffDays = (date1, date2) => {
    // Calculate the difference in milliseconds
    const differenceInMilliseconds = date2 - date1;

    // Convert milliseconds to days
    const millisecondsInOneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
    return  Math.floor(differenceInMilliseconds / millisecondsInOneDay);
}

const Header = () => {
    const theme = useTheme();

    const dispatch = useDispatch();
    const { drawerOpen } = useSelector((state) => {console.log(state);return state.menu;});
    const { user } = useContext(JWTContext);
    let trialDay = 30;
    try {
        if (user && user.isFreeTrial && !user.isSubscribed) {
            const currDate = new Date();
            const trialEndDate = new Date(user.trialEndDate);
            trialDay = getDiffDays(currDate, trialEndDate);
        }
    } catch (error) {
        console.error(error);
    }
    return (
        <>
            {/* logo & toggler button */}
            <Box
                sx={{
                    width: 228,
                    display: 'flex',
                    alignItems: 'center',
                    [theme.breakpoints.down('md')]: {
                        width: 'auto'
                    }
                }}
            >
                <Box component="span" sx={{ display: { xs: 'none', md: 'block' }, flexGrow: 1 }}>
                    <LogoSection />
                </Box>
                <Avatar
                    variant="rounded"
                    sx={{
                        ...theme.typography.commonAvatar,
                        ...theme.typography.mediumAvatar,
                        overflow: 'hidden',
                        transition: 'all .2s ease-in-out',
                        background: theme.palette.mode === 'dark' ? theme.palette.dark.main : theme.palette.secondary.light,
                        color: theme.palette.mode === 'dark' ? theme.palette.secondary.main : theme.palette.secondary.dark,
                        '&:hover': {
                            background: theme.palette.mode === 'dark' ? theme.palette.secondary.main : theme.palette.secondary.dark,
                            color: theme.palette.mode === 'dark' ? theme.palette.secondary.light : theme.palette.secondary.light
                        }
                    }}
                    onClick={() => dispatch(openDrawer(!drawerOpen))}
                    color="inherit"
                >
                    <IconMenu2 stroke={1.5} size="20px" />
                </Avatar>
            </Box>

            {/* header search */}
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <SearchSection />
            </LocalizationProvider>
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ flexGrow: 1 }} />
            {user && !user.isSubscribed && !user.roles.includes('admin') && <AnimateButton>
                <Button
                    component={Link}
                    // to="/login"
                    href='/billing'
                    // target="_blank"
                    size="large"
                    variant="contained"
                    color="error"
                    sx={{mr:3}}
                >
                    Trial Remaining {trialDay}-Day
                </Button>
            </AnimateButton>}
            {/* mega-menu */}
            {/* <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <MegaMenuSection />
            </Box> */}

            {/* live customization & localization */}
            {/* <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <LocalizationSection />
            </Box> */}

            {/* notification & profile */}
            <NotificationSection />
            <ProfileSection />

            {/* mobile header */}
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                <MobileSection />
            </Box>
        </>
    );
};

export default Header;
