import PropTypes from 'prop-types';
import { createContext, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axiosServices from "../utils/axios";
import axios from 'axios';

const GoogleGmailContext = createContext({
    channels: {
        inbox: [],
        sentItems: [],
        drafts: [],
        loginLog: [],
    }, 
});

const GoogleGmailProvider = ({ children }) => {
    const navigate = useNavigate();
    const [gmailData, setGmailData] = useState({
        channels: {
          inbox: [],
          sentItems: [],
          drafts: [],
          trash: [],
          loginLog: [],
          driveLog: [],
          adminLog: [],
        }
    });

    const fetchThreadDetails = async (threadId, accessToken) => {
      const response = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
      });
      return response.data;
    }

    const getInbox = async (accessToken) => {
        try {
            if(accessToken){
                const gmailInboxResponse = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=INBOX', {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                // console.log('gmailInboxResponse: ', JSON.stringify(gmailInboxResponse, null, 2))
                const inboxMessagesDetails = await Promise.all(
                    gmailInboxResponse.data.messages.map(async message => 
                        axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        })
                    )
                );
                const inboxMessageList = inboxMessagesDetails.map(res => res.data);
                console.log('inbox messages: ', inboxMessageList);

                const gmailSentResponse = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=SENT', {
                  headers: { Authorization: `Bearer ${accessToken}` }
                });
                // console.log('gmailSentResponse: ', JSON.stringify(gmailSentResponse, null, 2))
                const sentMessagesDetails = await Promise.all(
                    gmailSentResponse.data.messages.map(async message => 
                        axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        })
                    )
                );
                const sentMessageList = sentMessagesDetails.map(res => res.data);
                console.log('sent messages: ', sentMessageList);
                setGmailData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, inbox: inboxMessageList, sentItems: sentMessageList }
                }));
                //
                // try {
                //   const response = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=10&labelIds=INBOX', {
                //       headers: { Authorization: `Bearer ${accessToken}` }
                //   });
                //   const threadDetails = await Promise.all(response.data.threads.map(thread => 
                //       fetchThreadDetails(thread.id, accessToken)
                //   ));
                //   console.log('inbox threads: ', JSON.stringify(threadDetails, null, 2))
                // } catch (error) {
                //     console.log('Error fetching inbox threads:', error);
                // }
                //
            }
        } catch {
            navigate(`/google/apps`);
        }
    }

    const getMessages = async (userId) => {
        try {
            if(userId){
                const result = await axiosServices.get(`/google/workspace/${userId}/gmail`);

                console.log('get msg:', result.data);
                setGmailData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, inbox: result.data.inboxMessageList, sentItems: result.data.sentMessageList, trash: result.data.trashMessageList }
                }));
            }
        } catch {
            navigate(`/google/apps`);
        }
    }

    const getActivities = async (userId) => {
        try {
            if(userId){
                const result = await axiosServices.get(`/google/workspace/${userId}/logs`);

                console.log('get logs:', result.data);
                console.log('get logs json:', JSON.stringify(result.data, null, 2));
                setGmailData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, loginLog: result.data.login, driveLog: result.data.drive, adminLog: result.data.admin }
                }));
            }
        } catch {
            navigate(`/google/apps`);
        }
    }

    return (
        <GoogleGmailContext.Provider value={{ gmailData, getInbox, setGmailData, getMessages, getActivities }}>
            {children}
        </GoogleGmailContext.Provider>
    );
}

GoogleGmailProvider.propTypes = {
    children: PropTypes.node
};

export { GoogleGmailContext, GoogleGmailProvider };
