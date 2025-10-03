import PropTypes from 'prop-types';
import { createContext, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axiosServices from "../utils/axios";

const GoogleChatContext = createContext({
    channels: {
        spaces: [],
    },
});

const GoogleChatProvider = ({ children }) => {
    const navigate = useNavigate();
    const [chatData, setChatData] = useState({
        channels: {
            spaces: [],
        },
    });

    const getSpaces = async (userId) => {
        try {
          if(userId){
              const result = await axiosServices.get(`/google/workspace/${userId}/chatspaces`);

              console.log('chat spaces data:', result.data);

              setChatData(prevData => ({
                  ...prevData,
                  channels: { ...prevData.channels, spaces: result.data }
              }));
          }
        } catch {
            navigate(`/google/apps`);
        }
    }

    return (
        <GoogleChatContext.Provider value={{ chatData, setChatData, getSpaces }}>
            {children}
        </GoogleChatContext.Provider>
    );
}

GoogleChatProvider.propTypes = {
    children: PropTypes.node
};

export { GoogleChatContext, GoogleChatProvider };
