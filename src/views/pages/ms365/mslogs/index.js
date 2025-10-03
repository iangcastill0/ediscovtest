import PropTypes from 'prop-types';
import { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, LinearProgress } from '@mui/material';

// project imports
import AuditsChannel from '../outlook/AuditsChannel';
import DevicesChannel from '../outlook/DevicesChannel';
import ActivitiesChannel from '../onedrive/ActivitiesChannel';
import FileOperationsChannel from '../onedrive/FileOperationsChannel';

import MainCard from 'ui-component/cards/MainCard';

// assets
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined';
import DevicesOtherOutlinedIcon from '@mui/icons-material/DevicesOtherOutlined';
import { MSOutlookContext } from 'contexts/MSOutlookContext';
import { MSOnedriveContext } from 'contexts/MSOnedriveContext';

import axios from 'utils/axios';
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

const MsLogsView = () => {
    const theme = useTheme();
    const {userId} = useParams()
    // set selected tab
    const [value, setValue] = useState(0);

    const [loading, setLoading] = useState(false);

    const { outlookData, getAudits, getDevices } = useContext(MSOutlookContext);
    const { onedriveData, getDelta, getActivities } = useContext(MSOnedriveContext);
    const { accessToken } = useContext(MS365Context);
    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            if (accessToken) {
                await getAudits(accessToken, userId);
                await getDevices(accessToken, userId);
                await getDelta(accessToken, userId);
                await getActivities(accessToken, userId);
            }
            setLoading(false);
        }

        fetch();
    }, []);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <MainCard title="Logs to Display" backButton>
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
                <Tab icon={<ManageSearchOutlinedIcon />} label="Activities" {...a11yProps(0)} />
                <Tab icon={<ManageSearchOutlinedIcon />} label="File Operations" {...a11yProps(1)} />
                <Tab icon={<ManageSearchOutlinedIcon />} label="Directory Audits" {...a11yProps(2)} />
                <Tab icon={<DevicesOtherOutlinedIcon />} label="Devices" {...a11yProps(3)} />
            </Tabs>

            <TabPanel value={value} index={0}>
                <ActivitiesChannel msgList={onedriveData.channels.activitiesLog} />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <FileOperationsChannel msgList={onedriveData.channels.deltaLog} />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <AuditsChannel msgList={outlookData.channels.audits} />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <DevicesChannel msgList={outlookData.channels.devices} />
            </TabPanel>
        </MainCard>
    );
};

export default MsLogsView;
