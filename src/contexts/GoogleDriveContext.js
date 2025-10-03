import PropTypes from 'prop-types';
import { createContext, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import axiosServices from "../utils/axios";

const GoogleDriveContext = createContext({
    channels: {
        my_files: [],
        folders: [],
        sharedWithMe: []
    },
});

const GoogleDriveProvider = ({ children }) => {
    const navigate = useNavigate();
    const [driveData, setDriveData] = useState({
        channels: {
            my_files: [],
            folders: [],
            deltaLog: [],
            activitiesLog: [],
            sharedWithMe: []
        },
    });

    function buildTree(items) {
      const itemMap = {};
      const tree = [];
  
      items.forEach(item => {
          itemMap[item.id] = {...item, children: []};
      });
  
      items.forEach(item => {
          if (item.parents && item.parents.length) {
              item.parents.forEach(parentId => {
                  if (itemMap[parentId]) {
                    itemMap[parentId].children.push(itemMap[item.id]);
                  } else {
                    tree.push(itemMap[item.id]);
                  }
              });
          } else {
              tree.push(itemMap[item.id]);
          }
      });
  
      function setPath(node, basePath = '') {
          const path = `${basePath}/${node.name}`;
          node.path = path;
          node.isFolder = node.mimeType === 'application/vnd.google-apps.folder';
          node.children.forEach(child => setPath(child, path));
      }
  
      tree.forEach(root => setPath(root));
  
      return tree;
    }

    const getFiles = async (workspaceId, userId, isPersonal) => {
        try {
          if(userId){
              const result = await axiosServices.get(`/google/workspace/${workspaceId}/users/${userId}/v2/drive?isPersonal=${isPersonal}`);

              const treeDriveData = buildTree(result.data);

              setDriveData(prevData => ({
                  ...prevData,
                  channels: { ...prevData.channels, my_files: treeDriveData }
              }));
          }
        } catch {
            navigate(`/google/apps`);
        }
    }

    const getSharedWithMe = async (workspaceId, userId, isPersonal) => {
        try {
          if(userId){
              const result = await axiosServices.get(`/google/workspace/${workspaceId}/users/${userId}/v2/sharedDrive?isPersonal=${isPersonal}`);
            //   console.log('shared with me in context:', JSON.stringify(result.data, null, 2));

              const treeDriveData = buildTree(result.data);
              console.log('shared with me tree:', JSON.stringify(treeDriveData, null, 2));

              setDriveData(prevData => ({
                  ...prevData,
                  channels: { ...prevData.channels, sharedWithMe: treeDriveData }
              }));
          }
        } catch {
            navigate(`/google/apps`);
        }
    }

    return (
        <GoogleDriveContext.Provider value={{ driveData, setDriveData, getFiles, getSharedWithMe }}>
            {children}
        </GoogleDriveContext.Provider>
    );
}

GoogleDriveProvider.propTypes = {
    children: PropTypes.node
};

export { GoogleDriveContext, GoogleDriveProvider };
