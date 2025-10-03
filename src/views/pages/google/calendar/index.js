import PropTypes from 'prop-types';
import { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import { Box, Tab, Tabs, LinearProgress } from '@mui/material';

// project imports
import EventsChannel from './EventsChannel';

import MainCard from 'ui-component/cards/MainCard';

// assets
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { GoogleCalendarContext } from 'contexts/GoogleCalendarContext';

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

const CalendarView = () => {
    const theme = useTheme();
    const {userId} = useParams();
    // set selected tab
    const [value, setValue] = useState(0);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const { calendarData, getEvents } = useContext(GoogleCalendarContext);
    useEffect(() => {
        const fetch = async () => {
          try {
            setLoading(true);
            if(userId){
              await getEvents(userId);
            }else{
              navigate(`/google/apps`);
            }
            setLoading(false);
          } catch (err) {
            navigate(`/google/apps`);
          }
        }
        fetch();
    }, []);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <MainCard title="Calendar" backButton>
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
                <Tab icon={<EventAvailableOutlinedIcon />} label="Events" {...a11yProps(0)} />
            </Tabs>

            <TabPanel value={value} index={0}>
                <EventsChannel msgList={calendarData.channels.events} />
            </TabPanel>
        </MainCard>
    );
};

export default CalendarView;
