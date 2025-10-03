import PropTypes from 'prop-types';
import { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';

// material-ui
import { styled, useTheme } from '@mui/material/styles';
import { Box, Grid } from '@mui/material';

// project imports
import ConversationsList from './ConversationsList';
import ConversationDetails from './ConversationDetails';
import { appDrawerWidth as drawerWidth, gridSpacing } from 'store/constant';
import { SlackContext } from 'contexts/SlackContext';

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

const DirectMessages = ({members, channels}) => {
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
    const {teamId, userId} = useParams();
    const [openConvSidebar, setopenConvSidebar] = useState(true);
    const [accessToken, setAccessToken] = useState('');
    const [userName, setUserName] = useState('');

    // useEffect(() => {
    //     const fetchData = async () => {
    //         if (Object.keys(members).length < 1) {
    //             getMembers(teamId);
    //         } else {
    //             const token = members[userId] ? members[userId].access_token : '';
    //             console.log("AccessToken: ", token);
    //             setAccessToken(token);
    //         }
    //     }
    //     fetchData();
    // }, [members, teamId, userId, getMembers]);

    const handleDrawerOpen = () => {
        setopenConvSidebar((prevState) => !prevState);
    };

    const [filter, setFilter] = useState('');
    const handleFilter = async (channelId, userName) => {
        setFilter(channelId);
        setUserName(userName);
    };

    // const handleImportantChange = async (event, dataImportant) => {
    //     if (dataImportant) {
    //         await dispatch(setImportant(dataImportant.id));
    //         handleFilter(filter);
    //     }
    // };

    // const handleStarredChange = async (event, dataStarred) => {
    //     if (dataStarred) {
    //         await dispatch(setStarred(dataStarred.id));
    //         handleFilter(filter);
    //     }
    // };

    // // search email using name
    // const [search, setSearch] = useState('');
    // const handleSearch = (event) => {
    //     const newString = event.target.value;
    //     setSearch(newString);

    //     if (newString) {
    //         const newRows = data.filter((row) => {
    //             let matches = true;

    //             const properties = ['name'];
    //             let containsQuery = false;

    //             properties.forEach((property) => {
    //                 if (row.profile[property].toString().toLowerCase().includes(newString.toString().toLowerCase())) {
    //                     containsQuery = true;
    //                 }
    //             });

    //             if (!containsQuery) {
    //                 matches = false;
    //             }
    //             return matches;
    //         });
    //         setData(newRows);
    //     } else {
    //         handleFilter(filter);
    //     }
    // };

    return (
        <Box sx={{ display: 'flex' }}>
            <ConversationsList
                openConvSidebar={openConvSidebar}
                handleDrawerOpen={handleDrawerOpen}
                filter={filter}
                handleFilter={handleFilter}
                teamId={teamId}
                userId={userId}
                channels={channels}
            />
            <Main theme={theme} open={openConvSidebar}>
                <Grid container spacing={gridSpacing}>
                    <Grid item xs={12}>
                            <ConversationDetails
                                teamId={teamId}
                                userId={userId}
                                channelId={filter}
                                userName={userName}
                            />
                    </Grid>
                </Grid>
            </Main>
        </Box>
    );
};

DirectMessages.propTypes = {
    members: PropTypes.object,
    channels: PropTypes.array,
};

export default DirectMessages;
