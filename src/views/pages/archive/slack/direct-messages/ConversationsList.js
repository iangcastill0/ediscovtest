import PropTypes from 'prop-types';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
    CardContent,
    Avatar,
    Drawer,
    Divider,
    Grid,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    LinearProgress,
    useMediaQuery
} from '@mui/material';

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar';

// project imports
import useConfig from 'hooks/useConfig';
import MainCard from 'ui-component/cards/MainCard';
import { appDrawerWidth as drawerWidth, gridSpacing } from 'store/constant';

// assets
import { useEffect, useState } from 'react';

// ==============================|| MAIL DRAWER ||============================== //

const ArchiveConversationsList = ({ filter, handleDrawerOpen, handleFilter, openConvSidebar, channels }) => {
    const theme = useTheme();
    const { borderRadius } = useConfig();
    const matchDownSM = useMediaQuery(theme.breakpoints.down('xl'));
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setLoading(true);
        setConversations(channels || []);
        setLoading(false)
    }, [channels]);

    return (
        <Drawer
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                zIndex: { xs: 1200, xl: 0 },
                '& .MuiDrawer-paper': {
                    height: 'auto',
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    position: 'relative',
                    border: 'none',
                    borderRadius: matchDownSM ? 0 : `${borderRadius}px`
                }
            }}
            variant={matchDownSM ? 'temporary' : 'persistent'}
            anchor="left"
            open={openConvSidebar}
            ModalProps={{ keepMounted: true }}
            onClose={handleDrawerOpen}
        >
            {openConvSidebar && (
                <MainCard
                    sx={{
                        bgcolor: theme.palette.mode === 'dark' ? 'dark.main' : 'grey.50'
                    }}
                    border={!matchDownSM}
                    content={false}
                    title="User List"
                >
                    <CardContent sx={{ height: matchDownSM ? '100vh' : 'auto' }}>
                        <Grid container spacing={gridSpacing}>
                            <Grid item xs={12}>
                                {loading && <LinearProgress />}
                                <PerfectScrollbar
                                    style={{
                                        height: matchDownSM ? 'calc(100vh - 115px)' : 'calc(100vh - 295px)',
                                        overflowX: 'hidden',
                                        minHeight: matchDownSM ? 0 : 435
                                    }}
                                >
                                    <List
                                        component="nav"
                                        sx={{
                                            '& .MuiListItem-root': {
                                                mb: 0.75,
                                                borderRadius: `${borderRadius}px`,
                                                '& .MuiChip-root': {
                                                    color:
                                                        theme.palette.mode === 'dark'
                                                            ? theme.palette.primary.main
                                                            : theme.palette.secondary.main,
                                                    bgcolor:
                                                        theme.palette.mode === 'dark'
                                                            ? theme.palette.dark.dark
                                                            : theme.palette.secondary.light
                                                }
                                            },
                                            '& .MuiListItem-root.Mui-selected': {
                                                bgcolor:
                                                    theme.palette.mode === 'dark' ? theme.palette.dark.dark : theme.palette.secondary.light,
                                                '& .MuiListItemText-primary': {
                                                    color:
                                                        theme.palette.mode === 'dark'
                                                            ? theme.palette.primary.main
                                                            : theme.palette.secondary.main
                                                },
                                                '& .MuiChip-root': {
                                                    color:
                                                        theme.palette.mode === 'dark'
                                                            ? theme.palette.primary.main
                                                            : theme.palette.secondary.light,
                                                    bgcolor:
                                                        theme.palette.mode === 'dark'
                                                            ? theme.palette.dark.main
                                                            : theme.palette.secondary.main
                                                }
                                            }
                                        }}
                                    >
                                        {
                                            conversations.map((channel) => (
                                                <>
                                                    <ListItemButton selected={filter === channel.id} onClick={() => handleFilter(channel.id)}>
                                                        <ListItemIcon>
                                                            <Avatar alt="User" src={channel.user.avatar} sx={{ mr: 2 }} />
                                                        </ListItemIcon>
                                                        <ListItemText primary={channel.user.real_name} />
                                                    </ListItemButton>
                                                    <Divider />
                                                </>
                                            ))
                                        }
                                    </List>
                                </PerfectScrollbar>
                            </Grid>
                        </Grid>
                    </CardContent>
                </MainCard>
            )}
        </Drawer>
    );
};

ArchiveConversationsList.propTypes = {
    filter: PropTypes.string,
    handleDrawerOpen: PropTypes.func,
    handleFilter: PropTypes.func,
    openConvSidebar: PropTypes.bool,
    channels: PropTypes.array,
};

export default ArchiveConversationsList;
