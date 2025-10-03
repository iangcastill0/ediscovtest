import PropTypes from 'prop-types';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, Typography, LinearProgress } from '@mui/material';

// project imports
import PublicChannels from './PublicChannels';
import PrivateChannels from './PrivateChannels';
// import DirectMessageTab from './DirectMessageTab';
import DirectMessageTab from '../direct-messages';
import UserGroups from './UserGroups';
// import Invoice from './Invoice';
// import Status from './Status';
import MainCard from 'ui-component/cards/MainCard';

// assets
import PublicIcon from '@mui/icons-material/Public';
import SecurityIcon from '@mui/icons-material/Security';
import MessageIcon from '@mui/icons-material/Message';
import GroupIcon from '@mui/icons-material/Group';
import { SlackContext } from 'contexts/SlackContext';

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

const SlackView = () => {
    const theme = useTheme();
    const { teamId, userId } = useParams();
    // set selected tab
    const [value, setValue] = useState(0);
    const [loading, setLoading] = useState(false);

    const { slackData, getChannels2, members, getMembers } = useContext(SlackContext);
    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            await getChannels2(teamId, userId);
            await getMembers(teamId);
            setLoading(false);
        }

        fetch();
    }, [teamId, userId, getChannels2, getMembers]);

    console.log("SlackData:", slackData);
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const query = new URLSearchParams(window.location.search);
    const workspaceName = query.get('workspaceName');
    const userName = query.get('userName');
    return (
        <MainCard title={`${userName} of ${workspaceName}`} backButton>
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
                <Tab icon={<PublicIcon />}  label="Public Channels" {...a11yProps(0)} />
                <Tab icon={<SecurityIcon />}  label="Private Channels" {...a11yProps(1)} />
                <Tab icon={<MessageIcon />}  label="Direct Messages" {...a11yProps(2)} />
                <Tab icon={<GroupIcon />}  label="User Groups" {...a11yProps(3)} />
            </Tabs>

            {/* tab - Public Channels */}
            <TabPanel value={value} index={0}>
                {
                    typeof slackData.channels === 'string' ? <Typography align='center' variant='h4' color='red'>{slackData.channels}</Typography> : <PublicChannels channels={slackData.channels.public} members={members} teamId={teamId} userId={userId}/>
                }
            </TabPanel>

            {/* tab - Private Channels */}
            <TabPanel value={value} index={1}>
                {
                    typeof slackData.channels === 'string' ? <Typography align='center' variant='h4' color='red'>{slackData.channels}</Typography> : <PrivateChannels channels={slackData.channels.private} members={members} teamId={teamId} userId={userId} />
                }
            </TabPanel>

            {/* tab - Direct Messages */}
            <TabPanel value={value} index={2}>
                {
                    typeof slackData.channels === 'string' ? <Typography align='center' variant='h4' color='red'>{slackData.channels}</Typography> : <DirectMessageTab channels={slackData.channels.direct} members={members} teamId={teamId} userId={userId} />
                }
            </TabPanel>

            {/* tab - User Groups */}
            <TabPanel value={value} index={3}>
                {
                /* <Status /> */}
                {
                    typeof slackData.channels === 'string' ? <Typography align='center' variant='h4' color='red'>{slackData.channels}</Typography> : <UserGroups channels={slackData.channels.group} members={members} teamId={teamId} userId={userId} />
                }
            </TabPanel>
        </MainCard>
    );
};

export default SlackView;
