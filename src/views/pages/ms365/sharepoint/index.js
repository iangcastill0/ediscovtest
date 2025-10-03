import PropTypes from 'prop-types';
import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, LinearProgress } from '@mui/material';

// project imports
import SharePointSitesChannel from './SharePointSitesChannel';
import ConversationsChannel from './ConversationsChannel';
import MainCard from 'ui-component/cards/MainCard';

// assets
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import { MSSharepointContext } from 'contexts/MSSharepointContext';

import axios, { SERVER_URL } from 'utils/axios';
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

const SharepointView = () => {
    const theme = useTheme();
    const { id } = useParams();
    // set selected tab
    const [value, setValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const { sharepointData, getSites, getGroup } = useContext(MSSharepointContext);
    const { accessToken } = useContext(MS365Context);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            if (accessToken){
                await getSites(accessToken);
                await getGroup(accessToken);
            }
            setLoading(false);
        }

        fetch();
    }, []);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <MainCard title="SharePoint" backButton>
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
                <Tab icon={<LanguageOutlinedIcon />}  label="Sites" {...a11yProps(0)} />
                <Tab icon={<ForumOutlinedIcon />}  label="Conversations" {...a11yProps(1)} />
                {/* <Tab icon={<FileCopyOutlinedIcon />}  label="Files" {...a11yProps(2)} /> */}
            </Tabs>

            <TabPanel value={value} index={0}>
                <SharePointSitesChannel msgList={sharepointData.channels.sites} />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <ConversationsChannel msgList={sharepointData.channels.groups} />
            </TabPanel>
            <TabPanel value={value} index={1}>
                {/* <MyfilesChannel msgList={onedriveData.channels.my_files} /> */}
            </TabPanel>

        </MainCard>
    );
};

export default SharepointView;
