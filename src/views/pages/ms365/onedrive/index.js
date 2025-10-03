import PropTypes from 'prop-types';
import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, LinearProgress } from '@mui/material';

// project imports
import MyfilesChannel from './MyfilesChannel';
// import SharedWithMeChannel from './SharedWithMeChannel';
// import SharedByYouChannel from './SharedByYouChannel';
import MainCard from 'ui-component/cards/MainCard';

// assets
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
// import FolderSharedOutlinedIcon from '@mui/icons-material/FolderSharedOutlined';
// import FolderCopyOutlinedIcon from '@mui/icons-material/FolderCopyOutlined';
// import CoPresentOutlinedIcon from '@mui/icons-material/CoPresentOutlined';
import { MSOnedriveContext } from 'contexts/MSOnedriveContext';

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

const OnedriveView = () => {
    const theme = useTheme();
    const { workspaceId, userId } = useParams();
    // set selected tab
    const [value, setValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const { onedriveData, getFiles, getSharedWithMe, getSharedByYou } = useContext(MSOnedriveContext);
    const { accessToken } = useContext(MS365Context);

    useEffect(() => {
        const fetch = async () => {
            setLoading(true);
            await getFiles(workspaceId, userId);
            // await getSharedWithMe(workspaceId, userId);
            // await getSharedByYou(workspaceId, userId);
            setLoading(false);
        }

        fetch();
    }, []);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <MainCard title="OneDrive" backButton>
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
                <Tab icon={<FileCopyOutlinedIcon />}  label="My Files" {...a11yProps(0)} />
                {/* <Tab icon={<FolderSharedOutlinedIcon />}  label="Shared With Me" {...a11yProps(1)} />
                <Tab icon={<CoPresentOutlinedIcon />}  label="Shared By You" {...a11yProps(2)} /> */}
                {/* <Tab icon={<FolderCopyOutlinedIcon />}  label="OneDrive Folders" {...a11yProps(2)} /> */}
            </Tabs>

            {/* tab - Public Channels */}
            <TabPanel value={value} index={0}>
                <MyfilesChannel msgList={onedriveData.channels.my_files} workspaceId={workspaceId} userId={userId} />
            </TabPanel>
            {/* tab - Private Channels */}
            {/* <TabPanel value={value} index={1}>
                <SharedWithMeChannel msgList={onedriveData.channels.sharedWithMe} />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <SharedByYouChannel msgList={onedriveData.channels.sharedByYou} />
            </TabPanel> */}

        </MainCard>
    );
};

export default OnedriveView;
