import PropTypes from 'prop-types';
import { createContext, useState, useCallback } from 'react';

import axiosServices from 'utils/axios';

const ArchiveContext = createContext({channels: {
    public: [],
    private: [],
    direct: [],
    group: []
}, members: []});

const ArchiveProvider = ({ children }) => {
    const [slackData, setSlackData] = useState({
        channels: {
            public: [],
            private: [],
            direct: [],
            group: [],
        }
    });

    const [members, setMembers] = useState({});
    const [emojis, setEmojis] = useState({});

    const getEmojis = useCallback(async (teamId) => {
        const response = await axiosServices.get(`/slack/team/${teamId}/emojis`);
        setEmojis(response.data.data);
    }, [])


    const getChannels = useCallback(async (teamid, backupId) => {
        const response = await axiosServices.get(`/archive/slack/${teamid}/channels/backup/${backupId}`);
        const data = response.data;
        console.log("Channels: ", data)
        setSlackData((prevData)=>({...prevData, channels: data.data}));

        return data.ok;
    }, [])

    const getMembers = useCallback(async (teamid) => {
        const response = await axiosServices.get(`/archive/slack/${teamid}/members`);
        const data = response.data;
        console.log("Members: ", data)
        setMembers(data.data);
    }, [])

    return (
        <ArchiveContext.Provider value={{ slackData, getChannels, members, getMembers, emojis, getEmojis }}>
            {children}
        </ArchiveContext.Provider>
    );
}

ArchiveProvider.propTypes = {
    children: PropTypes.node
};

export { ArchiveContext };
export default ArchiveProvider;