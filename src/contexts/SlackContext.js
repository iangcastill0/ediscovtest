import PropTypes from 'prop-types';
import { createContext, useCallback, useState } from 'react';

import axiosServices from 'utils/axios';

const SlackContext = createContext({
    channels: {
        public: [],
        private: [],
        direct: [],
        group: []
    }, 
    members: {},
    realMembers: []
});

const SlackProvider = ({ children }) => {
    const [slackData, setSlackData] = useState({
        channels: {
            public: [],
            private: [],
            direct: [],
            group: []
        }
    });

    const [members, setMembers] = useState({});
    const [realMembers, setRealMembers] = useState([]);

    const getChannels = useCallback(async (teamid) => {
        const response = await axiosServices.get(`/slack/team/${teamid}/channels`);
        const data = response.data;
        console.log("Channels: ", data);
        setSlackData((prevData) => ({...prevData, channels: data.data}));

        return data.ok;
    }, []); // Dependencies array is empty, meaning this function is created once per mount

    const getChannels2 = useCallback(async (teamid, userId) => {
        const response = await axiosServices.get(`/slack/team/${teamid}/users/${userId}/channels`);
        const data = response.data;
        console.log("Channels: ", data);
        setSlackData((prevData) => ({...prevData, channels: data.data}));

        return data.ok;
    }, []); // Dependencies array is empty, meaning this function is created once per mount

    const getMembers = useCallback(async (teamid) => {
        const response = await axiosServices.get(`/slack/team/${teamid}/members`);
        const data = response.data;
        console.log("Members: ", data);
        setMembers(data.data);
    }, []);

    const getRealMembers = useCallback(async (teamid) => {
        const response = await axiosServices.get(`/slack/team/${teamid}/real-members`);
        const data = response.data;
        console.log("Real Members: ", data);
        setRealMembers(data.data);
    }, []);

    return (
        <SlackContext.Provider value={{ slackData, getChannels, getChannels2, members, getMembers, realMembers, getRealMembers }}>
            {children}
        </SlackContext.Provider>
    );
}

SlackProvider.propTypes = {
    children: PropTypes.node
};

export { SlackContext, SlackProvider };
