import PropTypes from 'prop-types';
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, LinearProgress } from '@mui/material';

// project imports
import Files from './Files';
import Deleted from './Deleted';
import Shared from './Shared';
import ActivityLogs from './ActivityLogs';
import MainCard from 'ui-component/cards/MainCard';

// assets
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import FolderSharedOutlinedIcon from '@mui/icons-material/FolderSharedOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NotesOutlineIcon from '@mui/icons-material/Notes';

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

const DropboxTabs = () => {
    const theme = useTheme();
    const { workspaceId, userId } = useParams();
    // set selected tab
    const [value, setValue] = useState(0);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const query = new URLSearchParams(window.location.search);
    const isPersonal = query.get('isPersonal');

    // useEffect(() => {
    //     const fetch = async () => {
    //         try {
    //           setLoading(true);
    //           if(userId){
    //             await getFiles(workspaceId, userId, isPersonal);
    //           }else{
    //             navigate(`/google/apps`);
    //           }
    //           setLoading(false);
    //         } catch (err) {
    //           navigate(`/google/apps`);
    //         }
    //     }

    //     fetch();
    // }, []);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <MainCard title="Dropbox Files" backButton>
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
                <Tab icon={<FileCopyOutlinedIcon />}  label="Files" {...a11yProps(0)} />
                <Tab icon={<FolderSharedOutlinedIcon />}  label="Shared" {...a11yProps(1)} />
                <Tab icon={<DeleteOutlineIcon />}  label="Deleted" {...a11yProps(2)} />
                {isPersonal === 'false' && <Tab icon={<NotesOutlineIcon />}  label="Activity Logs" {...a11yProps(3)} />}
            </Tabs>

            <TabPanel value={value} index={0}>
                <Files userId={userId} workspaceId={workspaceId} isPersonal={isPersonal} />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <Shared userId={userId} workspaceId={workspaceId} isPersonal={isPersonal} />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <Deleted userId={userId} workspaceId={workspaceId} isPersonal={isPersonal} />
            </TabPanel>
            <TabPanel value={value} index={3}>
                <ActivityLogs userId={userId} workspaceId={workspaceId} isPersonal={isPersonal} />
            </TabPanel>

        </MainCard>
    );
};

export default DropboxTabs;
