import PropTypes from 'prop-types';
import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, LinearProgress } from '@mui/material';

// project imports
import TeamsChannel from './TeamsChannel';
import ChatsChannel from './ChatsChannel';
import CalendarsChannel from './CalendarsChannel';
import FilesChannel from './FilesChannel';
import MainCard from 'ui-component/cards/MainCard';

// assets
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import { MSTeamsContext } from 'contexts/MSTeamsContext';

import { MS365Context } from 'contexts/MS365Context';

// tab content
function TabPanel({ children, value, index, ...other }) {
    return (
        <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`} {...other}>
            {value === index && <Box sx={{ p: 0 }}>{children}</Box>}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.any.isRequired,
    value: PropTypes.any.isRequired
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`
    };
}

// ==============================|| ORDER DETAILS ||============================== //

const TeamsView = () => {
    const theme = useTheme();
    const { userId } = useParams();
    // set selected tab
    const [value, setValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const { teamsData, getTeams, getChats, getCalendars, getSites } = useContext(MSTeamsContext);
    const { accessToken } = useContext(MS365Context);
    
    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            if(accessToken){
                await getTeams(accessToken, userId);
                await getChats(accessToken, userId);
                await getCalendars(accessToken, userId);
                await getSites(accessToken, userId);
            }
            setLoading(false);
        }

        fetch();
    }, []);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <MainCard title="Teams" backButton>
            {loading && <LinearProgress />}
            <Tabs
                value={value}
                indicatorColor="primary"
                textColor="primary"
                onChange={handleChange}
                variant="scrollable"
                aria-label="simple tabs example"
                sx={{
                    '& a': {
                        minHeight: 'auto',
                        minWidth: 10,
                        px: 1,
                        py: 1.5,
                        mr: 2.25,
                        color: theme.palette.grey[600],
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center'
                    },
                    '& a.Mui-selected': {
                        color: theme.palette.primary.main
                    },
                    '& a > svg': {
                        marginBottom: '0px !important',
                        marginRight: 1.25
                    },
                    mb: 3
                }}
            >
                <Tab icon={<GroupsOutlinedIcon />}  label="Teams" {...a11yProps(0)} />
                <Tab icon={<MessageOutlinedIcon />}  label="Chats" {...a11yProps(1)} />
                <Tab icon={<CalendarMonthOutlinedIcon />}  label="Calendar" {...a11yProps(2)} />
                <Tab icon={<FileCopyOutlinedIcon />}  label="Files" {...a11yProps(3)} />
            </Tabs>

            <TabPanel value={value} index={0}>
                <TeamsChannel msgList={teamsData.channels.teams} />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <ChatsChannel msgList={teamsData.channels.chatList} />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <CalendarsChannel msgList={teamsData.channels.calendarList} />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <FilesChannel msgList={teamsData.channels.sites} />
            </TabPanel>

        </MainCard>
    );
};

export default TeamsView;
