import PropTypes from 'prop-types';
import { createContext, useCallback, useState } from 'react';

import axiosServices from 'utils/axios';

const MS365Context = createContext({
    accessToken: ''
});

const MS365Provider = ({ children }) => {
    const [accessToken, setAccessToken] = useState('');

    const resetAccessToken = useCallback(async (workspaceId) => {
        const response = await axiosServices.get(`/ms365/workspace/${workspaceId}/token`);
        const { accessToken } = response.data;
        setAccessToken(accessToken);
    }, []);

    return (
        <MS365Context.Provider value={{ accessToken, resetAccessToken }}>
            {children}
        </MS365Context.Provider>
    );
}

MS365Provider.propTypes = {
    children: PropTypes.node
};

export { MS365Context, MS365Provider };
