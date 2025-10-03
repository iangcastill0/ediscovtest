import PropTypes from 'prop-types';
import { createContext, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axiosServices from "../utils/axios";
import axios from 'axios';

const GoogleCalendarContext = createContext({
    channels: {
        events: [],
    }, 
});

const GoogleCalendarProvider = ({ children }) => {
    const navigate = useNavigate();
    const [calendarData, setCalendarData] = useState({
        channels: {
          events: [],
        }
    });

    const getEvents = async (userId) => {
        try {
            if(userId){
                const result = await axiosServices.get(`/google/workspace/${userId}/events`);

                console.log('get events:', result.data);
                setCalendarData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, events: result.data }
                }));
            }
        } catch {
            navigate(`/google/apps`);
        }
    }

    return (
        <GoogleCalendarContext.Provider value={{ calendarData, getEvents, setCalendarData }}>
            {children}
        </GoogleCalendarContext.Provider>
    );
}

GoogleCalendarProvider.propTypes = {
    children: PropTypes.node
};

export { GoogleCalendarContext, GoogleCalendarProvider };
