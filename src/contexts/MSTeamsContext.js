import PropTypes from 'prop-types';
import { createContext, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';

const MSTeamsContext = createContext({
    channels: {
        sites: [],
    },
});

const MSTeamsProvider = ({ children }) => {
    const navigate = useNavigate();
    const [teamsData, setTeamsData] = useState({
        channels: {
            teams: [],
            chatList: [],
            calendarList: [],
            inbox: [],
            sent_items: [],
            sites: [],
            my_files: [],
        },
        versionHistory: [],
        JsonOfTeam: {},
        dataOfMsg: [],
    });

    const getTeams = async (accessToken, userId) => {
        try {
            if (accessToken) {
                const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/joinedTeams`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const data = response.data;
                setTeamsData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, teams: data.value }
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

    const getChats = async (accessToken, userId) => {
        try {
            if (accessToken) {
                const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/chats?$expand=members`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const data = response.data;
                console.log('me/chats?$expand=members: ')
                console.log(data.value)
                setTeamsData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, chatList: data.value }
                }));
                const responseMsg = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/mailFolders/Inbox/messages`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const messages = responseMsg.data.value;
                const inboxMessages = messages.map(msg => ({ ...msg, folderType: 'inbox' }));

                const responseSent = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/mailFolders/SentItems/messages`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const sentMessages = responseSent.data.value;
                const sentMessagesWithFolder = sentMessages.map(msg => ({ ...msg, folderType: 'sent' }));

                const allMessages = [...inboxMessages, ...sentMessagesWithFolder];

                // Group and sort messages by conversationId ---inbox
                const conversationsInbox = inboxMessages.reduce((acc, message) => {
                    const convId = message.conversationId;
                    if (!acc[convId]) {
                        acc[convId] = [];
                    }
                    acc[convId].push(message);
                    return acc;
                }, {});

                Object.keys(conversationsInbox).forEach(convId => {
                    conversationsInbox[convId].sort((a, b) => {
                        const dateA = new Date(a.receivedDateTime);
                        const dateB = new Date(b.receivedDateTime);
                        return dateB - dateA; // For descending order
                    });
                });
                // Group and sort messages by conversationId ---sent
                const conversationsSent = sentMessagesWithFolder.reduce((acc, message) => {
                    const convId = message.conversationId;
                    if (!acc[convId]) {
                        acc[convId] = [];
                    }
                    acc[convId].push(message);
                    return acc;
                }, {});

                Object.keys(conversationsSent).forEach(convId => {
                    conversationsSent[convId].sort((a, b) => {
                        const dateA = new Date(a.receivedDateTime);
                        const dateB = new Date(b.receivedDateTime);
                        return dateB - dateA; // For descending order
                    });
                });
                // Group and sort messages by conversationId ---total
                const conversations = allMessages.reduce((acc, message) => {
                    const convId = message.conversationId;
                    if (!acc[convId]) {
                        acc[convId] = [];
                    }
                    acc[convId].push(message);
                    return acc;
                }, {});

                Object.keys(conversations).forEach(convId => {
                    conversations[convId].sort((a, b) => {
                        const dateA = new Date(a.receivedDateTime);
                        const dateB = new Date(b.receivedDateTime);
                        return dateB - dateA; // For descending order
                    });
                });
                // ----- end -------
                Object.keys(conversationsInbox).forEach(convId => {
                    conversationsInbox[convId].inbox = conversationsInbox[convId];
                    conversationsInbox[convId].total = conversations[convId];
                });

                Object.keys(conversationsSent).forEach(convId => {
                    conversationsSent[convId].sent = conversationsSent[convId];
                    conversationsSent[convId].total = conversations[convId];
                });

                setTeamsData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, inbox: conversationsInbox, sent_items: conversationsSent }
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
                alert("An unexpected error occurred:")
            }
            navigate(`/ms365/apps`);
        }
    }

    const getCalendars = async (accessToken, userId) => {
        try {
            if (accessToken) {
                const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/calendars`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const data = response.data;
                setTeamsData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, calendarList: data.value }
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
                alert("An unexpected error occurred:")
            }
            navigate(`/ms365/apps`);
        }
    }

    const jsonDataOfTeams = async (accessToken, teamId) => {
        const url = `https://graph.microsoft.com/v1.0/teams/${teamId}`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error', error);
            throw error;
        }
    }

    const getJsonOfTeam = async (accessToken, teamId) => {
        try {
            if (accessToken) {
                const jsonData = await jsonDataOfTeams(accessToken, teamId);
                setTeamsData(prevData => ({
                    ...prevData,
                    JsonOfTeam: jsonData
                }));
                // const response = await axios.get(`https://graph.microsoft.com/v1.0/teams/${teamId}/channels`, {
                //     headers: {
                //         Authorization: `Bearer ${accessToken}`
                //     }
                // });
                // const data = response.data.value;
                // console.log('channel data')
                // console.log(data)
                // const msg1 = await axios.get(`https://graph.microsoft.com/v1.0/teams/${teamId}/channels/${data[0].id}/messages`, {
                //     headers: {
                //         Authorization: `Bearer ${accessToken}`
                //     }
                // });
                // const data1 = msg1.data;
                // console.log('msg1')
                // console.log(data1)
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

    const dataOfMessage = async (accessToken, chatId) => {
        const url = `https://graph.microsoft.com/v1.0/chats/${chatId}/messages`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error', error);
            throw error;
        }
    }

    const getMessageContent = async (accessToken, chatId) => {
        try {
            if (accessToken) {
                const jsonData = await dataOfMessage(accessToken, chatId);
                console.log('chats/chatId/messages: ')
                console.log(jsonData)
                setTeamsData(prevData => ({
                    ...prevData,
                    dataOfMsg: jsonData.value || []
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

    const listItemsInFolder = async (accessToken, siteId, folderId = 'root') => {
        const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${folderId}/children`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            return response.data.value;
        } catch (error) {
            console.error('Error listing items in folder', error);
            throw error;
        }
    }

    async function buildFileTree(accessToken, siteId, folderId = 'root', path = '') {
        const items = await listItemsInFolder(accessToken, siteId, folderId);
        const nodePromises = items.map(async (item) => {
            const node = {
                id: item.id,
                name: item.name,
                path: `${path}/${item.name}`,
                isFolder: item.folder !== undefined
            };

            if (node.isFolder) {
                node.children = await buildFileTree(accessToken, siteId, item.id, node.path);
            }

            return node;
        });

        return Promise.all(nodePromises);
    }

    const getAllFiles = async (accessToken, siteId) => {
        try {
            if (accessToken) {
                const flatList = await buildFileTree(accessToken, siteId);
                setTeamsData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, my_files: flatList }
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
                alert("An unexpected error occurred:")
            }
            navigate(`/ms365/apps`);
        }
    }

    const getSites = async (accessToken) => {
        try {
            if (accessToken) {
                const response = await axios.get('https://graph.microsoft.com/v1.0/sites?search=*', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const data = response.data;
                setTeamsData(prevData => ({
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
                alert("An unexpected error occurred:")
            }
            navigate(`/ms365/apps`);
        }
    }

    const listItemHistory = async (accessToken, siteId, itemId) => {
        const url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${itemId}/versions`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            console.log('versions')
            console.log(response.data)
            return response.data.value;
        } catch (error) {
            console.error('Error', error);
            throw error;
        }
    }

    const getItemHistory = async (accessToken, siteId, itemId) => {
        try {
            if (accessToken) {
                const historyList = await listItemHistory(accessToken, siteId, itemId);
                setTeamsData(prevData => ({
                    ...prevData,
                    versionHistory: historyList
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
                alert("An unexpected error occurred:")
            }
            navigate(`/ms365/apps`);
        }
    }

    return (
        <MSTeamsContext.Provider value={{ teamsData, setTeamsData, getTeams, getChats, getJsonOfTeam, getCalendars, getMessageContent, getAllFiles, getSites, getItemHistory }}>
            {children}
        </MSTeamsContext.Provider>
    );
}

MSTeamsProvider.propTypes = {
    children: PropTypes.node
};

export { MSTeamsContext, MSTeamsProvider };
