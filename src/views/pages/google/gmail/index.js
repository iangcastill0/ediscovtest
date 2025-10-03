import PropTypes from 'prop-types';
import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, LinearProgress } from '@mui/material';

// project imports
import Messages from './Messages';
import MainCard from 'ui-component/cards/MainCard';

// assets
import AllInboxIcon from '@mui/icons-material/AllInbox';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DraftsIcon from '@mui/icons-material/Drafts';
import axios from 'utils/axios'

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

const GmailView = () => {
    const theme = useTheme();
    const {workspaceId, userId} = useParams();
    const [labels, setLabels] = useState([])
    const query = new URLSearchParams(window.location.search);
    const isPersonal = query.get('isPersonal');
    // set selected tab
    const [value, setValue] = useState(0);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchLables = async () => {
            setLoading(true)
          const resp = await axios.get(`/google/workspace/${workspaceId}/users/${userId}/gmail/labels?isPersonal=${isPersonal}`)
          if (resp.data?.ok) {
            setLabels(resp.data?.labels)
          }
          setLoading(false)
      };

      fetchLables();
  }, []);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <MainCard title="Gmail" backButton>
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
                <Tab icon={<AllInboxIcon />}  label="All" {...a11yProps(0)} />
                <Tab icon={<MailOutlineIcon />}  label="Inbox" {...a11yProps(1)} />
                <Tab icon={<SendOutlinedIcon />}  label="Sent Items" {...a11yProps(2)} />
                <Tab icon={<DeleteOutlinedIcon />}  label="Trash" {...a11yProps(3)} />
                <Tab icon={<DraftsIcon />}  label="Drafts" {...a11yProps(4)} />
            </Tabs>

            <TabPanel value={value} index={0}>
                <Messages workspaceId={workspaceId} userId={userId} isPersonal={isPersonal} type='all' labels={labels}/>
            </TabPanel>
            <TabPanel value={value} index={1}>
                <Messages workspaceId={workspaceId} userId={userId} isPersonal={isPersonal} type='inbox' labels={labels}/>
            </TabPanel>
            <TabPanel value={value} index={2}>
                <Messages workspaceId={workspaceId} userId={userId} isPersonal={isPersonal} type='sent' labels={labels}/>
            </TabPanel>
            <TabPanel value={value} index={3}>
                <Messages workspaceId={workspaceId} userId={userId} isPersonal={isPersonal} type='trash' labels={labels}/>
            </TabPanel>
            <TabPanel value={value} index={4}>
                <Messages workspaceId={workspaceId} userId={userId} isPersonal={isPersonal} type='drafts' labels={labels}/>
            </TabPanel>
        </MainCard>
    );
};

export default GmailView;
