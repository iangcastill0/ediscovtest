import PropTypes from 'prop-types';
import { createContext, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axios from 'utils/axios';

const MSOnedriveContext = createContext({
    channels: {
        my_files: [],
        folders: [],
    },
});

const MSOnedriveProvider = ({ children }) => {
    const navigate = useNavigate();
    const [onedriveData, setOnedriveData] = useState({
        channels: {
            my_files: [],
            folders: [],
            deltaLog: [],
            activitiesLog: [],
            sharedWithMe: [],
            sharedByYou: []
        },
        versionHistory: [],
        fileName: '',
        fileInfo: [],
    });

    const listItemsInFolder = async (workspaceId, userId, folderId = 'root') => {

        const url = `/ms365/workspace/${workspaceId}/users/${userId}/onedrive/items/${folderId}`;
        try {
            const response = await axios.get(url);
            return response.data.items;
        } catch (error) {
            console.error('Error listing items in folder', error);
        }
        return []
    }
    
    async function buildFileTree(workspaceId, userId, folderId = 'root', path = '', parentId = null) {
        const items = await listItemsInFolder(workspaceId,userId, folderId);
        const nodePromises = items.map(async (item) => {
            const node = {
                id: item.id,
                label: item.name,
                name: item.name,
                path: `${path}/${item.name}`,
                isFolder: item.folder !== undefined,
                childCount: item.folder?.childCount,
                downloadUrl: item.folder ? '' : item['@microsoft.graph.downloadUrl'],
                parentId: parentId,
                items: item.folder ? [] : null,
                size: item.size,
                lastModifiedDateTime: item.lastModifiedDateTime
            };
    
            if (node.isFolder && node.childCount > 0) {
                node.items = await buildFileTree(workspaceId, userId, item.id, node.path, item.id);
            }
    
            return node;
        });
    
        return Promise.all(nodePromises);
    }
    
    async function getDocumentTree(workspaceId, userId) {
        // Create the root folder node with name "Documents"
        const root = {
            id: 'root',
            label: 'Documents',
            name: 'Documents',
            path: '/Documents',
            isFolder: true,
            downloadUrl: '',
            parentId: null,
            items: await buildFileTree(workspaceId, userId, 'root', '/Documents')
        };
        return [root]; // Wrap in an array to match the provided format
    }

    function flattenTree(tree) {
        const flatList = [];

        function processNode(node) {
            if (!node.isFolder) {
                flatList.push({
                    id: node.id,
                    name: node.name,
                    path: node.path,
                    isFolder: node.isFolder
                });
            }

            if (node.children && node.children.length > 0) {
                node.children.forEach(child => processNode(child));
            }
        }

        tree.forEach(node => processNode(node));
        return flatList;
    }

    const getFiles = async (workspaceId, userId) => {
        try {
            const flatList = await getDocumentTree(workspaceId, userId);
            // const fileTree = flattenTree(flatList);
            setOnedriveData(prevData => ({
                ...prevData,
                channels: { ...prevData.channels, my_files: flatList }
            }));
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
                alert(JSON.stringify(e))
            }
            navigate(`/ms365/apps`);
        }
    }

    const listItemHistory = async (workspaceId, userId, itemId) => {
        const url = `/ms365/workspace/${workspaceId}/users/${userId}/onedrive/versions/${itemId}`;
        try {
            const response = await axios.get(url);
            return response.data.versions;
        } catch (error) {
            console.error('Error', error);
            throw error;
        }
    }

    const metadataOfItem = async (accessToken, userId, itemId) => {
        const url = `https://graph.microsoft.com/v1.0/users/${userId}/drive/items/${itemId}`;
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

    const getItemHistory = async (workspaceId, userId, itemId, name) => {
        try {
            const historyList = await listItemHistory(workspaceId, userId, itemId);
            setOnedriveData(prevData => ({
                ...prevData,
                versionHistory: historyList,
                fileName: name
            }));
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
            // navigate(`/ms365/apps`);
        }
    }

    const getDelta = async (accessToken, userId) => {
        try {
            if (accessToken) {
                const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/drive/root/delta`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const data = response.data;
                setOnedriveData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, deltaLog: data.value }
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
            // navigate(`/ms365/apps`);
        }
    }

    const getActivities = async (accessToken, userId) => {
        try {
            if (accessToken) {
                const response = await axios.get(`https://graph.microsoft.com/v1.0/users/${userId}/drive/root/activities`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                });
                const data = response.data;
                setOnedriveData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, activitiesLog: data.value }
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
            // navigate(`/ms365/apps`);
        }
    }

    const getSharedWithMe = async (workspaceId, userId) => {
        try {
            if (workspaceId) {
                const response = await axios.get(`/ms365/workspace/${workspaceId}/users/${userId}/onedrive/sharedwithme`);
                const data = response.data;
                setOnedriveData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, sharedWithMe: data.items }
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
            navigate(`/ms365/apps`);
        }
    }

    const sharedFileData = async (accessToken, driveId, remoteId) => {
        const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${remoteId}`;
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

    const sharedChildData = async (accessToken, driveId, remoteId) => {
        const url = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${remoteId}/children`;
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

    const getFileData = async (accessToken, driveId, remoteId, type) => {
        try {
            if (accessToken) {
                if (type === 'Folder') {
                    const fileData = await sharedChildData(accessToken, driveId, remoteId);
                    setOnedriveData(prevData => ({
                        ...prevData,
                        fileInfo: fileData
                    }));
                } else {
                    const fileData = await sharedFileData(accessToken, driveId, remoteId);
                    setOnedriveData(prevData => ({
                        ...prevData,
                        fileInfo: [fileData]
                    }));
                }
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
                alert(JSON.stringify(e))
            }
            navigate(`/ms365/apps`);
        }
    }

    const getSharedByYou = async (workspaceId, userId) => {
        try {
            if (workspaceId) {
                const response = await axios.get(`/ms365/workspace/${workspaceId}/users/${userId}/onedrive/sharedbyyou`);
                setOnedriveData(prevData => ({
                    ...prevData,
                    channels: { ...prevData.channels, sharedByYou: response.data?.items }
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
            navigate(`/ms365/apps`);
        }
    }

    return (
        <MSOnedriveContext.Provider value={{ onedriveData, setOnedriveData, getFiles, getItemHistory, getDelta, getActivities, getSharedWithMe, getFileData, listItemsInFolder, getSharedByYou }}>
            {children}
        </MSOnedriveContext.Provider>
    );
}

MSOnedriveProvider.propTypes = {
    children: PropTypes.node
};

export { MSOnedriveContext, MSOnedriveProvider };
