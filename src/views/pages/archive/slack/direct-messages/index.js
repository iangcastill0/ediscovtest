import PropTypes from 'prop-types';

import { useState } from 'react';

// material-ui
import { styled, useTheme } from '@mui/material/styles';
import { Box, Grid } from '@mui/material';

// project imports
import ArchiveConversationsList from './ConversationsList';
import ArchiveConversationDetails from './ConversationDetails';
import { appDrawerWidth as drawerWidth, gridSpacing } from 'store/constant';

// drawer content element
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
    width: 'calc(100% - 320px)',
    flexGrow: 1,
    paddingLeft: open ? theme.spacing(3) : 0,
    transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.shorter
    }),
    marginLeft: `-${drawerWidth}px`,
    [theme.breakpoints.down('xl')]: {
        paddingLeft: 0,
        marginLeft: 0
    },
    ...(open && {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.shorter
        }),
        marginLeft: 0
    })
}));

// ==============================|| MAIL MAIN PAGE ||============================== //

const ArchiveDirectMessages = ({teamId, channels, members, backupId}) => {
    const theme = useTheme();

    // const [selectedMail, setSelectedMail] = useState(null);

    // const handleUserChange = async (data) => {
    //     if (data) {
    //         await dispatch(setRead(data.id));
    //         await dispatch(getMails());
    //     }
    //     setSelectedMail(data);
    //     setEmailDetailsValue((prev) => !prev);
    // };
    const [openConvSidebar, setopenConvSidebar] = useState(true);

    const handleDrawerOpen = () => {
        setopenConvSidebar((prevState) => !prevState);
    };

    const [filter, setFilter] = useState('');
    const handleFilter = async (channelId) => {
        setFilter(channelId);
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <ArchiveConversationsList
                openConvSidebar={openConvSidebar}
                handleDrawerOpen={handleDrawerOpen}
                filter={filter}
                handleFilter={handleFilter}
                channels={channels}
            />
            <Main theme={theme} open={openConvSidebar}>
                <Grid container spacing={gridSpacing}>
                    <Grid item xs={12}>
                            <ArchiveConversationDetails
                                teamId={teamId}
                                channelId={filter}
                                backupId={backupId}
                                members={members}
                            />
                    </Grid>
                </Grid>
            </Main>
        </Box>
    );
};

ArchiveDirectMessages.propTypes = {
    teamId: PropTypes.string,
    channels: PropTypes.array,
    members: PropTypes.object,
    backupId: PropTypes.string
};

export default ArchiveDirectMessages;
