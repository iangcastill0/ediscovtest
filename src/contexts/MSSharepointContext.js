import PropTypes from 'prop-types';
import { createContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';

const MSSharepointContext = createContext({
    channels: {
        sites: [],
    }, 
});

const MSSharepointProvider = ({ children }) => {
    const navigate = useNavigate();
    const [sharepointData, setSharepointData] = useState({
        channels: {
          sites: [],
        },
        rootFiles: [],
        Lists: [],
        groups: [],
        conversationList: [],
    });

    const getSites = async (accessToken) => {
        try {
            if(accessToken){
                const response = await axios.get('https://graph.microsoft.com/v1.0/sites?search=*', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const data = response.data;
                console.log('get sites?search=*: ');
                console.log(data);
                setSharepointData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, sites: data.value }
                }));
            }
        } catch (e) {
            if (e.response && e.response.data && e.response.data.error) {
                const errorCode = e.response.data.error.code;
                const errorMessage = e.response.data.error.message;

                console.error("Error Code:", errorCode);
                console.error("Error Message:", errorMessage);
                // eslint-disable-next-line no-alert
                alert(errorMessage)
            } else {
                // General error handling if the error structure is different
                console.error("An unexpected error occurred:", e);
                // eslint-disable-next-line no-alert
                alert("An unexpected error occurred")
            }
            navigate(`/ms365/apps`);
        }
    }

    const rootFilesData = async (accessToken, siteId) => {
        const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root/children`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data.value;
        } catch (error) {
            console.error('Error', error);
            throw error;
        }
    }

    const getRootFilesData = async (accessToken, siteId) => {
        try {
            if (accessToken) {
                const fileData = await rootFilesData(accessToken, siteId);
                console.log('get rootFilesData: ');
                console.log(fileData);
                setSharepointData(prevData => ({
                    ...prevData,
                    rootFiles: fileData
                }));
                
            }
        } catch (e) {
            if (e.response && e.response.data && e.response.data.error) {
                const errorCode = e.response.data.error.code;
                const errorMessage = e.response.data.error.message;

                console.error("Error Code:", errorCode);
                console.error("Error Message:", errorMessage);
                // eslint-disable-next-line no-alert
                alert(errorMessage)
                
            } else {
                // General error handling if the error structure is different
                console.error("An unexpected error occurred:", e);
                // eslint-disable-next-line no-alert
                alert("An unexpected error occurred")
            }
            navigate(`/ms365/apps`);
        }
    }

    const listsData = async (accessToken, siteId) => {
        const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data.value;
        } catch (error) {
            console.error('Error', error);
            throw error;
        }
    }

    const getListsData = async (accessToken, siteId) => {
        try {
            if (accessToken) {
                const listData = await listsData(accessToken, siteId);
                console.log('get listData: ');
                console.log(listData);
                setSharepointData(prevData => ({
                    ...prevData,
                    Lists: listData
                }));
                
            }
        } catch (error) {
            console.error('Error getting lists info:', error);
            navigate(`/ms365/apps`);
        }
    }

    const getGroup = async (accessToken) => {
        try {
            if(accessToken){
                const response = await axios.get('https://graph.microsoft.com/v1.0/groups', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const data = response.data;
                console.log('get groups: ');
                console.log(data);
                setSharepointData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, groups: data.value }
                }));
            }
        } catch(e) {
            if (e.response && e.response.data && e.response.data.error) {
                const errorCode = e.response.data.error.code;
                const errorMessage = e.response.data.error.message;

                console.error("Error Code:", errorCode);
                console.error("Error Message:", errorMessage);
                // eslint-disable-next-line no-alert
                alert(errorMessage)
            } else {
                // General error handling if the error structure is different
                console.error("An unexpected error occurred:", e);
                // eslint-disable-next-line no-alert
                alert("An unexpected error occurred")
            }
            navigate(`/ms365/apps`);
        }
    }

    const conversationsData = async (accessToken, groupId) => {
        const url = `https://graph.microsoft.com/v1.0/groups/${groupId}/conversations`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data.value;
        } catch (error) {
            console.error('Error', error);
            throw error;
        }
    }

    const getConversationsData = async (accessToken, groupId) => {
        try {
            if (accessToken) {
                const conversationData = await conversationsData(accessToken, groupId);
                console.log('get conversationsData: ');
                console.log(conversationData);
                setSharepointData(prevData => ({
                    ...prevData,
                    conversationList: conversationData
                }));
                
            }
        } catch (e) {
            if (e.response && e.response.data && e.response.data.error) {
                const errorCode = e.response.data.error.code;
                const errorMessage = e.response.data.error.message;

                console.error("Error Code:", errorCode);
                console.error("Error Message:", errorMessage);
                // eslint-disable-next-line no-alert
                alert(errorMessage)
            } else {
                // General error handling if the error structure is different
                console.error("An unexpected error occurred:", e);
                // eslint-disable-next-line no-alert
                alert("An unexpected error occurred")
            }
            navigate(`/ms365/apps`);
        }
    }

    return (
        <MSSharepointContext.Provider value={{ sharepointData, setSharepointData, getSites, getRootFilesData, getListsData, getGroup, getConversationsData }}>
            {children}
        </MSSharepointContext.Provider>
    );
}

MSSharepointProvider.propTypes = {
    children: PropTypes.node
};

export { MSSharepointContext, MSSharepointProvider };
