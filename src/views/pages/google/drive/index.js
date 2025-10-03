import PropTypes from 'prop-types';
import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, LinearProgress } from '@mui/material';

// project imports
import MyfilesChannel from './MyfilesChannel_v2';
import SharedWithMeChannel from './SharedWithMeChannel';
import MainCard from 'ui-component/cards/MainCard';

// assets
import FileCopyOutlinedIcon from '@mui/icons-material/FileCopyOutlined';
import FolderSharedOutlinedIcon from '@mui/icons-material/FolderSharedOutlined';
import FolderCopyOutlinedIcon from '@mui/icons-material/FolderCopyOutlined';
import { GoogleDriveContext } from 'contexts/GoogleDriveContext';

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

const DriveView = () => {
    const theme = useTheme();
    const { workspaceId, userId } = useParams();
    // set selected tab
    const [value, setValue] = useState(0);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const { driveData, getFiles } = useContext(GoogleDriveContext);
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
        <MainCard title="Google Drive" backButton>
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
                <Tab icon={<FolderSharedOutlinedIcon />}  label="Shared With Me" {...a11yProps(1)} />
            </Tabs>

            <TabPanel value={value} index={0}>
                <MyfilesChannel msgList={driveData.channels.my_files} userId={userId} workspaceId={workspaceId} isPersonal={isPersonal} />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <SharedWithMeChannel msgList={driveData.channels.sharedWithMe} userId={userId} workspaceId={workspaceId} isPersonal={isPersonal} />
            </TabPanel>

        </MainCard>
    );
};

export default DriveView;
