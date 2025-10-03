import PropTypes from 'prop-types';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs } from '@mui/material';

// project imports
import ListOfApps from './ListOfApps';
import ArchiveLogs from './Logs';
import CronSetting from './CronSetting';
import MainCard from 'ui-component/cards/MainCard';

// assets
import ListAltIcon from '@mui/icons-material/ListAlt';
import FeedIcon from '@mui/icons-material/Feed';
import ManageHistoryIcon from '@mui/icons-material/ManageHistory';

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

const ArchiveView = () => {
    const theme = useTheme();
    const { id } = useParams();
    // set selected tab
    const [value, setValue] = useState(0);
    const [archives, setArchives] = useState({});

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const goArchiveList = (row) => {
        setArchives(row);
        setValue(1);
    }

    return (
        <MainCard>
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
                <Tab icon={<ListAltIcon />}  label="SaaS Apps" {...a11yProps(0)} />
                <Tab icon={<FeedIcon />}  label="Backups" {...a11yProps(1)} disabled />
                {/* <Tab icon={<ManageHistoryIcon />}  label="Setting" {...a11yProps(2)} /> */}
            </Tabs>

            {/* tab - Public Channels */}
            <TabPanel value={value} index={0}>
                <ListOfApps goArchiveList={goArchiveList}/>
            </TabPanel>

            {/* tab - Private Channels */}
            <TabPanel value={value} index={1}>
                <ArchiveLogs teamId={id} data={archives}/>
            </TabPanel>

            {/* tab - Direct Messages
            <TabPanel value={value} index={2}>
                <CronSetting teamId={id} />
            </TabPanel> */}
        </MainCard>
    );
};

export default ArchiveView;
