import PropTypes from 'prop-types';
import { createContext, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'axios';

const MSOutlookContext = createContext({
    channels: {
        inbox: {},
        sentItems: {},
        drafts: [],
        audits: [],
        devices: [],
        trash: [],
    },
});

const MSOutlookProvider = ({ children }) => {
    const navigate = useNavigate();
    const [outlookData, setOutlookData] = useState({
        channels: {
            inbox: null,
            sentItems: null,
            drafts: null,
            audits: null,
            devices: null,
            trash: null,
        }
    });

    const getInboxInfo = async (accessToken, userId) => {
        try {
            if (accessToken) {
                const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/mailFolders/Inbox`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                console.log("get inbox: ", response.data);
                const inboxInfo = response.data;

                const responseSent = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/mailFolders/SentItems`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const sentItemsInfo = responseSent.data;
                
                setOutlookData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, inbox: inboxInfo, sentItems: sentItemsInfo }
                }));
            }
        } catch (e) {
            if (e.response && e.response.data && e.response.data.error) {
                const errorCode = e.response.data.error.code;
                const errorMessage = e.response.data.error.message;

                console.error("Error Code:", errorCode);
                console.error("Error Message:", errorMessage);

                // Handle specific error codes
                if (errorCode === "MailboxNotEnabledForRESTAPI") {
                    // Specific handling for this error
                } else {
                    // Handling for other types of errors
                }
                alert(errorMessage)
            } else {
                // General error handling if the error structure is different
                console.error("An unexpected error occurred:", e);
                alert(e)
            }
            setOutlookData(prevData => ({
                ...prevData,
                channels: { ...prevData.channels, inbox: null, sentItems: null }
            }));
            navigate(`/ms365/apps`);
        }
    }

    const getInbox = async (accessToken, userId) => {
        try {
            if (accessToken) {
                const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/mailFolders/Inbox/messages`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                console.log("get inbox: ", response.data);
                const messages = response.data.value;
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


                setOutlookData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, inbox: conversationsInbox, sentItems: conversationsSent }
                }));
            }
        } catch (e) {
            if (e.response && e.response.data && e.response.data.error) {
                const errorCode = e.response.data.error.code;
                const errorMessage = e.response.data.error.message;

                console.error("Error Code:", errorCode);
                console.error("Error Message:", errorMessage);
            } else {
                // General error handling if the error structure is different
                console.error("An unexpected error occurred:", e);
            }
            setOutlookData(prevData => ({
                ...prevData,
                channels: { ...prevData.channels, inbox: null, sentItems: null }
            }));
            navigate(`/ms365/apps`);
        }
    }

    const getSent = async (accessToken, userId) => {
        try {
            if (accessToken) {
                const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/mailFolders/SentItems/messages`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const data = response.data;
                setOutlookData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, sentItems: data.value }
                }));
            }
        } catch (e) {
            if (e.response && e.response.data && e.response.data.error) {
                const errorCode = e.response.data.error.code;
                const errorMessage = e.response.data.error.message;

                console.error("Error Code:", errorCode);
                console.error("Error Message:", errorMessage);
            } else {
                // General error handling if the error structure is different
                console.error("An unexpected error occurred:", e);
            }
            setOutlookData(prevData => ({
                ...prevData,
                channels: { ...prevData.channels, sentItems: null, inbox: null }
            }));
            navigate(`/ms365/apps`);
        }
    }

    const getDrafts = async (accessToken, userId) => {
        try {
            if (accessToken) {
                const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/mailFolders/Drafts/messages`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const data = response.data;

                const trashResponse = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/mailFolders/deleteditems/messages`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const trashData = trashResponse.data;
                console.log('ms trash data:', trashData);
                setOutlookData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, drafts: data.value, trash: trashData.value }
                }));
            }
        } catch (e) {
            if (e.response && e.response.data && e.response.data.error) {
                const errorCode = e.response.data.error.code;
                const errorMessage = e.response.data.error.message;

                console.error("Error Code:", errorCode);
                console.error("Error Message:", errorMessage);
            } else {
                // General error handling if the error structure is different
                console.error("An unexpected error occurred:", e);
            }
            setOutlookData(prevData => ({
                ...prevData,
                channels: { ...prevData.channels, drafts: [], trash: [] }
            }));
            navigate(`/ms365/apps`);
        }
    }

    const getAudits = async (accessToken) => {
        try {
            if (accessToken) {
                const response = await axios.get(`https://graph.microsoft.com/v1.0/auditLogs/directoryAudits`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const data = response.data;
                setOutlookData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, audits: data.value }
                }));
            }
        } catch {
            setOutlookData(prevData => ({
                ...prevData,
                channels: { ...prevData.channels, audits: [] }
            }));
            navigate(`/ms365/apps`);
        }
    }

    const getDevices = async (accessToken) => {
        try {
            if (accessToken) {
                const response = await axios.get('https://graph.microsoft.com/v1.0/devices', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const data = response.data;
                console.log('get devices: ');
                console.log(data);
                setOutlookData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, devices: data.value }
                }));
            }
        } catch {
            navigate(`/ms365/apps`);
        }
    }



    return (
        <MSOutlookContext.Provider value={{ outlookData, setOutlookData, getInboxInfo, getInbox, getSent, getDrafts, getAudits, getDevices }}>
            {children}
        </MSOutlookContext.Provider>
    );
}

MSOutlookProvider.propTypes = {
    children: PropTypes.node
};

export { MSOutlookContext, MSOutlookProvider };
