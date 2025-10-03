import PropTypes from 'prop-types';
import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import {
    Box,
    Tab,
    Tabs,
    Typography,
    LinearProgress,
    Button,
} from '@mui/material';

// project imports
import ArchivePublicChannels from './PublicChannels';
import ArchivePrivateChannels from './PrivateChannels';
// import ArchiveDirectMessageTab from './DirectMessageTab';
import ArchiveDirectMessageTab from  '../direct-messages';
import ArchiveUserGroups from './UserGroups';
// import Invoice from './Invoice';
// import Status from './Status';
import MainCard from 'ui-component/cards/MainCard';

// assets
import PublicIcon from '@mui/icons-material/Public';
import SecurityIcon from '@mui/icons-material/Security';
import MessageIcon from '@mui/icons-material/Message';
import GroupIcon from '@mui/icons-material/Group';
import { ArchiveContext } from 'contexts/ArchiveContext';
import SimpleSearchDialog from 'ui-component/extended/SimpleSearchDialog';

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

const ArchiveSlackView = () => {
    const theme = useTheme();
    const { id, backupId } = useParams();
    // set selected tab
    const [value, setValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const navigate = useNavigate();

    const { slackData, getChannels, members, getMembers, getEmojis } = useContext(ArchiveContext);
    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            await getChannels(id, backupId);
            await getMembers(id, backupId);
            await getEmojis(id);
            setLoading(false);
        }

        fetch();
    }, [backupId, id, getChannels, getMembers, getEmojis]);

    console.log("SlackData:", slackData);
    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const query = new URLSearchParams(window.location.search);
    const title = query.get('name');

    const handleAdvancedSearchSubmit = (data) => {
        console.log('Slack Advanced Search Data:', data);
        let parameterText = `q=${data.keywords}`;
        if (data.dateRange.start) {
            parameterText += `&start=${data.dateRange.start.toLocaleDateString('en-CA')}`;
        }
        if (data.dateRange.end) {
            parameterText += `&end=${data.dateRange.end.toLocaleDateString('en-CA')}`;
        }
        if (data.emailFilters.from !== '') {
            parameterText += `&from=${data.emailFilters.from}`;
        }
        if (data.emailFilters.to !== '') {
            parameterText += `&to=${data.emailFilters.to}`;
        }
        parameterText += `&archives=${backupId}`;
        parameterText += `&type=slack`;
        navigate(`/search?${parameterText}`, { replace: true, state: { forceRefresh: true } });
    };

    return (
        <MainCard title={`${title}`} backButton>
            {loading && <LinearProgress />}
            <Button
                variant="contained"
                onClick={() => setDialogOpen(true)}
                style={{ margin: 8, float: 'right' }}
            >
                {'Advanced\nSearch'}
            </Button>
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
                <Tab icon={<PublicIcon />} label="Public Channels" {...a11yProps(0)} />
                <Tab icon={<SecurityIcon />} label="Private Channels" {...a11yProps(1)} />
                <Tab icon={<MessageIcon />} label="Direct Messages" {...a11yProps(2)} />
                <Tab icon={<GroupIcon />} label="User Groups" {...a11yProps(3)} />
            </Tabs>

            {/* tab - Public Channels */}
            <TabPanel value={value} index={0}>
                {
                    typeof slackData.channels === 'string' ? 
                    <Typography align='center' variant='h4' color='red'>{slackData.channels}</Typography> : 
                    <ArchivePublicChannels channels={slackData.channels.public} members={members} teamId={id} backupId={backupId} />
                }
            </TabPanel>

            {/* tab - Private Channels */}
            <TabPanel value={value} index={1}>
                {
                    typeof slackData.channels === 'string' ? 
                    <Typography align='center' variant='h4' color='red'>{slackData.channels}</Typography> : 
                    <ArchivePrivateChannels channels={slackData.channels.private} members={members} teamId={id} backupId={backupId} />
                }
            </TabPanel>

            {/* tab - Direct Messages */}
            <TabPanel value={value} index={2}>
                {
                    typeof slackData.channels === 'string' ? 
                    <Typography align='center' variant='h4' color='red'>{slackData.channels}</Typography> : 
                    <ArchiveDirectMessageTab teamId={id} channels={slackData.channels.direct} members={members} backupId={backupId} />
                }
            </TabPanel>

            {/* tab - User Groups */}
            <TabPanel value={value} index={3}>
                {
                /* <Status /> */}
                {
                    typeof slackData.channels === 'string' ? 
                    <Typography align='center' variant='h4' color='red'>{slackData.channels}</Typography> : 
                    <ArchiveUserGroups channels={slackData.channels.group} members={members} teamId={id} backupId={backupId} />
                }
            </TabPanel>
            <SimpleSearchDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSubmit={handleAdvancedSearchSubmit}
            />
        </MainCard>
    );
};

export default ArchiveSlackView;
